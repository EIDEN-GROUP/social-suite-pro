import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  Plug,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Unplug,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Company, Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import { destinationPickerRequired } from "@/lib/publishing/platforms";
import {
  clearAuthConfig,
  connectionModes,
  disconnectSocialAccount,
  getConnectionLink,
  listSocialAccounts,
  platformAvailability,
  refreshSocialAccount,
  setAuthConfig,
  syncSocialAccounts,
  verifyReturnedConnection,
} from "@/lib/social/social.functions";
import { AccountStatusBadge, PlatformBadge } from "@/components/social/PlatformBadge";
import { DestinationPicker } from "@/components/social/DestinationPicker";

export const Route = createFileRoute("/_authenticated/admin/connect")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    company?: string;
    platform?: Platform;
    connected?: string;
    connected_account_id?: string;
    status?: string;
  } => ({
    company: typeof search.company === "string" ? search.company : undefined,
    platform: typeof search.platform === "string" ? (search.platform as Platform) : undefined,
    connected: typeof search.connected === "string" ? search.connected : undefined,
    connected_account_id:
      typeof search.connected_account_id === "string"
        ? search.connected_account_id
        : typeof search.connectedAccountId === "string"
          ? (search.connectedAccountId as string)
          : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
  }),
  component: ConnectPage,
});

type Availability = {
  platform: Platform;
  configured: boolean;
  enabled: boolean;
  custom: boolean;
  hosted: boolean;
};

type Account = {
  id: string;
  platform: Platform;
  display_name: string;
  username: string | null;
  status: string;
  avatar_url: string | null;
  can_publish: boolean;
  external_account_id: string | null;
  connected_account_id: string;
};

type Mode = {
  platform: Platform;
  toolkit: string;
  authConfigId: string | null;
  custom: boolean;
  hosted: boolean;
  redirectUri: string;
};

function ConnectPage() {
  const search = Route.useSearch();
  const availability = useServerFn(platformAvailability);
  const modesFn = useServerFn(connectionModes);
  const getLink = useServerFn(getConnectionLink);
  const sync = useServerFn(syncSocialAccounts);
  const list = useServerFn(listSocialAccounts);
  const refresh = useServerFn(refreshSocialAccount);
  const disconnect = useServerFn(disconnectSocialAccount);
  const verifyReturned = useServerFn(verifyReturnedConnection);
  const saveConfig = useServerFn(setAuthConfig);
  const clearConfig = useServerFn(clearAuthConfig);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState(search.company ?? "");
  const [platforms, setPlatforms] = useState<Availability[]>([]);
  const [modes, setModes] = useState<Mode[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [busyAccount, setBusyAccount] = useState<string | null>(null);
  const [busyPlatform, setBusyPlatform] = useState<Platform | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [drafts, setDrafts] = useState<Partial<Record<Platform, string>>>({});

  const loadModes = useCallback(async () => {
    try {
      const res = await modesFn({ data: {} });
      setModes((res.modes as unknown as Mode[]) ?? []);
    } catch {
      setModes([]);
    }
  }, [modesFn]);

  const refreshAccounts = useCallback(
    async (cid: string) => {
      if (!cid) return setAccounts([]);
      try {
        const res = await list({ data: { companyId: cid } });
        setAccounts((res.accounts as unknown as Account[]) ?? []);
      } catch {
        setAccounts([]);
      }
    },
    [list],
  );

  useEffect(() => {
    (async () => {
      const [{ data: cs }, avail] = await Promise.all([
        supabase.from("companies").select("*").order("name"),
        availability({ data: {} }),
      ]);
      setCompanies((cs ?? []) as Company[]);
      setPlatforms((avail.platforms as Availability[]) ?? []);
      if (!companyId && cs && cs.length > 0) setCompanyId(cs[0].id);
    })();
    void loadModes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refreshAccounts(companyId);
  }, [companyId, refreshAccounts]);

  // Returning from the provider (or Composio's hosted page).
  useEffect(() => {
    const cid = search.company;
    if (search.connected !== "1" || !cid) return;
    const platform = search.platform;
    const returnedId = search.connected_account_id;

    (async () => {
      const tid = toast.loading("Confirming the connection...");
      try {
        // Ownership check: the returned account must exist in this client's
        // Composio namespace before we trust it.
        if (returnedId && platform) {
          const check = await verifyReturned({
            data: { companyId: cid, platform, connectedAccountId: returnedId },
          });
          if (!check.ok) {
            toast.error("That connection isn't linked to this client - ignored.", { id: tid });
            return;
          }
        }
        const res = await sync({ data: { companyId: cid, platform } });
        if (res.upserted === 0) {
          toast.warning("No new account was activated. You can retry the connection.", { id: tid });
        } else {
          toast.success(`Connected - ${res.upserted} account updated`, { id: tid });
        }
        await refreshAccounts(cid);
      } catch (err) {
        toast.error((err as Error).message, { id: tid });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect(platform: Platform) {
    if (!companyId) return toast.error("Select a client first.");
    setConnecting(platform);
    try {
      const res = await getLink({ data: { companyId, platform } });
      toast.message(
        res.direct
          ? `Continuing on ${PLATFORMS.find((p) => p.id === platform)?.label}...`
          : "Opening Composio's connect page...",
      );
      window.location.href = res.redirectUrl;
    } catch (err) {
      toast.error((err as Error).message);
      setConnecting(null);
    }
  }

  async function syncPlatform(platform: Platform) {
    if (!companyId) return;
    setBusyPlatform(platform);
    try {
      const res = await sync({ data: { companyId, platform } });
      toast.success(`Synced ${res.upserted} account(s)`);
      await refreshAccounts(companyId);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyPlatform(null);
    }
  }

  async function refreshAccount(accountId: string) {
    setBusyAccount(accountId);
    try {
      await refresh({ data: { accountId } });
      toast.success("Account refreshed");
      await refreshAccounts(companyId);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyAccount(null);
    }
  }

  async function disconnectAccount(a: Account) {
    if (
      !window.confirm(
        `Disconnect ${a.display_name}? Publishing to it will stop until you reconnect it.`,
      )
    )
      return;
    setBusyAccount(a.id);
    try {
      await disconnect({ data: { accountId: a.id } });
      toast.success("Account disconnected");
      await refreshAccounts(companyId);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyAccount(null);
    }
  }

  async function saveConfigFor(platform: Platform) {
    const id = drafts[platform]?.trim();
    if (!id) return toast.error("Paste a Composio auth config id (ac_...).");
    setBusyPlatform(platform);
    try {
      const res = await saveConfig({ data: { platform, authConfigId: id } });
      toast.success(
        res.custom
          ? "Saved - connections will go straight to the provider."
          : "Saved, but that config is Composio-managed, so the hosted page will still show.",
      );
      setDrafts((d) => ({ ...d, [platform]: "" }));
      await loadModes();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyPlatform(null);
    }
  }

  async function clearConfigFor(platform: Platform) {
    setBusyPlatform(platform);
    try {
      await clearConfig({ data: { platform } });
      toast.success("Cleared");
      await loadModes();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyPlatform(null);
    }
  }

  const byPlatform = useMemo(() => {
    const map = new Map<Platform, Account[]>();
    for (const a of accounts) {
      const arr = map.get(a.platform) ?? [];
      arr.push(a);
      map.set(a.platform, arr);
    }
    return map;
  }, [accounts]);

  const selectedCompany = companies.find((c) => c.id === companyId);
  const modeFor = (p: Platform) => modes.find((m) => m.platform === p);
  const availFor = (p: Platform) => platforms.find((x) => x.platform === p);

  return (
    <main className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center gap-4 border-b editorial-rule px-6 py-4">
        <Link
          to="/admin"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Studio
        </Link>
        <div className="h-4 w-px bg-foreground/20" />
        <span className="font-display text-xl">Connect social accounts</span>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <label className="block max-w-md">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Which client?
          </span>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="mt-2 w-full rounded-sm border editorial-rule bg-background px-3 py-2.5 text-sm"
          >
            <option value="">Select a client...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Connect each platform the client wants to publish to. Connections and tokens are handled
          by Composio on the server; nothing sensitive reaches the browser.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {PLATFORMS.map((p) => {
            const avail = availFor(p.id);
            const mode = modeFor(p.id);
            const platformAccounts = byPlatform.get(p.id) ?? [];
            const connected = platformAccounts.filter((a) => a.status !== "disconnected");
            const disabled = !avail?.configured || !avail?.enabled || !companyId;
            return (
              <section key={p.id} className="flex flex-col rounded border editorial-rule">
                <div className="flex flex-wrap items-center gap-3 border-b editorial-rule px-5 py-4">
                  <PlatformBadge platform={p.id} />
                  {mode?.custom ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                      <ShieldCheck className="h-3 w-3" /> Direct
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500"
                      title="Connecting uses Composio's hosted page"
                    >
                      <Lock className="h-3 w-3" /> Composio page
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => connect(p.id)}
                    disabled={disabled || connecting !== null}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-sm bg-foreground px-3 py-1.5 text-xs font-medium text-background transition hover:opacity-90 disabled:opacity-40"
                  >
                    {connecting === p.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plug className="h-3.5 w-3.5" />
                    )}
                    {connected.length > 0 ? "Connect another" : "Connect"}
                  </button>
                </div>

                <div className="flex flex-1 flex-col gap-3 px-5 py-4">
                  {disabled ? (
                    <p className="text-xs text-muted-foreground">
                      {!companyId ? "Select a client first." : "Not configured."}
                    </p>
                  ) : platformAccounts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No {p.label} account connected yet.
                    </p>
                  ) : (
                    platformAccounts.map((a) => (
                      <div
                        key={a.id}
                        className="flex flex-wrap items-center gap-3 rounded border editorial-rule px-3 py-3"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-foreground/5 text-xs font-semibold">
                          {a.avatar_url ? (
                            <img src={a.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (a.display_name || "?").slice(0, 1).toUpperCase()
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {a.display_name}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {a.username ? `@${a.username}` : a.connected_account_id}
                            {a.external_account_id ? " · destination set" : ""}
                          </span>
                        </span>
                        <AccountStatusBadge status={a.status} />
                        <span className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => refreshAccount(a.id)}
                            disabled={busyAccount === a.id}
                            className="inline-flex items-center gap-1 rounded-sm border editorial-rule px-2 py-1 text-[11px] hover:bg-foreground/5 disabled:opacity-40"
                          >
                            {busyAccount === a.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Refresh
                          </button>
                          <button
                            type="button"
                            onClick={() => disconnectAccount(a)}
                            disabled={busyAccount === a.id || a.status === "disconnected"}
                            className="inline-flex items-center gap-1 rounded-sm border border-rose-200 px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                          >
                            <Unplug className="h-3 w-3" /> Disconnect
                          </button>
                        </span>
                        {a.status !== "disconnected" && destinationPickerRequired(a.platform) && (
                          <span className="w-full">
                            <DestinationPicker
                              accountId={a.id}
                              platform={a.platform}
                              currentName={a.external_account_id ? a.display_name : null}
                              onChanged={() => refreshAccounts(companyId)}
                            />
                          </span>
                        )}
                      </div>
                    ))
                  )}

                  {platformAccounts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => syncPlatform(p.id)}
                      disabled={busyPlatform === p.id}
                      className="inline-flex items-center gap-1.5 self-start rounded-sm border editorial-rule px-2.5 py-1.5 text-[11px] hover:bg-foreground/5 disabled:opacity-40"
                    >
                      {busyPlatform === p.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      Sync from Composio
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* How connections are started (admin-only) */}
        <div className="mt-10 rounded border editorial-rule">
          <button
            type="button"
            onClick={() => setShowSetup((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
          >
            <span>
              <span className="block text-xs uppercase tracking-widest text-muted-foreground">
                Connection setup
              </span>
              <span className="mt-0.5 block text-sm">
                Which platforms skip Composio's connect page
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition ${showSetup ? "rotate-180" : ""}`}
            />
          </button>

          {showSetup && (
            <div className="space-y-4 border-t editorial-rule px-5 py-4">
              <p className="flex items-start gap-2 rounded border border-amber-300/60 bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-900">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Composio retired direct starts for its <strong>managed</strong> apps, so a
                  Composio-branded connect page is unavoidable on those. To send people straight to
                  the provider, create a <strong>custom auth config</strong> in the Composio
                  dashboard (Auth Configs → OAuth2 → “use your own developer credentials”), then
                  paste its <code>ac_…</code> id below. Register this redirect URI in the provider's
                  OAuth app: <code>{modeFor("instagram")?.redirectUri ?? COMPOSIO_CALLBACK}</code>
                </span>
              </p>

              {PLATFORMS.map((p) => {
                const mode = modeFor(p.id);
                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 rounded border editorial-rule px-3 py-3"
                  >
                    <PlatformBadge platform={p.id} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">
                        {mode?.authConfigId ?? "no auth config yet"}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {mode?.custom ? "Direct to provider" : "Composio hosted page"}
                      </span>
                    </span>
                    <input
                      value={drafts[p.id] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                      placeholder="ac_xxxxxxxx"
                      className="w-40 rounded-sm border editorial-rule bg-background px-2 py-1.5 font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => saveConfigFor(p.id)}
                      disabled={busyPlatform === p.id || !(drafts[p.id] ?? "").trim()}
                      className="inline-flex items-center gap-1 rounded-sm bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background disabled:opacity-40"
                    >
                      {busyPlatform === p.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => clearConfigFor(p.id)}
                      disabled={busyPlatform === p.id || !mode?.authConfigId}
                      className="inline-flex items-center gap-1 rounded-sm border editorial-rule px-2.5 py-1.5 text-[11px] hover:bg-foreground/5 disabled:opacity-40"
                      title="Clear so the next connect creates a managed config"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedCompany && (
          <p className="mt-6 text-[11px] text-muted-foreground">
            Showing connections for{" "}
            <strong className="text-foreground">{selectedCompany.name}</strong>. Accounts are scoped
            by client — one client can never see another's.
          </p>
        )}
      </div>

      {/* Our connecting screen while the browser heads to the provider */}
      {connecting && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg border editorial-rule bg-background p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Connecting
              </span>
              <button
                type="button"
                onClick={() => setConnecting(null)}
                aria-label="Cancel"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-foreground/60" />
              <div className="min-w-0">
                <p className="truncate font-display text-xl">
                  {PLATFORMS.find((p) => p.id === connecting)?.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {modeFor(connecting)?.custom
                    ? "Taking you to the provider to authorize, then straight back here."
                    : "Opening Composio's connect page, then the provider. We'll come back here after."}
                </p>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1.5 border-t editorial-rule pt-3 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" /> Tokens are stored by Composio, never in this app.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

const COMPOSIO_CALLBACK = "https://backend.composio.dev/api/v3/toolkits/auth/callback";

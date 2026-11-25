import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Loader2, Lock, Plug, RefreshCw, Unplug, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Company, Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import { destinationPickerRequired } from "@/lib/publishing/platforms";
import {
  disconnectSocialAccount,
  getConnectionLink,
  listSocialAccounts,
  platformAvailability,
  refreshSocialAccount,
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

type Availability = { platform: Platform; configured: boolean; enabled: boolean };

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

function ConnectPage() {
  const search = Route.useSearch();
  const availability = useServerFn(platformAvailability);
  const getLink = useServerFn(getConnectionLink);
  const sync = useServerFn(syncSocialAccounts);
  const list = useServerFn(listSocialAccounts);
  const refresh = useServerFn(refreshSocialAccount);
  const disconnect = useServerFn(disconnectSocialAccount);
  const verifyReturned = useServerFn(verifyReturnedConnection);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState(search.company ?? "");
  const [platforms, setPlatforms] = useState<Availability[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [busyAccount, setBusyAccount] = useState<string | null>(null);
  const [busyPlatform, setBusyPlatform] = useState<Platform | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refreshAccounts(companyId);
  }, [companyId, refreshAccounts]);

  // Returning from authorization.
  useEffect(() => {
    const cid = search.company;
    if (search.connected !== "1" || !cid) return;
    const platform = search.platform;
    const returnedId = search.connected_account_id;

    (async () => {
      const tid = toast.loading("Confirming the connection...");
      try {
        // Ownership check: the returned account must exist in this client's
        // namespace before we trust it.
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
      const { redirectUrl } = await getLink({ data: { companyId, platform } });
      window.location.href = redirectUrl;
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
          Connect each platform the client wants to publish to. Authorization and tokens are handled
          securely on the server; nothing sensitive reaches the browser.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {PLATFORMS.map((p) => {
            const avail = availFor(p.id);
            const platformAccounts = byPlatform.get(p.id) ?? [];
            const connected = platformAccounts.filter((a) => a.status !== "disconnected");
            const disabled = !avail?.configured || !avail?.enabled || !companyId;
            return (
              <section key={p.id} className="flex flex-col rounded border editorial-rule">
                <div className="flex flex-wrap items-center gap-3 border-b editorial-rule px-5 py-4">
                  <PlatformBadge platform={p.id} />
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
                      Sync accounts
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {selectedCompany && (
          <p className="mt-6 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Check className="h-3 w-3 text-emerald-600" />
            Showing connections for{" "}
            <strong className="text-foreground">{selectedCompany.name}</strong>. Accounts are scoped
            by client — one client can never see another's.
          </p>
        )}
      </div>

      {/* Connecting screen while the browser heads to authorization */}
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
                  Taking you to a secure sign-in to authorize, then straight back here.
                </p>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1.5 border-t editorial-rule pt-3 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" /> Tokens are stored securely on the server, never in the
              browser.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

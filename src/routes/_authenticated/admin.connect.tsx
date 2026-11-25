import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
} from "@/lib/social/social.functions";
import {
  AccountStatusBadge,
  PlatformBadge,
  PublishCapabilityBadge,
} from "@/components/social/PlatformBadge";
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
    error?: string;
  } => ({
    company: typeof search.company === "string" ? search.company : undefined,
    platform:
      typeof search.platform === "string" && PLATFORMS.some((p) => p.id === search.platform)
        ? (search.platform as Platform)
        : undefined,
    connected: typeof search.connected === "string" ? search.connected : undefined,
    connected_account_id:
      typeof search.connected_account_id === "string"
        ? search.connected_account_id
        : typeof search.connectedAccountId === "string"
          ? (search.connectedAccountId as string)
          : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
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
  last_error?: string | null;
  last_synced_at?: string | null;
};

function ConnectPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const availability = useServerFn(platformAvailability);
  const getLink = useServerFn(getConnectionLink);
  const sync = useServerFn(syncSocialAccounts);
  const list = useServerFn(listSocialAccounts);
  const refresh = useServerFn(refreshSocialAccount);
  const disconnect = useServerFn(disconnectSocialAccount);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState(search.company ?? "");
  const [platforms, setPlatforms] = useState<Availability[]>([]);
  const [configured, setConfigured] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true); // page: clients + availability
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [connectingStalled, setConnectingStalled] = useState(false);
  const [busyAccount, setBusyAccount] = useState<string | null>(null);
  const [busyPlatform, setBusyPlatform] = useState<Platform | null>(null);
  const [returnNotice, setReturnNotice] = useState<{
    kind: "info" | "error";
    text: string;
  } | null>(null);

  const handledReturn = useRef(false);
  const cancelledRef = useRef(false);
  const redirectUrlRef = useRef<string | null>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectingTitleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const refreshAccounts = useCallback(
    async (cid: string) => {
      if (!cid) {
        setAccounts([]);
        setAccountsError(null);
        return;
      }
      setAccountsLoading(true);
      try {
        const res = await list({ data: { companyId: cid } });
        setAccounts((res.accounts as unknown as Account[]) ?? []);
        setAccountsError(null);
      } catch (err) {
        setAccountsError((err as Error).message || "Couldn't load accounts.");
      } finally {
        setAccountsLoading(false);
      }
    },
    [list],
  );

  useEffect(() => {
    (async () => {
      try {
        const [{ data: cs }, avail] = await Promise.all([
          supabase.from("companies").select("*").order("name"),
          availability({ data: {} }),
        ]);
        setCompanies((cs ?? []) as Company[]);
        setPlatforms((avail.platforms as Availability[]) ?? []);
        setConfigured(avail.configured);
        if (!companyId && cs && cs.length > 0) setCompanyId(cs[0].id);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (connecting) {
      cancelRef.current?.focus();
    } else {
      // Return focus to whatever opened the overlay (usually the Connect button).
      lastFocusRef.current?.focus?.();
      lastFocusRef.current = null;
    }
  }, [connecting]);

  // Clear the stall timer if the page unmounts mid-connection.
  useEffect(
    () => () => {
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    void refreshAccounts(companyId);
  }, [companyId, refreshAccounts]);

  // Returning from authorization. Anchor the action to the client the
  // authorization was for, then force the selector to match so the UI and the
  // action can never disagree. Consume the return params so a reload cannot
  // replay a stale "Connected".
  useEffect(() => {
    if (handledReturn.current) return;
    const isReturn =
      search.connected !== undefined || search.status !== undefined || search.error !== undefined;
    if (!isReturn) return;
    handledReturn.current = true;

    const cid = search.company ?? companyId;
    const platform = search.platform;

    if (search.connected !== "1") {
      setReturnNotice({
        kind: "info",
        text: "Authorization was cancelled or didn't finish — nothing was connected. Try again.",
      });
      void navigate({ to: "/admin/connect", search: {}, replace: true });
      return;
    }
    if (!cid) {
      setReturnNotice({
        kind: "error",
        text: "We couldn't tell which client that connection was for. Pick the client and press Sync accounts to finish.",
      });
      void navigate({ to: "/admin/connect", search: {}, replace: true });
      return;
    }
    setCompanyId(cid);

    void (async () => {
      const tid = toast.loading("Confirming the connection...");
      try {
        // Ownership: anything that appears here came from list(cid), which is
        // scoped to this client's provider user id — so its presence in this
        // client's namespace is the ownership proof. The former per-id "verify"
        // never ran (the callback does not carry connected_account_id).
        const before = await list({ data: { companyId: cid } });
        const beforeIds = new Set(
          ((before.accounts as unknown as Account[]) ?? []).map((a) => a.id),
        );

        const res = await sync({ data: { companyId: cid, platform } });

        const afterRes = await list({ data: { companyId: cid } });
        const after = (afterRes.accounts as unknown as Account[]) ?? [];
        setAccounts(after);
        const gained = (platform ? after.filter((a) => a.platform === platform) : after).filter(
          (a) => !beforeIds.has(a.id),
        );

        if (gained.length === 0) {
          toast.info(
            res.upserted > 0
              ? "Connection finished — existing accounts were refreshed. Nothing new was added."
              : "No new account was activated. If you expected one, press Sync accounts.",
            { id: tid },
          );
        } else if (gained.length === 1) {
          const g = gained[0];
          const label = PLATFORMS.find((p) => p.id === g.platform)?.label ?? g.platform;
          const who = g.username ? ` — @${g.username}` : ` — ${g.display_name}`;
          if (g.status === "connected") toast.success(`${label} connected${who}`, { id: tid });
          else
            toast.info(`${label} connected${who}, but it needs attention before it can publish.`, {
              id: tid,
            });
        } else {
          toast.success(`Connected ${gained.length} accounts`, { id: tid });
        }
      } catch (err) {
        toast.error((err as Error).message, { id: tid });
      } finally {
        void navigate({ to: "/admin/connect", search: {}, replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cancelConnect() {
    cancelledRef.current = true;
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    setConnecting(null);
    setConnectingStalled(false);
  }

  async function connect(platform: Platform) {
    if (!companyId) return toast.error("Select a client first.");
    cancelledRef.current = false;
    redirectUrlRef.current = null;
    lastFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;
    setConnectingStalled(false);
    setConnecting(platform);
    stallTimerRef.current = setTimeout(() => setConnectingStalled(true), 10_000);
    try {
      const { redirectUrl } = await getLink({ data: { companyId, platform } });
      // Cancelled while the link was in flight: do not navigate.
      if (cancelledRef.current) return;
      redirectUrlRef.current = redirectUrl;
      window.location.href = redirectUrl; // navigation is committed from here on
    } catch (err) {
      toast.error((err as Error).message);
      setConnecting(null);
    } finally {
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
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
        `Disconnect ${a.display_name} for ${selectedCompany?.name ?? "this client"}? Scheduled and approved posts to it will fail until you reconnect.`,
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
        <h1 className="font-display text-xl">Connect social accounts</h1>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {!configured && (
          <p className="mb-6 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Connections aren't configured yet. Add the integration API key to the server environment
            to connect accounts and publish.
          </p>
        )}

        {returnNotice && (
          <div
            className={`mb-6 flex items-start justify-between gap-4 rounded border editorial-rule px-4 py-3 text-sm ${
              returnNotice.kind === "error"
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : "bg-foreground/5"
            }`}
          >
            <span>{returnNotice.text}</span>
            <button
              type="button"
              onClick={() => setReturnNotice(null)}
              aria-label="Dismiss"
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {!loading && companies.length === 0 ? (
          <div className="rounded border editorial-rule p-12 text-center">
            <p className="font-display text-2xl">No clients yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a client workspace before connecting social accounts.
            </p>
            <Link
              to="/admin"
              className="mt-6 inline-block rounded-sm bg-foreground px-5 py-2.5 text-sm text-background"
            >
              Go to Clients
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Connections</p>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Connect each platform the client wants to publish to. Authorization and tokens are
              handled securely on the server; nothing sensitive reaches the browser.
            </p>

            <label className="mt-6 block max-w-md">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Which client?
              </span>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="mt-2 w-full rounded-sm border editorial-rule bg-background px-3 py-2 text-xs"
              >
                <option value="">Select a client...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {PLATFORMS.map((p) => {
                const avail = availFor(p.id);
                const platformAccounts = byPlatform.get(p.id) ?? [];
                const notConfigured = !avail?.configured;
                const disabledByAdmin = Boolean(avail?.configured) && avail?.enabled === false;
                const disabled = notConfigured || disabledByAdmin || !companyId;
                return (
                  <section
                    key={p.id}
                    aria-labelledby={`pl-${p.id}`}
                    className="flex flex-col rounded border editorial-rule"
                  >
                    <div className="flex flex-wrap items-center gap-3 border-b editorial-rule px-5 py-4">
                      <span id={`pl-${p.id}`}>
                        <PlatformBadge platform={p.id} />
                      </span>
                      <button
                        type="button"
                        onClick={() => connect(p.id)}
                        disabled={disabled || connecting !== null}
                        aria-busy={connecting === p.id}
                        aria-label={`Connect ${p.label}`}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-sm bg-foreground px-4 py-2 text-xs font-medium uppercase tracking-widest text-background transition hover:opacity-90 disabled:opacity-40"
                      >
                        {connecting === p.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plug className="h-3.5 w-3.5" />
                        )}
                        {platformAccounts.length > 0 ? "Connect another" : "Connect"}
                      </button>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 px-5 py-4">
                      {loading || accountsLoading ? (
                        <p className="text-xs text-muted-foreground">Loading...</p>
                      ) : disabled ? (
                        <p className="text-xs text-muted-foreground">
                          {!companyId
                            ? "Select a client first."
                            : notConfigured
                              ? "Not available yet — an administrator needs to finish setup."
                              : "Turned off for this client."}
                        </p>
                      ) : accountsError ? (
                        <p className="text-xs text-rose-600">
                          Couldn't load accounts.{" "}
                          <button
                            type="button"
                            className="underline hover:text-foreground"
                            onClick={() => refreshAccounts(companyId)}
                          >
                            Retry
                          </button>
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
                                <img
                                  src={a.avatar_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                (a.display_name || "?").slice(0, 1).toUpperCase()
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                {a.display_name}
                              </span>
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {a.username ? `@${a.username}` : "Connected account"}
                                {destinationPickerRequired(a.platform)
                                  ? a.external_account_id
                                    ? " · Destination selected"
                                    : " · Needs a destination selected"
                                  : ""}
                              </span>
                            </span>
                            <AccountStatusBadge status={a.status} />
                            <PublishCapabilityBadge canPublish={a.can_publish} />
                            <span className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => refreshAccount(a.id)}
                                disabled={busyAccount === a.id}
                                aria-label={`Refresh ${a.display_name}`}
                                className="inline-flex items-center gap-1 rounded-sm border editorial-rule px-2.5 py-1.5 text-xs hover:bg-foreground/5 disabled:opacity-40"
                              >
                                {busyAccount === a.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3.5 w-3.5" />
                                )}
                                Refresh
                              </button>
                              {a.status === "disconnected" && (
                                <button
                                  type="button"
                                  onClick={() => connect(a.platform)}
                                  disabled={busyAccount === a.id}
                                  aria-label={`Reconnect ${a.display_name}`}
                                  className="inline-flex items-center gap-1 rounded-sm border editorial-rule px-2.5 py-1.5 text-xs hover:bg-foreground/5 disabled:opacity-40"
                                >
                                  <Plug className="h-3.5 w-3.5" /> Reconnect
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => disconnectAccount(a)}
                                disabled={busyAccount === a.id || a.status === "disconnected"}
                                aria-label={`Disconnect ${a.display_name}`}
                                className="inline-flex items-center gap-1 rounded-sm border border-rose-300 px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                              >
                                <Unplug className="h-3.5 w-3.5" /> Disconnect
                              </button>
                            </span>
                            {a.last_error && (
                              <p className="w-full text-[11px] text-rose-600">{a.last_error}</p>
                            )}
                            {a.status !== "disconnected" &&
                              destinationPickerRequired(a.platform) && (
                                <div className="w-full">
                                  <DestinationPicker
                                    accountId={a.id}
                                    platform={a.platform}
                                    currentName={a.external_account_id ? a.display_name : null}
                                    onChanged={() => refreshAccounts(companyId)}
                                  />
                                </div>
                              )}
                          </div>
                        ))
                      )}

                      <button
                        type="button"
                        onClick={() => syncPlatform(p.id)}
                        disabled={busyPlatform === p.id || !companyId || accountsLoading}
                        aria-label={`Sync ${p.label} accounts`}
                        className="inline-flex items-center gap-1.5 self-start rounded-sm border editorial-rule px-2.5 py-1.5 text-xs hover:bg-foreground/5 disabled:opacity-40"
                      >
                        {busyPlatform === p.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Sync accounts
                      </button>
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}

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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={connectingTitleId}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
          onKeyDown={(e) => {
            if (e.key === "Escape") cancelConnect();
          }}
        >
          <div className="w-full max-w-sm rounded-lg border editorial-rule bg-background p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <span
                id={connectingTitleId}
                className="text-xs uppercase tracking-widest text-muted-foreground"
              >
                Connecting
              </span>
              <button
                type="button"
                ref={cancelRef}
                onClick={cancelConnect}
                aria-label="Cancel"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div aria-live="polite" aria-busy={!connectingStalled}>
              {connectingStalled ? (
                <div className="mt-4">
                  <p className="text-sm">Taking longer than expected.</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your browser may be blocking the sign-in page. Open it again, or allow the
                    navigation.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => connect(connecting!)}
                      className="rounded-sm bg-foreground px-4 py-2 text-xs font-medium uppercase tracking-widest text-background"
                    >
                      Try again
                    </button>
                    {redirectUrlRef.current && (
                      <a
                        href={redirectUrlRef.current}
                        className="text-xs underline text-muted-foreground hover:text-foreground"
                      >
                        Open sign-in page
                      </a>
                    )}
                  </div>
                </div>
              ) : (
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
              )}
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

import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2, Lock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Company, Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import {
  getConnectionLink,
  listSocialAccounts,
  platformAvailability,
  syncSocialAccounts,
} from "@/lib/social/social.functions";
import { AccountStatusBadge, PlatformBadge } from "@/components/social/PlatformBadge";

export const Route = createFileRoute("/_authenticated/admin/connect")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { company?: string; platform?: Platform; connected?: string } => ({
    company: typeof search.company === "string" ? search.company : undefined,
    platform: typeof search.platform === "string" ? (search.platform as Platform) : undefined,
    connected: typeof search.connected === "string" ? search.connected : undefined,
  }),
  component: ConnectPage,
});

type Availability = { platform: Platform; configured: boolean; enabled: boolean };

function ConnectPage() {
  const search = Route.useSearch();
  const availability = useServerFn(platformAvailability);
  const getLink = useServerFn(getConnectionLink);
  const sync = useServerFn(syncSocialAccounts);
  const list = useServerFn(listSocialAccounts);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState(search.company ?? "");
  const [platforms, setPlatforms] = useState<Availability[]>([]);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [accounts, setAccounts] = useState<
    {
      id: string;
      platform: Platform;
      display_name: string;
      username: string | null;
      status: string;
    }[]
  >([]);

  const refreshAccounts = useCallback(
    async (cid: string) => {
      if (!cid) return setAccounts([]);
      try {
        const res = await list({ data: { companyId: cid } });
        setAccounts(
          (res.accounts as unknown as {
            id: string;
            platform: Platform;
            display_name: string;
            username: string | null;
            status: string;
          }[]) ?? [],
        );
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
      setPlatforms(avail.platforms as Availability[]);
      if (!companyId && cs && cs.length > 0) setCompanyId(cs[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refreshAccounts(companyId);
  }, [companyId, refreshAccounts]);

  // Returning from the provider's authorization screen.
  useEffect(() => {
    if (search.connected === "1" && search.company && search.platform) {
      toast.success("Authorization received - syncing account...");
      sync({ data: { companyId: search.company, platform: search.platform } })
        .then(() => refreshAccounts(search.company!))
        .catch((err) => toast.error((err as Error).message));
    }
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

  const selectedCompany = companies.find((c) => c.id === companyId);

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center gap-4 border-b editorial-rule px-6 py-4">
        <Link
          to="/admin"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Studio
        </Link>
        <div className="h-4 w-px bg-foreground/20" />
        <span className="font-display text-xl">Connect social accounts</span>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <label className="block">
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

        <div className="mt-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Choose a platform to connect
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {PLATFORMS.map((p) => {
              const avail = platforms.find((x) => x.platform === p.id);
              const disabled = !avail?.configured || !avail?.enabled || !companyId;
              return (
                <button
                  key={p.id}
                  onClick={() => connect(p.id)}
                  disabled={disabled || connecting !== null}
                  className="flex items-center justify-between rounded border editorial-rule p-4 text-left transition hover:bg-foreground/[0.02] disabled:opacity-50"
                >
                  <span className="flex items-center gap-3">
                    <PlatformBadge platform={p.id} />
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    {connecting === p.id ? "Opening..." : disabled ? "Not configured" : "Connect"}
                    {!disabled && <ArrowRight className="h-3.5 w-3.5" />}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> You'll be taken to Composio's connect page, then to the
            provider to authorize. Tokens are stored by Composio, never in this app.
          </p>
        </div>

        {selectedCompany && (
          <div className="mt-10 rounded border editorial-rule p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {selectedCompany.name}'s connected accounts
              </p>
              <button
                onClick={async () => {
                  try {
                    const res = await sync({ data: { companyId } });
                    toast.success(`Synced ${res.upserted} account(s)`);
                    await refreshAccounts(companyId);
                  } catch (err) {
                    toast.error((err as Error).message);
                  }
                }}
                className="rounded-sm border editorial-rule px-3 py-1.5 text-xs hover:bg-foreground/5"
              >
                Sync now
              </button>
            </div>
            {accounts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No accounts connected yet.</p>
            ) : (
              <ul className="mt-3 divide-y editorial-rule">
                {accounts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium">{a.display_name}</span>
                      {a.username && (
                        <span className="text-xs text-muted-foreground">@{a.username}</span>
                      )}
                      <PlatformBadge platform={a.platform} />
                    </span>
                    <AccountStatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Connecting screen while the browser heads to Composio / the provider */}
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
                  Opening Composio's connect page. You'll authorize there, then come back here.
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

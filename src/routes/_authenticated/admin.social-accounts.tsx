import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Link2, RefreshCw, Search, Unplug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Company, Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import {
  disconnectSocialAccount,
  listSocialAccounts,
  refreshSocialAccount,
  syncSocialAccounts,
  platformAvailability,
} from "@/lib/social/social.functions";
import {
  AccountStatusBadge,
  PlatformBadge,
  PublishCapabilityBadge,
} from "@/components/social/PlatformBadge";
import { DestinationPicker } from "@/components/social/DestinationPicker";
import { destinationPickerRequired } from "@/lib/publishing/platforms";
import { postedAgo } from "@/lib/posted";

export const Route = createFileRoute("/_authenticated/admin/social-accounts")({
  component: SocialAccountsPage,
});

type AccountRow = {
  id: string;
  company_id: string;
  platform: Platform;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  status: string;
  can_publish: boolean;
  external_account_id: string | null;
  last_synced_at: string | null;
  last_checked_at: string | null;
  last_error: string | null;
  company: { id: string; name: string; slug: string } | null;
};

const STATUS_OPTIONS = [
  { id: "", label: "All statuses" },
  { id: "connected", label: "Connected" },
  { id: "attention_required", label: "Attention Required" },
  { id: "expired", label: "Expired" },
  { id: "disconnected", label: "Disconnected" },
  { id: "error", label: "Error" },
];

function SocialAccountsPage() {
  const navigate = useNavigate();
  const load = useServerFn(listSocialAccounts);
  const sync = useServerFn(syncSocialAccounts);
  const refresh = useServerFn(refreshSocialAccount);
  const disconnect = useServerFn(disconnectSocialAccount);
  const availability = useServerFn(platformAvailability);

  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [configured, setConfigured] = useState(true);

  const [clientFilter, setClientFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [res, { data: cs }, avail] = await Promise.all([
        load({ data: {} }),
        supabase.from("companies").select("*").order("name"),
        availability({ data: {} }),
      ]);
      setAccounts((res.accounts as AccountRow[]) ?? []);
      setCompanies((cs ?? []) as Company[]);
      setConfigured(avail.configured);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [load, availability]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((a) => {
      if (clientFilter && a.company_id !== clientFilter) return false;
      if (platformFilter && a.platform !== platformFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (q) {
        const hay = `${a.display_name} ${a.username ?? ""} ${a.company?.name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [accounts, clientFilter, platformFilter, statusFilter, query]);

  async function onSync(companyId: string) {
    setSyncing(true);
    try {
      const res = await sync({ data: { companyId } });
      toast.success(`Synced ${res.upserted} account(s)`);
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  async function onRefresh(id: string) {
    setBusyId(id);
    try {
      await refresh({ data: { accountId: id } });
      toast.success("Account refreshed");
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function onDisconnect(id: string) {
    if (!confirm("Disconnect this account? Publishing to it will stop until reconnected.")) return;
    setBusyId(id);
    try {
      await disconnect({ data: { accountId: id } });
      toast.success("Account disconnected");
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b editorial-rule px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← Studio
          </Link>
          <div className="h-4 w-px bg-foreground/20" />
          <span className="font-display text-xl">Social accounts</span>
        </div>
        <Link
          to="/admin/connect"
          className="rounded-sm bg-foreground px-4 py-2 text-xs font-medium uppercase tracking-widest text-background"
        >
          + Connect account
        </Link>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {!configured && (
          <p className="mb-6 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Composio is not configured. Set <span className="font-mono">COMPOSIO_API_KEY</span> to
            connect accounts and publish.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search accounts…"
              className="w-full rounded-sm border editorial-rule bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded-sm border editorial-rule bg-background px-3 py-2 text-xs"
          >
            <option value="">All clients</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-sm border editorial-rule bg-background px-3 py-2 text-xs"
          >
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-sm border editorial-rule bg-background px-3 py-2 text-xs"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {visible.length} of {accounts.length}
          </span>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
        ) : accounts.length === 0 ? (
          <div className="mt-12 rounded border editorial-rule p-12 text-center">
            <p className="font-display text-2xl">No accounts connected yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect a client's Instagram, TikTok, Facebook, X or LinkedIn account to get started.
            </p>
            <Link
              to="/admin/connect"
              className="mt-6 inline-block rounded-sm bg-foreground px-5 py-2.5 text-sm text-background"
            >
              Connect an account
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-10 py-10 text-center text-sm text-muted-foreground">
            No accounts match your filters.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {visible.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-4 rounded border editorial-rule p-4"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-foreground/5">
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <PlatformBadge platform={a.platform} className="scale-75" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{a.display_name}</span>
                    {a.username && (
                      <span className="text-xs text-muted-foreground">@{a.username}</span>
                    )}
                    <PlatformBadge platform={a.platform} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <Link
                      to="/admin/companies/$slug"
                      params={{ slug: a.company?.slug ?? "" }}
                      className="hover:text-foreground"
                    >
                      {a.company?.name ?? "Unknown client"}
                    </Link>
                    {a.last_synced_at && <span>· synced {postedAgo(a.last_synced_at)}</span>}
                  </div>
                  {a.last_error && <p className="mt-1 text-[11px] text-rose-600">{a.last_error}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AccountStatusBadge status={a.status} />
                  <PublishCapabilityBadge canPublish={a.can_publish} />
                  {destinationPickerRequired(a.platform) && a.status !== "disconnected" && (
                    <DestinationPicker
                      accountId={a.id}
                      platform={a.platform}
                      currentName={a.external_account_id ? a.display_name : null}
                      onChanged={reload}
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={() => onRefresh(a.id)}
                    disabled={busyId === a.id || !configured}
                    className="inline-flex items-center gap-1.5 rounded-sm border editorial-rule px-2.5 py-1.5 hover:bg-foreground/5 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </button>
                  <button
                    onClick={() =>
                      navigate({
                        to: "/admin/connect",
                        search: { company: a.company_id, platform: a.platform },
                      })
                    }
                    disabled={!configured}
                    className="inline-flex items-center gap-1.5 rounded-sm border editorial-rule px-2.5 py-1.5 hover:bg-foreground/5 disabled:opacity-50"
                  >
                    <Link2 className="h-3.5 w-3.5" /> Reconnect
                  </button>
                  <Link
                    to="/admin/publishing"
                    search={{ company: a.company?.slug }}
                    className="inline-flex items-center gap-1.5 rounded-sm border editorial-rule px-2.5 py-1.5 hover:bg-foreground/5"
                  >
                    History
                  </Link>
                  <button
                    onClick={() => onDisconnect(a.id)}
                    disabled={busyId === a.id}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-rose-300 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Unplug className="h-3.5 w-3.5" /> Disconnect
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {companies.length > 0 && (
          <div className="mt-10 rounded border editorial-rule p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Sync from Composio
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pull the latest accounts, statuses and permissions for a client.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSync(c.id)}
                  disabled={syncing || !configured}
                  className="rounded-sm border editorial-rule px-3 py-1.5 text-xs hover:bg-foreground/5 disabled:opacity-50"
                >
                  Sync {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

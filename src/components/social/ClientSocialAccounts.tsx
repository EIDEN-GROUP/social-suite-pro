import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Link2, RefreshCw, Unplug } from "lucide-react";
import type { Company, Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import {
  disconnectSocialAccount,
  listSocialAccounts,
  refreshSocialAccount,
  syncSocialAccounts,
} from "@/lib/social/social.functions";
import {
  AccountStatusBadge,
  PlatformBadge,
  PublishCapabilityBadge,
} from "@/components/social/PlatformBadge";

type AccountRow = {
  id: string;
  platform: Platform;
  display_name: string;
  username: string | null;
  status: string;
  can_publish: boolean;
  last_synced_at: string | null;
  last_error: string | null;
};

/** Social Accounts section embedded inside a client's admin page. */
export function ClientSocialAccounts({ company }: { company: Company }) {
  const load = useServerFn(listSocialAccounts);
  const sync = useServerFn(syncSocialAccounts);
  const refresh = useServerFn(refreshSocialAccount);
  const disconnect = useServerFn(disconnectSocialAccount);

  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await load({ data: { companyId: company.id } });
      setAccounts((res.accounts as unknown as AccountRow[]) ?? []);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [company.id, load]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function onSyncAll() {
    setBusy("sync");
    try {
      const res = await sync({ data: { companyId: company.id } });
      toast.success(`Synced ${res.upserted} account(s)`);
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function onRefresh(id: string) {
    setBusy(id);
    try {
      await refresh({ data: { accountId: id } });
      toast.success("Refreshed");
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function onDisconnect(id: string) {
    if (!confirm("Disconnect this account?")) return;
    setBusy(id);
    try {
      await disconnect({ data: { accountId: id } });
      toast.success("Disconnected");
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const byPlatform = new Map(accounts.map((a) => [a.platform, a]));

  return (
    <div className="rounded border editorial-rule p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Social accounts</p>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onSyncAll}
            disabled={busy === "sync"}
            className="inline-flex items-center gap-1.5 rounded-sm border editorial-rule px-2.5 py-1.5 hover:bg-foreground/5 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Sync
          </button>
          <Link
            to="/admin/connect"
            search={{ company: company.id }}
            className="inline-flex items-center gap-1.5 rounded-sm bg-foreground px-2.5 py-1.5 text-background"
          >
            <Link2 className="h-3.5 w-3.5" /> Connect
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Platform</th>
                <th className="py-2 pr-4 font-medium">Account</th>
                <th className="py-2 pr-4 font-medium">Connection</th>
                <th className="py-2 pr-4 font-medium">Publishing</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORMS.map((p) => {
                const a = byPlatform.get(p.id);
                return (
                  <tr key={p.id} className="border-t editorial-rule">
                    <td className="py-2.5 pr-4">
                      <PlatformBadge platform={p.id} />
                    </td>
                    <td className="py-2.5 pr-4">
                      {a ? (
                        <span>
                          {a.display_name}
                          {a.username ? (
                            <span className="text-muted-foreground"> · @{a.username}</span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not connected</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      {a ? (
                        <span className="inline-flex flex-col gap-1">
                          <AccountStatusBadge status={a.status} />
                          {a.last_error && (
                            <span className="text-[10px] text-rose-600">{a.last_error}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      {a ? (
                        <PublishCapabilityBadge canPublish={a.can_publish} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5">
                      {a ? (
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => onRefresh(a.id)}
                            disabled={busy === a.id}
                            className="rounded-sm border editorial-rule px-2 py-1 hover:bg-foreground/5 disabled:opacity-50"
                          >
                            Refresh
                          </button>
                          <button
                            onClick={() => onDisconnect(a.id)}
                            disabled={busy === a.id}
                            className="inline-flex items-center gap-1 rounded-sm border border-rose-300 px-2 py-1 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            <Unplug className="h-3 w-3" /> Disconnect
                          </button>
                          <Link
                            to="/admin/publishing"
                            search={{ company: company.slug }}
                            className="rounded-sm border editorial-rule px-2 py-1 hover:bg-foreground/5"
                          >
                            History
                          </Link>
                        </div>
                      ) : (
                        <Link
                          to="/admin/connect"
                          search={{ company: company.id, platform: p.id }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Connect →
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

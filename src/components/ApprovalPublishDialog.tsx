import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarClock, Check, Rocket, X } from "lucide-react";
import type { Company, Post, Platform } from "@/lib/types";
import { Media } from "@/components/Media";
import { AccountStatusBadge, PlatformBadge } from "@/components/social/PlatformBadge";
import {
  publishingToast,
  publishingSuccess,
  publishingWarning,
  publishingError,
  publishingDone,
} from "@/components/publish-toast";
import {
  getPublishableContext,
  publishNow,
  schedulePublish,
} from "@/lib/publishing/publishing.functions";

type Account = {
  id: string;
  display_name: string;
  username: string | null;
  platform: Platform;
  status: string;
  can_publish: boolean;
};

interface Props {
  post: Post;
  company: Company | null;
  onClose: () => void;
  /** Persist a "not now" so the popup stays dismissed for this post. */
  onDismiss: (postId: string) => void;
}

/**
 * Internal confirmation popup shown when a client approves a post.
 * Approval never auto-publishes - the team explicitly confirms here.
 */
export function ApprovalPublishDialog({ post, company, onClose, onDismiss }: Props) {
  const loadContext = useServerFn(getPublishableContext);
  const doPublishNow = useServerFn(publishNow);
  const doSchedule = useServerFn(schedulePublish);

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [approvalValid, setApprovalValid] = useState(true);
  const [busy, setBusy] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");

  useEffect(() => {
    let alive = true;
    loadContext({ data: { postId: post.id } })
      .then((res) => {
        if (!alive) return;
        const list = (res.accounts as Account[]) ?? [];
        setAccounts(list);
        setApprovalValid(res.approvalValid);
        const firstPublishable = list.find((a) => a.can_publish) ?? list[0];
        setAccountId(firstPublishable?.id ?? "");
      })
      .catch((err) => toast.error((err as Error).message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [post.id, loadContext]);

  const selected = accounts.find((a) => a.id === accountId) ?? null;

  async function runPublishNow() {
    if (!selected) return toast.error("Select an account first.");
    if (!selected.can_publish) return toast.error("This account cannot publish this content.");
    setBusy(true);
    const tid = publishingToast("Publishing…");
    try {
      const res = await doPublishNow({ data: { postId: post.id, socialAccountId: selected.id } });
      if (res.status === "published") publishingSuccess(tid);
      else publishingWarning(tid, res.error ?? `Publishing status: ${res.status}`);
      onClose();
    } catch (err) {
      publishingError(tid, (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runSchedule() {
    if (!selected) return toast.error("Select an account first.");
    if (!scheduledFor) return toast.error("Pick a date and time.");
    setBusy(true);
    const tid = publishingToast("Scheduling…");
    try {
      const iso = new Date(scheduledFor).toISOString();
      const res = await doSchedule({
        data: { postId: post.id, socialAccountId: selected.id, scheduledFor: iso },
      });
      if ("scheduled" in res && res.scheduled) publishingDone(tid, "Scheduled for publishing");
      else publishingSuccess(tid);
      onClose();
    } catch (err) {
      publishingError(tid, (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b editorial-rule p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white">
              <Check className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-emerald-600">
                Approval received
              </p>
              <h2 className="font-display text-2xl leading-tight">Client approved this post!</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[140px_1fr]">
          <div className="h-40 overflow-hidden rounded border editorial-rule bg-foreground/5">
            <Media post={post} className="h-full w-full object-cover" />
          </div>
          <div className="space-y-2 text-sm">
            <Row label="Client" value={company?.name ?? "—"} />
            <Row label="Platform" value={<PlatformBadge platform={post.platform} />} />
            <Row label="Approval" value={<span className="text-emerald-600">Approved</span>} />
            {post.caption && (
              <p className="line-clamp-3 text-xs text-muted-foreground">{post.caption}</p>
            )}
          </div>
        </div>

        <div className="space-y-4 border-t editorial-rule p-5">
          {!approvalValid && (
            <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              The content changed after approval, so this approval is no longer valid.
            </p>
          )}

          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              Publish to account
            </span>
            {loading ? (
              <p className="mt-2 text-sm text-muted-foreground">Loading accounts…</p>
            ) : accounts.length === 0 ? (
              <p className="mt-2 rounded border editorial-rule px-3 py-2 text-xs text-muted-foreground">
                No connected {post.platform} account for this client. Connect one first.
              </p>
            ) : (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="mt-1.5 w-full rounded border editorial-rule bg-background px-3 py-2 text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.display_name}
                    {a.username ? ` (@${a.username})` : ""} —{" "}
                    {a.can_publish ? "can publish" : "no publish permission"}
                  </option>
                ))}
              </select>
            )}
          </label>

          {selected && (
            <div className="flex flex-wrap items-center gap-2">
              <AccountStatusBadge status={selected.status} />
              {!selected.can_publish && (
                <span className="text-[11px] text-amber-700">
                  This account lacks the publishing permission.
                </span>
              )}
            </div>
          )}

          <div className="rounded border editorial-rule p-3">
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" /> Schedule instead
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="min-w-0 flex-1 rounded border editorial-rule bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={busy || !selected?.can_publish || !scheduledFor}
                onClick={runSchedule}
                className="rounded-sm border editorial-rule px-3 text-xs uppercase tracking-widest hover:bg-foreground/5 disabled:opacity-50"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t editorial-rule p-5">
          <button
            disabled={busy || !selected?.can_publish}
            onClick={runPublishNow}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <Rocket className="h-4 w-4" /> {busy ? "Working…" : "Publish Now"}
          </button>
          <button
            disabled={busy}
            onClick={() => {
              onDismiss(post.id);
              onClose();
            }}
            className="rounded-sm border editorial-rule px-4 py-2.5 text-sm hover:bg-foreground/5"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

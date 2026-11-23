import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink, RotateCw, XCircle } from "lucide-react";
import { Media } from "@/components/Media";
import { AccountStatusBadge, PlatformBadge } from "@/components/social/PlatformBadge";
import type { Platform } from "@/lib/types";
import {
  cancelPublishingJob,
  getPublishingJob,
  retryPublishingJob,
} from "@/lib/publishing/publishing.functions";
import { formatPostedAt } from "@/lib/posted";

export const Route = createFileRoute("/_authenticated/admin/publishing/$id")({
  component: PublishingDetail,
});

type Detail = {
  job: {
    id: string;
    status: string;
    platform: Platform;
    scheduled_for: string | null;
    approved_content_version: number | null;
    last_error: string | null;
  };
  post: {
    id: string;
    caption: string | null;
    media_url: string | null;
    media_type: string | null;
    post_type: string;
    extra_media: string[];
    status: string;
    decided_at: string | null;
  } | null;
  company: { id: string; name: string; slug: string } | null;
  account: {
    id: string;
    display_name: string;
    username: string | null;
    status: string;
    can_publish: boolean;
  } | null;
  attempts: Array<{
    id: string;
    attempt_no: number;
    outcome: string;
    error_message: string | null;
    provider_response: unknown;
  }>;
  published: {
    external_url: string | null;
    external_post_id: string | null;
    published_at: string;
  } | null;
};

function PublishingDetail() {
  const { id } = Route.useParams();
  const load = useServerFn(getPublishingJob);
  const retry = useServerFn(retryPublishingJob);
  const cancel = useServerFn(cancelPublishingJob);

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setDetail((await load({ data: { id } })) as unknown as Detail);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id, load]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function onRetry() {
    setBusy(true);
    try {
      const res = await retry({ data: { id } });
      if (res.status === "published") toast.success("Published ✅");
      else toast.warning(res.error ?? `Status: ${res.status}`);
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onCancel() {
    setBusy(true);
    try {
      await cancel({ data: { id } });
      toast.success("Cancelled");
      await reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  if (!detail) return <div className="p-10 text-sm text-muted-foreground">Job not found.</div>;

  const { job, post, company, account, attempts, published } = detail;

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center gap-4 border-b editorial-rule px-6 py-4">
        <Link
          to="/admin/publishing"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Publishing
        </Link>
        <div className="h-4 w-px bg-foreground/20" />
        <span className="font-display text-xl">Publishing details</span>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-8 lg:grid-cols-[1fr_340px]">
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <div className="h-56 overflow-hidden rounded border editorial-rule bg-foreground/5">
              {post && <Media post={post} className="h-full w-full object-cover" />}
            </div>
            <div className="space-y-2 text-sm">
              <Field label="Client" value={company?.name ?? "—"} />
              <Field label="Platform" value={<PlatformBadge platform={job.platform} />} />
              <Field
                label="Account"
                value={
                  account
                    ? `${account.display_name}${account.username ? ` (@${account.username})` : ""}`
                    : "—"
                }
              />
              <Field label="Job status" value={job.status} />
              <Field label="Approval status" value={post?.status ?? "—"} />
              <Field label="Approved version" value={String(job.approved_content_version ?? "—")} />
              {post?.decided_at && (
                <Field label="Approved at" value={formatPostedAt(post.decided_at)} />
              )}
              {job.scheduled_for && (
                <Field label="Scheduled for" value={formatPostedAt(job.scheduled_for)} />
              )}
              {published?.published_at && (
                <Field label="Published at" value={formatPostedAt(published.published_at)} />
              )}
              {published?.external_post_id && (
                <Field label="External ID" value={published.external_post_id} />
              )}
            </div>
          </div>

          {post?.caption && (
            <div className="rounded border editorial-rule p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Content</p>
              <p className="mt-2 whitespace-pre-line text-sm">{post.caption}</p>
            </div>
          )}

          {job.last_error && (
            <div className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p className="text-xs uppercase tracking-widest">Last error</p>
              <p className="mt-1">{job.last_error}</p>
            </div>
          )}

          <div className="rounded border editorial-rule p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Publishing attempts
            </p>
            {attempts.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No attempts yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {attempts.map((a) => (
                  <li key={a.id} className="rounded border editorial-rule p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Attempt {a.attempt_no}</span>
                      <span className="uppercase tracking-widest text-muted-foreground">
                        {a.outcome}
                      </span>
                    </div>
                    {a.error_message && <p className="mt-1 text-rose-600">{a.error_message}</p>}
                    {a.provider_response ? (
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-foreground/5 p-2 text-[10px] leading-relaxed">
                        {JSON.stringify(a.provider_response, null, 2)}
                      </pre>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          {account && (
            <div className="rounded border editorial-rule p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Account health
              </p>
              <div className="mt-2">
                <AccountStatusBadge status={account.status} />
              </div>
              {account.can_publish ? (
                <p className="mt-2 text-xs text-emerald-700">Publishing available</p>
              ) : (
                <p className="mt-2 text-xs text-amber-700">
                  Publishing unavailable for this account
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {published?.external_url && (
              <a
                href={published.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                <ExternalLink className="h-4 w-4" /> View published post
              </a>
            )}
            {(job.status === "failed" || job.status === "requires_attention") && (
              <button
                onClick={onRetry}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-50"
              >
                <RotateCw className="h-4 w-4" /> Retry safely
              </button>
            )}
            {job.status === "scheduled" && (
              <button
                onClick={onCancel}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-rose-300 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" /> Cancel scheduled post
              </button>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

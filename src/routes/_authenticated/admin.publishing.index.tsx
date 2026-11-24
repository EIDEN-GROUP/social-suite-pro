import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink, RotateCw, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Company, Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import { Media } from "@/components/Media";
import { PlatformBadge } from "@/components/social/PlatformBadge";
import { publishingToast } from "@/components/publish-toast";
import {
  cancelPublishingJob,
  listPublishingJobs,
  retryPublishingJob,
} from "@/lib/publishing/publishing.functions";
import { formatPostedAt, postedAgo } from "@/lib/posted";

export const Route = createFileRoute("/_authenticated/admin/publishing/")({
  validateSearch: (search: Record<string, unknown>): { company?: string } => ({
    company: typeof search.company === "string" ? search.company : undefined,
  }),
  component: PublishingCenter,
});

type JobStatus =
  | "ready"
  | "scheduled"
  | "processing"
  | "published"
  | "failed"
  | "cancelled"
  | "requires_attention";

const TABS: { id: "" | JobStatus; label: string; match?: JobStatus[] }[] = [
  { id: "", label: "All" },
  { id: "ready", label: "Ready to Publish", match: ["ready"] },
  { id: "scheduled", label: "Scheduled", match: ["scheduled"] },
  { id: "processing", label: "Processing", match: ["processing"] },
  { id: "published", label: "Published", match: ["published"] },
  { id: "failed", label: "Failed", match: ["failed", "requires_attention"] },
  { id: "cancelled", label: "Cancelled", match: ["cancelled"] },
];

const JOB_STATUS_META: Record<JobStatus, { label: string; cls: string }> = {
  ready: { label: "Ready", cls: "bg-amber-400/20 text-amber-700" },
  scheduled: { label: "Scheduled", cls: "bg-indigo-500/15 text-indigo-700" },
  processing: { label: "Processing", cls: "bg-sky-500/15 text-sky-700" },
  published: { label: "Published", cls: "bg-emerald-500/15 text-emerald-700" },
  failed: { label: "Failed", cls: "bg-rose-500/15 text-rose-700" },
  requires_attention: { label: "Requires Attention", cls: "bg-orange-500/15 text-orange-700" },
  cancelled: { label: "Cancelled", cls: "bg-foreground/10 text-muted-foreground" },
};

function JobStatusBadge({ status }: { status: JobStatus }) {
  const meta = JOB_STATUS_META[status] ?? JOB_STATUS_META.failed;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.cls}`}
    >
      {meta.label}
    </span>
  );
}

type JobRow = {
  id: string;
  status: JobStatus;
  platform: Platform;
  scheduled_for: string | null;
  created_at: string;
  last_error: string | null;
  attempts_count: number;
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
  account: { id: string; display_name: string; username: string | null } | null;
  published: {
    external_url: string | null;
    external_post_id: string | null;
    published_at: string;
  } | null;
};

function PublishingCenter() {
  const search = Route.useSearch();
  const load = useServerFn(listPublishingJobs);
  const cancel = useServerFn(cancelPublishingJob);
  const retry = useServerFn(retryPublishingJob);

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"" | JobStatus>("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState(search.company ?? "");
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [res, { data: cs }] = await Promise.all([
        load({ data: {} }),
        supabase.from("companies").select("*").order("name"),
      ]);
      setJobs((res.jobs as unknown as JobRow[]) ?? []);
      setCompanies((cs ?? []) as Company[]);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const channel = supabase
      .channel("publishing-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "publishing_jobs" },
        () => void reload(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reload]);

  const visible = useMemo(() => {
    const tabDef = TABS.find((t) => t.id === tab);
    const companySlug = companies.find((c) => c.id === companyFilter)?.slug ?? null;
    return jobs.filter((j) => {
      if (tabDef?.match && !tabDef.match.includes(j.status)) return false;
      if (platformFilter && j.platform !== platformFilter) return false;
      if (companyFilter) {
        if (search.company) {
          if (j.company?.slug !== search.company) return false;
        } else if (companySlug && j.company?.slug !== companySlug) {
          return false;
        } else if (!companySlug && j.company?.id !== companyFilter) {
          return false;
        }
      }
      return true;
    });
  }, [jobs, tab, platformFilter, companyFilter, companies, search.company]);

  async function onCancel(id: string) {
    if (!confirm("Cancel this scheduled post?")) return;
    setBusyId(id);
    const tid = publishingToast("Cancelling…");
    try {
      await cancel({ data: { id } });
      toast.success("Cancelled", { id: tid });
      await reload();
    } catch (err) {
      toast.error((err as Error).message, { id: tid });
    } finally {
      setBusyId(null);
    }
  }

  async function onRetry(id: string) {
    setBusyId(id);
    const tid = publishingToast("Publishing…");
    try {
      const res = await retry({ data: { id } });
      if (res.status === "published") toast.success("Published ✅", { id: tid });
      else toast.warning(res.error ?? `Status: ${res.status}`, { id: tid });
      await reload();
    } catch (err) {
      toast.error((err as Error).message, { id: tid });
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
          <span className="font-display text-xl">Publishing</span>
          {search.company && (
            <span className="text-xs text-muted-foreground">· {search.company}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!search.company && (
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="rounded-sm border editorial-rule bg-background px-3 py-1.5 text-xs"
            >
              <option value="">All clients</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="rounded-sm border editorial-rule bg-background px-3 py-1.5 text-xs"
          >
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap gap-1 border editorial-rule">
          {TABS.map((t) => (
            <button
              key={t.id || "all"}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs uppercase tracking-widest ${
                tab === t.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="mt-12 rounded border editorial-rule p-12 text-center text-sm text-muted-foreground">
            Nothing here yet. Publishing jobs appear once you publish or schedule an approved post.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {visible.map((j) => (
              <li
                key={j.id}
                className="flex flex-wrap items-center gap-4 rounded border editorial-rule p-4"
              >
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded border editorial-rule bg-foreground/5">
                  {j.post && <Media post={j.post} className="h-full w-full object-cover" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{j.company?.name ?? "—"}</span>
                    <PlatformBadge platform={j.platform} />
                    <JobStatusBadge status={j.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {j.account
                      ? `${j.account.display_name}${j.account.username ? ` (@${j.account.username})` : ""}`
                      : "No account"}
                    {j.scheduled_for &&
                      j.status === "scheduled" &&
                      ` · goes live ${formatPostedAt(j.scheduled_for)}`}
                    {j.status === "published" &&
                      j.published?.published_at &&
                      ` · published ${postedAgo(j.published.published_at)}`}
                  </p>
                  {j.post?.caption && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {j.post.caption}
                    </p>
                  )}
                  {j.last_error && <p className="mt-1 text-[11px] text-rose-600">{j.last_error}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {j.status === "published" && j.published?.external_url && (
                    <a
                      href={j.published.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-sm border editorial-rule px-2.5 py-1.5 text-sky-700 hover:bg-foreground/5"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View post
                    </a>
                  )}
                  {(j.status === "failed" || j.status === "requires_attention") && (
                    <button
                      onClick={() => onRetry(j.id)}
                      disabled={busyId === j.id}
                      className="inline-flex items-center gap-1.5 rounded-sm border editorial-rule px-2.5 py-1.5 hover:bg-foreground/5 disabled:opacity-50"
                    >
                      <RotateCw className="h-3.5 w-3.5" /> Retry
                    </button>
                  )}
                  {j.status === "scheduled" && (
                    <button
                      onClick={() => onCancel(j.id)}
                      disabled={busyId === j.id}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-rose-300 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Cancel
                    </button>
                  )}
                  <Link
                    to="/admin/publishing/$id"
                    params={{ id: j.id }}
                    className="rounded-sm border editorial-rule px-2.5 py-1.5 hover:bg-foreground/5"
                  >
                    Details
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

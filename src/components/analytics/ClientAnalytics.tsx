import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  UploadCloud,
} from "lucide-react";
import type { Company, Platform } from "@/lib/types";
import { getClientAnalytics } from "@/lib/analytics/analytics.functions";
import { AccountStatusBadge, PlatformBadge } from "@/components/social/PlatformBadge";
import { formatPostedAt, postedAgo } from "@/lib/posted";

export function ClientAnalytics({ company }: { company: Company }) {
  const load = useServerFn(getClientAnalytics);
  const [data, setData] = useState<Awaited<ReturnType<typeof load>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    load({ data: { companyId: company.id } })
      .then((res) => alive && setData(res))
      .catch((err) => toast.error((err as Error).message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [company.id, load]);

  if (loading)
    return <p className="py-16 text-center text-sm text-muted-foreground">Loading analytics…</p>;
  if (!data) return <p className="py-16 text-center text-sm text-muted-foreground">No data.</p>;

  const { totals, platforms, recentPublished } = data;

  const chartData = platforms.map((p) => ({
    name: p.platform === "twitter" ? "X" : p.platform[0].toUpperCase() + p.platform.slice(1),
    Pending: p.pending,
    Approved: p.approved,
    Changes: p.rejected,
    Posted: p.posted,
  }));

  const hasAny = totals.posts > 0 || totals.publishedFromSite > 0;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={UploadCloud}
          label="Content pieces"
          value={totals.posts}
          hint="across all platforms"
        />
        <Stat icon={Clock} label="Pending review" value={totals.pending} tone="amber" />
        <Stat
          icon={CheckCircle2}
          label="Approval rate"
          value={`${totals.approvalRate}%`}
          tone="emerald"
          hint={`${totals.approved + totals.posted} approved · ${totals.rejected} changes`}
        />
        <Stat
          icon={CalendarClock}
          label="Published from site"
          value={totals.publishedFromSite}
          tone="sky"
          hint={totals.scheduled > 0 ? `${totals.scheduled} scheduled` : undefined}
        />
      </div>

      {!hasAny ? (
        <div className="rounded border editorial-rule p-12 text-center">
          <p className="font-display text-2xl">No activity yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Once content is uploaded, approved and published, this dashboard fills in.
          </p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="rounded border editorial-rule p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Content by platform & status
            </p>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Pending" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Approved" stackId="a" fill="#10b981" />
                  <Bar dataKey="Changes" stackId="a" fill="#f43f5e" />
                  <Bar dataKey="Posted" stackId="a" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-platform table */}
          <div className="overflow-x-auto rounded border editorial-rule">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground/[0.03] text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Platform</th>
                  <th className="px-4 py-3 font-medium">Accounts</th>
                  <th className="px-4 py-3 text-center font-medium">Content</th>
                  <th className="px-4 py-3 text-center font-medium">Pending</th>
                  <th className="px-4 py-3 text-center font-medium">Approved</th>
                  <th className="px-4 py-3 text-center font-medium">Changes</th>
                  <th className="px-4 py-3 text-center font-medium">Posted</th>
                  <th className="px-4 py-3 text-center font-medium">From site</th>
                </tr>
              </thead>
              <tbody>
                {platforms.map((p) => (
                  <tr key={p.platform} className="border-t editorial-rule align-top">
                    <td className="px-4 py-3">
                      <PlatformBadge platform={p.platform as Platform} />
                    </td>
                    <td className="px-4 py-3">
                      {p.accounts.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Not connected</span>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {p.accounts.map((a) => (
                            <span key={a.id} className="flex items-center gap-2 text-xs">
                              <span className="max-w-[10rem] truncate">
                                {a.name}
                                {a.username ? ` (@${a.username})` : ""}
                              </span>
                              <AccountStatusBadge status={a.status} />
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <Num value={p.posts} />
                    <Num value={p.pending} tone="amber" />
                    <Num value={p.approved} tone="emerald" />
                    <Num value={p.rejected} tone="rose" />
                    <Num value={p.posted} tone="sky" />
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium">{p.publishedFromSite}</span>
                      {p.failed > 0 && (
                        <span className="ml-1 inline-flex items-center gap-0.5 text-rose-600">
                          <AlertTriangle className="h-3 w-3" />
                          {p.failed}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent published */}
          <div className="rounded border editorial-rule p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Recently published from the site
            </p>
            {recentPublished.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing published yet.</p>
            ) : (
              <ul className="mt-3 divide-y editorial-rule">
                {recentPublished.map((r) => (
                  <li key={r.postId} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={r.platform as Platform} />
                        <span className="truncate text-sm">
                          {r.caption?.slice(0, 80) || "Post"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {r.publishedAt
                          ? `${formatPostedAt(r.publishedAt)} · ${postedAgo(r.publishedAt)}`
                          : ""}
                      </p>
                    </div>
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 rounded-sm border editorial-rule px-2.5 py-1.5 text-xs text-sky-700 hover:bg-foreground/5"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "amber" | "emerald" | "sky";
}) {
  const toneCls = {
    default: "text-foreground",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    sky: "text-sky-600",
  }[tone];
  return (
    <div className="rounded border editorial-rule p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] uppercase tracking-widest">{label}</span>
      </div>
      <div className={`mt-2 font-display text-4xl leading-none ${toneCls}`}>{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Num({
  value,
  tone = "default",
}: {
  value: number;
  tone?: "default" | "amber" | "emerald" | "rose" | "sky";
}) {
  const toneCls = {
    default: "text-foreground",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    rose: "text-rose-600",
    sky: "text-sky-600",
  }[tone];
  return (
    <td className="px-4 py-3 text-center">
      <span className={`font-medium ${value === 0 ? "text-muted-foreground/50" : toneCls}`}>
        {value}
      </span>
    </td>
  );
}

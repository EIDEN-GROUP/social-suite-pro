import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Lock,
  Pencil,
  Send,
  Users,
  X,
} from "lucide-react";
import type { Company, Highlight, Platform, Post } from "@/lib/types";
import type { ClientSnapshot } from "@/lib/client.functions";
import { PLATFORMS } from "@/lib/types";
import { PhonePreview } from "@/components/PhonePreview";
import { Media } from "@/components/Media";
import { cn } from "@/lib/utils";
import { formatPostedAt, postedAgo } from "@/lib/posted";

type Filter = "all" | "pending" | "approved" | "rejected" | "posted";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Changes" },
  { id: "posted", label: "Posted" },
];

const STATUS: Record<string, { label: string; dot: string; pill: string }> = {
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
  },
  approved: {
    label: "Approved",
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Changes",
    dot: "bg-rose-500",
    pill: "bg-rose-50 text-rose-700 border-rose-200",
  },
  posted: { label: "Posted", dot: "bg-sky-500", pill: "bg-sky-50 text-sky-700 border-sky-200" },
};

const QUICK_CHIPS = ["Adjust crop", "Update copy", "Ready to publish", "Loved it"];

interface Props {
  company: Company;
  posts: Post[];
  highlights: Highlight[];
  snapshot?: ClientSnapshot | null;
  onDecide: (post: Post, status: "approved" | "rejected", comment: string) => Promise<void>;
  onLogout: () => void;
}

function formatCount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function ApprovalRoom({ company, posts, highlights, snapshot, onDecide, onLogout }: Props) {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobilePane, setMobilePane] = useState<"phone" | "review">("phone");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, posted: 0 };
    for (const p of posts) c[p.status] += 1;
    return c;
  }, [posts]);

  const platformCounts = useMemo(() => {
    const m = new Map<Platform, number>();
    for (const p of posts) m.set(p.platform, (m.get(p.platform) ?? 0) + 1);
    return m;
  }, [posts]);

  const platformPosts = useMemo(
    () => posts.filter((p) => p.platform === platform),
    [posts, platform],
  );

  const filtered = useMemo(
    () => (filter === "all" ? platformPosts : platformPosts.filter((p) => p.status === filter)),
    [platformPosts, filter],
  );

  const effectiveSelected = useMemo(() => {
    if (selectedId) {
      const found = posts.find((p) => p.id === selectedId);
      if (found && found.platform === platform) return found;
    }
    return filtered[0] ?? platformPosts[0] ?? null;
  }, [selectedId, posts, platform, filtered, platformPosts]);

  const selected = effectiveSelected;
  const selectedIndex = selected ? filtered.findIndex((p) => p.id === selected.id) : -1;

  useEffect(() => {
    setNote(selected?.client_comment ?? "");
  }, [selected?.id, selected?.client_comment]);

  // Default to the first platform that actually has content.
  useEffect(() => {
    if (platformCounts.size > 0 && !platformCounts.has(platform)) {
      setPlatform(([...platformCounts.keys()][0] as Platform) ?? "instagram");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const postedItems = useMemo(
    () =>
      posts
        .filter((p) => p.status === "posted")
        .sort((a, b) => (b.posted_at ?? "").localeCompare(a.posted_at ?? "")),
    [posts],
  );

  function step(dir: -1 | 1) {
    if (selectedIndex < 0) return;
    const next = selectedIndex + dir;
    if (next < 0 || next >= filtered.length) return;
    setSelectedId(filtered[next].id);
  }

  async function decide(status: "approved" | "rejected") {
    if (!selected) return;
    if (status === "rejected" && !note.trim()) {
      toast.error("Add a note to request changes");
      return;
    }
    setBusy(true);
    const tid = toast.loading(status === "approved" ? "Approving…" : "Sending changes…");
    try {
      await onDecide(selected, status, note);
      toast.success(status === "approved" ? "Approved ✅" : "Changes requested", {
        id: tid,
        duration: 3500,
      });
      setSheetOpen(false);
    } catch (err) {
      toast.error((err as Error).message, { id: tid });
    } finally {
      setBusy(false);
    }
  }

  const phone = (
    <div className="flex w-full flex-col items-center gap-3">
      <div
        className="mx-auto w-full"
        style={{ maxWidth: "min(440px, calc((100dvh - 110px) * 0.4615 + 24px))" }}
      >
        <PhonePreview
          platform={platform}
          company={company}
          posts={platformPosts}
          highlights={highlights}
          onTap={(p) => {
            setSelectedId(p.id);
            setSheetOpen(true);
          }}
          frameClassName="max-w-none"
        />
      </div>
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-soft/70">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Live preview · tap any tile to review
      </p>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F7F8] text-[#111827]">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-40 h-14 shrink-0 border-b border-gray-200 bg-[#F7F7F8]/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-[1520px] items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_0_3px_rgba(99,102,241,0.16)]"
              style={{ background: company.accent_color || "#6366f1" }}
            />
            <span className="truncate text-[15px] font-extrabold tracking-tight text-gray-950">
              {company.name}
            </span>
            <span className="hidden shrink-0 items-center rounded border border-gray-200 bg-white px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-gray-500 sm:inline-flex">
              Approval room
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {snapshot && (snapshot.followers != null || snapshot.posts > 0) && (
              <div
                className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1 text-[12.5px] font-medium text-gray-500 lg:flex"
                title={
                  snapshot.handles.length
                    ? snapshot.handles
                        .map(
                          (h) =>
                            `${h.platform}${h.username ? ` @${h.username}` : ""}${
                              h.followers != null ? ` · ${formatCount(h.followers)}` : ""
                            }`,
                        )
                        .join("\n")
                    : undefined
                }
              >
                <Users className="h-3.5 w-3.5 text-gray-400" />
                {snapshot.followers != null ? (
                  <span>
                    <strong className="font-bold text-gray-900">
                      {formatCount(snapshot.followers)}
                    </strong>{" "}
                    followers
                  </span>
                ) : (
                  <span className="text-gray-400">Audience</span>
                )}
                <span className="text-gray-300">·</span>
                <span>
                  <strong className="font-bold text-gray-900">{snapshot.posts}</strong> pieces
                </span>
                <span className="text-gray-300">·</span>
                <span>
                  <strong className="font-bold text-sky-600">{snapshot.published}</strong> live
                </span>
              </div>
            )}
            <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1 text-[12.5px] font-medium text-gray-500 md:flex">
              <span>
                <strong className="font-bold text-gray-900">{counts.pending}</strong> pending
              </span>
              <span className="text-gray-300">·</span>
              <span>
                <strong className="font-bold text-emerald-600">{counts.approved}</strong> ok
              </span>
              <span className="text-gray-300">·</span>
              <span>
                <strong className="font-bold text-rose-600">{counts.rejected}</strong> changes
              </span>
              <span className="text-gray-300">·</span>
              <span>
                <strong className="font-bold text-sky-600">{counts.posted}</strong> posted
              </span>
            </div>

            <div className="relative">
              <button
                type="button"
                aria-label="Activity"
                onClick={() => setBellOpen((v) => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
              >
                <Bell className="h-4 w-4" />
                {counts.posted > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#F7F7F8]">
                    {counts.posted}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-24px)] rounded-2xl border border-gray-200 bg-white py-2 shadow-xl">
                  <div className="border-b border-gray-100 px-4 py-2 text-xs font-bold text-gray-900">
                    Your published posts
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {postedItems.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-gray-400">
                        Nothing published yet.
                      </p>
                    ) : (
                      postedItems.map((p) => (
                        <a
                          key={p.id}
                          href={p.post_url ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2.5 px-4 py-2.5 transition hover:bg-gray-50"
                        >
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-medium text-gray-800">
                              {p.caption ? p.caption.slice(0, 48) : `A ${p.post_type} went live`}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-gray-400">
                              {p.posted_at
                                ? `${formatPostedAt(p.posted_at)} · ${postedAgo(p.posted_at)}`
                                : ""}{" "}
                              · {PLATFORMS.find((x) => x.id === p.platform)?.label}
                            </span>
                          </span>
                        </a>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ---------- Mobile segmented switcher ---------- */}
      <div className="flex h-[46px] shrink-0 items-center border-b border-gray-200 bg-white px-3.5 lg:hidden">
        <div className="mx-auto grid w-full max-w-sm grid-cols-2 rounded-xl border border-gray-200/60 bg-[#F2F3F5] p-0.5">
          {(["phone", "review"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setMobilePane(id)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12px] transition",
                mobilePane === id
                  ? "bg-white font-bold text-gray-900 shadow-sm"
                  : "font-semibold text-gray-500",
              )}
            >
              {id === "phone" ? "Feed Preview" : "Review & Approve"}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Workspace ---------- */}
      <main className="mx-auto flex w-full max-w-[1520px] flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left: device */}
        <section
          className={cn(
            "flex w-full shrink-0 items-start justify-center overflow-y-auto bg-[#F7F7F8] px-3 py-5 lg:flex lg:w-[43%] lg:items-center lg:border-r lg:border-gray-200",
            mobilePane === "phone" ? "flex" : "hidden",
          )}
        >
          {phone}
        </section>

        {/* Right: workspace */}
        <section
          className={cn(
            "w-full flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-7 lg:w-[57%]",
            mobilePane === "review" ? "block" : "hidden lg:block",
          )}
        >
          {/* Platform + filters */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
                Tap any post to approve or request changes
              </p>
              <div className="flex items-center gap-1 overflow-x-auto text-[11.5px]">
                {FILTERS.map((f) => {
                  const n =
                    f.id === "all"
                      ? platformPosts.length
                      : platformPosts.filter((p) => p.status === f.id).length;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={cn(
                        "shrink-0 rounded-lg px-2.5 py-1 font-medium transition",
                        filter === f.id
                          ? "bg-gray-900 font-semibold text-white"
                          : "text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      {f.label}
                      {f.id === "all" ? ` (${n})` : n > 0 ? ` ${n}` : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="inline-flex w-full flex-wrap items-center gap-1 rounded-full border border-gray-200 bg-[#F7F7F8] p-1 sm:w-auto">
              {PLATFORMS.map((p) => {
                const n = platformCounts.get(p.id) ?? 0;
                const active = platform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPlatform(p.id);
                      setSelectedId(null);
                    }}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-[11.5px] font-bold uppercase tracking-wider transition",
                      active
                        ? "bg-[#111827] text-white shadow-sm"
                        : "font-semibold text-gray-600 hover:text-gray-900",
                    )}
                  >
                    {p.label} <span className="ml-0.5 opacity-70">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Studio card */}
          {selected ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-gray-900 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
                    POST #{Math.max(1, selectedIndex + 1)} OF {Math.max(1, filtered.length)}
                  </span>
                  <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-indigo-700">
                    {selected.post_type}
                  </span>
                  <span className="hidden text-xs font-medium text-gray-400 sm:inline">
                    · {PLATFORMS.find((p) => p.id === selected.platform)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                      STATUS[selected.status]?.pill,
                    )}
                  >
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full", STATUS[selected.status]?.dot)}
                    />
                    {STATUS[selected.status]?.label}
                  </span>
                  <div className="ml-1 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      disabled={selectedIndex <= 0}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => step(1)}
                      disabled={selectedIndex >= filtered.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                      aria-label="Next"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-12">
                <div className="flex flex-col gap-3 xl:col-span-5">
                  <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-xl border border-gray-200 bg-gray-100 xl:max-w-none">
                    <Media post={selected} className="h-full w-full object-cover" />
                  </div>
                  {selected.scheduled_at && (
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-[#F7F7F8] px-3.5 py-2.5 text-xs">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Scheduled publish
                        </span>
                        <span className="mt-0.5 block font-semibold text-gray-800">
                          {formatPostedAt(selected.scheduled_at)}
                        </span>
                      </div>
                      <span className="rounded border border-gray-200 bg-white px-2 py-0.5 text-[10.5px] font-semibold text-gray-600">
                        Auto-queue
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between gap-4 xl:col-span-7">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Caption & hashtags
                    </span>
                    <p className="mt-1.5 max-h-48 overflow-y-auto whitespace-pre-line rounded-xl border border-gray-200 bg-[#F7F7F8] p-3 text-[12.5px] leading-relaxed text-gray-700">
                      {selected.caption || "No caption"}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="client-note"
                      className="text-[11px] font-bold uppercase tracking-wider text-gray-400"
                    >
                      {selected.status === "posted" ? "Posted" : "Note for the studio"}
                    </label>
                    {selected.status === "posted" ? (
                      <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50 p-3">
                        <p className="flex items-center gap-2 text-sm font-semibold text-sky-800">
                          <BadgeCheck className="h-4 w-4" /> This post is live
                        </p>
                        {selected.posted_at && (
                          <p className="mt-0.5 text-xs text-sky-700">
                            {formatPostedAt(selected.posted_at)} · {postedAgo(selected.posted_at)}
                          </p>
                        )}
                        {selected.post_url && (
                          <a
                            href={selected.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Open post
                          </a>
                        )}
                        {selected.client_comment && (
                          <p className="mt-2 text-xs text-sky-700/80">{selected.client_comment}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="mt-2 mb-2 flex flex-wrap gap-1.5">
                          {QUICK_CHIPS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNote((n) => (n ? `${n}, ${c}` : c))}
                              className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 transition hover:bg-gray-200/80"
                            >
                              + {c}
                            </button>
                          ))}
                        </div>
                        <textarea
                          id="client-note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={2}
                          placeholder="Write a note… (required to request changes)"
                          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12.5px] text-gray-800 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busy || selected.status === "posted"}
                        onClick={() => decide("approved")}
                        className="flex min-w-[135px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" /> Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy || selected.status === "posted"}
                        onClick={() => decide("rejected")}
                        className="flex min-w-[150px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Pencil className="h-4 w-4" /> Request changes
                      </button>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-1 text-[11px] text-gray-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {selected.decided_at
                          ? `Last decision ${postedAgo(selected.decided_at)}`
                          : "Awaiting your review"}
                      </span>
                      <span className="hidden items-center gap-1 sm:inline-flex">
                        <Lock className="h-3 w-3" /> Private &amp; secure
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <p className="text-lg font-bold text-gray-900">Nothing to review here</p>
              <p className="mt-1 text-sm text-gray-500">
                No {filter !== "all" ? filter : ""} {platform} posts right now.
              </p>
            </div>
          )}

          {/* Queue */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  {PLATFORMS.find((p) => p.id === platform)?.label} queue ({filtered.length})
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-sky-500" /> Posted
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> OK
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Pending
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Changes
                </span>
              </div>
            </div>
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">No posts in this filter.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-9">
                {filtered.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(p.id);
                      setSheetOpen(true);
                    }}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-lg border-2 transition",
                      selected?.id === p.id
                        ? "border-gray-900"
                        : "border-transparent hover:border-gray-300",
                    )}
                  >
                    <Media post={p} className="h-full w-full object-cover" />
                    <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[9px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        "absolute bottom-1 left-1 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                        STATUS[p.status]?.dot,
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ---------- Mobile bottom sheet ---------- */}
      {sheetOpen && selected && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setSheetOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-3xl border-t border-gray-200 bg-white shadow-[0_-12px_40px_-8px_rgba(17,24,39,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 border-b border-gray-100 px-4 pb-2 pt-2.5">
              <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-gray-300" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-gray-900 px-2 py-0.5 text-[10.5px] font-bold text-white">
                    POST #{Math.max(1, selectedIndex + 1)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                      STATUS[selected.status]?.pill,
                    )}
                  >
                    {STATUS[selected.status]?.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <div className="flex items-start gap-3">
                <span className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200">
                  <Media post={selected} className="h-full w-full object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    {selected.post_type} ·{" "}
                    {PLATFORMS.find((p) => p.id === selected.platform)?.label}
                  </p>
                  <p className="mt-1 max-h-28 overflow-y-auto whitespace-pre-line text-[12.5px] leading-relaxed text-gray-700">
                    {selected.caption || "No caption"}
                  </p>
                </div>
              </div>

              {selected.status !== "posted" && (
                <>
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {QUICK_CHIPS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNote((n) => (n ? `${n}, ${c}` : c))}
                        className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700"
                      >
                        + {c}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Optional note… (required to request changes)"
                    className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-500"
                  />
                </>
              )}
            </div>

            {selected.status !== "posted" ? (
              <div className="flex shrink-0 items-center gap-2 border-t border-gray-200 bg-gray-50 p-3.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => decide("approved")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => decide("rejected")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-xs font-bold text-rose-600 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> Request changes
                </button>
              </div>
            ) : (
              <div className="shrink-0 border-t border-gray-200 bg-gray-50 p-3.5">
                {selected.post_url ? (
                  <a
                    href={selected.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2.5 text-xs font-bold text-white"
                  >
                    <ExternalLink className="h-4 w-4" /> Open live post
                  </a>
                ) : (
                  <p className="text-center text-xs text-gray-500">
                    This post is live on {selected.platform}.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

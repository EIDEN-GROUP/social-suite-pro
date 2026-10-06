import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, ExternalLink, GripVertical, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Company, Platform, Post } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import { Media } from "@/components/Media";
import { formatPostedAt, postedAgo } from "@/lib/posted";

export const Route = createFileRoute("/_authenticated/admin/calendar")({
  validateSearch: (search: Record<string, unknown>): { company?: string } => ({
    company: typeof search.company === "string" && search.company ? search.company : undefined,
  }),
  component: PostedCalendarPage,
});

type CompanyLite = Pick<Company, "id" | "slug" | "name" | "accent_color">;
type PostedPost = Post & { posted_at: string };

const PLATFORM_DOT: Record<Platform, string> = {
  instagram: "bg-pink-500",
  tiktok: "bg-teal-500",
  facebook: "bg-blue-600",
  twitter: "bg-neutral-800",
  linkedin: "bg-sky-600",
};

const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

function PostedCalendarPage() {
  // /admin/calendar?company=<slug> locks the calendar to a single company.
  const { company: scopedSlug } = Route.useSearch();
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [posts, setPosts] = useState<PostedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());
  const [companyId, setCompanyId] = useState<string>("all");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [dragging, setDragging] = useState<PostedPost | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  useEffect(() => {
    (async () => {
      const [{ data: cs }, { data: ps }] = await Promise.all([
        supabase.from("companies").select("id, slug, name, accent_color").order("name"),
        supabase
          .from("posts")
          .select("*")
          .eq("status", "posted")
          .not("posted_at", "is", null)
          .order("posted_at", { ascending: true }),
      ]);
      setCompanies((cs ?? []) as CompanyLite[]);
      setPosts(
        (ps ?? []).map((p) => ({
          ...(p as unknown as Post),
          extra_media: Array.isArray(p.extra_media) ? (p.extra_media as string[]) : [],
        })) as PostedPost[],
      );
      setLoading(false);
    })();
  }, []);

  const postIdOf = (dragId: unknown) => String(dragId).replace(/^(cell|card):/, "");

  function onDragStart(e: DragStartEvent) {
    setDragging(posts.find((p) => p.id === postIdOf(e.active.id)) ?? null);
  }

  /** Dropping on another day moves the post's posted date there and keeps its time of day. */
  async function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    if (!e.over) return;
    const post = posts.find((p) => p.id === postIdOf(e.active.id));
    if (!post) return;
    const [y, m, d] = String(e.over.id).split("-").map(Number);
    if (!y || !m || !d) return;
    const old = new Date(post.posted_at);
    if (dayKey(old) === String(e.over.id)) return;
    const next = new Date(y, m - 1, d, old.getHours(), old.getMinutes(), old.getSeconds());
    const nextIso = next.toISOString();

    const previous = post.posted_at;
    setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, posted_at: nextIso } : p)));
    setSelectedDay(next);
    const { error } = await supabase.from("posts").update({ posted_at: nextIso }).eq("id", post.id);
    if (error) {
      setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, posted_at: previous } : p)));
      toast.error(error.message);
      return;
    }
    toast.success(`Moved to ${format(next, "EEE, MMM d")}`);
  }

  const companyById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);
  const scoped = scopedSlug ? companies.find((c) => c.slug === scopedSlug) : undefined;
  // While a scoped company is still loading/unknown, show nothing rather than everyone's posts.
  const activeCompanyId = scopedSlug ? (scoped?.id ?? "none") : companyId;

  const filtered = useMemo(
    () =>
      posts.filter(
        (p) =>
          (activeCompanyId === "all" || p.company_id === activeCompanyId) &&
          (platform === "all" || p.platform === platform),
      ),
    [posts, activeCompanyId, platform],
  );

  const byDay = useMemo(() => {
    const m = new Map<string, PostedPost[]>();
    for (const p of filtered) {
      const k = dayKey(new Date(p.posted_at));
      const list = m.get(k);
      if (list) list.push(p);
      else m.set(k, [p]);
    }
    return m;
  }, [filtered]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(month, { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
      }),
    [month],
  );

  const monthPosts = filtered.filter((p) => isSameMonth(new Date(p.posted_at), month));
  const perPlatform = PLATFORMS.map((pf) => ({
    ...pf,
    n: monthPosts.filter((p) => p.platform === pf.id).length,
  })).filter((x) => x.n > 0);
  const dayPosts = byDay.get(dayKey(selectedDay)) ?? [];

  return (
    <main className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b editorial-rule px-6 py-4">
        <div className="flex items-center gap-4">
          {scopedSlug ? (
            <Link
              to="/admin/companies/$slug"
              params={{ slug: scopedSlug }}
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              ← {scoped?.name ?? "Company"}
            </Link>
          ) : (
            <Link
              to="/admin"
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              ← Studio
            </Link>
          )}
          <div className="h-4 w-px bg-foreground/20" />
          <span className="font-display text-xl">
            {scopedSlug && scoped ? `${scoped.name} · Posted calendar` : "Posted calendar"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!scopedSlug && (
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="rounded-sm border editorial-rule bg-background px-3 py-1.5 text-xs"
            >
              <option value="all">All companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform | "all")}
            className="rounded-sm border editorial-rule bg-background px-3 py-1.5 text-xs"
          >
            <option value="all">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px]">
          {/* Month grid */}
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-4xl">{format(month, "MMMM yyyy")}</h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  <strong className="text-foreground">{monthPosts.length}</strong> posted this month
                  {perPlatform.map((x) => (
                    <span key={x.id} className="ml-3 inline-flex items-center gap-1">
                      <span className={`h-2 w-2 rounded-full ${PLATFORM_DOT[x.id]}`} />
                      {x.label} {x.n}
                    </span>
                  ))}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  aria-label="Previous month"
                  onClick={() => setMonth(addMonths(month, -1))}
                  className="rounded-sm border editorial-rule p-2 hover:bg-foreground/5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setMonth(startOfMonth(new Date()));
                    setSelectedDay(new Date());
                  }}
                  className="rounded-sm border editorial-rule px-3 py-2 text-xs uppercase tracking-widest hover:bg-foreground/5"
                >
                  Today
                </button>
                <button
                  aria-label="Next month"
                  onClick={() => setMonth(addMonths(month, 1))}
                  className="rounded-sm border editorial-rule p-2 hover:bg-foreground/5"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-l border-t editorial-rule text-center">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div
                  key={d}
                  className="border-b border-r editorial-rule py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground"
                >
                  {d}
                </div>
              ))}
              {days.map((day) => {
                const list = byDay.get(dayKey(day)) ?? [];
                const active = isSameDay(day, selectedDay);
                return (
                  <DayCell
                    key={day.toISOString()}
                    day={day}
                    active={active}
                    inMonth={isSameMonth(day, month)}
                    onSelect={() => setSelectedDay(day)}
                  >
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                        isToday(day) ? "bg-foreground text-background" : ""
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {list.length > 0 && (
                      <>
                        {/* phones: dots */}
                        <span className="flex flex-wrap gap-0.5 sm:hidden">
                          {list.slice(0, 6).map((p) => (
                            <span
                              key={p.id}
                              className={`h-1.5 w-1.5 rounded-full ${PLATFORM_DOT[p.platform]}`}
                            />
                          ))}
                        </span>
                        {/* desktop: draggable thumbnails */}
                        <span className="hidden flex-wrap gap-1 sm:flex">
                          {list.slice(0, 3).map((p) => (
                            <DragHandle key={p.id} dragId={`cell:${p.id}`} className="h-7 w-7">
                              <span className="relative block h-7 w-7 overflow-hidden rounded-sm border editorial-rule bg-foreground/5">
                                <Media post={p} className="h-full w-full object-cover" />
                                <span
                                  className={`absolute bottom-0 right-0 h-2 w-2 rounded-tl-sm ${PLATFORM_DOT[p.platform]}`}
                                />
                              </span>
                            </DragHandle>
                          ))}
                          {list.length > 3 && (
                            <span className="grid h-7 w-7 place-items-center rounded-sm bg-foreground/10 text-[10px]">
                              +{list.length - 3}
                            </span>
                          )}
                        </span>
                      </>
                    )}
                  </DayCell>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] italic text-muted-foreground">
              Drag a post onto another day to change its posted date (the time stays the same).
            </p>
            {loading && <p className="mt-3 text-xs text-muted-foreground">Loading…</p>}
          </section>

          {/* Day details */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded border editorial-rule">
              <div className="border-b editorial-rule p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {format(selectedDay, "EEEE")}
                </p>
                <p className="font-display text-2xl">{format(selectedDay, "MMMM d, yyyy")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {dayPosts.length === 0
                    ? "Nothing posted this day"
                    : `${dayPosts.length} post${dayPosts.length > 1 ? "s" : ""} went live`}
                </p>
              </div>
              <ul className="max-h-[70vh] divide-y editorial-rule overflow-y-auto">
                {dayPosts.length === 0 && (
                  <li className="p-6 text-center text-sm text-muted-foreground">
                    Pick a day with a dot or thumbnail to see its posted content.
                  </li>
                )}
                {dayPosts.map((p) => {
                  const c = companyById.get(p.company_id);
                  return (
                    <li key={p.id} className="flex gap-3 p-4">
                      <DragHandle dragId={`card:${p.id}`} className="h-20 w-20 shrink-0">
                        <div className="relative h-20 w-20 overflow-hidden rounded border editorial-rule bg-foreground/5">
                          <Media post={p} className="h-full w-full object-cover" />
                          {(p.post_type === "reel" || p.media_type === "video") && (
                            <Play className="absolute right-1 top-1 h-3 w-3 fill-white text-white drop-shadow" />
                          )}
                          <GripVertical className="absolute bottom-1 left-1 h-3.5 w-3.5 text-white drop-shadow" />
                        </div>
                      </DragHandle>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: c?.accent_color || "#0d0d0d" }}
                          />
                          <span className="truncate font-medium">{c?.name ?? "Company"}</span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${PLATFORM_DOT[p.platform]}`}
                          />
                          {p.platform} · {p.post_type}
                        </p>
                        <p className="mt-1 text-xs text-sky-700">
                          {formatPostedAt(p.posted_at)}
                          <span className="text-muted-foreground"> · {postedAgo(p.posted_at)}</span>
                        </p>
                        {p.caption && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {p.caption}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                          {p.post_url ? (
                            <a
                              href={p.post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                            >
                              Open live post <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">No link saved</span>
                          )}
                          {c && (
                            <Link
                              to="/admin/companies/$slug"
                              params={{ slug: c.slug }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              Manage →
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
        <DragOverlay dropAnimation={null}>
          {dragging && (
            <div className="h-16 w-16 overflow-hidden rounded border-2 border-sky-500 bg-background shadow-xl">
              <Media post={dragging} className="h-full w-full object-cover" />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

function DayCell({
  day,
  active,
  inMonth,
  onSelect,
  children,
}: {
  day: Date;
  active: boolean;
  inMonth: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey(day) });
  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative flex min-h-[64px] cursor-pointer flex-col items-stretch gap-1 border-b border-r editorial-rule p-1 text-left transition sm:min-h-[104px] sm:p-1.5 ${
        inMonth ? "" : "bg-foreground/[0.03] text-muted-foreground/60"
      } ${
        isOver
          ? "bg-sky-500/20 ring-2 ring-inset ring-sky-500"
          : active
            ? "bg-sky-500/10 ring-2 ring-inset ring-sky-500"
            : "hover:bg-foreground/[0.03]"
      }`}
    >
      {children}
    </div>
  );
}

function DragHandle({
  dragId,
  className,
  children,
}: {
  dragId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: dragId });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title="Drag to another day"
      className={`touch-none cursor-grab active:cursor-grabbing ${isDragging ? "opacity-30" : ""} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

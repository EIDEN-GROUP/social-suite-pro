import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import type { Company, Post, Highlight, Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import {
  getClientWorkspace,
  clientDecide,
  getCompanyBranding,
  type CompanyBranding,
} from "@/lib/client.functions";
import { Media } from "@/components/Media";
import { AuthAura } from "@/components/AuthAura";
import {
  Lock,
  ArrowRight,
  ChevronDown,
  PlusSquare,
  AlignJustify,
  Grid3x3,
  Film,
  UserCheck,
  Home,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Images,
  Heart,
  MessageCircle,
  Send,
  Repeat2,
  ThumbsUp,
  MoreHorizontal,
  Music2,
  Share2,
} from "lucide-react";

export const Route = createFileRoute("/c/$slug")({
  ssr: false,
  head: () => ({ meta: [{ title: "For your approval - Atelier" }] }),
  component: ClientRoom,
});

function ClientRoom() {
  const { slug } = Route.useParams();
  const loadWorkspace = useServerFn(getClientWorkspace);
  const decide = useServerFn(clientDecide);
  const loadBranding = useServerFn(getCompanyBranding);

  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  const storageKey = `atelier_pw:${slug}`;

  async function load(password: string) {
    const res = await loadWorkspace({ data: { slug, password } });
    setCompany(res.company);
    setPosts(res.posts);
    setHighlights(res.highlights);
    setAuthed(true);
    sessionStorage.setItem(storageKey, password);
    setPw(password);
  }

  useEffect(() => {
    // Greet the client in their own colours/logo before they sign in.
    loadBranding({ data: { slug } })
      .then((r) => setBranding(r.branding))
      .catch(() => setBranding(null));

    const saved = sessionStorage.getItem(storageKey);
    if (!saved) {
      setLoading(false);
      return;
    }
    load(saved)
      .catch(() => sessionStorage.removeItem(storageKey))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function refresh() {
    if (!pw) return;
    try {
      const res = await loadWorkspace({ data: { slug, password: pw } });
      setPosts(res.posts);
      setHighlights(res.highlights);
      setCompany(res.company);
    } catch {
      /* ignore transient refresh errors */
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await load(pw);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(storageKey);
    setAuthed(false);
    setCompany(null);
    setPw("");
  }

  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );

  if (!authed || !company) {
    const accent = branding?.accent_color || undefined;
    const logo = branding?.logo_url || branding?.profile_pic_url || null;
    const brandName = branding?.name;
    return (
      <AuthAura accent={accent}>
        <div className="animate-rise w-full max-w-md">
          <div className="auth-card rounded-[2rem] border border-white/40 p-8 sm:p-10">
            <div className="flex items-center gap-3">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl text-base font-bold text-white shadow-lg"
                style={{ background: accent || "#0d0d0d" }}
              >
                {logo ? (
                  <img src={logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  (brandName || slug).slice(0, 2).toUpperCase()
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  Approval room
                </p>
                <p className="truncate font-display text-xl leading-tight">
                  {brandName || `/${slug}`}
                </p>
              </div>
            </div>

            <h1 className="mt-7 font-display text-5xl leading-[0.95]">
              Your work,
              <br />
              ready for review.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {brandName ? (
                <>
                  Enter the password your studio shared to open the{" "}
                  <strong className="text-foreground">{brandName}</strong> workspace.
                </>
              ) : (
                <>
                  Your studio shared a password for{" "}
                  <strong className="text-foreground">/{slug}</strong>.
                </>
              )}
            </p>

            <form onSubmit={handleLogin} className="mt-8">
              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Workspace password
                </span>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    autoFocus
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-foreground/10 bg-background/50 py-3 pl-11 pr-4 text-base outline-none transition focus:border-foreground/40 focus:bg-background/80 focus:ring-4 focus:ring-foreground/5"
                  />
                </div>
              </label>
              <button
                disabled={submitting || !pw}
                className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-100 disabled:opacity-50"
                style={{ background: accent || "#0d0d0d" }}
              >
                {submitting ? "…" : "Enter the room"}
                {!submitting && (
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Reviewed in seconds — no account needed. Powered by Atelier.
          </p>
        </div>
      </AuthAura>
    );
  }

  return (
    <ReviewPhone
      company={company}
      posts={posts}
      highlights={highlights}
      onLogout={logout}
      onDecide={async (post, status, comment) => {
        await decide({ data: { slug, password: pw, postId: post.id, status, comment } });
        await refresh();
      }}
    />
  );
}

type Decide = (post: Post, status: "approved" | "rejected", comment: string) => Promise<void>;
type ViewerState = { list: Post[]; id: string } | null;

function ReviewPhone({
  company,
  posts,
  highlights,
  onLogout,
  onDecide,
}: {
  company: Company;
  posts: Post[];
  highlights: Highlight[];
  onLogout: () => void;
  onDecide: Decide;
}) {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [igTab, setIgTab] = useState<"posts" | "reels">("posts");
  const [viewer, setViewer] = useState<ViewerState>(null);

  const platformPosts = posts.filter((p) => p.platform === platform);
  const counts = {
    pending: platformPosts.filter((p) => p.status === "pending").length,
    approved: platformPosts.filter((p) => p.status === "approved").length,
    rejected: platformPosts.filter((p) => p.status === "rejected").length,
  };
  const open = (list: Post[], id: string) => setViewer({ list, id });

  const viewerIdx = viewer ? viewer.list.findIndex((p) => p.id === viewer.id) : -1;

  return (
    <main className="min-h-screen bg-neutral-100 text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/10 bg-background px-6 py-3">
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: company.accent_color || "#0d0d0d" }}
          />
          <span className="font-display text-lg">{company.name}</span>
          <span className="rounded border editorial-rule px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            Approval room
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="hidden sm:inline">
            <strong className="text-foreground">{counts.pending}</strong> pending ·{" "}
            <strong className="text-emerald-600">{counts.approved}</strong> ok ·{" "}
            <strong className="text-rose-600">{counts.rejected}</strong> changes
          </span>
          <button onClick={onLogout} className="rounded-sm border editorial-rule px-3 py-1.5">
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-col items-center gap-4 px-4 py-8">
        {/* Platform switcher */}
        <div className="flex flex-wrap justify-center gap-1 rounded-full border editorial-rule bg-background p-1">
          {PLATFORMS.map((p) => {
            const n = posts.filter((x) => x.platform === p.id).length;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setPlatform(p.id);
                  setViewer(null);
                }}
                className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-widest ${platform === p.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                {p.label}
                {n > 0 && <span className="ml-1 opacity-60">{n}</span>}
              </button>
            );
          })}
        </div>
        <p className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Tap any post to approve or request changes
        </p>

        {/* Phone */}
        <div
          className="relative w-full max-w-[390px] overflow-hidden rounded-[44px] border-[11px] border-neutral-900 bg-background shadow-2xl"
          style={{ aspectRatio: "9 / 19.5" }}
        >
          <div className="absolute left-1/2 top-2 z-30 h-6 w-32 -translate-x-1/2 rounded-full bg-neutral-900" />

          {platform === "instagram" ? (
            <Instagram
              company={company}
              posts={platformPosts}
              highlights={highlights}
              igTab={igTab}
              setIgTab={setIgTab}
              onOpen={open}
            />
          ) : (
            <FeedPhone platform={platform} company={company} posts={platformPosts} onOpen={open} />
          )}

          {viewer && viewerIdx >= 0 && (
            <PostViewer
              post={viewer.list[viewerIdx]}
              index={viewerIdx}
              total={viewer.list.length}
              onClose={() => setViewer(null)}
              onNav={(dir) => {
                const next = viewerIdx + dir;
                if (next < 0 || next >= viewer.list.length) setViewer(null);
                else setViewer({ list: viewer.list, id: viewer.list[next].id });
              }}
              onDecide={onDecide}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function statusDot(status: string) {
  return status === "approved"
    ? "bg-emerald-500"
    : status === "rejected"
      ? "bg-rose-500"
      : "bg-amber-400";
}

// ---------------------------------------------------------------------------
// Instagram - faithful profile mockup with Posts / Reels tabs
// ---------------------------------------------------------------------------
function Instagram({
  company,
  posts,
  highlights,
  igTab,
  setIgTab,
  onOpen,
}: {
  company: Company;
  posts: Post[];
  highlights: Highlight[];
  igTab: "posts" | "reels";
  setIgTab: (t: "posts" | "reels") => void;
  onOpen: (list: Post[], id: string) => void;
}) {
  const [lightbox, setLightbox] = useState<Highlight | null>(null);
  // Stories behave like real IG stories for the client: once reviewed
  // (approved or changes requested) they drop off the avatar ring.
  const stories = posts.filter((p) => p.post_type === "story" && p.status === "pending");
  const gridPosts = posts.filter((p) => p.post_type === "post" || p.post_type === "carousel");
  const reels = posts.filter((p) => p.post_type === "reel");
  const list = igTab === "posts" ? gridPosts : reels;

  return (
    <>
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-foreground/10 bg-background px-4 pb-2 pt-9">
        <div className="flex items-center gap-1 text-base font-semibold">
          <Lock className="h-3.5 w-3.5" />
          <span>{company.username || company.slug}</span>
          <ChevronDown className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-4">
          <PlusSquare className="h-5 w-5" />
          <AlignJustify className="h-5 w-5" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-12 top-[68px] overflow-y-auto">
        <Profile
          company={company}
          postCount={gridPosts.length}
          hasStory={stories.length > 0}
          onStory={stories.length ? () => onOpen(stories, stories[0].id) : undefined}
        />
        {highlights.length > 0 && (
          <Highlights highlights={highlights} accent={company.accent_color} onPick={setLightbox} />
        )}

        <div className="mt-2 flex border-y border-foreground/10">
          <button
            onClick={() => setIgTab("posts")}
            className={`flex flex-1 justify-center border-b-2 py-2.5 ${igTab === "posts" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}
          >
            <Grid3x3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIgTab("reels")}
            className={`flex flex-1 justify-center border-b-2 py-2.5 ${igTab === "reels" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}
          >
            <Film className="h-5 w-5" />
          </button>
          <button className="flex flex-1 justify-center border-b-2 border-transparent py-2.5 text-muted-foreground">
            <UserCheck className="h-5 w-5" />
          </button>
        </div>

        {list.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            No {igTab} to review yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {list.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpen(list, p.id)}
                className="relative aspect-square overflow-hidden bg-foreground/5"
              >
                <Media post={p} className="h-full w-full object-cover" muted />
                {p.post_type === "reel" && (
                  <Play className="absolute right-1 top-1 h-3.5 w-3.5 fill-white text-white drop-shadow" />
                )}
                {p.post_type === "carousel" && (
                  <Images className="absolute right-1 top-1 h-3.5 w-3.5 text-white drop-shadow" />
                )}
                <span
                  className={`absolute bottom-1 left-1 h-2 w-2 rounded-full ${statusDot(p.status)}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-foreground/10 bg-background py-2.5">
        <Home className="h-5 w-5" />
        <Search className="h-5 w-5" />
        <PlusSquare className="h-5 w-5" />
        <Film className="h-5 w-5" />
        <span className="h-6 w-6 overflow-hidden rounded-full bg-foreground/10">
          {company.profile_pic_url && (
            <img src={company.profile_pic_url} className="h-full w-full object-cover" />
          )}
        </span>
      </div>

      {lightbox && <HighlightViewer highlight={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}

function HighlightViewer({ highlight, onClose }: { highlight: Highlight; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-black text-white" onClick={onClose}>
      <div className="flex items-center justify-between px-4 pb-2 pt-9">
        <button onClick={onClose}>
          <X className="h-6 w-6" />
        </button>
        <span className="text-xs tracking-wide text-white/70">
          {highlight.label || "Highlight"}
        </span>
        <span className="w-6" />
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        {highlight.image ? (
          <img src={highlight.image} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-7xl">{highlight.emoji || "○"}</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TikTok / Facebook / X / LinkedIn - native-style feeds, same review flow
// ---------------------------------------------------------------------------
function FeedPhone({
  platform,
  company,
  posts,
  onOpen,
}: {
  platform: Platform;
  company: Company;
  posts: Post[];
  onOpen: (list: Post[], id: string) => void;
}) {
  const label = PLATFORMS.find((p) => p.id === platform)?.label;
  const handle = company.username || company.slug;
  const accent = company.accent_color || "#1d4ed8";
  const followers = company.followers || "0";
  const following = company.following ?? 0;
  const linkText = company.link?.replace(/^https?:\/\//, "");
  const cover = company.cover_url;
  const banner = (gradient: string) =>
    cover ? { backgroundImage: `url(${cover})` } : { background: gradient };

  const Pic = ({
    className,
    rounded = "rounded-full",
  }: {
    className: string;
    rounded?: string;
  }) => (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden ${rounded} bg-foreground/10 text-sm font-semibold uppercase ${className}`}
    >
      {company.profile_pic_url ? (
        <img src={company.profile_pic_url} className="h-full w-full object-cover" />
      ) : (
        company.name.slice(0, 2)
      )}
    </span>
  );
  const smallAvatar = (
    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-foreground/10 text-[10px] uppercase">
      {company.profile_pic_url ? (
        <img src={company.profile_pic_url} className="h-full w-full object-cover" />
      ) : (
        company.name.slice(0, 2)
      )}
    </span>
  );

  return (
    <>
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-foreground/10 bg-background px-4 pb-2 pt-9">
        <span className="text-base font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">@{handle}</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 top-[64px] overflow-y-auto bg-neutral-50">
        {/* ---- Business profile / page header ---- */}
        {platform === "facebook" && (
          <div className="bg-background">
            <div
              className="h-20 w-full bg-cover bg-center"
              style={banner(`linear-gradient(135deg, ${accent}, ${accent}88)`)}
            />
            <div className="px-4 pb-3">
              <Pic className="-mt-8 h-20 w-20 ring-4 ring-background" />
              <div className="mt-2 text-lg font-bold">{company.name}</div>
              <div className="text-xs text-muted-foreground">
                {company.category || "Business"} · {followers} followers
              </div>
              {company.bio && <div className="mt-1 text-sm">{company.bio}</div>}
              {linkText && (
                <div className="mt-0.5 text-xs font-medium" style={{ color: accent }}>
                  {linkText}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  className="flex-1 rounded-md py-1.5 text-sm font-semibold text-white"
                  style={{ background: accent }}
                >
                  ＋ Follow
                </button>
                <button className="flex-1 rounded-md bg-foreground/5 py-1.5 text-sm font-semibold">
                  Message
                </button>
              </div>
            </div>
          </div>
        )}
        {platform === "twitter" && (
          <div className="bg-background">
            <div className="h-20 w-full bg-cover bg-center" style={banner(accent)} />
            <div className="px-4">
              <div className="-mt-8 flex items-end justify-between">
                <Pic className="h-16 w-16 ring-4 ring-background" />
                <button className="mb-1 rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background">
                  Follow
                </button>
              </div>
              <div className="mt-2 text-lg font-bold leading-tight">{company.name}</div>
              <div className="text-sm text-muted-foreground">@{handle}</div>
              {company.bio && <div className="mt-1 text-sm">{company.bio}</div>}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {company.category && <span>{company.category}</span>}
                {linkText && <span style={{ color: accent }}>{linkText}</span>}
              </div>
              <div className="mt-2 flex gap-4 pb-2 text-sm">
                <span>
                  <b>{following}</b> <span className="text-muted-foreground">Following</span>
                </span>
                <span>
                  <b>{followers}</b> <span className="text-muted-foreground">Followers</span>
                </span>
              </div>
            </div>
          </div>
        )}
        {platform === "linkedin" && (
          <div className="bg-background">
            <div
              className="h-16 w-full bg-cover bg-center"
              style={banner(`linear-gradient(135deg, ${accent}, ${accent}88)`)}
            />
            <div className="px-4 pb-3">
              <Pic className="-mt-7 h-16 w-16 ring-4 ring-background" rounded="rounded-md" />
              <div className="mt-2 text-lg font-bold leading-tight">{company.name}</div>
              {company.category && (
                <div className="text-sm text-muted-foreground">{company.category}</div>
              )}
              {company.bio && <div className="text-xs text-muted-foreground">{company.bio}</div>}
              <div className="mt-1 text-xs text-muted-foreground">{followers} followers</div>
              <div className="mt-3 flex gap-2">
                <button
                  className="rounded-full px-5 py-1.5 text-sm font-semibold text-white"
                  style={{ background: accent }}
                >
                  ＋ Follow
                </button>
                <button className="rounded-full border border-foreground/30 px-5 py-1.5 text-sm font-semibold">
                  Visit website
                </button>
              </div>
            </div>
          </div>
        )}
        {platform === "tiktok" && (
          <div className="flex flex-col items-center bg-background px-4 pt-4">
            <Pic className="h-20 w-20" />
            <div className="mt-2 text-base font-semibold">@{handle}</div>
            <div className="mt-3 flex gap-6 text-center text-sm">
              <div>
                <div className="font-bold">{following}</div>
                <div className="text-xs text-muted-foreground">Following</div>
              </div>
              <div>
                <div className="font-bold">{followers}</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
              <div>
                <div className="font-bold">{posts.length}</div>
                <div className="text-xs text-muted-foreground">Videos</div>
              </div>
            </div>
            <button
              className="mt-3 rounded px-10 py-1.5 text-sm font-semibold text-white"
              style={{ background: accent }}
            >
              Follow
            </button>
            {company.category && (
              <div className="mt-2 text-xs text-muted-foreground">{company.category}</div>
            )}
            {company.bio && <div className="mt-1 text-center text-xs">{company.bio}</div>}
            {linkText && (
              <div className="mt-0.5 text-xs font-medium" style={{ color: accent }}>
                {linkText}
              </div>
            )}
          </div>
        )}

        {/* ---- Feed / grid ---- */}
        {posts.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            No {label} content to review yet.
          </div>
        ) : platform === "tiktok" ? (
          <div className="mt-3 grid grid-cols-3 gap-0.5 border-t border-foreground/10 pt-0.5">
            {posts.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpen(posts, p.id)}
                className="relative aspect-[9/14] overflow-hidden bg-black"
              >
                <Media post={p} className="h-full w-full object-cover" muted />
                <Play className="absolute left-1 bottom-1 h-3.5 w-3.5 fill-white text-white drop-shadow" />
                <span
                  className={`absolute right-1 top-1 h-2 w-2 rounded-full ${statusDot(p.status)}`}
                />
              </button>
            ))}
          </div>
        ) : platform === "twitter" ? (
          <div className="mt-2 divide-y divide-foreground/10 border-t border-foreground/10 bg-background">
            {posts.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpen(posts, p.id)}
                className="flex w-full gap-3 p-3 text-left hover:bg-foreground/[0.02]"
              >
                {smallAvatar}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-sm">
                    <span className="font-semibold">{company.name}</span>
                    <span className="text-muted-foreground">@{handle}</span>
                    <span className={`ml-auto h-2 w-2 rounded-full ${statusDot(p.status)}`} />
                  </div>
                  {p.caption && (
                    <div className="mt-0.5 whitespace-pre-line text-sm">{p.caption}</div>
                  )}
                  {p.media_url && (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-foreground/10">
                      <Media post={p} className="w-full" muted />
                    </div>
                  )}
                  <div className="mt-2 flex gap-8 text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <Repeat2 className="h-4 w-4" />
                    <Heart className="h-4 w-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {posts.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpen(posts, p.id)}
                className="block w-full overflow-hidden rounded-lg border border-foreground/10 bg-background text-left"
              >
                <div className="flex items-center gap-2 p-3">
                  {smallAvatar}
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{company.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {platform === "linkedin" ? "Promoted · 1h" : "Sponsored · 🌐"}
                    </div>
                  </div>
                  <span className={`h-2 w-2 rounded-full ${statusDot(p.status)}`} />
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
                {p.caption && <div className="px-3 pb-2 text-sm">{p.caption}</div>}
                {p.media_url && <Media post={p} className="w-full" muted />}
                <div className="flex justify-around border-t border-foreground/10 p-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3.5 w-3.5" /> Like
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> Comment
                  </span>
                  <span className="flex items-center gap-1">
                    <Send className="h-3.5 w-3.5" /> Send
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Profile({
  company,
  postCount,
  hasStory,
  onStory,
}: {
  company: Company;
  postCount: number;
  hasStory?: boolean;
  onStory?: () => void;
}) {
  const inner = company.profile_pic_url ? (
    <img src={company.profile_pic_url} className="h-full w-full object-cover" />
  ) : (
    <span className="grid h-full w-full place-items-center text-sm uppercase">
      {company.name.slice(0, 2)}
    </span>
  );
  return (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-6">
        {hasStory ? (
          <button
            onClick={onStory}
            className="shrink-0 rounded-full p-[3px]"
            style={{ background: "linear-gradient(45deg,#f59e0b,#ef4444,#d946ef)" }}
            title="View story"
          >
            <span className="block rounded-full bg-background p-[2px]">
              <span className="block h-[68px] w-[68px] overflow-hidden rounded-full bg-foreground/10">
                {inner}
              </span>
            </span>
          </button>
        ) : (
          <span className="h-[78px] w-[78px] shrink-0 overflow-hidden rounded-full bg-foreground/10 ring-2 ring-foreground/10">
            {inner}
          </span>
        )}
        <div className="flex flex-1 justify-around text-center text-sm">
          <div>
            <div className="text-lg font-semibold leading-none">{postCount}</div>
            <span className="text-xs text-muted-foreground">posts</span>
          </div>
          <div>
            <div className="text-lg font-semibold leading-none">{company.followers || "0"}</div>
            <span className="text-xs text-muted-foreground">followers</span>
          </div>
          <div>
            <div className="text-lg font-semibold leading-none">{company.following ?? 0}</div>
            <span className="text-xs text-muted-foreground">following</span>
          </div>
        </div>
      </div>
      <div className="mt-3 text-sm leading-snug">
        <div className="font-semibold">{company.name}</div>
        {company.category && <div className="text-muted-foreground">{company.category}</div>}
        {company.bio && <div className="whitespace-pre-line">{company.bio}</div>}
        {company.link && (
          <a
            href={company.link}
            target="_blank"
            rel="noreferrer"
            className="font-medium"
            style={{ color: company.accent_color || "#3b5998" }}
          >
            {company.link.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <button className="flex-1 rounded-lg bg-foreground/5 py-1.5 text-xs font-semibold">
          Edit profile
        </button>
        <button className="flex-1 rounded-lg bg-foreground/5 py-1.5 text-xs font-semibold">
          Share profile
        </button>
      </div>
    </div>
  );
}

function Highlights({
  highlights,
  accent,
  onPick,
}: {
  highlights: Highlight[];
  accent: string;
  onPick: (h: Highlight) => void;
}) {
  return (
    <div className="mt-4 flex gap-4 overflow-x-auto px-4">
      {highlights.map((h) => (
        <button
          key={h.id}
          onClick={() => onPick(h)}
          className="flex w-16 shrink-0 flex-col items-center gap-1"
        >
          <span
            className="grid h-16 w-16 place-items-center overflow-hidden rounded-full p-[2px]"
            style={{ boxShadow: `inset 0 0 0 2px ${accent || "#dbdbdb"}33` }}
          >
            <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-foreground/5">
              {h.image ? (
                <img src={h.image} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl">{h.emoji || "○"}</span>
              )}
            </span>
          </span>
          <span className="max-w-[64px] truncate text-[11px]">{h.label}</span>
        </button>
      ))}
    </div>
  );
}

function PostViewer({
  post,
  index,
  total,
  onClose,
  onNav,
  onDecide,
}: {
  post: Post;
  index: number;
  total: number;
  onClose: () => void;
  onNav: (dir: -1 | 1) => void;
  onDecide: Decide;
}) {
  const [comment, setComment] = useState(post.client_comment ?? "");
  const [busy, setBusy] = useState(false);
  const media = [post.media_url, ...(post.extra_media ?? [])].filter(Boolean) as string[];
  const [mi, setMi] = useState(0);

  useEffect(() => {
    setComment(post.client_comment ?? "");
    setMi(0);
  }, [post.id, post.client_comment]);

  async function act(status: "approved" | "rejected") {
    if (status === "rejected" && !comment.trim())
      return toast.error("Add a comment to request changes");
    setBusy(true);
    try {
      await onDecide(post, status, comment);
      toast.success(status === "approved" ? "Approved" : "Changes requested");
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const cur = media[mi];
  const isVideo = post.media_type === "video";
  const isCarousel = media.length > 1;

  // Arrows/taps page THROUGH a carousel first, then roll over to the
  // adjacent post only once you're on the carousel's first/last frame.
  function step(dir: -1 | 1) {
    if (dir === 1) {
      if (mi < media.length - 1) setMi(mi + 1);
      else onNav(1);
    } else {
      if (mi > 0) setMi(mi - 1);
      else onNav(-1);
    }
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 pb-2 pt-9">
        <button onClick={onClose}>
          <X className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          {isCarousel && (
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium tracking-wide">
              {mi + 1}/{media.length}
            </span>
          )}
          <span className="text-xs tracking-wide text-white/70">
            {index + 1} / {total}
          </span>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {cur ? (
          isVideo ? (
            <video src={cur} className="max-h-full max-w-full" controls autoPlay loop playsInline />
          ) : (
            <img src={cur} className="max-h-full max-w-full object-contain" />
          )
        ) : (
          <div className="text-white/40">No media</div>
        )}

        <button
          onClick={() => step(-1)}
          className="absolute inset-y-0 left-0 w-1/4"
          aria-label="previous"
        />
        <button
          onClick={() => step(1)}
          className="absolute inset-y-0 right-0 w-1/4"
          aria-label="next"
        />
        <button
          onClick={() => step(-1)}
          className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => step(1)}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {isCarousel && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => setMi(i)}
                className={`h-1.5 w-1.5 rounded-full transition ${i === mi ? "w-4 bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>

      {post.caption && (
        <p className="max-h-20 overflow-y-auto px-4 py-2 text-xs text-white/80">{post.caption}</p>
      )}

      <div className="border-t border-white/10 bg-black/95 p-3">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${post.status === "approved" ? "bg-emerald-500/20 text-emerald-300" : post.status === "rejected" ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-white/60"}`}
          >
            {post.status === "rejected" ? "changes requested" : post.status}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            {post.platform} · {post.post_type}
          </span>
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="Your feedback… (required to request changes)"
          className="w-full rounded-md border border-white/15 bg-white/5 p-2 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
        />
        <div className="mt-2 flex gap-2">
          <button
            disabled={busy}
            onClick={() => act("approved")}
            className="flex-1 rounded-md bg-emerald-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Approve
          </button>
          <button
            disabled={busy || !comment.trim()}
            onClick={() => act("rejected")}
            className="flex-1 rounded-md border border-white/25 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Request changes
          </button>
        </div>
      </div>
    </div>
  );
}

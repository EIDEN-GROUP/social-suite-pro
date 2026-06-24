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
import lunjaWordmark from "@/assets/lunja-wordmark-white.png";
import {
  Lock,
  ArrowRight,
  Check,
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
  head: () => ({ meta: [{ title: "For your approval - SMimulator" }] }),
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
    const initials = (brandName || slug).slice(0, 2).toUpperCase();
    const BrandMark = ({ size }: { size: string }) => (
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-2xl text-base font-bold text-white shadow-lg ring-1 ring-black/5 ${size}`}
        style={{ background: accent || "#1a1208" }}
      >
        {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : initials}
      </span>
    );

    return (
      <main className="lunja-auth grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* LEFT - looping atelier side video: sketching, print proofs, swatches, tabletop */}
        <section className="relative hidden flex-col justify-between overflow-hidden p-12 text-[#fdf8ee] lg:flex xl:p-16">
          <AtelierLoop accent={accent} />

          {/* Swiss hairline grid + readability scrim over the loop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(#fdf8ee_1px,transparent_1px),linear-gradient(90deg,#fdf8ee_1px,transparent_1px)] [background-size:64px_64px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a1208]/90 via-[#1a1208]/45 to-[#1a1208]/25"
          />

          <div className="relative z-10 flex items-center gap-3">
            <BrandMark size="h-11 w-11" />
            <div className="min-w-0">
              <p className="lj-eyebrow text-[10px] uppercase text-[#fdf8ee]/70">Approval room</p>
              <p className="lj-serif truncate text-xl leading-tight">{brandName || `/${slug}`}</p>
            </div>
          </div>

          <div className="relative z-10">
            <span className="lj-eyebrow inline-flex items-center gap-2 rounded-full border border-[#fdf8ee]/25 bg-[#1a1208]/30 px-3 py-1 text-[10px] uppercase text-[#fdf8ee]/85 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f96635]" />
              The studio, in session
            </span>
            <h1 className="lj-serif mt-6 text-6xl leading-[0.95] xl:text-7xl">
              Your work,
              <br />
              <span className="lj-gradient italic">ready for review.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-[#fdf8ee]/80">
              Swipe through every post, reel and story in true-to-life mockups - then approve or
              request changes in a single tap.
            </p>

            {/* Decision chips as translucent glass modules */}
            <div className="mt-9 flex flex-wrap gap-3">
              <span className="lj-glass flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-[#1a1208]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#2bbaa5] text-white">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-xs">
                  <span className="block font-semibold">Approved</span>
                  <span className="text-[#3d2c1e]/70">Reel · just now</span>
                </span>
              </span>
              <span className="lj-glass flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-[#1a1208]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f96635] text-white">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <span className="text-xs">
                  <span className="block font-semibold">“Brighten the logo?”</span>
                  <span className="text-[#3d2c1e]/70">Your comment</span>
                </span>
              </span>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <img src={lunjaWordmark} alt="Lunja" className="h-6 w-auto opacity-90" />
            <span className="h-4 w-px bg-[#fdf8ee]/25" />
            <p className="lj-eyebrow text-[10px] uppercase text-[#fdf8ee]/55">
              Powered by eiden-group
            </p>
          </div>
        </section>

        {/* RIGHT - sign-in form on warm paper with a shifting Mondrian grid */}
        <section className="relative flex items-center justify-center overflow-hidden bg-[#fdf8ee] p-6 sm:p-10">
          <MondrianGrid accent={accent} />

          <div className="lj-glass animate-rise relative z-10 w-full max-w-sm rounded-[28px] p-7 sm:p-9">
            {/* Brand header (shows on mobile where the left panel is hidden) */}
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <BrandMark size="h-12 w-12" />
              <div className="min-w-0">
                <p className="lj-eyebrow text-[10px] uppercase text-[#3d2c1e]/70">Approval room</p>
                <p className="lj-serif truncate text-xl leading-tight">{brandName || `/${slug}`}</p>
              </div>
            </div>

            <p className="lj-eyebrow text-[10px] uppercase text-[#3d2c1e]/65">Welcome</p>
            <h2 className="lj-serif mt-2 text-4xl leading-tight text-[#1a1208]">
              Enter your workspace
            </h2>
            <p className="mt-3 text-sm text-[#3d2c1e]/80">
              {brandName ? (
                <>
                  Use the password your studio shared to open the{" "}
                  <strong className="font-semibold text-[#1a1208]">{brandName}</strong> room.
                </>
              ) : (
                <>
                  Your studio shared a password for{" "}
                  <strong className="font-semibold text-[#1a1208]">/{slug}</strong>.
                </>
              )}
            </p>

            <form onSubmit={handleLogin} className="mt-8">
              <label className="lj-module block rounded-2xl px-4 py-3">
                <span className="lj-eyebrow text-[10px] uppercase text-[#3d2c1e]/65">
                  Workspace password
                </span>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3d2c1e]/55" />
                  <input
                    type="password"
                    autoFocus
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent py-1 pl-7 text-base text-[#1a1208] outline-none placeholder:text-[#3d2c1e]/35"
                  />
                </div>
              </label>
              <button
                disabled={submitting || !pw}
                className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1a1208]/15 transition hover:scale-[1.02] active:scale-100 disabled:opacity-50"
                style={{ background: accent || "#1a1208" }}
              >
                {submitting ? "…" : "Enter the room"}
                {!submitting && (
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                )}
              </button>
            </form>

            <p className="lj-eyebrow mt-8 text-[10px] uppercase text-[#3d2c1e]/55">
              Reviewed in seconds - no account needed.
            </p>
          </div>
        </section>
      </main>
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

/**
 * Looping "side video" for the client login - an atelier montage that
 * cross-fades through four scenes (colour swatches, a print proof, a contour
 * sketch and a tabletop). It is built entirely from brand-coloured markup so it
 * always renders; if a studio drops an `/atelier-loop.mp4` into the public
 * folder it plays on top, otherwise the montage shows through.
 */
function AtelierLoop({ accent }: { accent?: string }) {
  const pop = accent || "#f96635";
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-[#3d2c1e]">
      {/* Scene 1 - colour swatches */}
      <div className="lj-scene" style={{ animationDelay: "0s" }}>
        <div className="lj-ken grid h-full w-full grid-cols-4 grid-rows-3 gap-2 bg-[#1a1208] p-2">
          {[
            "#f96635",
            "#f9a822",
            "#2bbaa5",
            "#faecb6",
            "#93d3ae",
            "#eee0c0",
            "#fdf8ee",
            pop,
            "#3d2c1e",
            "#2bbaa5",
            "#f96635",
            "#f9a822",
          ].map((c, i) => (
            <span
              key={i}
              className="rounded-md"
              style={{ background: c, boxShadow: "inset 0 1px 0 rgba(255,255,255,.25)" }}
            />
          ))}
        </div>
      </div>

      {/* Scene 2 - print proof sheet */}
      <div className="lj-scene" style={{ animationDelay: "8s" }}>
        <div className="lj-ken grid h-full w-full place-items-center bg-[#3d2c1e] p-10">
          <div className="relative w-full max-w-md rounded-sm bg-[#fdf8ee] p-7 shadow-2xl">
            {["8%", "8%", "92%", "92%"].map((_, i) => (
              <span
                key={i}
                className="absolute h-4 w-4 text-[#3d2c1e]/40"
                style={{
                  top: i < 2 ? "10px" : "auto",
                  bottom: i >= 2 ? "10px" : "auto",
                  left: i % 2 === 0 ? "10px" : "auto",
                  right: i % 2 === 1 ? "10px" : "auto",
                }}
              >
                <PlusSquare className="h-4 w-4" />
              </span>
            ))}
            <div className="h-3 w-2/3 rounded-full bg-[#f96635]" />
            <div className="mt-3 h-2 w-full rounded-full bg-[#3d2c1e]/15" />
            <div className="mt-2 h-2 w-11/12 rounded-full bg-[#3d2c1e]/15" />
            <div className="mt-2 h-2 w-4/5 rounded-full bg-[#3d2c1e]/15" />
            <div className="mt-6 flex gap-1.5">
              {["#22d3ee", "#f472b6", "#facc15", "#1a1208"].map((c) => (
                <span key={c} className="h-6 flex-1 rounded-sm" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scene 3 - contour sketch */}
      <div className="lj-scene" style={{ animationDelay: "16s" }}>
        <div className="lj-ken grid h-full w-full place-items-center bg-[#1a1208]">
          <svg viewBox="0 0 200 200" className="h-3/4 w-3/4" fill="none">
            {[
              "M40 150 C40 80 90 40 130 60 S170 140 120 160 S50 170 40 150 Z",
              "M70 120 C70 95 95 85 110 95 S125 130 100 135 S70 135 70 120 Z",
              "M95 70 L150 50 M150 50 L145 95 M150 50 L120 40",
            ].map((d, i) => (
              <path
                key={i}
                d={d}
                stroke={i === 2 ? pop : "#fdf8ee"}
                strokeWidth={i === 2 ? 2 : 1.5}
                strokeLinecap="round"
                strokeDasharray="600"
                strokeDashoffset="600"
                style={{ animation: `ljStroke 5s ease ${i * 0.6}s forwards` }}
                opacity={0.85}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Scene 4 - tabletop */}
      <div className="lj-scene" style={{ animationDelay: "24s" }}>
        <div className="lj-ken relative h-full w-full overflow-hidden bg-[#eee0c0]">
          <span className="absolute left-[12%] top-[20%] h-40 w-40 rounded-full bg-[#2bbaa5]/80 blur-[1px]" />
          <span className="absolute left-[34%] top-[34%] h-44 w-44 rounded-full bg-[#f9a822]/80" />
          <span className="absolute left-[52%] top-[24%] h-36 w-36 rounded-full bg-[#f96635]/85" />
          <span
            className="absolute bottom-[18%] left-[20%] h-3 w-56 -rotate-12 rounded-full"
            style={{ background: "linear-gradient(90deg,#3d2c1e,#3d2c1e 70%,#faecb6 70%)" }}
          />
          <span className="absolute bottom-[26%] right-[16%] h-28 w-40 rotate-6 rounded-md bg-[#fdf8ee] shadow-xl" />
        </div>
      </div>

      {/* Optional real footage layered on top of the montage */}
      <video
        className="absolute inset-0 z-[1] h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
      >
        <source src="/atelier-loop.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

/**
 * A Mondrian-inspired backdrop for the form side: modular colour blocks held in
 * a thick-ruled grid that quietly re-composes itself behind the glass card.
 */
function MondrianGrid({ accent }: { accent?: string }) {
  const pop = accent || "#f96635";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.9]">
      <div className="lj-grid absolute inset-0">
        <span className="lj-bv absolute left-0 top-0 h-[42%] w-[26%] bg-[#faecb6]" />
        <span
          className="lj-bh absolute right-0 top-0 h-[34%] w-[34%]"
          style={{ background: pop, opacity: 0.85 }}
        />
        <span className="absolute bottom-0 left-0 h-[40%] w-[20%] bg-[#2bbaa5]/80" />
        <span className="lj-bv absolute bottom-0 right-[24%] h-[30%] w-[16%] bg-[#f9a822]/85" />
        <span className="absolute bottom-0 right-0 h-[24%] w-[24%] bg-[#93d3ae]/70" />
        {/* thick Mondrian rules */}
        <span className="absolute left-[26%] top-0 h-full w-[6px] bg-[#1a1208]" />
        <span className="absolute right-[24%] top-0 h-full w-[6px] bg-[#1a1208]" />
        <span className="absolute left-0 top-[42%] h-[6px] w-full bg-[#1a1208]" />
        <span className="absolute left-0 bottom-[24%] h-[6px] w-full bg-[#1a1208]" />
      </div>
      {/* paper wash so the card and copy stay legible */}
      <div className="absolute inset-0 bg-[#fdf8ee]/82" />
    </div>
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
        {/* Platform switcher - dropdown on mobile, pill on desktop */}
        <div className="relative sm:hidden">
          <select
            value={platform}
            onChange={(e) => {
              setPlatform(e.target.value as Platform);
              setViewer(null);
            }}
            className="appearance-none rounded-full border editorial-rule bg-background py-2.5 pl-5 pr-10 text-xs uppercase tracking-widest outline-none"
          >
            {PLATFORMS.map((p) => {
              const n = posts.filter((x) => x.platform === p.id).length;
              return (
                <option key={p.id} value={p.id}>
                  {p.label}
                  {n > 0 ? ` (${n})` : ""}
                </option>
              );
            })}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="hidden flex-wrap justify-center gap-1 rounded-full border editorial-rule bg-background p-1 sm:flex">
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

      <div className="no-scrollbar absolute inset-x-0 bottom-12 top-[68px] overflow-y-auto">
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

      <div className="no-scrollbar absolute inset-x-0 bottom-0 top-[64px] overflow-y-auto bg-neutral-50">
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
    <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto px-4">
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
        <p className="no-scrollbar max-h-20 overflow-y-auto px-4 py-2 text-xs text-white/80">
          {post.caption}
        </p>
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

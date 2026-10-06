import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  Eye,
  EyeOff,
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
  CalendarClock,
  ExternalLink,
  BadgeCheck,
  Copy,
  X as CloseX,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { formatPostedAt, linkHost, postedAgo } from "@/lib/posted";

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
    // Lunja Village keeps its bespoke atelier identity; every other company
    // client gets the shared studio split-screen login. Detection is by slug
    // or brand name so no per-company wiring is ever needed.
    const isLunja = /lunja/i.test(slug) || /lunja/i.test(branding?.name ?? "");
    const shared: LoginProps = {
      slug,
      branding,
      pw,
      setPw,
      submitting,
      onSubmit: handleLogin,
    };
    return isLunja ? <AtelierLogin {...shared} /> : <StudioLogin {...shared} />;
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

type LoginProps = {
  slug: string;
  branding: CompanyBranding | null;
  pw: string;
  setPw: (v: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

/**
 * Lunja Village's bespoke "atelier" login — dark atelier loop on the left,
 * a shifting Mondrian grid behind a frosted card on the right.
 */
function AtelierLogin({ slug, branding, pw, setPw, submitting, onSubmit }: LoginProps) {
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

            <form onSubmit={onSubmit} className="mt-8">
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

/** Turn a workspace slug into a presentable title (never shown as a raw slug). */
function prettyName(slug: string) {
  return (
    slug
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase()) || "Your studio"
  );
}

/**
 * Shared "studio" login for every non-Lunja company client. A full-bleed
 * split-screen identity: a deep-aubergine brand stage on the left with a live,
 * auto-playing demo phone and floating review stickers, and a clean white
 * sign-in panel on the right. The company's own accent colour tints everything,
 * so the design never needs per-company edits.
 */
function StudioLogin({ slug, branding, pw, setPw, submitting, onSubmit }: LoginProps) {
  const [show, setShow] = useState(false);
  const accent = branding?.accent_color || "#f2683c";
  const logo = branding?.logo_url || branding?.profile_pic_url || null;
  const brandName = branding?.name || prettyName(slug);
  const initials = (branding?.name || slug).slice(0, 2).toUpperCase();

  return (
    <main className="studio-auth grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* MOBILE HERO — a compact branded stage with a live phone, shown only on
          small screens where the full left stage is hidden. */}
      <section className="relative overflow-hidden bg-[#2e1d3f] px-6 pb-7 pt-10 text-white lg:hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full opacity-70"
          style={{ background: `radial-gradient(circle at 50% 50%, ${accent}, ${accent}00 70%)` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"
        />
        <div className="relative z-10 flex items-center gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl text-base font-bold text-white ring-1 ring-white/15"
            style={{ background: logo ? "rgba(255,255,255,0.1)" : accent }}
          >
            {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : initials}
          </span>
          <div className="min-w-0">
            <p className="lj-serif truncate text-xl leading-tight">{brandName}</p>
            <p className="text-xs text-white/60">The approval room</p>
          </div>
        </div>
        <h2 className="lj-serif relative z-10 mt-5 text-3xl leading-[1.08]">
          Your content, <span style={{ color: accent }}>ready to review.</span>
        </h2>
        <div className="relative z-10 mx-auto mt-6 h-44 w-[232px] overflow-hidden">
          <div className="studio-float">
            <PhoneFrame w={232} h={420}>
              <FeedScreen accent={accent} brandName={brandName} logo={logo} initials={initials} />
            </PhoneFrame>
          </div>
          {/* fade the clipped bottom into the stage */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#2e1d3f] to-transparent" />
          <div className="studio-pop absolute right-1 top-3 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#1f142e] shadow-lg">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-[#16b981] text-white">
              <Check className="h-3 w-3" />
            </span>
            Approved
          </div>
        </div>
      </section>

      {/* LEFT — deep-aubergine brand stage with the live demo phone */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#2e1d3f] p-10 text-white lg:flex xl:p-14">
        {/* layered accent glows (transform/opacity only — no animated blur) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-[30rem] w-[30rem] rounded-full opacity-70"
          style={{ background: `radial-gradient(circle at 50% 50%, ${accent}, ${accent}00 70%)` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-16 h-[26rem] w-[26rem] rounded-full opacity-50"
          style={{ background: `radial-gradient(circle at 50% 50%, #6d5bd0, #6d5bd000 70%)` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]"
        />

        <div className="relative z-10 flex items-center gap-3">
          {logo ? (
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15">
              <img src={logo} alt="" className="h-full w-full object-cover" />
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="lj-serif truncate text-2xl leading-tight">{brandName}</p>
            <p className="mt-0.5 text-sm text-white/65">The approval room</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="lj-serif text-4xl leading-[1.05] xl:text-5xl">
            Your content,
            <br />
            <span style={{ color: accent }}>ready to review.</span>
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/70">
            Swipe through every post, reel and story in a true-to-life preview - then approve or
            request changes in a tap.
          </p>
        </div>

        <StudioDemo accent={accent} brandName={brandName} logo={logo} initials={initials} />

        <div className="relative z-10 flex items-center gap-2 text-xs text-white/55">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">
            <Lock className="h-3.5 w-3.5" /> Private &amp; secure
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">
            <Check className="h-3.5 w-3.5" /> No account needed
          </span>
        </div>
      </section>

      {/* RIGHT — sign-in panel */}
      <section className="relative flex flex-col justify-center p-8 sm:p-12 lg:p-16">
        <div className="mx-auto w-full max-w-sm">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
            style={{ background: `${accent}1a`, color: accent }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            Welcome back
          </span>
          <h1 className="lj-serif mt-4 text-4xl leading-tight text-[#1f142e] sm:text-[2.75rem]">
            Log in to {brandName}
          </h1>
          <p className="mt-3 text-[15px] text-[#6b5f78]">
            Enter the password your studio shared to open your approval room.
          </p>

          <form onSubmit={onSubmit} className="mt-8">
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#6b5f78]">
              Workspace password
            </label>
            <div className="studio-field mt-2 flex items-center gap-3 rounded-2xl bg-[#f5f3f8] px-4 py-3.5">
              <Lock className="h-5 w-5 shrink-0 text-[#a397b0]" />
              <input
                type={show ? "text" : "password"}
                autoFocus
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••••"
                className="w-full bg-transparent text-base text-[#1f142e] outline-none placeholder:text-[#b6acc0]"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="shrink-0 text-[#a397b0] transition hover:text-[#1f142e]"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <button
              disabled={submitting || !pw}
              className="group mt-7 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              style={{ background: accent, boxShadow: `0 18px 40px -16px ${accent}` }}
            >
              {submitting ? "Signing in…" : "Enter approval room"}
              {!submitting && (
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#6b5f78]">
            Don&apos;t have the password?{" "}
            <span className="font-semibold text-[#1f142e]">Ask your studio.</span>
          </p>
        </div>
      </section>
    </main>
  );
}

// Real, editorial-grade photography for the demo feed (Unsplash, sized/optimised
// on the fly). A soft gradient sits behind each image so the frame still reads
// if a shot is slow to load.
const shot = (id: string, w = 480) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

// Feed for the live demo phone — an approval story woven through real content.
const STUDIO_REEL = [
  {
    tag: "Product launch",
    img: shot("photo-1441986300917-64674bd600d8"),
    likes: "2,481",
    caption: "The new collection is live",
    status: "approved" as const,
  },
  {
    tag: "Behind the scenes",
    img: shot("photo-1490481651871-ab68de25d43d"),
    likes: "1,208",
    caption: "On set today",
    status: "pending" as const,
  },
  {
    tag: "Reel",
    img: shot("photo-1499696010180-025ef6e1a8f9"),
    likes: "3,760",
    caption: "Golden hour",
    status: "approved" as const,
  },
  {
    tag: "Story",
    img: shot("photo-1512436991641-6745cdb1723f"),
    likes: "980",
    caption: "Fresh this morning",
    status: "pending" as const,
  },
];

// Photos reused across the profile-grid and story phones.
const STUDIO_SHOTS = [
  shot("photo-1441986300917-64674bd600d8", 240),
  shot("photo-1483985988355-763728e1935b", 240),
  shot("photo-1512436991641-6745cdb1723f", 240),
  shot("photo-1499696010180-025ef6e1a8f9", 240),
  shot("photo-1490481651871-ab68de25d43d", 240),
  shot("photo-1445205170230-053b83016050", 240),
  shot("photo-1519681393784-d120267933ba", 240),
  shot("photo-1506744038136-46273834b3fb", 240),
  shot("photo-1502920917128-1aa500764cbd", 240),
];
const STUDIO_STORY = shot("photo-1519681393784-d120267933ba");
const STUDIO_TILE_OK = [true, true, false, true, false, true, true, false, true];

type PhoneVars = React.CSSProperties & Record<string, string | number>;

/**
 * The live demo: three floating phones at different depths (a front phone
 * running an auto-scrolling feed, plus a profile-grid and a story phone behind
 * it), ringed by floating review stickers. The whole composition parallaxes to
 * the cursor. Motion is pure CSS/transform + a tiny pointer handler — no
 * animation framework, no animated blur — so it stays light on the GPU.
 */
function StudioDemo({
  accent,
  brandName,
  logo,
  initials,
}: {
  accent: string;
  brandName: string;
  logo: string | null;
  initials: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const setVars = (px: number, py: number) =>
      el.querySelectorAll<HTMLElement>("[data-depth]").forEach((n) => {
        const d = parseFloat(n.dataset.depth || "1");
        n.style.setProperty("--px", `${px * d * -14}px`);
        n.style.setProperty("--py", `${py * d * -14}px`);
      });
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setVars((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
    };
    const onLeave = () => setVars(0, 0);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const Avatar = ({ className }: { className: string }) => (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-white ${className}`}
      style={{ background: accent }}
    >
      {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : initials}
    </span>
  );

  return (
    <div ref={stageRef} className="relative z-10 flex-1">
      <div className="relative mx-auto h-[540px] w-full max-w-xl">
        {/* ---- Tertiary phone: a single story (back-left) ---- */}
        <div
          className="studio-pw"
          data-depth="3"
          style={
            {
              left: "34%",
              top: "52%",
              "--rot": "-13deg",
              "--sc": 0.72,
              "--fdur": "8s",
              "--fdelay": "0.6s",
            } as PhoneVars
          }
        >
          <div className="studio-floatinner">
            <PhoneFrame w={228} h={470}>
              <div className="pointer-events-none absolute inset-0 z-10 rounded-[29px] bg-gradient-to-b from-transparent via-transparent to-[#2e1d3f]/40" />
              <div className="absolute inset-x-3 top-3.5 z-10 flex gap-1">
                <span className="h-[3px] flex-1 rounded bg-white" />
                <span className="h-[3px] flex-1 rounded bg-white/40" />
                <span className="h-[3px] flex-1 rounded bg-white/40" />
              </div>
              <img
                src={STUDIO_STORY}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </PhoneFrame>
          </div>
        </div>

        {/* ---- Secondary phone: profile grid (back-right) ---- */}
        <div
          className="studio-pw"
          data-depth="2"
          style={
            {
              left: "66%",
              top: "50%",
              "--rot": "11deg",
              "--sc": 0.82,
              "--fdur": "7.5s",
              "--fdelay": "0.3s",
            } as PhoneVars
          }
        >
          <div className="studio-floatinner">
            <PhoneFrame w={250} h={500}>
              <div className="pointer-events-none absolute inset-0 z-10 rounded-[29px] bg-gradient-to-b from-transparent via-transparent to-[#2e1d3f]/25" />
              <div className="p-3 pt-8">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 text-sm" />
                  <div className="flex flex-1 justify-around text-center text-[10px] text-[#9a8fa6]">
                    {[
                      ["128", "posts"],
                      ["4.6k", "followers"],
                      ["312", "following"],
                    ].map(([n, l]) => (
                      <div key={l}>
                        <b className="block text-[13px] text-[#1f142e]">{n}</b>
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1">
                  {STUDIO_SHOTS.map((src, i) => (
                    <span key={i} className="relative aspect-square overflow-hidden rounded-md">
                      <img
                        src={src}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <span
                        className="absolute bottom-1 left-1 h-1.5 w-1.5 rounded-full ring-1 ring-white/80"
                        style={{ background: STUDIO_TILE_OK[i] ? "#16b981" : accent }}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </PhoneFrame>
          </div>
        </div>

        {/* ---- Primary phone: live auto-scrolling feed (front) ---- */}
        <div
          className="studio-pw z-[4]"
          data-depth="1"
          style={{ left: "48%", top: "50%", "--fdur": "6.5s" } as PhoneVars}
        >
          <div className="studio-floatinner">
            <PhoneFrame w={288} h={540}>
              <FeedScreen accent={accent} brandName={brandName} logo={logo} initials={initials} />
            </PhoneFrame>
          </div>
        </div>

        {/* ---- Floating review stickers + content card ---- */}
        <div
          className="studio-pop absolute left-[2%] top-[12%] z-[7] flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 text-[#1f142e] shadow-xl"
          style={{ animationDelay: "0.2s, 0.9s" }}
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#16b981] text-white">
            <Check className="h-4 w-4" />
          </span>
          <span className="text-[11px] leading-tight">
            <b className="block">Approved</b>
            <span className="text-[#9a8fa6]">Reel · just now</span>
          </span>
        </div>

        <div
          className="studio-pop absolute right-[3%] top-[19%] z-[7] flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[#1f142e] shadow-xl"
          style={{ animationDelay: "0.6s, 1.3s" }}
        >
          <Heart className="h-4 w-4 fill-[#f43f5e] text-[#f43f5e]" /> 2.4k
        </div>

        <div
          className="studio-pop absolute left-0 bottom-[22%] z-[7] flex max-w-[11rem] items-start gap-2 rounded-2xl bg-white px-3.5 py-2.5 text-[11px] text-[#1f142e] shadow-xl"
          style={{ animationDelay: "1s, 1.7s" }}
        >
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
          <span>
            <b>Client:</b> Obsessed with this one!
          </span>
        </div>

        <div
          className="studio-pop absolute right-[6%] bottom-[12%] z-[7] flex items-center gap-1 rounded-full bg-white px-3.5 py-1.5 text-sm shadow-xl"
          style={{ animationDelay: "1.4s, 2.1s" }}
        >
          {"★★★★★".split("").map((s, i) => (
            <span key={i} style={{ color: "#f4b740" }}>
              {s}
            </span>
          ))}
        </div>

        <div
          className="studio-pop absolute -right-1 top-[46%] z-[7] flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 text-[#1f142e] shadow-xl"
          style={{ animationDelay: "0.8s, 1.5s" }}
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-xl"
            style={{ background: `${accent}2e`, color: accent }}
          >
            <CalendarClock className="h-4 w-4" />
          </span>
          <span className="text-[11px] leading-tight">
            <b className="block">12 posts</b>
            <span className="text-[#9a8fa6]">scheduled this week</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Shared phone shell: notch + rounded screen at an explicit size. */
function PhoneFrame({ w, h, children }: { w: number; h: number; children: React.ReactNode }) {
  return (
    <div
      className="relative rounded-[40px] border-[11px] border-[#160d20] bg-white shadow-2xl"
      style={{ width: w }}
    >
      <div className="absolute left-1/2 top-2.5 z-30 h-5 w-24 -translate-x-1/2 rounded-full bg-[#160d20]" />
      <div className="relative overflow-hidden rounded-[29px] bg-white" style={{ height: h }}>
        {children}
      </div>
    </div>
  );
}

/** The live Instagram-style feed screen — reused by the desktop composition and
 * the mobile hero so both stay in sync. */
function FeedScreen({
  accent,
  brandName,
  logo,
  initials,
}: {
  accent: string;
  brandName: string;
  logo: string | null;
  initials: string;
}) {
  const Avatar = ({ className }: { className: string }) => (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full font-bold text-white ${className}`}
      style={{ background: accent }}
    >
      {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : initials}
    </span>
  );
  const reel = [...STUDIO_REEL, ...STUDIO_REEL]; // doubled → seamless loop

  return (
    <>
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-[#efeaf4] bg-white/95 px-4 pb-2.5 pt-8">
        <div className="flex items-center gap-2 text-sm font-bold text-[#1f142e]">
          <Avatar className="h-6 w-6 text-[10px]" />
          <span className="max-w-[8rem] truncate">{brandName}</span>
        </div>
        <Heart className="h-[18px] w-[18px] text-[#1f142e]" />
      </div>

      <div className="absolute inset-x-0 bottom-0 top-[56px] overflow-hidden">
        <div className="studio-reel">
          {reel.map((p, i) => (
            <article key={i} className="px-3.5 pb-4">
              <div className="flex items-center gap-2.5 py-2.5">
                <Avatar className="h-8 w-8 text-[11px]" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-[#1f142e]">{brandName}</div>
                  <div className="text-[10px] text-[#9a8fa6]">{p.tag}</div>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                  style={
                    p.status === "approved"
                      ? { background: "#16b98122", color: "#0f9d6f" }
                      : { background: `${accent}1f`, color: accent }
                  }
                >
                  {p.status === "approved" ? "Approved" : "Review"}
                </span>
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#efeaf4]">
                <img src={p.img} alt="" className="h-full w-full object-cover" loading="lazy" />
                {p.status === "approved" && (
                  <span className="studio-stamp absolute right-3.5 top-3.5 rounded-lg border-2 border-white/90 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white">
                    Approved
                  </span>
                )}
              </div>
              <div className="mt-2.5 flex items-center gap-3.5 text-[#1f142e]">
                <Heart className="h-[18px] w-[18px]" />
                <MessageCircle className="h-[18px] w-[18px]" />
                <Send className="h-[18px] w-[18px]" />
              </div>
              <div className="mt-1 text-[11px] font-bold text-[#1f142e]">{p.likes} likes</div>
              <div className="text-[11px] text-[#6b5f78]">
                <b className="text-[#1f142e]">{brandName}</b> {p.caption}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-[#efeaf4] bg-white/95 py-3">
        <Home className="h-[18px] w-[18px] text-[#1f142e]" />
        <Search className="h-[18px] w-[18px] text-[#9a8fa6]" />
        <PlusSquare className="h-[18px] w-[18px] text-[#9a8fa6]" />
        <Film className="h-[18px] w-[18px] text-[#9a8fa6]" />
        <Avatar className="h-[22px] w-[22px] text-[9px]" />
      </div>
    </>
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
    posted: platformPosts.filter((p) => p.status === "posted").length,
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
            <strong className="text-rose-600">{counts.rejected}</strong> changes ·{" "}
            <strong className="text-sky-600">{counts.posted}</strong> posted
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

        <LiveNotice
          companyId={company.id}
          posts={posts}
          onOpen={(p) => {
            setPlatform(p.platform);
            setViewer({
              list: posts.filter((x) => x.platform === p.platform && x.status === "posted"),
              id: p.id,
            });
          }}
        />

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

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, MMM d");
}

/**
 * "Your posts are live" notice. Stays compact however many posts are marked as posted:
 * a one-line summary with stacked thumbnails that expands into a scrollable list grouped by day.
 */
function LiveNotice({
  companyId,
  posts,
  onOpen,
}: {
  companyId: string;
  posts: Post[];
  onOpen: (p: Post) => void;
}) {
  const storageKey = `smim-seen-posted-${companyId}`;
  const [seen, setSeen] = useState<string[]>([]);
  const [hidden, setHidden] = useState(false);
  const [expanded, setExpanded] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setSeen(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setSeen([]);
    }
  }, [storageKey]);

  const live = posts
    .filter((p) => p.status === "posted")
    .sort((a, b) => (b.posted_at ?? "").localeCompare(a.posted_at ?? ""));
  if (live.length === 0 || hidden) return null;

  function markSeen(ids: string[]) {
    const next = Array.from(new Set([...seen, ...ids]));
    setSeen(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* storage unavailable - banner just shows "new" again next visit */
    }
  }

  const unseen = live.filter((p) => !seen.includes(p.id));
  // A single post shows its row right away; several start collapsed.
  const isOpen = expanded ?? live.length === 1;
  const groups: { label: string; items: Post[] }[] = [];
  for (const p of live) {
    const label = p.posted_at ? dayLabel(p.posted_at) : "Posted";
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(p);
    else groups.push({ label, items: [p] });
  }
  const headline =
    unseen.length > 0
      ? `${unseen.length} new post${unseen.length > 1 ? "s" : ""} live`
      : `${live.length} post${live.length > 1 ? "s" : ""} live`;

  return (
    <div className="w-full max-w-[390px] overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-background to-emerald-500/10 shadow-sm">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          onClick={() => setExpanded(!isOpen)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
          </span>
          <span className="truncate text-xs font-semibold uppercase tracking-widest text-sky-700">
            {headline}
          </span>
          {!isOpen && (
            <span className="ml-auto flex shrink-0 -space-x-2">
              {live.slice(0, 4).map((p) => (
                <span
                  key={p.id}
                  className="h-7 w-7 overflow-hidden rounded-full border-2 border-background bg-foreground/5"
                >
                  <Media post={p} className="h-full w-full object-cover" />
                </span>
              ))}
              {live.length > 4 && (
                <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-foreground/10 text-[10px] font-medium">
                  +{live.length - 4}
                </span>
              )}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""} ${isOpen ? "ml-auto" : ""}`}
          />
        </button>
        <button
          aria-label="Dismiss"
          onClick={() => {
            markSeen(live.map((p) => p.id));
            setHidden(true);
          }}
          className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-foreground/5"
        >
          <CloseX className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* grid-rows 0fr -> 1fr animates height without measuring; content stays mounted */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        aria-hidden={!isOpen}
      >
        <div
          className={`overflow-hidden transition-[visibility] duration-300 ${isOpen ? "visible" : "invisible"}`}
        >
        <div className="border-t border-foreground/5">
          <div className="max-h-64 overflow-y-auto px-2 pb-2">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="sticky top-0 z-10 bg-background/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur">
                  {g.label} · {g.items.length}
                </p>
                <ul>
                  {g.items.map((p) => {
                    const future = p.posted_at
                      ? new Date(p.posted_at).getTime() > Date.now()
                      : false;
                    return (
                      <li key={p.id} className="flex items-center gap-3 rounded-xl p-2">
                        <button
                          onClick={() => {
                            markSeen([p.id]);
                            onOpen(p);
                          }}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-foreground/10 bg-foreground/5">
                            <Media post={p} className="h-full w-full object-cover" />
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                              {p.platform} · {p.post_type}
                              {!seen.includes(p.id) && (
                                <span className="rounded-full bg-sky-500 px-1.5 py-px text-[9px] font-semibold text-white">
                                  New
                                </span>
                              )}
                            </span>
                            <span className="block truncate text-xs font-medium">
                              {p.posted_at ? format(new Date(p.posted_at), "p") : "Posted"}
                              {future && <span className="text-sky-700"> · scheduled</span>}
                            </span>
                            {p.posted_at && (
                              <span className="block text-[11px] text-muted-foreground">
                                {future ? "Goes live " : ""}
                                {postedAgo(p.posted_at)}
                              </span>
                            )}
                          </span>
                        </button>
                        {p.post_url && (
                          <a
                            href={p.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markSeen([p.id])}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-sky-500"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {unseen.length > 0 && (
            <button
              onClick={() => markSeen(live.map((p) => p.id))}
              className="flex w-full items-center justify-center gap-1.5 border-t border-foreground/5 py-2 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              <Check className="h-3 w-3" /> Mark all as seen
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

function statusDot(status: string) {
  return status === "approved"
    ? "bg-emerald-500"
    : status === "rejected"
      ? "bg-rose-500"
      : status === "posted"
        ? "bg-sky-500"
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
  const isPosted = post.status === "posted";

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
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${post.status === "approved" ? "bg-emerald-500/20 text-emerald-300" : post.status === "rejected" ? "bg-rose-500/20 text-rose-300" : post.status === "posted" ? "bg-sky-500/20 text-sky-300" : "bg-white/10 text-white/60"}`}
          >
            {post.status === "rejected" ? "changes requested" : post.status}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            {post.platform} · {post.post_type}
          </span>
        </div>
        {isPosted ? (
          <div className="rounded-xl border border-sky-400/30 bg-gradient-to-br from-sky-500/20 to-emerald-500/10 p-3">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-500 text-white">
                <BadgeCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Your post is live</p>
                {post.posted_at ? (
                  <p className="text-xs text-white/70">
                    Posted {formatPostedAt(post.posted_at)}
                    <span className="text-white/40"> · {postedAgo(post.posted_at)}</span>
                  </p>
                ) : (
                  <p className="text-xs text-white/70">Published on {post.platform}</p>
                )}
              </div>
            </div>
            {post.post_url ? (
              <div className="mt-3 flex gap-2">
                <a
                  href={post.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span className="truncate">Open on {linkHost(post.post_url)}</span>
                </a>
                <button
                  aria-label="Copy link"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(post.post_url ?? "")
                      .then(() => toast.success("Link copied"))
                      .catch(() => toast.error("Could not copy the link"));
                  }}
                  className="grid w-11 place-items-center rounded-lg border border-white/20 text-white/80 hover:bg-white/10"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-center text-xs text-white/60">
                The studio hasn't added the link yet.
              </p>
            )}
            {post.client_comment && (
              <p className="mt-2 line-clamp-2 text-xs text-white/50">{post.client_comment}</p>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

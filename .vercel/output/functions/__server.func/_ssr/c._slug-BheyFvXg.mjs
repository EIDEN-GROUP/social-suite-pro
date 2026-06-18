import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, c as createSsrRpc } from "./createSsrRpc-Bz2nbQDp.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { P as PLATFORMS, M as Media } from "./types-CQzXJOzH.mjs";
import { c as createServerFn } from "./server-RS57rG6Y.mjs";
import { a as AuroraLayer } from "./AuthAura-Dmd388lH.mjs";
import { R as Route$3 } from "./router-8TfFJ86_.mjs";
import "../_libs/seroval.mjs";
import { C as Check, M as MessageCircle, L as Lock, A as ArrowRight, f as ChevronDown, g as SquarePlus, T as TextAlignJustify, G as Grid3x3, F as Film, U as UserCheck, h as Play, I as Images, i as House, j as Search, R as Repeat2, H as Heart, E as Ellipsis, k as ThumbsUp, d as Send, X, l as ChevronLeft, m as ChevronRight } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType, e as enumType } from "../_libs/zod.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream/promises";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "./client-D2eKXXFb.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const getCompanyBranding = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  slug: stringType().min(1).max(80)
}).parse(input)).handler(createSsrRpc("f1ced4b90724720222b1bcd5233d4c056681bb239d76a086d70af4fe699f396e"));
const getClientWorkspace = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  slug: stringType().min(1).max(80),
  password: stringType().min(1).max(255)
}).parse(input)).handler(createSsrRpc("c66687f3fd5374f4965da097301eaf573c907bb3b0850b9956e372584a0401f1"));
const clientDecide = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  slug: stringType().min(1).max(80),
  password: stringType().min(1).max(255),
  postId: stringType().uuid(),
  status: enumType(["approved", "rejected"]),
  comment: stringType().max(2e3).optional()
}).parse(input)).handler(createSsrRpc("005776df560c987ea9fd0c4388b1a630c89c2fca77a413e62c78347894d0c972"));
function ClientRoom() {
  const {
    slug
  } = Route$3.useParams();
  const loadWorkspace = useServerFn(getClientWorkspace);
  const decide = useServerFn(clientDecide);
  const loadBranding = useServerFn(getCompanyBranding);
  const [authed, setAuthed] = reactExports.useState(false);
  const [pw, setPw] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(true);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [company, setCompany] = reactExports.useState(null);
  const [branding, setBranding] = reactExports.useState(null);
  const [posts, setPosts] = reactExports.useState([]);
  const [highlights, setHighlights] = reactExports.useState([]);
  const storageKey = `atelier_pw:${slug}`;
  async function load(password) {
    const res = await loadWorkspace({
      data: {
        slug,
        password
      }
    });
    setCompany(res.company);
    setPosts(res.posts);
    setHighlights(res.highlights);
    setAuthed(true);
    sessionStorage.setItem(storageKey, password);
    setPw(password);
  }
  reactExports.useEffect(() => {
    loadBranding({
      data: {
        slug
      }
    }).then((r) => setBranding(r.branding)).catch(() => setBranding(null));
    const saved = sessionStorage.getItem(storageKey);
    if (!saved) {
      setLoading(false);
      return;
    }
    load(saved).catch(() => sessionStorage.removeItem(storageKey)).finally(() => setLoading(false));
  }, [slug]);
  async function refresh() {
    if (!pw) return;
    try {
      const res = await loadWorkspace({
        data: {
          slug,
          password: pw
        }
      });
      setPosts(res.posts);
      setHighlights(res.highlights);
      setCompany(res.company);
    } catch {
    }
  }
  async function handleLogin(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await load(pw);
    } catch (err) {
      toast.error(err.message);
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
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid min-h-screen place-items-center text-sm text-muted-foreground", children: "Loading…" });
  if (!authed || !company) {
    const accent = branding?.accent_color || void 0;
    const logo = branding?.logo_url || branding?.profile_pic_url || null;
    const brandName = branding?.name;
    const initials = (brandName || slug).slice(0, 2).toUpperCase();
    const BrandMark = ({
      size
    }) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `grid shrink-0 place-items-center overflow-hidden rounded-2xl text-base font-bold text-white shadow-lg ${size}`, style: {
      background: accent || "#0d0d0d"
    }, children: logo ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: logo, alt: "", className: "h-full w-full object-cover" }) : initials });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-[1.05fr_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative hidden flex-col justify-between overflow-hidden border-r editorial-rule p-12 lg:flex xl:p-16", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AuroraLayer, { accent }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BrandMark, { size: "h-11 w-11" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.3em] text-muted-foreground", children: "Approval room" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-display text-xl leading-tight", children: brandName || `/${slug}` })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-display text-6xl leading-[0.92] xl:text-7xl", children: [
            "Your work,",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-social-gradient", children: "ready for review." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 max-w-md text-base text-muted-foreground", children: "Swipe through every post, reel and story in true-to-life mockups — then approve or request changes in a single tap." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-9 flex flex-wrap gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "auth-card flex items-center gap-2 rounded-2xl border border-white/40 px-3.5 py-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block font-semibold", children: "Approved" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Reel · just now" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "auth-card flex items-center gap-2 rounded-2xl border border-white/40 px-3.5 py-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-7 w-7 place-items-center rounded-full bg-rose-500 text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block font-semibold", children: "“Brighten the logo?”" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Your comment" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "relative z-10 text-[11px] uppercase tracking-[0.3em] text-muted-foreground", children: "Powered by Atelier" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative flex items-center justify-center overflow-hidden p-6 sm:p-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 -z-10 opacity-70 lg:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AuroraLayer, { accent }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-rise w-full max-w-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 flex items-center gap-3 lg:hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BrandMark, { size: "h-12 w-12" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.25em] text-muted-foreground", children: "Approval room" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate font-display text-xl leading-tight", children: brandName || `/${slug}` })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] uppercase tracking-[0.3em] text-muted-foreground", children: "Welcome" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-2 font-display text-4xl leading-tight", children: "Enter your workspace" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: brandName ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            "Use the password your studio shared to open the",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: brandName }),
            " room."
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            "Your studio shared a password for",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { className: "text-foreground", children: [
              "/",
              slug
            ] }),
            "."
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleLogin, className: "mt-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] uppercase tracking-[0.2em] text-muted-foreground", children: "Workspace password" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", autoFocus: true, value: pw, onChange: (e) => setPw(e.target.value), placeholder: "••••••••", className: "w-full rounded-xl border border-foreground/15 bg-card/60 py-3 pl-11 pr-4 text-base outline-none transition focus:border-foreground/40 focus:bg-card focus:ring-4 focus:ring-foreground/5" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: submitting || !pw, className: "group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-100 disabled:opacity-50", style: {
              background: accent || "#0d0d0d"
            }, children: [
              submitting ? "…" : "Enter the room",
              !submitting && /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 transition group-hover:translate-x-1" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-8 text-[11px] text-muted-foreground", children: "Reviewed in seconds — no account needed." })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ReviewPhone, { company, posts, highlights, onLogout: logout, onDecide: async (post, status, comment) => {
    await decide({
      data: {
        slug,
        password: pw,
        postId: post.id,
        status,
        comment
      }
    });
    await refresh();
  } });
}
function ReviewPhone({
  company,
  posts,
  highlights,
  onLogout,
  onDecide
}) {
  const [platform, setPlatform] = reactExports.useState("instagram");
  const [igTab, setIgTab] = reactExports.useState("posts");
  const [viewer, setViewer] = reactExports.useState(null);
  const platformPosts = posts.filter((p) => p.platform === platform);
  const counts = {
    pending: platformPosts.filter((p) => p.status === "pending").length,
    approved: platformPosts.filter((p) => p.status === "approved").length,
    rejected: platformPosts.filter((p) => p.status === "rejected").length
  };
  const open = (list, id) => setViewer({
    list,
    id
  });
  const viewerIdx = viewer ? viewer.list.findIndex((p) => p.id === viewer.id) : -1;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "min-h-screen bg-neutral-100 text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-foreground/10 bg-background px-6 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-3 w-3 rounded-full", style: {
          background: company.accent_color || "#0d0d0d"
        } }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-lg", children: company.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded border editorial-rule px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground", children: "Approval room" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "hidden sm:inline", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: counts.pending }),
          " pending ·",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-emerald-600", children: counts.approved }),
          " ok ·",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-rose-600", children: counts.rejected }),
          " changes"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onLogout, className: "rounded-sm border editorial-rule px-3 py-1.5", children: "Sign out" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-4 px-4 py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap justify-center gap-1 rounded-full border editorial-rule bg-background p-1", children: PLATFORMS.map((p) => {
        const n = posts.filter((x) => x.platform === p.id).length;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
          setPlatform(p.id);
          setViewer(null);
        }, className: `rounded-full px-3 py-1.5 text-xs uppercase tracking-widest ${platform === p.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`, children: [
          p.label,
          n > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 opacity-60", children: n })
        ] }, p.id);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs uppercase tracking-[0.3em] text-muted-foreground", children: "Tap any post to approve or request changes" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full max-w-[390px] overflow-hidden rounded-[44px] border-[11px] border-neutral-900 bg-background shadow-2xl", style: {
        aspectRatio: "9 / 19.5"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-1/2 top-2 z-30 h-6 w-32 -translate-x-1/2 rounded-full bg-neutral-900" }),
        platform === "instagram" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Instagram, { company, posts: platformPosts, highlights, igTab, setIgTab, onOpen: open }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FeedPhone, { platform, company, posts: platformPosts, onOpen: open }),
        viewer && viewerIdx >= 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(PostViewer, { post: viewer.list[viewerIdx], index: viewerIdx, total: viewer.list.length, onClose: () => setViewer(null), onNav: (dir) => {
          const next = viewerIdx + dir;
          if (next < 0 || next >= viewer.list.length) setViewer(null);
          else setViewer({
            list: viewer.list,
            id: viewer.list[next].id
          });
        }, onDecide })
      ] })
    ] })
  ] });
}
function statusDot(status) {
  return status === "approved" ? "bg-emerald-500" : status === "rejected" ? "bg-rose-500" : "bg-amber-400";
}
function Instagram({
  company,
  posts,
  highlights,
  igTab,
  setIgTab,
  onOpen
}) {
  const [lightbox, setLightbox] = reactExports.useState(null);
  const stories = posts.filter((p) => p.post_type === "story" && p.status === "pending");
  const gridPosts = posts.filter((p) => p.post_type === "post" || p.post_type === "carousel");
  const reels = posts.filter((p) => p.post_type === "reel");
  const list = igTab === "posts" ? gridPosts : reels;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-foreground/10 bg-background px-4 pb-2 pt-9", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-base font-semibold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-3.5 w-3.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: company.username || company.slug }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePlus, { className: "h-5 w-5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TextAlignJustify, { className: "h-5 w-5" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-x-0 bottom-12 top-[68px] overflow-y-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Profile, { company, postCount: gridPosts.length, hasStory: stories.length > 0, onStory: stories.length ? () => onOpen(stories, stories[0].id) : void 0 }),
      highlights.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Highlights, { highlights, accent: company.accent_color, onPick: setLightbox }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex border-y border-foreground/10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setIgTab("posts"), className: `flex flex-1 justify-center border-b-2 py-2.5 ${igTab === "posts" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Grid3x3, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setIgTab("reels"), className: `flex flex-1 justify-center border-b-2 py-2.5 ${igTab === "reels" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "flex flex-1 justify-center border-b-2 border-transparent py-2.5 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { className: "h-5 w-5" }) })
      ] }),
      list.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-16 text-center text-xs text-muted-foreground", children: [
        "No ",
        igTab,
        " to review yet."
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-0.5", children: list.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => onOpen(list, p.id), className: "relative aspect-square overflow-hidden bg-foreground/5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Media, { post: p, className: "h-full w-full object-cover", muted: true }),
        p.post_type === "reel" && /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "absolute right-1 top-1 h-3.5 w-3.5 fill-white text-white drop-shadow" }),
        p.post_type === "carousel" && /* @__PURE__ */ jsxRuntimeExports.jsx(Images, { className: "absolute right-1 top-1 h-3.5 w-3.5 text-white drop-shadow" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute bottom-1 left-1 h-2 w-2 rounded-full ${statusDot(p.status)}` })
      ] }, p.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-foreground/10 bg-background py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-5 w-5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-5 w-5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePlus, { className: "h-5 w-5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "h-5 w-5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-6 w-6 overflow-hidden rounded-full bg-foreground/10", children: company.profile_pic_url && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: company.profile_pic_url, className: "h-full w-full object-cover" }) })
    ] }),
    lightbox && /* @__PURE__ */ jsxRuntimeExports.jsx(HighlightViewer, { highlight: lightbox, onClose: () => setLightbox(null) })
  ] });
}
function HighlightViewer({
  highlight,
  onClose
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 z-40 flex flex-col bg-black text-white", onClick: onClose, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 pb-2 pt-9", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-6 w-6" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs tracking-wide text-white/70", children: highlight.label || "Highlight" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-6" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1 items-center justify-center p-4", children: highlight.image ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: highlight.image, className: "max-h-full max-w-full object-contain" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-7xl", children: highlight.emoji || "○" }) })
  ] });
}
function FeedPhone({
  platform,
  company,
  posts,
  onOpen
}) {
  const label = PLATFORMS.find((p) => p.id === platform)?.label;
  const handle = company.username || company.slug;
  const accent = company.accent_color || "#1d4ed8";
  const followers = company.followers || "0";
  const following = company.following ?? 0;
  const linkText = company.link?.replace(/^https?:\/\//, "");
  const cover = company.cover_url;
  const banner = (gradient) => cover ? {
    backgroundImage: `url(${cover})`
  } : {
    background: gradient
  };
  const Pic = ({
    className,
    rounded = "rounded-full"
  }) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `grid shrink-0 place-items-center overflow-hidden ${rounded} bg-foreground/10 text-sm font-semibold uppercase ${className}`, children: company.profile_pic_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: company.profile_pic_url, className: "h-full w-full object-cover" }) : company.name.slice(0, 2) });
  const smallAvatar = /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-foreground/10 text-[10px] uppercase", children: company.profile_pic_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: company.profile_pic_url, className: "h-full w-full object-cover" }) : company.name.slice(0, 2) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-foreground/10 bg-background px-4 pb-2 pt-9", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base font-semibold", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
        "@",
        handle
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-x-0 bottom-0 top-[64px] overflow-y-auto bg-neutral-50", children: [
      platform === "facebook" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-full bg-cover bg-center", style: banner(`linear-gradient(135deg, ${accent}, ${accent}88)`) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pic, { className: "-mt-8 h-20 w-20 ring-4 ring-background" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-lg font-bold", children: company.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
            company.category || "Business",
            " · ",
            followers,
            " followers"
          ] }),
          company.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-sm", children: company.bio }),
          linkText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs font-medium", style: {
            color: accent
          }, children: linkText }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "flex-1 rounded-md py-1.5 text-sm font-semibold text-white", style: {
              background: accent
            }, children: "＋ Follow" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "flex-1 rounded-md bg-foreground/5 py-1.5 text-sm font-semibold", children: "Message" })
          ] })
        ] })
      ] }),
      platform === "twitter" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-full bg-cover bg-center", style: banner(accent) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "-mt-8 flex items-end justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pic, { className: "h-16 w-16 ring-4 ring-background" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mb-1 rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background", children: "Follow" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-lg font-bold leading-tight", children: company.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground", children: [
            "@",
            handle
          ] }),
          company.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-sm", children: company.bio }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground", children: [
            company.category && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: company.category }),
            linkText && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
              color: accent
            }, children: linkText })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-4 pb-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: following }),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Following" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: followers }),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Followers" })
            ] })
          ] })
        ] })
      ] }),
      platform === "linkedin" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-full bg-cover bg-center", style: banner(`linear-gradient(135deg, ${accent}, ${accent}88)`) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Pic, { className: "-mt-7 h-16 w-16 ring-4 ring-background", rounded: "rounded-md" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-lg font-bold leading-tight", children: company.name }),
          company.category && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: company.category }),
          company.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: company.bio }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
            followers,
            " followers"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "rounded-full px-5 py-1.5 text-sm font-semibold text-white", style: {
              background: accent
            }, children: "＋ Follow" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "rounded-full border border-foreground/30 px-5 py-1.5 text-sm font-semibold", children: "Visit website" })
          ] })
        ] })
      ] }),
      platform === "tiktok" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center bg-background px-4 pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Pic, { className: "h-20 w-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-base font-semibold", children: [
          "@",
          handle
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-6 text-center text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: following }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Following" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: followers }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Followers" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: posts.length }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Videos" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mt-3 rounded px-10 py-1.5 text-sm font-semibold text-white", style: {
          background: accent
        }, children: "Follow" }),
        company.category && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 text-xs text-muted-foreground", children: company.category }),
        company.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-center text-xs", children: company.bio }),
        linkText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs font-medium", style: {
          color: accent
        }, children: linkText })
      ] }),
      posts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-16 text-center text-xs text-muted-foreground", children: [
        "No ",
        label,
        " content to review yet."
      ] }) : platform === "tiktok" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid grid-cols-3 gap-0.5 border-t border-foreground/10 pt-0.5", children: posts.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => onOpen(posts, p.id), className: "relative aspect-[9/14] overflow-hidden bg-black", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Media, { post: p, className: "h-full w-full object-cover", muted: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "absolute left-1 bottom-1 h-3.5 w-3.5 fill-white text-white drop-shadow" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute right-1 top-1 h-2 w-2 rounded-full ${statusDot(p.status)}` })
      ] }, p.id)) }) : platform === "twitter" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 divide-y divide-foreground/10 border-t border-foreground/10 bg-background", children: posts.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => onOpen(posts, p.id), className: "flex w-full gap-3 p-3 text-left hover:bg-foreground/[0.02]", children: [
        smallAvatar,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: company.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
              "@",
              handle
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `ml-auto h-2 w-2 rounded-full ${statusDot(p.status)}` })
          ] }),
          p.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 whitespace-pre-line text-sm", children: p.caption }),
          p.media_url && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 overflow-hidden rounded-2xl border border-foreground/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Media, { post: p, className: "w-full", muted: true }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-8 text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Repeat2, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "h-4 w-4" })
          ] })
        ] })
      ] }, p.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 p-2", children: posts.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => onOpen(posts, p.id), className: "block w-full overflow-hidden rounded-lg border border-foreground/10 bg-background text-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3", children: [
          smallAvatar,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: company.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: platform === "linkedin" ? "Promoted · 1h" : "Sponsored · 🌐" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-2 w-2 rounded-full ${statusDot(p.status)}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        p.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 pb-2 text-sm", children: p.caption }),
        p.media_url && /* @__PURE__ */ jsxRuntimeExports.jsx(Media, { post: p, className: "w-full", muted: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-around border-t border-foreground/10 p-2 text-[11px] text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ThumbsUp, { className: "h-3.5 w-3.5" }),
            " Like"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-3.5 w-3.5" }),
            " Comment"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-3.5 w-3.5" }),
            " Send"
          ] })
        ] })
      ] }, p.id)) })
    ] })
  ] });
}
function Profile({
  company,
  postCount,
  hasStory,
  onStory
}) {
  const inner = company.profile_pic_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: company.profile_pic_url, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-full w-full place-items-center text-sm uppercase", children: company.name.slice(0, 2) });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pt-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6", children: [
      hasStory ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onStory, className: "shrink-0 rounded-full p-[3px]", style: {
        background: "linear-gradient(45deg,#f59e0b,#ef4444,#d946ef)"
      }, title: "View story", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block rounded-full bg-background p-[2px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block h-[68px] w-[68px] overflow-hidden rounded-full bg-foreground/10", children: inner }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-[78px] w-[78px] shrink-0 overflow-hidden rounded-full bg-foreground/10 ring-2 ring-foreground/10", children: inner }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 justify-around text-center text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold leading-none", children: postCount }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "posts" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold leading-none", children: company.followers || "0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "followers" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold leading-none", children: company.following ?? 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "following" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 text-sm leading-snug", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: company.name }),
      company.category && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: company.category }),
      company.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "whitespace-pre-line", children: company.bio }),
      company.link && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: company.link, target: "_blank", rel: "noreferrer", className: "font-medium", style: {
        color: company.accent_color || "#3b5998"
      }, children: company.link.replace(/^https?:\/\//, "") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "flex-1 rounded-lg bg-foreground/5 py-1.5 text-xs font-semibold", children: "Edit profile" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "flex-1 rounded-lg bg-foreground/5 py-1.5 text-xs font-semibold", children: "Share profile" })
    ] })
  ] });
}
function Highlights({
  highlights,
  accent,
  onPick
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex gap-4 overflow-x-auto px-4", children: highlights.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => onPick(h), className: "flex w-16 shrink-0 flex-col items-center gap-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-16 w-16 place-items-center overflow-hidden rounded-full p-[2px]", style: {
      boxShadow: `inset 0 0 0 2px ${accent || "#dbdbdb"}33`
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-full w-full place-items-center overflow-hidden rounded-full bg-foreground/5", children: h.image ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: h.image, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl", children: h.emoji || "○" }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-[64px] truncate text-[11px]", children: h.label })
  ] }, h.id)) });
}
function PostViewer({
  post,
  index,
  total,
  onClose,
  onNav,
  onDecide
}) {
  const [comment, setComment] = reactExports.useState(post.client_comment ?? "");
  const [busy, setBusy] = reactExports.useState(false);
  const media = [post.media_url, ...post.extra_media ?? []].filter(Boolean);
  const [mi, setMi] = reactExports.useState(0);
  reactExports.useEffect(() => {
    setComment(post.client_comment ?? "");
    setMi(0);
  }, [post.id, post.client_comment]);
  async function act(status) {
    if (status === "rejected" && !comment.trim()) return toast.error("Add a comment to request changes");
    setBusy(true);
    try {
      await onDecide(post, status, comment);
      toast.success(status === "approved" ? "Approved" : "Changes requested");
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }
  const cur = media[mi];
  const isVideo = post.media_type === "video";
  const isCarousel = media.length > 1;
  function step(dir) {
    if (dir === 1) {
      if (mi < media.length - 1) setMi(mi + 1);
      else onNav(1);
    } else {
      if (mi > 0) setMi(mi - 1);
      else onNav(-1);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 z-40 flex flex-col bg-black text-white", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 pb-2 pt-9", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-6 w-6" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        isCarousel && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium tracking-wide", children: [
          mi + 1,
          "/",
          media.length
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs tracking-wide text-white/70", children: [
          index + 1,
          " / ",
          total
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex flex-1 items-center justify-center overflow-hidden", children: [
      cur ? isVideo ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { src: cur, className: "max-h-full max-w-full", controls: true, autoPlay: true, loop: true, playsInline: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: cur, className: "max-h-full max-w-full object-contain" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-white/40", children: "No media" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => step(-1), className: "absolute inset-y-0 left-0 w-1/4", "aria-label": "previous" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => step(1), className: "absolute inset-y-0 right-0 w-1/4", "aria-label": "next" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => step(-1), className: "absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => step(1), className: "absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-5 w-5" }) }),
      isCarousel && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5", children: media.map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setMi(i), className: `h-1.5 w-1.5 rounded-full transition ${i === mi ? "w-4 bg-white" : "bg-white/40"}` }, i)) })
    ] }),
    post.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-h-20 overflow-y-auto px-4 py-2 text-xs text-white/80", children: post.caption }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-white/10 bg-black/95 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${post.status === "approved" ? "bg-emerald-500/20 text-emerald-300" : post.status === "rejected" ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-white/60"}`, children: post.status === "rejected" ? "changes requested" : post.status }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] uppercase tracking-widest text-white/40", children: [
          post.platform,
          " · ",
          post.post_type
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: comment, onChange: (e) => setComment(e.target.value), rows: 2, placeholder: "Your feedback… (required to request changes)", className: "w-full rounded-md border border-white/15 bg-white/5 p-2 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: busy, onClick: () => act("approved"), className: "flex-1 rounded-md bg-emerald-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50", children: "Approve" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: busy || !comment.trim(), onClick: () => act("rejected"), className: "flex-1 rounded-md border border-white/25 py-2.5 text-sm font-semibold text-white disabled:opacity-40", children: "Request changes" })
      ] })
    ] })
  ] });
}
export {
  ClientRoom as component
};

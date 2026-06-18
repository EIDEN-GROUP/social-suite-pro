import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useServerFn, c as createSsrRpc } from "./createSsrRpc-BWDJsalq.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { Q as QRCodeSVG } from "../_libs/qrcode.react.mjs";
import { P as PhonePreview } from "./PhonePreview-B043DJOt.mjs";
import { P as PLATFORMS, M as Media } from "./types-CQzXJOzH.mjs";
import { c as createServerFn } from "./server-DDgu703A.mjs";
import "../_libs/seroval.mjs";
import { S as Sparkles, A as ArrowRight, C as Check, M as MessageCircle, Z as Zap, a as MousePointerClick, b as Clock, c as ShieldCheck, H as Heart, d as Send, e as MapPin, P as Phone, X } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType, l as literalType } from "../_libs/zod.mjs";
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
const submitContact = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  name: stringType().trim().min(1, "Please add your name").max(120),
  email: stringType().trim().email("Enter a valid email").max(255).optional().or(literalType("")),
  phone: stringType().trim().max(40).optional().or(literalType("")),
  message: stringType().trim().min(1, "Tell us a little about your project").max(2e3)
}).parse(input)).handler(createSsrRpc("1ac20e83585a55e943670fa4670b07889b610801a7a21f28dc367c19f92e50fd"));
const WHATSAPP_NUMBER = "212777777428";
const WHATSAPP_PREFILL = "Hi Atelier 👋 I'd like to see how the approval studio works for my agency.";
const waLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
const CONTACT = {
  address: "Agadir Bay, Technopole 1 Bloc B, Agadir 80000",
  phones: [{
    label: "US / Canada",
    display: "+1 613 706 9011",
    tel: "+16137069011"
  }, {
    label: "Morocco",
    display: "+212 7 77 77 74 28",
    tel: "+212777777428"
  }]
};
const PLATFORM_CHIPS = [{
  label: "Instagram",
  className: "ig-gradient text-white"
}, {
  label: "TikTok",
  className: "bg-black text-white"
}, {
  label: "Facebook",
  className: "bg-[#1877F2] text-white"
}, {
  label: "X",
  className: "bg-neutral-900 text-white"
}, {
  label: "LinkedIn",
  className: "bg-[#0A66C2] text-white"
}];
const demoCompany = {
  id: "demo",
  slug: "atelier",
  name: "Atelier Studio",
  accent_color: "#dc2743",
  logo_url: null,
  bio: "Where social campaigns get the green light ✨",
  username: "atelier.studio",
  profile_pic_url: "https://picsum.photos/seed/atelieravatar/200/200",
  followers: "64.4k",
  following: 128,
  link: "https://atelier.studio",
  category: "Creative Studio",
  cover_url: "https://picsum.photos/seed/ateliercover/1200/400"
};
let _n = 0;
const mk = (platform, post_type, seed, caption = "") => ({
  id: `demo-${_n++}`,
  company_id: "demo",
  platform,
  post_type,
  media_url: `https://picsum.photos/seed/${seed}/600/800`,
  media_type: "image",
  extra_media: [],
  caption,
  position: _n,
  status: "approved",
  client_comment: null,
  decided_at: null,
  scheduled_at: null,
  created_at: ""
});
const demoPosts = [...Array.from({
  length: 6
}).map((_, i) => mk("instagram", "post", `igp${i}`, `Campaign frame ${i + 1} - autumn drop.`)), mk("instagram", "reel", "igr1", "Behind the scenes 🎬"), mk("instagram", "reel", "igr2", "Launch teaser"), mk("instagram", "story", "igs1", "Weekend teaser"), ...["t1", "t2", "t3"].map((s) => mk("tiktok", "reel", s, "New drop just landed 🔥")), ...["f1", "f2"].map((s) => mk("facebook", "post", s, "Big news for our community today.")), ...["x1", "x2", "x3"].map((s) => mk("twitter", "post", s, "Shipping something special today.")), ...["l1", "l2"].map((s) => mk("linkedin", "post", s, "We're proud to announce our latest campaign."))];
const demoHighlights = [{
  id: "h1",
  company_id: "demo",
  label: "Launch",
  emoji: "🚀",
  image: "https://picsum.photos/seed/hll/200/200",
  position: 0,
  created_at: ""
}, {
  id: "h2",
  company_id: "demo",
  label: "BTS",
  emoji: "🎬",
  image: "https://picsum.photos/seed/hlb/200/200",
  position: 1,
  created_at: ""
}, {
  id: "h3",
  company_id: "demo",
  label: "Press",
  emoji: "📰",
  image: null,
  position: 2,
  created_at: ""
}];
function Index() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "relative min-h-screen overflow-x-clip bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "aria-hidden": true, className: "pointer-events-none fixed inset-0 -z-10 overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-blob absolute -left-24 -top-24 h-[36vw] w-[36vw] rounded-full opacity-30 blur-[120px]", style: {
        background: "linear-gradient(135deg,#f09433,#dc2743,#bc1888)"
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-blob absolute right-[-10%] top-[10%] h-[30vw] w-[30vw] rounded-full opacity-25 blur-[120px] [animation-delay:-6s]", style: {
        background: "linear-gradient(135deg,#405de6,#1877f2)"
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-blob absolute bottom-[-10%] left-[30%] h-[28vw] w-[28vw] rounded-full opacity-20 blur-[120px] [animation-delay:-12s]", style: {
        background: "linear-gradient(135deg,#22c55e,#06b6d4)"
      } })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "glass sticky top-0 z-50 border-b editorial-rule", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-6xl items-center justify-between px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-display text-2xl tracking-tight", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ig-gradient inline-grid h-7 w-7 place-items-center rounded-lg text-sm font-bold text-white", children: "A" }),
        "Atelier"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "hidden items-center gap-8 text-sm text-muted-foreground md:flex", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#how", className: "hover:text-foreground", children: "How it works" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#features", className: "hover:text-foreground", children: "Features" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#platforms", className: "hover:text-foreground", children: "Platforms" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#contact", className: "rounded-full bg-foreground px-5 py-2 font-medium text-background transition hover:opacity-90", children: "Get a demo" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative mx-auto grid max-w-6xl items-center gap-12 px-6 pt-16 md:pt-24 lg:grid-cols-2 lg:gap-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center lg:text-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "animate-rise inline-flex items-center gap-2 rounded-full border editorial-rule bg-card px-3 py-1 text-xs font-medium text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5" }),
          " The approval room agencies actually enjoy"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "animate-rise mt-6 font-display text-5xl leading-[0.95] sm:text-6xl md:text-7xl", children: [
          "Get campaigns",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block -rotate-2 bg-yellow-300 px-3 py-0.5 font-display text-black shadow-lg", children: "approved" }),
          " ",
          "without the chaos."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "animate-rise mx-auto mt-7 max-w-xl text-lg text-muted-foreground lg:mx-0", children: "Present feed posts, reels, stories & timelines in true-to-life mockups. Clients tap, react, approve - no logins, no endless email threads." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-rise mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#contact", className: "group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-bold text-background transition hover:scale-105", children: [
            "Book a demo",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 transition group-hover:translate-x-1" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#how", className: "inline-flex items-center gap-2 rounded-full border editorial-rule px-7 py-3.5 text-sm font-semibold transition hover:bg-foreground/[0.03]", children: "See how it works" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex justify-center pb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-float-slow absolute left-0 top-16 z-10 hidden rounded-2xl border editorial-rule bg-card p-3 text-left shadow-xl sm:block", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "Approved" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "Reel · 12s ago" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-float absolute right-0 top-36 z-10 hidden rounded-2xl border editorial-rule bg-card p-3 text-left shadow-xl sm:block [animation-delay:-3s]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-8 w-8 place-items-center rounded-full bg-rose-500 text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "“Brighten the logo?”" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "Client comment" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LivePhone, {})
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative overflow-hidden border-y editorial-rule bg-foreground py-3 text-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-marquee flex w-max gap-10 whitespace-nowrap text-sm uppercase tracking-[0.3em]", children: Array.from({
      length: 2
    }).map((_, k) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex gap-10", children: ["Instagram", "·", "TikTok", "·", "Facebook", "·", "X", "·", "LinkedIn", "·", "Stories", "·", "Reels", "·", "Carousels", "·", "One-tap approve", "·"].map((t, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "opacity-80", children: t }, i)) }, k)) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "how", className: "mx-auto max-w-6xl px-6 py-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-muted-foreground", children: "In three taps" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mt-3 font-display text-4xl md:text-5xl", children: [
          "From draft to ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-social-gradient", children: "green light" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-14 grid gap-6 md:grid-cols-3", children: [{
        n: "01",
        t: "Upload",
        d: "Drop media, write captions, pick the post type for each platform.",
        icon: Zap,
        grad: "from-amber-400 to-orange-500"
      }, {
        n: "02",
        t: "Preview",
        d: "Clients see exactly what they'll see - pixel-true device frames.",
        icon: MousePointerClick,
        grad: "from-fuchsia-500 to-purple-600"
      }, {
        n: "03",
        t: "Approve",
        d: "One tap to approve, or reject with a comment. You see it live.",
        icon: Check,
        grad: "from-emerald-400 to-teal-500"
      }].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "group rounded-3xl border editorial-rule bg-card p-7 transition hover:-translate-y-1 hover:shadow-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${s.grad} text-white`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(s.icon, { className: "h-6 w-6" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 font-display text-3xl text-muted-foreground", children: s.n }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-1 font-display text-2xl", children: s.t }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: s.d })
      ] }, s.n)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#contact", className: "group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-bold text-background transition hover:scale-105", children: [
        "Set up my approval room",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 transition group-hover:translate-x-1" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "platforms", className: "mx-auto max-w-6xl px-6 pb-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-muted-foreground", children: "Every channel, true to life" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 flex flex-wrap items-center justify-center gap-3", children: PLATFORM_CHIPS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition hover:scale-105 ${p.className}`, children: p.label }, p.label)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#contact", className: "group inline-flex items-center gap-2 text-sm font-semibold text-foreground underline-offset-4 hover:underline", children: [
        "See it with your branding",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 transition group-hover:translate-x-1" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { id: "features", className: "mx-auto max-w-6xl px-6 py-20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-5 md:grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Feature, { className: "md:col-span-2 ig-gradient text-white", icon: Sparkles, title: "True-to-life mockups", desc: "Instagram grids, reels, stories, TikTok, Facebook & LinkedIn pages - your client sees the real thing, branded to them.", light: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Feature, { icon: Clock, title: "Real-time decisions", desc: "Approvals and comments land in your studio the instant a client taps." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Feature, { icon: ShieldCheck, title: "No client login", desc: "Share a link + password. Clients review in seconds - zero friction." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Feature, { icon: Check, title: "One-tap approve", desc: "Or reject with a comment. Every status tracked at a glance." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Feature, { icon: Heart, title: "Made to feel good", desc: "A playful, native-feeling space that clients actually want to open." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-12 flex flex-wrap items-center justify-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#contact", className: "group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-bold text-background transition hover:scale-105", children: [
          "Start getting approvals",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 transition group-hover:translate-x-1" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "#how", className: "text-sm font-medium text-muted-foreground hover:text-foreground", children: "See how it works again" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-6xl px-6 pb-16", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ig-gradient relative overflow-hidden rounded-[2rem] px-8 py-16 text-center text-white shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "aria-hidden": true, className: "animate-spin-slow absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/20" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "aria-hidden": true, className: "animate-spin-slow absolute -bottom-24 -left-16 h-72 w-72 rounded-full border border-white/20" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "relative font-display text-4xl md:text-6xl", children: "Make approvals fun." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "relative mx-auto mt-4 max-w-xl text-white/90", children: "Ship campaigns faster with a proofing room your clients love to open." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "#contact", className: "relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-neutral-900 transition hover:scale-105", children: [
        "Talk to us ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ContactSection, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "border-t editorial-rule", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground sm:flex-row", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
      "© ",
      (/* @__PURE__ */ new Date()).getFullYear(),
      " Atelier Studio - Approval workflow for modern agencies."
    ] }) }) })
  ] });
}
function Feature({
  icon: Icon,
  title,
  desc,
  className = "",
  light = false
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-3xl border p-7 transition hover:-translate-y-1 hover:shadow-xl ${className || "editorial-rule bg-card"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-grid h-11 w-11 place-items-center rounded-2xl ${light ? "bg-white/20 text-white" : "bg-foreground/5"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-4 font-display text-2xl", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mt-2 text-sm ${light ? "text-white/90" : "text-muted-foreground"}`, children: desc })
  ] });
}
function ContactSection() {
  const send = useServerFn(submitContact);
  const [form, setForm] = reactExports.useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [busy, setBusy] = reactExports.useState(false);
  const set = (k) => (e) => setForm((f) => ({
    ...f,
    [k]: e.target.value
  }));
  async function onSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Add your name and a short message.");
      return;
    }
    setBusy(true);
    try {
      await send({
        data: form
      });
      const text = `Hi Atelier, I'm ${form.name.trim()}.${form.email.trim() ? ` (${form.email.trim()})` : ""}

${form.message.trim()}`;
      window.open(waLink(text), "_blank", "noopener,noreferrer");
      toast.success("Thanks! Opening WhatsApp to finish the conversation ✨");
      setForm({
        name: "",
        email: "",
        phone: "",
        message: ""
      });
    } catch (err) {
      toast.error(err.message || "Couldn't send - please try again.");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { id: "contact", className: "scroll-mt-24 border-t editorial-rule", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 py-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-muted-foreground", children: "The last step" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mt-3 font-display text-4xl md:text-5xl", children: [
        "Let's get your campaigns ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-social-gradient", children: "approved" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-4 max-w-xl text-muted-foreground", children: "Tell us about your studio and we'll set you up. Prefer to chat? Scan the code and message us on WhatsApp in one tap." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-14 grid gap-6 md:grid-cols-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit, className: "rounded-3xl border editorial-rule bg-card p-7 md:col-span-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Name *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.name, onChange: set("name"), required: true, placeholder: "Your name", className: "mt-1.5 w-full rounded-xl border editorial-rule bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Email" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.email, onChange: set("email"), type: "email", placeholder: "you@studio.com", className: "mt-1.5 w-full rounded-xl border editorial-rule bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-4 block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Phone" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.phone, onChange: set("phone"), placeholder: "+1 …", className: "mt-1.5 w-full rounded-xl border editorial-rule bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-4 block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Message *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: form.message, onChange: set("message"), required: true, rows: 4, placeholder: "What would you like to present to your clients?", className: "mt-1.5 w-full resize-none rounded-xl border editorial-rule bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: busy, className: "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50", children: busy ? "Sending…" : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          "Send & open WhatsApp ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-center text-xs text-muted-foreground", children: "We save your note and open WhatsApp so we can reply fast." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 md:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: waLink(WHATSAPP_PREFILL), target: "_blank", rel: "noopener noreferrer", className: "group flex flex-col items-center rounded-3xl border editorial-rule bg-card p-7 text-center transition hover:-translate-y-1 hover:shadow-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-3.5 w-3.5" }),
            " WhatsApp us"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-foreground/5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(QRCodeSVG, { value: waLink(WHATSAPP_PREFILL), size: 148, bgColor: "#ffffff", fgColor: "#0d0d0d", level: "M" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 font-display text-lg", children: "Scan to chat instantly" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Point your camera here - or tap on mobile." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl border editorial-rule bg-card p-6 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: CONTACT.address })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 space-y-2", children: CONTACT.phones.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `tel:${p.tel}`, className: "flex items-center gap-3 hover:text-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-4 w-4 shrink-0 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground", children: p.display }),
              " · ",
              p.label
            ] })
          ] }, p.tel)) })
        ] })
      ] })
    ] })
  ] }) });
}
function LivePhone() {
  const [platform, setPlatform] = reactExports.useState("instagram");
  const [tilt, setTilt] = reactExports.useState({
    rx: 5,
    ry: -12
  });
  const [interacted, setInteracted] = reactExports.useState(false);
  const [open, setOpen] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (interacted) return;
    const id = setInterval(() => {
      setPlatform((prev) => {
        const i = PLATFORMS.findIndex((p) => p.id === prev);
        return PLATFORMS[(i + 1) % PLATFORMS.length].id;
      });
    }, 2800);
    return () => clearInterval(id);
  }, [interacted]);
  function onMove(e) {
    setInteracted(true);
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({
      rx: -py * 14,
      ry: px * 20
    });
  }
  const reset = () => setTilt({
    rx: 5,
    ry: -12
  });
  const pick = (p) => {
    setInteracted(true);
    setPlatform(p);
  };
  const tap = (p) => {
    setInteracted(true);
    setOpen(p);
  };
  const posts = demoPosts.filter((p) => p.platform === platform);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap justify-center gap-1.5", children: PLATFORMS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => pick(p.id), className: `rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${platform === p.id ? "bg-foreground text-background" : "border editorial-rule text-muted-foreground hover:text-foreground"}`, children: p.label }, p.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      perspective: "1400px"
    }, onMouseMove: onMove, onMouseLeave: reset, className: "w-[300px] sm:w-[340px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
      transformStyle: "preserve-3d",
      transition: "transform .3s ease-out"
    }, className: "drop-shadow-[0_40px_70px_rgba(0,0,0,0.4)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PhonePreview, { platform, company: demoCompany, posts, highlights: demoHighlights, onTap: tap }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(MousePointerClick, { className: "h-3.5 w-3.5" }),
      " ",
      interacted ? "Tap any post, reel or video to review it" : "Auto-playing - tap a post to try the review flow"
    ] }),
    open && /* @__PURE__ */ jsxRuntimeExports.jsx(DemoViewer, { post: open, onClose: () => setOpen(null) })
  ] });
}
function DemoViewer({
  post,
  onClose
}) {
  function act(kind) {
    toast.success(kind === "approved" ? "Approved! ✨" : "Changes requested 📝", {
      description: "That's the whole flow - sign in to use it on your real campaigns."
    });
    onClose();
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-black text-white shadow-2xl", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 py-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs uppercase tracking-widest text-white/60", children: [
        post.platform,
        " · ",
        post.post_type
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center bg-black", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Media, { post, className: "max-h-[55vh] w-full object-contain", controls: post.media_type === "video", autoPlay: post.media_type === "video", loop: true, muted: false }) }),
    post.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-4 py-3 text-sm text-white/85", children: post.caption }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-white/10 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60", children: "✨ Demo - try it: approve or request changes." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => act("approved"), className: "flex-1 rounded-md bg-emerald-500 py-2.5 text-sm font-semibold", children: "Approve" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => act("changes"), className: "flex-1 rounded-md border border-white/25 py-2.5 text-sm font-semibold", children: "Request changes" })
      ] })
    ] })
  ] }) });
}
export {
  Index as component
};

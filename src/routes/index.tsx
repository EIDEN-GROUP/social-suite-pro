import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Heart,
  MessageCircle,
  Check,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  Star,
  MousePointerClick,
  ShieldCheck,
  X,
  Phone,
  MapPin,
  Send,
} from "lucide-react";
import { PhonePreview } from "@/components/PhonePreview";
import { Media } from "@/components/Media";
import { submitContact } from "@/lib/contact.functions";
import {
  PLATFORMS,
  type Platform,
  type Post,
  type PostType,
  type Company,
  type Highlight,
} from "@/lib/types";

// ---- Studio contact details ------------------------------------------------
const WHATSAPP_NUMBER = "212777777428"; // Morocco line - WhatsApp
const WHATSAPP_PREFILL =
  "Hi Atelier 👋 I'd like to see how the approval studio works for my agency.";
const waLink = (text: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
const CONTACT = {
  address: "Agadir Bay, Technopole 1 Bloc B, Agadir 80000",
  phones: [
    { label: "US / Canada", display: "+1 613 706 9011", tel: "+16137069011" },
    { label: "Morocco", display: "+212 7 77 77 74 28", tel: "+212777777428" },
  ],
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier - Where social campaigns get the green light" },
      {
        name: "description",
        content:
          "An editorial proofing room where agencies present Instagram, TikTok, Facebook, X & LinkedIn campaigns in true-to-life mockups - and clients approve them in one tap.",
      },
      { property: "og:title", content: "Atelier - Social Media Approval Studio" },
      {
        property: "og:description",
        content:
          "Present feed posts, reels, stories & timelines in real device mockups. Clients tap, react, approve. You ship faster.",
      },
    ],
  }),
  component: Index,
});

const PLATFORM_CHIPS = [
  { label: "Instagram", className: "ig-gradient text-white" },
  { label: "TikTok", className: "bg-black text-white" },
  { label: "Facebook", className: "bg-[#1877F2] text-white" },
  { label: "X", className: "bg-neutral-900 text-white" },
  { label: "LinkedIn", className: "bg-[#0A66C2] text-white" },
];

// ---- Demo content so visitors can play with every platform on the homepage ----
const demoCompany: Company = {
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
  cover_url: "https://picsum.photos/seed/ateliercover/1200/400",
};
let _n = 0;
const mk = (platform: Platform, post_type: PostType, seed: string, caption = ""): Post => ({
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
  created_at: "",
});
const demoPosts: Post[] = [
  ...Array.from({ length: 6 }).map((_, i) =>
    mk("instagram", "post", `igp${i}`, `Campaign frame ${i + 1} - autumn drop.`),
  ),
  mk("instagram", "reel", "igr1", "Behind the scenes 🎬"),
  mk("instagram", "reel", "igr2", "Launch teaser"),
  mk("instagram", "story", "igs1", "Weekend teaser"),
  ...["t1", "t2", "t3"].map((s) => mk("tiktok", "reel", s, "New drop just landed 🔥")),
  ...["f1", "f2"].map((s) => mk("facebook", "post", s, "Big news for our community today.")),
  ...["x1", "x2", "x3"].map((s) => mk("twitter", "post", s, "Shipping something special today.")),
  ...["l1", "l2"].map((s) =>
    mk("linkedin", "post", s, "We're proud to announce our latest campaign."),
  ),
];
const demoHighlights: Highlight[] = [
  {
    id: "h1",
    company_id: "demo",
    label: "Launch",
    emoji: "🚀",
    image: "https://picsum.photos/seed/hll/200/200",
    position: 0,
    created_at: "",
  },
  {
    id: "h2",
    company_id: "demo",
    label: "BTS",
    emoji: "🎬",
    image: "https://picsum.photos/seed/hlb/200/200",
    position: 1,
    created_at: "",
  },
  {
    id: "h3",
    company_id: "demo",
    label: "Press",
    emoji: "📰",
    image: null,
    position: 2,
    created_at: "",
  },
];

function Index() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      {/* animated background blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="animate-blob absolute -left-24 -top-24 h-[36vw] w-[36vw] rounded-full opacity-30 blur-[120px]"
          style={{ background: "linear-gradient(135deg,#f09433,#dc2743,#bc1888)" }}
        />
        <div
          className="animate-blob absolute right-[-10%] top-[10%] h-[30vw] w-[30vw] rounded-full opacity-25 blur-[120px] [animation-delay:-6s]"
          style={{ background: "linear-gradient(135deg,#405de6,#1877f2)" }}
        />
        <div
          className="animate-blob absolute bottom-[-10%] left-[30%] h-[28vw] w-[28vw] rounded-full opacity-20 blur-[120px] [animation-delay:-12s]"
          style={{ background: "linear-gradient(135deg,#22c55e,#06b6d4)" }}
        />
      </div>

      {/* Nav */}
      <header className="glass sticky top-0 z-50 border-b editorial-rule">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-display text-2xl tracking-tight">
            <span className="ig-gradient inline-grid h-7 w-7 place-items-center rounded-lg text-sm font-bold text-white">
              A
            </span>
            Atelier
          </div>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#platforms" className="hover:text-foreground">
              Platforms
            </a>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <a
              href="#contact"
              className="rounded-full bg-foreground px-5 py-2 font-medium text-background transition hover:opacity-90"
            >
              Get a demo
            </a>
          </div>
        </div>
      </header>

      {/* Hero - copy on the left, the live phone preview on the right */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pt-16 md:pt-24 lg:grid-cols-2 lg:gap-8">
        {/* Left: headline + copy + CTAs */}
        <div className="text-center lg:text-left">
          <span className="animate-rise inline-flex items-center gap-2 rounded-full border editorial-rule bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> The approval room agencies actually enjoy
          </span>
          <h1 className="animate-rise mt-6 font-display text-5xl leading-[0.95] sm:text-6xl md:text-7xl">
            Get campaigns{" "}
            <span className="inline-block -rotate-2 bg-yellow-300 px-3 py-0.5 font-display text-black shadow-lg">
              approved
            </span>{" "}
            without the chaos.
          </h1>
          <p className="animate-rise mx-auto mt-7 max-w-xl text-lg text-muted-foreground lg:mx-0">
            Present feed posts, reels, stories &amp; timelines in true-to-life mockups. Clients tap,
            react, approve - no logins, no endless email threads.
          </p>
          <div className="animate-rise mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-bold text-background transition hover:scale-105"
            >
              Book a demo
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border editorial-rule px-7 py-3.5 text-sm font-semibold transition hover:bg-foreground/[0.03]"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Right: live phone with floating cards */}
        <div className="relative flex justify-center pb-4">
          <div className="animate-float-slow absolute left-0 top-16 z-10 hidden rounded-2xl border editorial-rule bg-card p-3 text-left shadow-xl sm:block">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white">
                <Check className="h-4 w-4" />
              </span>
              <div className="text-xs">
                <div className="font-semibold">Approved</div>
                <div className="text-muted-foreground">Reel · 12s ago</div>
              </div>
            </div>
          </div>
          <div className="animate-float absolute right-0 top-36 z-10 hidden rounded-2xl border editorial-rule bg-card p-3 text-left shadow-xl sm:block [animation-delay:-3s]">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-rose-500 text-white">
                <MessageCircle className="h-4 w-4" />
              </span>
              <div className="text-xs">
                <div className="font-semibold">“Brighten the logo?”</div>
                <div className="text-muted-foreground">Client comment</div>
              </div>
            </div>
          </div>
          <LivePhone />
        </div>
      </section>

      {/* Marquee */}
      <div className="relative overflow-hidden border-y editorial-rule bg-foreground py-3 text-background">
        <div className="animate-marquee flex w-max gap-10 whitespace-nowrap text-sm uppercase tracking-[0.3em]">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k} className="flex gap-10">
              {[
                "Instagram",
                "·",
                "TikTok",
                "·",
                "Facebook",
                "·",
                "X",
                "·",
                "LinkedIn",
                "·",
                "Stories",
                "·",
                "Reels",
                "·",
                "Carousels",
                "·",
                "One-tap approve",
                "·",
              ].map((t, i) => (
                <span key={i} className="opacity-80">
                  {t}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">In three taps</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">
            From draft to <span className="text-social-gradient">green light</span>
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Upload",
              d: "Drop media, write captions, pick the post type for each platform.",
              icon: Zap,
              grad: "from-amber-400 to-orange-500",
            },
            {
              n: "02",
              t: "Preview",
              d: "Clients see exactly what they'll see - pixel-true device frames.",
              icon: MousePointerClick,
              grad: "from-fuchsia-500 to-purple-600",
            },
            {
              n: "03",
              t: "Approve",
              d: "One tap to approve, or reject with a comment. You see it live.",
              icon: Check,
              grad: "from-emerald-400 to-teal-500",
            },
          ].map((s) => (
            <article
              key={s.n}
              className="group rounded-3xl border editorial-rule bg-card p-7 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className={`inline-grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${s.grad} text-white`}
              >
                <s.icon className="h-6 w-6" />
              </div>
              <div className="mt-5 font-display text-3xl text-muted-foreground">{s.n}</div>
              <h3 className="mt-1 font-display text-2xl">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </article>
          ))}
        </div>
        <div className="mt-12 text-center">
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-bold text-background transition hover:scale-105"
          >
            Set up my approval room
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      {/* Platforms */}
      <section id="platforms" className="mx-auto max-w-6xl px-6 pb-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Every channel, true to life
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {PLATFORM_CHIPS.map((p) => (
            <span
              key={p.label}
              className={`rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition hover:scale-105 ${p.className}`}
            >
              {p.label}
            </span>
          ))}
        </div>
        <div className="mt-8">
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
          >
            See it with your branding
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      {/* Features bento */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          <Feature
            className="md:col-span-2 ig-gradient text-white"
            icon={Sparkles}
            title="True-to-life mockups"
            desc="Instagram grids, reels, stories, TikTok, Facebook & LinkedIn pages - your client sees the real thing, branded to them."
            light
          />
          <Feature
            icon={Clock}
            title="Real-time decisions"
            desc="Approvals and comments land in your studio the instant a client taps."
          />
          <Feature
            icon={ShieldCheck}
            title="No client login"
            desc="Share a link + password. Clients review in seconds - zero friction."
          />
          <Feature
            icon={Check}
            title="One-tap approve"
            desc="Or reject with a comment. Every status tracked at a glance."
          />
          <Feature
            icon={Heart}
            title="Made to feel good"
            desc="A playful, native-feeling space that clients actually want to open."
          />
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#contact"
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-bold text-background transition hover:scale-105"
          >
            Start getting approvals
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </a>
          <a
            href="#how"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            See how it works again
          </a>
        </div>
      </section>

      {/* CTA - emotional peak that hands off to the contact step */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="ig-gradient relative overflow-hidden rounded-[2rem] px-8 py-16 text-center text-white shadow-2xl">
          <div
            aria-hidden
            className="animate-spin-slow absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/20"
          />
          <div
            aria-hidden
            className="animate-spin-slow absolute -bottom-24 -left-16 h-72 w-72 rounded-full border border-white/20"
          />
          <h2 className="relative font-display text-4xl md:text-6xl">Make approvals fun.</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/90">
            Ship campaigns faster with a proofing room your clients love to open.
          </p>
          <a
            href="#contact"
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-neutral-900 transition hover:scale-105"
          >
            Talk to us <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Action - the conversion step: form + one-scan WhatsApp */}
      <ContactSection />

      <footer className="border-t editorial-rule">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} Atelier Studio - Approval workflow for modern agencies.
          </span>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
  className = "",
  light = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  className?: string;
  light?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-7 transition hover:-translate-y-1 hover:shadow-xl ${className || "editorial-rule bg-card"}`}
    >
      <span
        className={`inline-grid h-11 w-11 place-items-center rounded-2xl ${light ? "bg-white/20 text-white" : "bg-foreground/5"}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display text-2xl">{title}</h3>
      <p className={`mt-2 text-sm ${light ? "text-white/90" : "text-muted-foreground"}`}>{desc}</p>
    </div>
  );
}

/** Action stage - capture the lead AND open a WhatsApp chat in one move. */
function ContactSection() {
  const send = useServerFn(submitContact);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("Add your name and a short message.");
      return;
    }
    setBusy(true);
    try {
      // 1) Save the lead so nothing is ever lost…
      await send({ data: form });
      // 2) …then hand off to WhatsApp with the message pre-written.
      const text = `Hi Atelier, I'm ${form.name.trim()}.${form.email.trim() ? ` (${form.email.trim()})` : ""}\n\n${form.message.trim()}`;
      window.open(waLink(text), "_blank", "noopener,noreferrer");
      toast.success("Thanks! Opening WhatsApp to finish the conversation ✨");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast.error((err as Error).message || "Couldn't send - please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="contact" className="scroll-mt-24 border-t editorial-rule">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">The last step</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">
            Let&apos;s get your campaigns <span className="text-social-gradient">approved</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Tell us about your studio and we&apos;ll set you up. Prefer to chat? Scan the code and
            message us on WhatsApp in one tap.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-5">
          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border editorial-rule bg-card p-7 md:col-span-3"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Name *
                </span>
                <input
                  value={form.name}
                  onChange={set("name")}
                  required
                  placeholder="Your name"
                  className="mt-1.5 w-full rounded-xl border editorial-rule bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Email
                </span>
                <input
                  value={form.email}
                  onChange={set("email")}
                  type="email"
                  placeholder="you@studio.com"
                  className="mt-1.5 w-full rounded-xl border editorial-rule bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground"
                />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Phone</span>
              <input
                value={form.phone}
                onChange={set("phone")}
                placeholder="+1 …"
                className="mt-1.5 w-full rounded-xl border editorial-rule bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Message *
              </span>
              <textarea
                value={form.message}
                onChange={set("message")}
                required
                rows={4}
                placeholder="What would you like to present to your clients?"
                className="mt-1.5 w-full resize-none rounded-xl border editorial-rule bg-background px-3.5 py-2.5 text-sm outline-none focus:border-foreground"
              />
            </label>
            <button
              disabled={busy}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? (
                "Sending…"
              ) : (
                <>
                  Send &amp; open WhatsApp <Send className="h-4 w-4" />
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              We save your note and open WhatsApp so we can reply fast.
            </p>
          </form>

          {/* WhatsApp QR + details */}
          <div className="flex flex-col gap-6 md:col-span-2">
            <a
              href={waLink(WHATSAPP_PREFILL)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center rounded-3xl border editorial-rule bg-card p-7 text-center transition hover:-translate-y-1 hover:shadow-xl"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp us
              </span>
              <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-foreground/5">
                <QRCodeSVG
                  value={waLink(WHATSAPP_PREFILL)}
                  size={148}
                  bgColor="#ffffff"
                  fgColor="#0d0d0d"
                  level="M"
                />
              </div>
              <p className="mt-4 font-display text-lg">Scan to chat instantly</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Point your camera here - or tap on mobile.
              </p>
            </a>

            <div className="rounded-3xl border editorial-rule bg-card p-6 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{CONTACT.address}</span>
              </div>
              <div className="mt-3 space-y-2">
                {CONTACT.phones.map((p) => (
                  <a
                    key={p.tel}
                    href={`tel:${p.tel}`}
                    className="flex items-center gap-3 hover:text-foreground"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      <span className="text-foreground">{p.display}</span> · {p.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Interactive 3D phone - auto-rotates platforms until the visitor interacts. */
function LivePhone() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [tilt, setTilt] = useState({ rx: 5, ry: -12 });
  const [interacted, setInteracted] = useState(false);
  const [open, setOpen] = useState<Post | null>(null);

  // Auto-cycle platforms until the visitor touches it.
  useEffect(() => {
    if (interacted) return;
    const id = setInterval(() => {
      setPlatform((prev) => {
        const i = PLATFORMS.findIndex((p) => p.id === prev);
        return PLATFORMS[(i + 1) % PLATFORMS.length].id;
      });
    }, 2800);
    return () => clearInterval(id);
  }, [interacted]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    setInteracted(true);
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * 14, ry: px * 20 });
  }
  const reset = () => setTilt({ rx: 5, ry: -12 });
  const pick = (p: Platform) => {
    setInteracted(true);
    setPlatform(p);
  };
  const tap = (p: Post) => {
    setInteracted(true);
    setOpen(p);
  };

  const posts = demoPosts.filter((p) => p.platform === platform);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap justify-center gap-1.5">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => pick(p.id)}
            className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${platform === p.id ? "bg-foreground text-background" : "border editorial-rule text-muted-foreground hover:text-foreground"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div
        style={{ perspective: "1400px" }}
        onMouseMove={onMove}
        onMouseLeave={reset}
        className="w-[300px] sm:w-[340px]"
      >
        <div
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transformStyle: "preserve-3d",
            transition: "transform .3s ease-out",
          }}
          className="drop-shadow-[0_40px_70px_rgba(0,0,0,0.4)]"
        >
          <PhonePreview
            platform={platform}
            company={demoCompany}
            posts={posts}
            highlights={demoHighlights}
            onTap={tap}
          />
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MousePointerClick className="h-3.5 w-3.5" />{" "}
        {interacted
          ? "Tap any post, reel or video to review it"
          : "Auto-playing - tap a post to try the review flow"}
      </p>

      {open && <DemoViewer post={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

/** Lets homepage visitors open any campaign and try the approve/reject flow. */
function DemoViewer({ post, onClose }: { post: Post; onClose: () => void }) {
  function act(kind: "approved" | "changes") {
    toast.success(kind === "approved" ? "Approved! ✨" : "Changes requested 📝", {
      description: "That's the whole flow - sign in to use it on your real campaigns.",
    });
    onClose();
  }
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-black text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs uppercase tracking-widest text-white/60">
            {post.platform} · {post.post_type}
          </span>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center justify-center bg-black">
          <Media
            post={post}
            className="max-h-[55vh] w-full object-contain"
            controls={post.media_type === "video"}
            autoPlay={post.media_type === "video"}
            loop
            muted={false}
          />
        </div>
        {post.caption && <p className="px-4 py-3 text-sm text-white/85">{post.caption}</p>}
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60">
            ✨ Demo - try it: approve or request changes.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => act("approved")}
              className="flex-1 rounded-md bg-emerald-500 py-2.5 text-sm font-semibold"
            >
              Approve
            </button>
            <button
              onClick={() => act("changes")}
              className="flex-1 rounded-md border border-white/25 py-2.5 text-sm font-semibold"
            >
              Request changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

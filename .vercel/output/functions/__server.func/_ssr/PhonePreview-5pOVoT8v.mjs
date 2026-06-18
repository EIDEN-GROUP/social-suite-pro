import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { M as Media } from "./types-CQzXJOzH.mjs";
import { o as Plus, G as Grid3x3, F as Film, U as UserCheck, h as Play, I as Images, E as Ellipsis, k as ThumbsUp, M as MessageCircle, d as Send, R as Repeat2, H as Heart } from "../_libs/lucide-react.mjs";
function statusRing(status) {
  if (status === "approved") return "ring-2 ring-emerald-500";
  if (status === "rejected") return "ring-2 ring-rose-500";
  return "ring-1 ring-foreground/10";
}
function PhoneFrame({ children }) {
  const frameRef = reactExports.useRef(null);
  const [shine, setShine] = reactExports.useState({ x: 50, y: 50 });
  reactExports.useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * 100;
      const y = (e.clientY - r.top) / r.height * 100;
      setShine({ x, y });
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: frameRef,
      className: "relative mx-auto w-full max-w-[340px]",
      style: {
        filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.3)) drop-shadow(0 10px 20px rgba(0,0,0,0.15))"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "relative overflow-hidden",
            style: {
              borderRadius: "52px",
              padding: "12px",
              background: "linear-gradient(145deg, #3a3a3c, #1c1c1e 40%, #2c2c2e 60%, #3a3a3c)",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.5)"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 z-30 rounded-[44px] border-2 border-white/10" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: "relative overflow-hidden bg-background",
                  style: { borderRadius: "40px", aspectRatio: "9 / 19.5" },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-1/2 top-2 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-black" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 overflow-y-auto pb-2 pt-8 text-foreground", children }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        "aria-hidden": true,
                        className: "pointer-events-none absolute inset-0 z-10",
                        style: {
                          background: `radial-gradient(240px circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.18), transparent 55%)`
                        }
                      }
                    )
                  ]
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-[-3px] top-[100px] h-10 w-[3px] rounded-r bg-gradient-to-b from-[#3a3a3c] to-[#2c2c2e] shadow-sm" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-[-3px] top-[140px] h-14 w-[3px] rounded-r bg-gradient-to-b from-[#3a3a3c] to-[#2c2c2e] shadow-sm" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-[-3px] top-[130px] h-12 w-[3px] rounded-l bg-gradient-to-b from-[#3a3a3c] to-[#2c2c2e] shadow-sm" })
      ]
    }
  );
}
function PhonePreview({ platform, company, posts, highlights = [], onTap }) {
  const [lightbox, setLightbox] = reactExports.useState(null);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(PhoneFrame, { children: [
    platform === "instagram" && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Instagram,
      {
        company,
        posts,
        highlights,
        onTap,
        onHighlight: setLightbox
      }
    ),
    platform === "tiktok" && /* @__PURE__ */ jsxRuntimeExports.jsx(TikTok, { company, posts, onTap }),
    platform === "facebook" && /* @__PURE__ */ jsxRuntimeExports.jsx(Facebook, { company, posts, onTap }),
    platform === "twitter" && /* @__PURE__ */ jsxRuntimeExports.jsx(Twitter, { company, posts, onTap }),
    platform === "linkedin" && /* @__PURE__ */ jsxRuntimeExports.jsx(LinkedIn, { company, posts, onTap }),
    lightbox && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "absolute inset-0 z-30 flex flex-col bg-black text-white",
        onClick: () => setLightbox(null),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-3 pb-2 pt-8 text-xs text-white/70", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setLightbox(null), children: "✕" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: lightbox.label || "Highlight" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-3" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1 items-center justify-center p-3", children: lightbox.image ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: lightbox.image, className: "max-h-full max-w-full object-contain" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-6xl", children: lightbox.emoji || "○" }) })
        ]
      }
    )
  ] });
}
function Avatar({ company, size = 32 }) {
  return company.profile_pic_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(
    "img",
    {
      src: company.profile_pic_url,
      alt: company.name,
      width: size,
      height: size,
      className: "rounded-full object-cover",
      style: { width: size, height: size }
    }
  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "flex items-center justify-center rounded-full bg-foreground/10 text-[10px] uppercase tracking-wider",
      style: { width: size, height: size },
      children: company.name.slice(0, 2)
    }
  );
}
function StoryRing({
  children,
  accent,
  active
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "span",
    {
      className: "grid place-items-center rounded-full p-[2px]",
      style: active ? { background: `linear-gradient(45deg, ${accent}, #f59e0b, #ef4444)` } : { background: "transparent", boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.12)" },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid place-items-center rounded-full bg-background p-[2px]", children })
    }
  );
}
function Instagram({
  company,
  posts,
  highlights,
  onTap,
  onHighlight
}) {
  const accent = company.accent_color || "#0d0d0d";
  const [tab, setTab] = reactExports.useState("posts");
  const stories = posts.filter((p) => p.post_type === "story");
  const gridPosts = posts.filter((p) => p.post_type === "post" || p.post_type === "carousel").slice(0, 17);
  const reels = posts.filter((p) => p.post_type === "reel").slice(0, 17);
  const list = tab === "posts" ? gridPosts : reels;
  const minCells = tab === "posts" ? 9 : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-3 pb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: company.username || company.slug }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-5 w-5" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 px-3 py-3", children: [
      stories.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onTap?.(stories[0]), title: "View story", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StoryRing, { accent, active: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { company, size: 58 }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { company, size: 64 }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 justify-around text-center text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-base font-semibold", children: gridPosts.length }),
          "posts"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-base font-semibold", children: company.followers || "0" }),
          "followers"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-base font-semibold", children: company.following || 0 }),
          "following"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 pb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold", children: company.name }),
      company.category && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: company.category }),
      company.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 whitespace-pre-line text-xs", children: company.bio }),
      company.link && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs font-medium", style: { color: accent }, children: company.link.replace(/^https?:\/\//, "") })
    ] }),
    highlights.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-3 overflow-x-auto px-3 pb-3", children: highlights.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => onHighlight?.(h),
        className: "flex w-14 shrink-0 flex-col items-center gap-1",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "grid h-12 w-12 place-items-center overflow-hidden rounded-full p-[2px]",
              style: { boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.12)" },
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-full w-full place-items-center overflow-hidden rounded-full bg-foreground/5", children: h.image ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: h.image, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg", children: h.emoji || "○" }) })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-[56px] truncate text-[10px] text-muted-foreground", children: h.label })
        ]
      },
      h.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex border-t border-foreground/10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setTab("posts"),
          className: `flex flex-1 justify-center border-b-2 py-2 ${tab === "posts" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Grid3x3, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setTab("reels"),
          className: `flex flex-1 justify-center border-b-2 py-2 ${tab === "reels" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`,
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Film, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "flex flex-1 justify-center border-b-2 border-transparent py-2 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { className: "h-4 w-4" }) })
    ] }),
    list.length === 0 && minCells === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-10 text-center text-[10px] text-muted-foreground", children: [
      "No ",
      tab,
      " yet."
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-0.5", children: Array.from({ length: Math.max(list.length, minCells) }).map((_, i) => {
      const p = list[i];
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => p && onTap?.(p),
          className: `relative aspect-square overflow-hidden bg-foreground/5 ${p ? statusRing(p.status) : ""}`,
          children: [
            p?.media_url ? /* @__PURE__ */ jsxRuntimeExports.jsx(Media, { post: p, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center text-[10px] text-foreground/30", children: i + 1 }),
            p?.post_type === "reel" && /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "absolute right-1 top-1 h-3 w-3 fill-white text-white drop-shadow" }),
            p?.post_type === "carousel" && /* @__PURE__ */ jsxRuntimeExports.jsx(Images, { className: "absolute right-1 top-1 h-3 w-3 text-white drop-shadow" })
          ]
        },
        p?.id ?? i
      );
    }) })
  ] });
}
function BizHeader({
  company,
  variant
}) {
  const accent = company.accent_color || "#1d4ed8";
  const followers = company.followers || "0";
  const following = company.following ?? 0;
  const linkText = company.link?.replace(/^https?:\/\//, "");
  const cover = company.cover_url;
  const bannerStyle = (gradient) => cover ? { backgroundImage: `url(${cover})` } : { background: gradient };
  if (variant === "twitter") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 bg-cover bg-center", style: bannerStyle(accent) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "-mt-6 flex items-end justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full ring-4 ring-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { company, size: 48 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "mb-1 rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background", children: "Follow" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-sm font-bold leading-tight", children: company.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "@",
          company.username || company.slug
        ] }),
        company.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs", children: company.bio }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex gap-3 pb-2 text-[11px]", children: [
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
    ] });
  }
  if (variant === "facebook") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "h-14 bg-cover bg-center",
          style: bannerStyle(`linear-gradient(135deg, ${accent}, ${accent}88)`)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 pb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "-mt-6 block w-fit rounded-full ring-4 ring-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { company, size: 56 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-base font-bold", children: company.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
          company.category || "Business",
          " · ",
          followers,
          " followers"
        ] }),
        company.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs", children: company.bio }),
        linkText && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-medium", style: { color: accent }, children: linkText }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "flex-1 rounded py-1 text-xs font-semibold text-white",
              style: { background: accent },
              children: "＋ Follow"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "flex-1 rounded bg-foreground/5 py-1 text-xs font-semibold", children: "Message" })
        ] })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "h-12 bg-cover bg-center",
        style: bannerStyle(`linear-gradient(135deg, ${accent}, ${accent}88)`)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 pb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "-mt-6 grid h-14 w-14 place-items-center overflow-hidden rounded-md bg-foreground/10 text-[10px] uppercase ring-4 ring-background", children: company.profile_pic_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: company.profile_pic_url, className: "h-full w-full object-cover" }) : company.name.slice(0, 2) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-base font-bold leading-tight", children: company.name }),
      company.category && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: company.category }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
        followers,
        " followers"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "rounded-full px-4 py-1 text-xs font-semibold text-white",
            style: { background: accent },
            children: "＋ Follow"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "rounded-full border border-foreground/30 px-4 py-1 text-xs font-semibold", children: "Website" })
      ] })
    ] })
  ] });
}
function TikTok({
  company,
  posts,
  onTap
}) {
  const accent = company.accent_color || "#1d4ed8";
  const followers = company.followers || "0";
  const following = company.following ?? 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center px-3 pt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { company, size: 64 }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-sm font-semibold", children: [
        "@",
        company.username || company.slug
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-5 text-center text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: following }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "Following" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: followers }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "Followers" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: posts.length }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "Videos" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "mt-2 rounded px-8 py-1 text-xs font-semibold text-white",
          style: { background: accent },
          children: "Follow"
        }
      ),
      company.category && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: company.category }),
      company.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-center text-xs", children: company.bio })
    ] }),
    posts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid grid-cols-3 gap-0.5", children: posts.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => onTap?.(p),
        className: `relative aspect-[9/14] overflow-hidden bg-black ${statusRing(p.status)}`,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Media, { post: p, className: "h-full w-full object-cover" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "absolute bottom-1 left-1 h-3 w-3 fill-white text-white drop-shadow" })
        ]
      },
      p.id
    )) })
  ] });
}
function Facebook({
  company,
  posts,
  onTap
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(BizHeader, { company, variant: "facebook" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 px-3 pb-6 pt-3", children: [
      posts.slice(0, 5).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => onTap?.(p),
          className: `block w-full rounded-md border border-foreground/10 bg-card text-left ${statusRing(p.status)}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { company, size: 36 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold", children: company.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: "Sponsored · 🌐" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "h-4 w-4" })
            ] }),
            p.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 pb-2 text-xs", children: p.caption }),
            p.media_url && /* @__PURE__ */ jsxRuntimeExports.jsx(Media, { post: p, className: "w-full", controls: true }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-around border-t border-foreground/10 p-2 text-[11px] text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ThumbsUp, { className: "h-3 w-3" }),
                " Like"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-3 w-3" }),
                " Comment"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-3 w-3" }),
                " Share"
              ] })
            ] })
          ]
        },
        p.id
      )),
      posts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, {})
    ] })
  ] });
}
function Twitter({
  company,
  posts,
  onTap
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(BizHeader, { company, variant: "twitter" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "divide-y divide-foreground/10 px-3 pb-6 pt-2", children: [
      posts.slice(0, 8).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => onTap?.(p),
          className: `flex w-full gap-2 py-3 text-left ${statusRing(p.status)} rounded`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { company, size: 36 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: company.name }),
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                  "@",
                  company.username || company.slug
                ] })
              ] }),
              p.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 whitespace-pre-line text-xs", children: p.caption }),
              p.media_url && /* @__PURE__ */ jsxRuntimeExports.jsx(Media, { post: p, className: "mt-2 rounded-xl border border-foreground/10", controls: true }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-6 text-[10px] text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-3 w-3" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Repeat2, { className: "h-3 w-3" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "h-3 w-3" })
              ] })
            ] })
          ]
        },
        p.id
      )),
      posts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, {})
    ] })
  ] });
}
function LinkedIn({
  company,
  posts,
  onTap
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(BizHeader, { company, variant: "linkedin" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 px-3 pb-6 pt-3", children: [
      posts.slice(0, 5).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => onTap?.(p),
          className: `block w-full rounded border border-foreground/10 bg-card text-left ${statusRing(p.status)}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { company, size: 36 }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold", children: company.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: "Promoted · 1h" })
              ] })
            ] }),
            p.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 pb-2 text-xs", children: p.caption }),
            p.media_url && /* @__PURE__ */ jsxRuntimeExports.jsx(Media, { post: p, className: "w-full", controls: true }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-around border-t border-foreground/10 p-2 text-[10px] text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ThumbsUp, { className: "h-3 w-3" }),
                " Like"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-3 w-3" }),
                " Comment"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-3 w-3" }),
                " Send"
              ] })
            ] })
          ]
        },
        p.id
      )),
      posts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, {})
    ] })
  ] });
}
function Empty() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-12 text-center text-xs text-muted-foreground", children: "Nothing here yet." });
}
export {
  PhonePreview as P
};

import { useState, useRef, useEffect } from "react";
import type { Company, Post, Platform, Highlight } from "@/lib/types";
import { Media } from "@/components/Media";
import {
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  Music2,
  Plus,
  Home,
  Search,
  PlaySquare,
  User,
  Play,
  Repeat2,
  ThumbsUp,
  Share2,
  Images,
  Grid3x3,
  Film,
  UserCheck,
} from "lucide-react";

function statusRing(status: string) {
  if (status === "approved") return "ring-2 ring-emerald-500";
  if (status === "rejected") return "ring-2 ring-rose-500";
  return "ring-1 ring-foreground/10";
}

interface Props {
  platform: Platform;
  company: Company;
  posts: Post[];
  highlights?: Highlight[];
  onTap?: (post: Post) => void;
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [shine, setShine] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      setShine({ x, y });
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative mx-auto w-full max-w-[340px]"
      style={{ filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.3)) drop-shadow(0 10px 20px rgba(0,0,0,0.15))" }}
    >
      {/* Outer bezel with realistic metallic gradient */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: "52px",
          padding: "12px",
          background: "linear-gradient(145deg, #3a3a3c, #1c1c1e 40%, #2c2c2e 60%, #3a3a3c)",
          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.5)",
        }}
      >
        {/* Inner rim highlight */}
        <div className="pointer-events-none absolute inset-0 z-30 rounded-[44px] border-2 border-white/10" />
        {/* Screen area */}
        <div
          className="relative overflow-hidden"
          style={{ borderRadius: "40px", aspectRatio: 9 / 19.5 }}
        >
          {/* Dynamic glass glare that follows mouse */}
          <div
            className="absolute inset-0 z-30 flex flex-col bg-black text-white"
            onClick={() => setLightbox(null)}
          >
            <div className="flex items-center justify-between px-3 pb-2 pt-8 text-xs text-white/70">
              <button onClick={() => setLightbox(null)}>✕</button>
              <span>{lightbox.label || "Highlight"}</span>
              <span className="w-3" />
            </div>
            <div className="flex flex-1 items-center justify-center p-3">
              {lightbox.image ? (
                <img src={lightbox.image} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-6xl">{lightbox.emoji || "○"}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Side buttons */}
      <div className="absolute right-[-3px] top-[100px] h-10 w-[3px] rounded-r bg-gradient-to-b from-[#3a3a3c] to-[#2c2c2e] shadow-sm" />
      <div className="absolute right-[-3px] top-[140px] h-14 w-[3px] rounded-r bg-gradient-to-b from-[#3a3a3c] to-[#2c2c2e] shadow-sm" />
      <div className="absolute left-[-3px] top-[130px] h-12 w-[3px] rounded-l bg-gradient-to-b from-[#3a3a3c] to-[#2c2c2e] shadow-sm" />
    </div>
  );
}

export function PhonePreview({ platform, company, posts, highlights = [], onTap }: Props) {
  const [lightbox, setLightbox] = useState<Highlight | null>(null);
  return (
    <PhoneFrame>
      {platform === "instagram" && <Instagram company={company} posts={posts} highlights={highlights} onTap={onTap} onHighlight={setLightbox} />}
      {platform === "tiktok" && <TikTok company={company} posts={posts} onTap={onTap} />}
      {platform === "facebook" && <Facebook company={company} posts={posts} onTap={onTap} />}
      {platform === "twitter" && <Twitter company={company} posts={posts} onTap={onTap} />}
      {platform === "linkedin" && <LinkedIn company={company} posts={posts} onTap={onTap} />}
      {lightbox && (
        <div className="absolute inset-0 z-30 flex flex-col bg-black text-white" onClick={() => setLightbox(null)}>
          <div className="flex items-center justify-between px-3 pb-2 pt-8 text-xs text-white/70">
            <button onClick={() => setLightbox(null)}>✕</button>
            <span>{lightbox.label || "Highlight"}</span>
            <span className="w-3" />
          </div>
          <div className="flex flex-1 items-center justify-center p-3">
            {lightbox.image ? <img src={lightbox.image} className="max-h-full max-w-full object-contain" /> : <span className="text-6xl">{lightbox.emoji || "○"}</span>}
          </div>
        </div>
      )}
    </PhoneFrame>
  );
}

function Avatar({ company, size = 32 }: { company: Company; size?: number }) {
  return company.profile_pic_url ? (
    <img
      src={company.profile_pic_url}
      alt={company.name}
      width={size}
      height={size}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="flex items-center justify-center rounded-full bg-foreground/10 text-[10px] uppercase tracking-wider"
      style={{ width: size, height: size }}
    >
      {company.name.slice(0, 2)}
    </div>
  );
}

function StoryRing({
  children,
  accent,
  active,
}: {
  children: React.ReactNode;
  accent: string;
  active?: boolean;
}) {
  return (
    <span
      className="grid place-items-center rounded-full p-[2px]"
      style={
        active
          ? { background: `linear-gradient(45deg, ${accent}, #f59e0b, #ef4444)` }
          : { background: "transparent", boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.12)" }
      }
    >
      <span className="grid place-items-center rounded-full bg-background p-[2px]">{children}</span>
    </span>
  );
}

function Instagram({
  company,
  posts,
  highlights,
  onTap,
  onHighlight,
}: {
  company: Company;
  posts: Post[];
  highlights: Highlight[];
  onTap?: (p: Post) => void;
  onHighlight?: (h: Highlight) => void;
}) {
  const accent = company.accent_color || "#0d0d0d";
  const [tab, setTab] = useState<"posts" | "reels">("posts");

  const stories = posts.filter((p) => p.post_type === "story");
  const gridPosts = posts
    .filter((p) => p.post_type === "post" || p.post_type === "carousel")
    .slice(0, 17);
  const reels = posts.filter((p) => p.post_type === "reel").slice(0, 17);
  const list = tab === "posts" ? gridPosts : reels;
  const minCells = tab === "posts" ? 9 : 0;

  return (
    <div className="text-sm">
      <div className="flex items-center justify-between px-3 pb-2">
        <span className="font-semibold">{company.username || company.slug}</span>
        <Plus className="h-5 w-5" />
      </div>
      <div className="flex items-center gap-4 px-3 py-3">
        {/* Active stories ring the profile avatar (tap to view) */}
        {stories.length > 0 ? (
          <button onClick={() => onTap?.(stories[0])} title="View story">
            <StoryRing accent={accent} active>
              <Avatar company={company} size={58} />
            </StoryRing>
          </button>
        ) : (
          <Avatar company={company} size={64} />
        )}
        <div className="flex flex-1 justify-around text-center text-xs">
          <div>
            <div className="text-base font-semibold">{gridPosts.length}</div>posts
          </div>
          <div>
            <div className="text-base font-semibold">{company.followers || "0"}</div>followers
          </div>
          <div>
            <div className="text-base font-semibold">{company.following || 0}</div>following
          </div>
        </div>
      </div>
      <div className="px-3 pb-3">
        <div className="text-xs font-semibold">{company.name}</div>
        {company.category && (
          <div className="text-xs text-muted-foreground">{company.category}</div>
        )}
        {company.bio && <div className="mt-0.5 whitespace-pre-line text-xs">{company.bio}</div>}
        {company.link && (
          <div className="mt-0.5 text-xs font-medium" style={{ color: accent }}>
            {company.link.replace(/^https?:\/\//, "")}
          </div>
        )}
      </div>

      {highlights.length > 0 && (
        <div className="flex gap-3 overflow-x-auto px-3 pb-3">
          {highlights.map((h) => (
            <button
              key={h.id}
              onClick={() => onHighlight?.(h)}
              className="flex w-14 shrink-0 flex-col items-center gap-1"
            >
              <span
                className="grid h-12 w-12 place-items-center overflow-hidden rounded-full p-[2px]"
                style={{ boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.12)" }}
              >
                <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-foreground/5">
                  {h.image ? (
                    <img src={h.image} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg">{h.emoji || "○"}</span>
                  )}
                </span>
              </span>
              <span className="max-w-[56px] truncate text-[10px] text-muted-foreground">
                {h.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Instagram tabs - Posts and Reels are separated, never mixed */}
      <div className="flex border-t border-foreground/10">
        <button
          onClick={() => setTab("posts")}
          className={`flex flex-1 justify-center border-b-2 py-2 ${tab === "posts" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}
        >
          <Grid3x3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTab("reels")}
          className={`flex flex-1 justify-center border-b-2 py-2 ${tab === "reels" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}
        >
          <Film className="h-4 w-4" />
        </button>
        <button className="flex flex-1 justify-center border-b-2 border-transparent py-2 text-muted-foreground">
          <UserCheck className="h-4 w-4" />
        </button>
      </div>

      {list.length === 0 && minCells === 0 ? (
        <div className="py-10 text-center text-[10px] text-muted-foreground">No {tab} yet.</div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {Array.from({ length: Math.max(list.length, minCells) }).map((_, i) => {
            const p = list[i];
            return (
              <button
                key={p?.id ?? i}
                onClick={() => p && onTap?.(p)}
                className={`relative aspect-square overflow-hidden bg-foreground/5 ${p ? statusRing(p.status) : ""}`}
              >
                {p?.media_url ? (
                  <Media post={p} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground/30">
                    {i + 1}
                  </div>
                )}
                {p?.post_type === "reel" && (
                  <Play className="absolute right-1 top-1 h-3 w-3 fill-white text-white drop-shadow" />
                )}
                {p?.post_type === "carousel" && (
                  <Images className="absolute right-1 top-1 h-3 w-3 text-white drop-shadow" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BizHeader({
  company,
  variant,
}: {
  company: Company;
  variant: "facebook" | "twitter" | "linkedin";
}) {
  const accent = company.accent_color || "#1d4ed8";
  const followers = company.followers || "0";
  const following = company.following ?? 0;
  const linkText = company.link?.replace(/^https?:\/\//, "");
  const cover = company.cover_url;
  const bannerStyle = (gradient: string) =>
    cover ? { backgroundImage: `url(${cover})` } : { background: gradient };

  if (variant === "twitter") {
    return (
      <div className="bg-background">
        <div className="h-14 bg-cover bg-center" style={bannerStyle(accent)} />
        <div className="px-3">
          <div className="-mt-6 flex items-end justify-between">
            <span className="rounded-full ring-4 ring-background">
              <Avatar company={company} size={48} />
            </span>
            <button className="mb-1 rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background">
              Follow
            </button>
          </div>
          <div className="mt-1 text-sm font-bold leading-tight">{company.name}</div>
          <div className="text-xs text-muted-foreground">@{company.username || company.slug}</div>
          {company.bio && <div className="mt-1 text-xs">{company.bio}</div>}
          <div className="mt-1 flex gap-3 pb-2 text-[11px]">
            <span>
              <b>{following}</b> <span className="text-muted-foreground">Following</span>
            </span>
            <span>
              <b>{followers}</b> <span className="text-muted-foreground">Followers</span>
            </span>
          </div>
        </div>
      </div>
    );
  }
  if (variant === "facebook") {
    return (
      <div className="bg-background">
        <div
          className="h-14 bg-cover bg-center"
          style={bannerStyle(`linear-gradient(135deg, ${accent}, ${accent}88)`)}
        />
        <div className="px-3 pb-2">
          <span className="-mt-6 block w-fit rounded-full ring-4 ring-background">
            <Avatar company={company} size={56} />
          </span>
          <div className="mt-1 text-base font-bold">{company.name}</div>
          <div className="text-[11px] text-muted-foreground">
            {company.category || "Business"} · {followers} followers
          </div>
          {company.bio && <div className="mt-1 text-xs">{company.bio}</div>}
          {linkText && (
            <div className="text-[11px] font-medium" style={{ color: accent }}>
              {linkText}
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <button
              className="flex-1 rounded py-1 text-xs font-semibold text-white"
              style={{ background: accent }}
            >
              ＋ Follow
            </button>
            <button className="flex-1 rounded bg-foreground/5 py-1 text-xs font-semibold">
              Message
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-background">
      <div
        className="h-12 bg-cover bg-center"
        style={bannerStyle(`linear-gradient(135deg, ${accent}, ${accent}88)`)}
      />
      <div className="px-3 pb-2">
        <span className="-mt-6 grid h-14 w-14 place-items-center overflow-hidden rounded-md bg-foreground/10 text-[10px] uppercase ring-4 ring-background">
          {company.profile_pic_url ? (
            <img src={company.profile_pic_url} className="h-full w-full object-cover" />
          ) : (
            company.name.slice(0, 2)
          )}
        </span>
        <div className="mt-1 text-base font-bold leading-tight">{company.name}</div>
        {company.category && (
          <div className="text-xs text-muted-foreground">{company.category}</div>
        )}
        <div className="text-[11px] text-muted-foreground">{followers} followers</div>
        <div className="mt-2 flex gap-2">
          <button
            className="rounded-full px-4 py-1 text-xs font-semibold text-white"
            style={{ background: accent }}
          >
            ＋ Follow
          </button>
          <button className="rounded-full border border-foreground/30 px-4 py-1 text-xs font-semibold">
            Website
          </button>
        </div>
      </div>
    </div>
  );
}

function TikTok({
  company,
  posts,
  onTap,
}: {
  company: Company;
  posts: Post[];
  onTap?: (p: Post) => void;
}) {
  const accent = company.accent_color || "#1d4ed8";
  const followers = company.followers || "0";
  const following = company.following ?? 0;
  return (
    <div className="text-sm">
      <div className="flex flex-col items-center px-3 pt-3">
        <Avatar company={company} size={64} />
        <div className="mt-1 text-sm font-semibold">@{company.username || company.slug}</div>
        <div className="mt-2 flex gap-5 text-center text-xs">
          <div>
            <div className="font-bold">{following}</div>
            <div className="text-muted-foreground">Following</div>
          </div>
          <div>
            <div className="font-bold">{followers}</div>
            <div className="text-muted-foreground">Followers</div>
          </div>
          <div>
            <div className="font-bold">{posts.length}</div>
            <div className="text-muted-foreground">Videos</div>
          </div>
        </div>
        <button
          className="mt-2 rounded px-8 py-1 text-xs font-semibold text-white"
          style={{ background: accent }}
        >
          Follow
        </button>
        {company.category && (
          <div className="mt-1 text-xs text-muted-foreground">{company.category}</div>
        )}
        {company.bio && <div className="mt-0.5 text-center text-xs">{company.bio}</div>}
      </div>
      {posts.length === 0 ? (
        <Empty />
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-0.5">
          {posts.map((p) => (
            <button
              key={p.id}
              onClick={() => onTap?.(p)}
              className={`relative aspect-[9/14] overflow-hidden bg-black ${statusRing(p.status)}`}
            >
              <Media post={p} className="h-full w-full object-cover" />
              <Play className="absolute bottom-1 left-1 h-3 w-3 fill-white text-white drop-shadow" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Facebook({
  company,
  posts,
  onTap,
}: {
  company: Company;
  posts: Post[];
  onTap?: (p: Post) => void;
}) {
  return (
    <div className="text-sm">
      <BizHeader company={company} variant="facebook" />
      <div className="space-y-3 px-3 pb-6 pt-3">
        {posts.slice(0, 5).map((p) => (
          <button
            key={p.id}
            onClick={() => onTap?.(p)}
            className={`block w-full rounded-md border border-foreground/10 bg-card text-left ${statusRing(p.status)}`}
          >
            <div className="flex items-center gap-2 p-3">
              <Avatar company={company} size={36} />
              <div className="flex-1">
                <div className="text-xs font-semibold">{company.name}</div>
                <div className="text-[10px] text-muted-foreground">Sponsored · 🌐</div>
              </div>
              <MoreHorizontal className="h-4 w-4" />
            </div>
            {p.caption && <div className="px-3 pb-2 text-xs">{p.caption}</div>}
            {p.media_url && <Media post={p} className="w-full" controls />}
            <div className="flex justify-around border-t border-foreground/10 p-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" /> Like
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> Comment
              </span>
              <span className="flex items-center gap-1">
                <Send className="h-3 w-3" /> Share
              </span>
            </div>
          </button>
        ))}
        {posts.length === 0 && <Empty />}
      </div>
    </div>
  );
}

function Twitter({
  company,
  posts,
  onTap,
}: {
  company: Company;
  posts: Post[];
  onTap?: (p: Post) => void;
}) {
  return (
    <div className="text-sm">
      <BizHeader company={company} variant="twitter" />
      <div className="divide-y divide-foreground/10 px-3 pb-6 pt-2">
        {posts.slice(0, 8).map((p) => (
          <button
            key={p.id}
            onClick={() => onTap?.(p)}
            className={`flex w-full gap-2 py-3 text-left ${statusRing(p.status)} rounded`}
          >
            <Avatar company={company} size={36} />
            <div className="flex-1">
              <div className="text-xs">
                <span className="font-semibold">{company.name}</span>{" "}
                <span className="text-muted-foreground">@{company.username || company.slug}</span>
              </div>
              {p.caption && <div className="mt-1 whitespace-pre-line text-xs">{p.caption}</div>}
              {p.media_url && (
                <Media post={p} className="mt-2 rounded-xl border border-foreground/10" controls />
              )}
              <div className="mt-2 flex gap-6 text-[10px] text-muted-foreground">
                <MessageCircle className="h-3 w-3" />
                <Repeat2 className="h-3 w-3" />
                <Heart className="h-3 w-3" />
              </div>
            </div>
          </button>
        ))}
        {posts.length === 0 && <Empty />}
      </div>
    </div>
  );
}

function LinkedIn({
  company,
  posts,
  onTap,
}: {
  company: Company;
  posts: Post[];
  onTap?: (p: Post) => void;
}) {
  return (
    <div className="text-sm">
      <BizHeader company={company} variant="linkedin" />
      <div className="space-y-3 px-3 pb-6 pt-3">
        {posts.slice(0, 5).map((p) => (
          <button
            key={p.id}
            onClick={() => onTap?.(p)}
            className={`block w-full rounded border border-foreground/10 bg-card text-left ${statusRing(p.status)}`}
          >
            <div className="flex items-center gap-2 p-3">
              <Avatar company={company} size={36} />
              <div>
                <div className="text-xs font-semibold">{company.name}</div>
                <div className="text-[10px] text-muted-foreground">Promoted · 1h</div>
              </div>
            </div>
            {p.caption && <div className="px-3 pb-2 text-xs">{p.caption}</div>}
            {p.media_url && <Media post={p} className="w-full" controls />}
            <div className="flex justify-around border-t border-foreground/10 p-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" /> Like
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> Comment
              </span>
              <span className="flex items-center gap-1">
                <Send className="h-3 w-3" /> Send
              </span>
            </div>
          </button>
        ))}
        {posts.length === 0 && <Empty />}
      </div>
    </div>
  );
}

function Empty() {
  return <div className="py-12 text-center text-xs text-muted-foreground">Nothing here yet.</div>;
}



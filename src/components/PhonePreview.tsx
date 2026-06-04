import type { Company, Post, Platform } from "@/lib/types";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Music2, Plus, Home, Search, PlaySquare, User, Play, Repeat2, ThumbsUp, Share2 } from "lucide-react";

function statusRing(status: string) {
  if (status === "approved") return "ring-2 ring-emerald-500";
  if (status === "rejected") return "ring-2 ring-rose-500";
  return "ring-1 ring-foreground/10";
}

interface Props {
  platform: Platform;
  company: Company;
  posts: Post[];
  onTap?: (post: Post) => void;
}

export function PhonePreview({ platform, company, posts, onTap }: Props) {
  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[42px] border-[10px] border-foreground bg-background shadow-2xl">
        <div className="absolute left-1/2 top-2 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-foreground" />
        <div className="absolute inset-0 overflow-y-auto pb-2 pt-8 text-foreground">
          {platform === "instagram" && <Instagram company={company} posts={posts} onTap={onTap} />}
          {platform === "tiktok" && <TikTok company={company} posts={posts} onTap={onTap} />}
          {platform === "facebook" && <Facebook company={company} posts={posts} onTap={onTap} />}
          {platform === "twitter" && <Twitter company={company} posts={posts} onTap={onTap} />}
          {platform === "linkedin" && <LinkedIn company={company} posts={posts} onTap={onTap} />}
        </div>
      </div>
    </div>
  );
}

function Avatar({ company, size = 32 }: { company: Company; size?: number }) {
  return company.profile_pic_url ? (
    <img src={company.profile_pic_url} alt={company.name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div className="flex items-center justify-center rounded-full bg-foreground/10 text-[10px] uppercase tracking-wider" style={{ width: size, height: size }}>
      {company.name.slice(0, 2)}
    </div>
  );
}

function Instagram({ company, posts, onTap }: { company: Company; posts: Post[]; onTap?: (p: Post) => void }) {
  const grid = posts.filter((p) => p.post_type !== "story").slice(0, 17);
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between px-3 pb-2">
        <span className="font-semibold">{company.username || company.slug}</span>
        <Plus className="h-5 w-5" />
      </div>
      <div className="flex items-center gap-4 px-3 py-3">
        <Avatar company={company} size={64} />
        <div className="flex flex-1 justify-around text-center text-xs">
          <div><div className="font-semibold text-base">{grid.length}</div>posts</div>
          <div><div className="font-semibold text-base">{company.followers || "0"}</div>followers</div>
          <div><div className="font-semibold text-base">{company.following || 0}</div>following</div>
        </div>
      </div>
      <div className="px-3 pb-3">
        <div className="text-xs font-semibold">{company.name}</div>
        {company.bio && <div className="mt-0.5 text-xs whitespace-pre-line">{company.bio}</div>}
      </div>
      <div className="mx-3 flex gap-1 border-t border-foreground/10 pt-1">
        <button className="flex-1 py-2 text-[10px] font-semibold uppercase">Posts</button>
      </div>
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: Math.max(grid.length, 9) }).map((_, i) => {
          const p = grid[i];
          return (
            <button
              key={p?.id ?? i}
              onClick={() => p && onTap?.(p)}
              className={`relative aspect-square overflow-hidden bg-foreground/5 ${p ? statusRing(p.status) : ""}`}
            >
              {p?.media_url ? (
                <img src={p.media_url} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground/30">{i + 1}</div>
              )}
              {p?.post_type === "reel" && <Play className="absolute right-1 top-1 h-3 w-3 fill-white text-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TikTok({ company, posts, onTap }: { company: Company; posts: Post[]; onTap?: (p: Post) => void }) {
  const p = posts[0];
  return (
    <div className="relative h-full bg-black text-white">
      {p?.media_url ? (
        <img src={p.media_url} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-white/40">No reels yet</div>
      )}
      <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4">
        <Avatar company={company} size={40} />
        <Heart className="h-6 w-6" /><MessageCircle className="h-6 w-6" /><Share2 className="h-6 w-6" />
      </div>
      <div className="absolute bottom-16 left-3 right-16">
        <div className="text-sm font-semibold">@{company.username || company.slug}</div>
        {p?.caption && <div className="mt-1 text-xs line-clamp-3">{p.caption}</div>}
        <div className="mt-2 flex items-center gap-1 text-xs"><Music2 className="h-3 w-3" /> original sound</div>
      </div>
      {p && (
        <button onClick={() => onTap?.(p)} className={`absolute inset-3 bottom-32 top-8 rounded ${statusRing(p.status)}`} />
      )}
      <div className="absolute inset-x-0 bottom-0 flex justify-around bg-black/60 py-2 text-xs">
        <Home className="h-5 w-5" /><Search className="h-5 w-5" /><PlaySquare className="h-5 w-5" /><User className="h-5 w-5" />
      </div>
    </div>
  );
}

function Facebook({ company, posts, onTap }: { company: Company; posts: Post[]; onTap?: (p: Post) => void }) {
  return (
    <div className="space-y-3 px-3 pb-6 text-sm">
      {posts.slice(0, 5).map((p) => (
        <button key={p.id} onClick={() => onTap?.(p)} className={`block w-full rounded-md border border-foreground/10 bg-card text-left ${statusRing(p.status)}`}>
          <div className="flex items-center gap-2 p-3">
            <Avatar company={company} size={36} />
            <div className="flex-1">
              <div className="text-xs font-semibold">{company.name}</div>
              <div className="text-[10px] text-muted-foreground">Sponsored · 🌐</div>
            </div>
            <MoreHorizontal className="h-4 w-4" />
          </div>
          {p.caption && <div className="px-3 pb-2 text-xs">{p.caption}</div>}
          {p.media_url && <img src={p.media_url} className="w-full" />}
          <div className="flex justify-around border-t border-foreground/10 p-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Like</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Comment</span>
            <span className="flex items-center gap-1"><Send className="h-3 w-3" /> Share</span>
          </div>
        </button>
      ))}
      {posts.length === 0 && <Empty />}
    </div>
  );
}

function Twitter({ company, posts, onTap }: { company: Company; posts: Post[]; onTap?: (p: Post) => void }) {
  return (
    <div className="divide-y divide-foreground/10 px-3 pb-6 text-sm">
      {posts.slice(0, 8).map((p) => (
        <button key={p.id} onClick={() => onTap?.(p)} className={`flex w-full gap-2 py-3 text-left ${statusRing(p.status)} rounded`}>
          <Avatar company={company} size={36} />
          <div className="flex-1">
            <div className="text-xs"><span className="font-semibold">{company.name}</span> <span className="text-muted-foreground">@{company.username || company.slug}</span></div>
            {p.caption && <div className="mt-1 text-xs whitespace-pre-line">{p.caption}</div>}
            {p.media_url && <img src={p.media_url} className="mt-2 rounded-xl border border-foreground/10" />}
            <div className="mt-2 flex gap-6 text-[10px] text-muted-foreground"><MessageCircle className="h-3 w-3" /><Repeat2 className="h-3 w-3" /><Heart className="h-3 w-3" /></div>
          </div>
        </button>
      ))}
      {posts.length === 0 && <Empty />}
    </div>
  );
}

function LinkedIn({ company, posts, onTap }: { company: Company; posts: Post[]; onTap?: (p: Post) => void }) {
  return (
    <div className="space-y-3 px-3 pb-6 text-sm">
      {posts.slice(0, 5).map((p) => (
        <button key={p.id} onClick={() => onTap?.(p)} className={`block w-full rounded border border-foreground/10 bg-card text-left ${statusRing(p.status)}`}>
          <div className="flex items-center gap-2 p-3">
            <Avatar company={company} size={36} />
            <div>
              <div className="text-xs font-semibold">{company.name}</div>
              <div className="text-[10px] text-muted-foreground">Promoted · 1h</div>
            </div>
          </div>
          {p.caption && <div className="px-3 pb-2 text-xs">{p.caption}</div>}
          {p.media_url && <img src={p.media_url} className="w-full" />}
          <div className="flex justify-around border-t border-foreground/10 p-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Like</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Comment</span>
            <span className="flex items-center gap-1"><Send className="h-3 w-3" /> Send</span>
          </div>
        </button>
      ))}
      {posts.length === 0 && <Empty />}
    </div>
  );
}

function Empty() {
  return <div className="py-12 text-center text-xs text-muted-foreground">Nothing here yet.</div>;
}

// silence unused import warnings if user removes any icon — referenced above
export const __icons = { Bookmark };
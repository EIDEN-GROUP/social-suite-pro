import type { Post } from "@/lib/types";

/** Detects video either from the stored media_type or the URL extension. */
export function isVideo(post: Pick<Post, "media_type" | "media_url">): boolean {
  if (post.media_type === "video") return true;
  return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(post.media_url ?? "");
}

/**
 * Renders a post's primary media as <video> or <img> depending on its type.
 * Use everywhere a post thumbnail/preview is shown so videos never render
 * inside a broken <img>.
 */
export function Media({
  post,
  className,
  muted = true,
  controls = false,
  autoPlay = false,
  loop = false,
}: {
  post: Pick<Post, "media_type" | "media_url">;
  className?: string;
  muted?: boolean;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
}) {
  if (!post.media_url) {
    return <div className={`grid place-items-center bg-foreground/5 text-[10px] text-foreground/30 ${className ?? ""}`}>empty</div>;
  }
  return isVideo(post) ? (
    <video src={post.media_url} className={className} muted={muted} controls={controls} autoPlay={autoPlay} loop={loop} playsInline preload="metadata" />
  ) : (
    <img src={post.media_url} className={className} alt="" />
  );
}

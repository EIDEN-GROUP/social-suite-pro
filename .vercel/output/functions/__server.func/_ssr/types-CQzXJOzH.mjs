import { j as jsxRuntimeExports } from "../_libs/react.mjs";
function isVideo(post) {
  if (post.media_type === "video") return true;
  return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(post.media_url ?? "");
}
function Media({
  post,
  className,
  muted = true,
  controls = false,
  autoPlay = false,
  loop = false
}) {
  if (!post.media_url) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `grid place-items-center bg-foreground/5 text-[10px] text-foreground/30 ${className ?? ""}`,
        children: "empty"
      }
    );
  }
  return isVideo(post) ? /* @__PURE__ */ jsxRuntimeExports.jsx(
    "video",
    {
      src: post.media_url,
      className,
      muted,
      controls,
      autoPlay,
      loop,
      playsInline: true,
      preload: "metadata"
    }
  ) : /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: post.media_url, className, alt: "" });
}
const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
  { id: "twitter", label: "X" },
  { id: "linkedin", label: "LinkedIn" }
];
const POST_TYPES = [
  { id: "post", label: "Post" },
  { id: "reel", label: "Reel" },
  { id: "story", label: "Story" },
  { id: "carousel", label: "Carousel" }
];
export {
  Media as M,
  PLATFORMS as P,
  POST_TYPES as a
};

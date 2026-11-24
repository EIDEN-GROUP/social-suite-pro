import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Lock,
  Pencil,
  X,
} from "lucide-react";
import type { Post } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import { formatPostedAt, postedAgo } from "@/lib/posted";
import { cn } from "@/lib/utils";

const QUICK_CHIPS = ["Adjust crop", "Update copy", "Ready to publish", "Loved it"];

const STATUS_PILL: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  posted: "bg-sky-50 text-sky-700 border-sky-200",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Changes",
  posted: "Posted",
};

function isVideoUrl(url: string, primaryVideo: boolean, isPrimary: boolean) {
  if (isPrimary && primaryVideo) return true;
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

/**
 * Desktop post viewer. Opens as a modal over the approval room with the media
 * in its native format (videos play inline), plus everything needed to decide:
 * caption, schedule, note, quick chips and the approve/request-changes actions.
 */
export function PostViewer({
  post,
  index,
  total,
  note,
  onNoteChange,
  busy,
  onApprove,
  onReject,
  onClose,
  onPrev,
  onNext,
}: {
  post: Post;
  index: number;
  total: number;
  note: string;
  onNoteChange: (v: string) => void;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const media = useMemo(() => {
    return [post.media_url, ...(post.extra_media ?? [])].filter(Boolean) as string[];
  }, [post.media_url, post.extra_media]);
  const [mediaIndex, setMediaIndex] = useState(0);

  useEffect(() => {
    setMediaIndex(0);
  }, [post.id]);

  const current = media[mediaIndex] ?? null;
  const currentIsVideo = current
    ? isVideoUrl(current, post.media_type === "video", mediaIndex === 0)
    : false;
  const isPosted = post.status === "posted";
  const platformLabel = PLATFORMS.find((p) => p.id === post.platform)?.label ?? post.platform;

  return (
    <div
      className="fixed inset-0 z-[70] hidden items-center justify-center bg-black/70 p-5 backdrop-blur-sm lg:flex xl:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Post ${index + 1} of ${total}`}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[1120px] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media — native aspect, videos play inline */}
        <div className="relative flex w-[54%] shrink-0 items-center justify-center bg-[#0b0b0d]">
          {current ? (
            currentIsVideo ? (
              <video
                key={current}
                src={current}
                className="max-h-[92vh] w-full object-contain"
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                key={current}
                src={current}
                alt={post.caption ? post.caption.slice(0, 120) : "Post preview"}
                className="max-h-[92vh] w-full object-contain"
              />
            )
          ) : (
            <div className="grid h-64 w-full place-items-center text-sm text-white/50">
              No media for this post
            </div>
          )}

          {media.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setMediaIndex((i) => (i - 1 + media.length) % media.length)}
                className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                aria-label="Previous media"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setMediaIndex((i) => (i + 1) % media.length)}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                aria-label="Next media"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {media.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMediaIndex(i)}
                    aria-label={`Media ${i + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === mediaIndex ? "w-5 bg-white" : "w-1.5 bg-white/50",
                    )}
                  />
                ))}
              </div>
              <span className="absolute left-3 top-3 rounded bg-black/55 px-2 py-0.5 text-[10.5px] font-semibold text-white">
                {mediaIndex + 1} / {media.length}
              </span>
            </>
          )}
        </div>

        {/* Details + actions */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="rounded-md bg-gray-900 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
                POST #{Math.max(1, index + 1)} OF {Math.max(1, total)}
              </span>
              <span className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-indigo-700">
                {post.post_type}
              </span>
              <span className="hidden truncate text-xs font-medium text-gray-400 sm:inline">
                · {platformLabel}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  STATUS_PILL[post.status],
                )}
              >
                {STATUS_LABEL[post.status] ?? post.status}
              </span>
              <div className="ml-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={index <= 0}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Previous post"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={index >= total - 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Next post"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition hover:bg-gray-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Caption &amp; hashtags
              </p>
              <p className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-line rounded-xl border border-gray-200 bg-[#F7F7F8] p-3 text-[12.5px] leading-relaxed text-gray-700">
                {post.caption || "No caption"}
              </p>
            </div>

            {post.scheduled_at && (
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-[#F7F7F8] px-3.5 py-2.5 text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Scheduled publish
                  </span>
                  <span className="mt-0.5 block font-semibold text-gray-800">
                    {formatPostedAt(post.scheduled_at)}
                  </span>
                </div>
                <span className="rounded border border-gray-200 bg-white px-2 py-0.5 text-[10.5px] font-semibold text-gray-600">
                  Auto-queue
                </span>
              </div>
            )}

            {isPosted ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-sky-800">
                  <BadgeCheck className="h-4 w-4" /> This post is live
                </p>
                {post.posted_at && (
                  <p className="mt-0.5 text-xs text-sky-700">
                    {formatPostedAt(post.posted_at)} · {postedAgo(post.posted_at)}
                  </p>
                )}
                {post.post_url && (
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open post
                  </a>
                )}
                {post.client_comment && (
                  <p className="mt-2 text-xs text-sky-700/80">{post.client_comment}</p>
                )}
              </div>
            ) : (
              <div>
                <label
                  htmlFor="viewer-note"
                  className="text-[11px] font-bold uppercase tracking-wider text-gray-400"
                >
                  Note for the studio
                </label>
                <div className="mb-2 mt-2 flex flex-wrap gap-1.5">
                  {QUICK_CHIPS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onNoteChange(note ? `${note}, ${c}` : c)}
                      className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 transition hover:bg-gray-200/80"
                    >
                      + {c}
                    </button>
                  ))}
                </div>
                <textarea
                  id="viewer-note"
                  value={note}
                  onChange={(e) => onNoteChange(e.target.value)}
                  rows={3}
                  placeholder="Write a note... (required to request changes)"
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12.5px] text-gray-800 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-gray-100 p-4">
            {!isPosted && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onApprove}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onReject}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  <Pencil className="h-4 w-4" /> Request changes
                </button>
              </div>
            )}
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {post.decided_at
                  ? `Last decision ${postedAgo(post.decided_at)}`
                  : "Awaiting your review"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3 w-3" /> Private &amp; secure
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

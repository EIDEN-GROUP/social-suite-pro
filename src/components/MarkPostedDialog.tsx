import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, ExternalLink, Link2, Pencil, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/lib/types";
import { Media } from "@/components/Media";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  LINK_PLACEHOLDER,
  formatPostedAt,
  isValidHttpUrl,
  postedAgo,
  toLocalInputValue,
} from "@/lib/posted";

interface Props {
  post: Post;
  onClose: () => void;
  onChanged: () => void;
  /** Open the full editor (caption, type, carousel media...) for this post. */
  onEditDetails: () => void;
}

/**
 * Opens when an admin clicks an approved (or already posted) post.
 * Captures when it went live and the link to it - saving flips the post to "posted"
 * and the client room shows a "your post is live" notice.
 */
export function MarkPostedDialog({ post, onClose, onChanged, onEditDetails }: Props) {
  const alreadyPosted = post.status === "posted";
  const [postUrl, setPostUrl] = useState(post.post_url ?? "");
  const [postedAt, setPostedAt] = useState(() =>
    toLocalInputValue(post.posted_at ?? new Date()),
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    const url = postUrl.trim();
    if (!postedAt) return toast.error("Pick the date and time it went live");
    if (url && !isValidHttpUrl(url)) {
      return toast.error("Enter a valid link starting with http(s)://");
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({
          status: "posted",
          post_url: url || null,
          posted_at: new Date(postedAt).toISOString(),
        })
        .eq("id", post.id);
      if (error) throw error;
      toast.success(alreadyPosted ? "Posted details updated" : "Marked as posted");
      onChanged();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function unmark() {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ status: "approved", post_url: null, posted_at: null })
        .eq("id", post.id);
      if (error) throw error;
      toast.success("Moved back to approved");
      onChanged();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="flex gap-3 border-b editorial-rule bg-foreground/[0.02] p-4 pr-12">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded border editorial-rule bg-foreground/5">
            <Media post={post} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-emerald-600">
              {alreadyPosted ? "Posted" : "Approved by client"}
            </p>
            <DialogTitle className="font-display text-xl leading-tight">
              {alreadyPosted ? "Posted details" : "Mark as posted"}
            </DialogTitle>
            <DialogDescription className="mt-0.5 truncate text-xs">
              {post.platform} · {post.post_type}
              {post.caption ? ` · ${post.caption}` : ""}
            </DialogDescription>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" /> Posted at
            </span>
            <div className="mt-1 flex gap-2">
              <input
                type="datetime-local"
                value={postedAt}
                onChange={(e) => setPostedAt(e.target.value)}
                className="min-w-0 flex-1 rounded border editorial-rule bg-transparent p-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setPostedAt(toLocalInputValue(new Date()))}
                className="rounded border editorial-rule px-3 text-xs uppercase tracking-widest hover:bg-foreground/5"
              >
                Now
              </button>
            </div>
          </label>

          <label className="block">
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
              <Link2 className="h-3.5 w-3.5" /> Link to the live post
            </span>
            <input
              type="url"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder={LINK_PLACEHOLDER[post.platform]}
              className="mt-1 w-full rounded border editorial-rule bg-transparent p-2 text-sm"
            />
            <span className="mt-1 block text-[11px] text-muted-foreground">
              The client sees this as a "your post is live" notice with an Open button.
            </span>
          </label>

          {alreadyPosted && post.posted_at && (
            <p className="flex items-center justify-between gap-2 rounded border editorial-rule bg-sky-500/5 px-3 py-2 text-xs text-muted-foreground">
              <span>
                Went live {formatPostedAt(post.posted_at)} ({postedAgo(post.posted_at)})
              </span>
              {post.post_url && (
                <a
                  href={post.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                >
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t editorial-rule p-4">
          <button
            disabled={busy}
            onClick={save}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Rocket className="h-4 w-4" />
            {alreadyPosted ? "Update" : "Mark as posted"}
          </button>
          <button
            disabled={busy}
            onClick={onEditDetails}
            className="inline-flex items-center gap-1.5 rounded-sm border editorial-rule px-3 py-2 text-sm hover:bg-foreground/5"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit post
          </button>
          {alreadyPosted && (
            <button
              disabled={busy}
              onClick={unmark}
              className="w-full text-center text-[11px] uppercase tracking-widest text-muted-foreground hover:text-rose-600"
            >
              Not posted yet - move back to approved
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Post } from "@/lib/types";

interface Props {
  post: Post;
  mode: "admin" | "client";
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function PostDialog({ post, mode, open, onClose, onChanged }: Props) {
  const [caption, setCaption] = useState(post.caption ?? "");
  const [comment, setComment] = useState(post.client_comment ?? "");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function decide(status: "approved" | "rejected") {
    setBusy(true);
    const { error } = await supabase
      .from("posts")
      .update({ status, client_comment: comment || null, decided_at: new Date().toISOString() })
      .eq("id", post.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Approved" : "Rejected with comment");
    onChanged();
    onClose();
  }

  async function saveCaption() {
    setBusy(true);
    const { error } = await supabase.from("posts").update({ caption }).eq("id", post.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onChanged();
  }

  async function remove() {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    onChanged();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-md bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b editorial-rule p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{post.platform} · {post.post_type}</p>
          <h3 className="font-display text-2xl">Review</h3>
        </div>
        {post.media_url && (
          <div className="bg-foreground/5">
            <img src={post.media_url} className="max-h-[40vh] w-full object-contain" />
          </div>
        )}
        <div className="space-y-4 p-4">
          {mode === "admin" ? (
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Caption</span>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded border editorial-rule bg-transparent p-2 text-sm"
              />
            </label>
          ) : (
            post.caption && <p className="text-sm whitespace-pre-line">{post.caption}</p>
          )}

          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {mode === "client" ? "Comment for the studio" : "Client comment"}
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              readOnly={mode === "admin"}
              rows={3}
              className="mt-1 w-full rounded border editorial-rule bg-transparent p-2 text-sm"
              placeholder={mode === "client" ? "Optional — required when rejecting" : "—"}
            />
          </label>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Status: <strong className="text-foreground">{post.status}</strong></span>
            {post.decided_at && <span>{new Date(post.decided_at).toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t editorial-rule p-4">
          {mode === "client" ? (
            <>
              <button disabled={busy} onClick={() => decide("approved")} className="flex-1 rounded-sm bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">Approve</button>
              <button disabled={busy || !comment.trim()} onClick={() => decide("rejected")} className="flex-1 rounded-sm bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">Reject</button>
            </>
          ) : (
            <>
              <button disabled={busy} onClick={saveCaption} className="flex-1 rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background">Save caption</button>
              <button disabled={busy} onClick={remove} className="rounded-sm border editorial-rule px-4 py-2 text-sm">Delete</button>
            </>
          )}
          <button onClick={onClose} className="rounded-sm border editorial-rule px-4 py-2 text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}
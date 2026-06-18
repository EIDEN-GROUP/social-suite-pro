import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Post, PostType } from "@/lib/types";
import { POST_TYPES } from "@/lib/types";
import { safeStorageName, splitBySize, MAX_UPLOAD_MB } from "@/lib/utils";
import { X } from "lucide-react";

interface Props {
  post: Post;
  mode: "admin" | "client";
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
  /** Client mode only - performs the approve/reject via the server fn. */
  onDecide?: (status: "approved" | "rejected", comment: string) => Promise<void>;
}

export function PostDialog({ post, mode, open, onClose, onChanged, onDecide }: Props) {
  const [caption, setCaption] = useState(post.caption ?? "");
  const [comment, setComment] = useState(post.client_comment ?? "");
  const [type, setType] = useState<PostType>(post.post_type);
  const [extra, setExtra] = useState<string[]>(post.extra_media ?? []);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  // ---- Client actions -------------------------------------------------------
  async function decide(status: "approved" | "rejected") {
    if (status === "rejected" && !comment.trim()) return toast.error("Add a comment to reject");
    setBusy(true);
    try {
      if (onDecide) {
        await onDecide(status, comment);
      } else {
        const { error } = await supabase
          .from("posts")
          .update({ status, client_comment: comment || null, decided_at: new Date().toISOString() })
          .eq("id", post.id);
        if (error) throw error;
      }
      toast.success(status === "approved" ? "Approved" : "Rejected with comment");
      onChanged();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // ---- Admin actions --------------------------------------------------------
  async function saveAdmin() {
    setBusy(true);
    const { error } = await supabase
      .from("posts")
      .update({ caption, post_type: type, extra_media: extra })
      .eq("id", post.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onChanged();
  }

  async function addCarouselMedia(fileList: FileList) {
    const { ok: files, tooBig } = splitBySize(Array.from(fileList));
    if (tooBig.length) toast.error(`Skipped ${tooBig.length} file(s) over ${MAX_UPLOAD_MB} MB.`);
    if (files.length === 0) return;
    setBusy(true);
    try {
      const added: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${post.company_id}/${post.platform}/${post.id}/${Date.now()}-${i}-${safeStorageName(file.name)}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("media").getPublicUrl(path);
        added.push(data.publicUrl);
      }
      const next = [...extra, ...added];
      setExtra(next);
      const { error } = await supabase
        .from("posts")
        .update({ extra_media: next, post_type: "carousel" })
        .eq("id", post.id);
      if (error) throw error;
      setType("carousel");
      toast.success("Added to carousel");
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function removeExtra(url: string) {
    setExtra((cur) => cur.filter((u) => u !== url));
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b editorial-rule p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {post.platform} · {type}
          </p>
          <h3 className="font-display text-2xl">Review</h3>
        </div>
        {post.media_url && (
          <div className="bg-foreground/5">
            {post.media_type === "video" ? (
              <video
                src={post.media_url}
                className="max-h-[40vh] w-full object-contain"
                controls
                playsInline
              />
            ) : (
              <img src={post.media_url} className="max-h-[40vh] w-full object-contain" />
            )}
          </div>
        )}
        {extra.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-t editorial-rule bg-foreground/5 p-2">
            {extra.map((u) => (
              <div key={u} className="relative shrink-0">
                <img src={u} className="h-16 w-16 rounded object-cover" />
                {mode === "admin" && (
                  <button
                    onClick={() => removeExtra(u)}
                    className="absolute -right-1 -top-1 rounded-full bg-background p-0.5 shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="space-y-4 p-4">
          {mode === "admin" ? (
            <>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Post type
                </span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PostType)}
                  className="mt-1 w-full rounded border editorial-rule bg-transparent p-2 text-sm"
                >
                  {POST_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Caption
                </span>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded border editorial-rule bg-transparent p-2 text-sm"
                />
              </label>
              <label className="block cursor-pointer rounded border border-dashed editorial-rule p-3 text-center text-xs uppercase tracking-widest text-muted-foreground hover:bg-foreground/[0.02]">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => e.target.files && addCarouselMedia(e.target.files)}
                />
                + Add carousel media
              </label>
            </>
          ) : (
            post.caption && <p className="whitespace-pre-line text-sm">{post.caption}</p>
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
              placeholder={mode === "client" ? "Optional - required when rejecting" : "-"}
            />
          </label>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Status: <strong className="text-foreground">{post.status}</strong>
            </span>
            {post.decided_at && <span>{new Date(post.decided_at).toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t editorial-rule p-4">
          {mode === "client" ? (
            <>
              <button
                disabled={busy}
                onClick={() => decide("approved")}
                className="flex-1 rounded-sm bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={busy || !comment.trim()}
                onClick={() => decide("rejected")}
                className="flex-1 rounded-sm bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Reject
              </button>
            </>
          ) : (
            <>
              <button
                disabled={busy}
                onClick={saveAdmin}
                className="flex-1 rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Save
              </button>
              <button
                disabled={busy}
                onClick={remove}
                className="rounded-sm border editorial-rule px-4 py-2 text-sm"
              >
                Delete
              </button>
            </>
          )}
          <button onClick={onClose} className="rounded-sm border editorial-rule px-4 py-2 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

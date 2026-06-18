import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Company, Post, Platform, PostType, Highlight } from "@/lib/types";
import { PLATFORMS, POST_TYPES } from "@/lib/types";
import { PhonePreview } from "@/components/PhonePreview";
import { PostDialog } from "@/components/PostDialog";
import { safeStorageName, splitBySize, MAX_UPLOAD_MB } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Media } from "@/components/Media";
import { Trash2, Play, Images } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/companies/$slug")({
  component: CompanyAdmin,
});

function normalizePost(row: Record<string, unknown>): Post {
  return {
    ...(row as unknown as Post),
    extra_media: Array.isArray(row.extra_media) ? (row.extra_media as string[]) : [],
  };
}

type ViewGroup = "posts" | "reels" | "stories";
const VIEW_GROUPS: { id: ViewGroup; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "reels", label: "Reels" },
  { id: "stories", label: "Stories" },
];
function inGroup(p: Post, g: ViewGroup): boolean {
  if (g === "posts") return p.post_type === "post" || p.post_type === "carousel";
  if (g === "reels") return p.post_type === "reel";
  return p.post_type === "story";
}

function CompanyAdmin() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [posts, setPosts] = useState<Post[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selected, setSelected] = useState<Post | null>(null);
  const [uploading, setUploading] = useState(false);
  const [addType, setAddType] = useState<PostType>("post");
  const [viewFilter, setViewFilter] = useState<ViewGroup>("posts");
  const [coverBusy, setCoverBusy] = useState(false);

  const loadPosts = useCallback(async (companyId: string, pf: Platform) => {
    const { data: ps } = await supabase
      .from("posts")
      .select("*")
      .eq("company_id", companyId)
      .eq("platform", pf)
      .order("position");
    setPosts((ps ?? []).map((p) => normalizePost(p as Record<string, unknown>)));
  }, []);

  const loadHighlights = useCallback(async (companyId: string) => {
    const { data } = await supabase
      .from("highlights")
      .select("*")
      .eq("company_id", companyId)
      .order("position");
    setHighlights((data ?? []) as Highlight[]);
  }, []);

  const load = useCallback(async () => {
    const { data: c } = await supabase.from("companies").select("*").eq("slug", slug).maybeSingle();
    if (!c) {
      toast.error("Company not found");
      return navigate({ to: "/admin" });
    }
    setCompany(c as Company);
    await Promise.all([loadPosts((c as Company).id, platform), loadHighlights((c as Company).id)]);
  }, [slug, platform, loadPosts, loadHighlights, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime: reflect client approvals/rejections as they happen.
  useEffect(() => {
    if (!company) return;
    const channel = supabase
      .channel(`posts:${company.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts", filter: `company_id=eq.${company.id}` },
        () => {
          void loadPosts(company.id, platform);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [company, platform, loadPosts]);

  async function uploadFiles(fileList: FileList) {
    if (!company || fileList.length === 0) return;

    // Friendly size check before we hit the network.
    const { ok: files, tooBig } = splitBySize(Array.from(fileList));
    if (tooBig.length) {
      const names = tooBig
        .map((f) => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`)
        .join(", ");
      toast.error(
        `Skipped - over the ${MAX_UPLOAD_MB} MB limit: ${names}. Compress the file or raise the cap in Supabase → Storage settings.`,
      );
    }
    if (files.length === 0) return;

    setUploading(true);
    try {
      // Upload every file to storage first, collecting permanent URLs.
      const media: { url: string; isVideo: boolean }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${company.id}/${platform}/${Date.now()}-${i}-${safeStorageName(file.name)}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
        media.push({ url: pub.publicUrl, isVideo: file.type.startsWith("video") });
      }

      const startPos = posts.length;
      if (addType === "carousel") {
        // Multiple files become ONE carousel (first = cover, rest = extra_media).
        const [cover, ...rest] = media;
        const { error } = await supabase.from("posts").insert({
          company_id: company.id,
          platform,
          post_type: "carousel",
          media_url: cover.url,
          media_type: cover.isVideo ? "video" : "image",
          extra_media: rest.map((m) => m.url),
          position: startPos,
        });
        if (error) throw error;
      } else {
        // One post/reel/story per file.
        const rows = media.map((m, i) => ({
          company_id: company.id,
          platform,
          post_type: addType,
          media_url: m.url,
          media_type: m.isVideo ? "video" : "image",
          position: startPos + i,
        }));
        const { error } = await supabase.from("posts").insert(rows);
        if (error) throw error;
      }
      toast.success(`Added ${addType}${addType !== "carousel" && media.length > 1 ? "s" : ""}`);
      await loadPosts(company.id, platform);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function saveCompany(patch: Partial<Company>) {
    if (!company) return;
    const { error } = await supabase.from("companies").update(patch).eq("id", company.id);
    if (error) return toast.error(error.message);
    setCompany({ ...company, ...patch });
    toast.success("Saved");
  }

  async function uploadCover(file: File) {
    if (!company) return;
    const { tooBig } = splitBySize([file]);
    if (tooBig.length) return toast.error(`Cover is over the ${MAX_UPLOAD_MB} MB limit.`);
    setCoverBusy(true);
    try {
      const path = `${company.id}/cover/${Date.now()}-${safeStorageName(file.name)}`;
      const { error } = await supabase.storage.from("media").upload(path, file);
      if (error) throw error;
      const url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
      await saveCompany({ cover_url: url });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCoverBusy(false);
    }
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    // Reorder happens within the currently-viewed group; we then weave the new
    // group order back into the full list so global positions stay consistent.
    const view = posts.filter((p) => inGroup(p, viewFilter));
    const oldIndex = view.findIndex((p) => p.id === active.id);
    const newIndex = view.findIndex((p) => p.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const newView = arrayMove(view, oldIndex, newIndex);
    let vi = 0;
    const inView = new Set(view.map((p) => p.id));
    const reordered = posts.map((p) => (inView.has(p.id) ? newView[vi++] : p));
    setPosts(reordered);
    const updates = reordered
      .map((p, idx) => ({ p, idx }))
      .filter(({ p, idx }) => p.position !== idx)
      .map(({ p, idx }) => supabase.from("posts").update({ position: idx }).eq("id", p.id));
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) toast.error("Couldn't save the new order");
  }

  async function copyClientLink() {
    if (!company) return;
    const url = `${window.location.origin}/c/${company.slug}`;
    await navigator.clipboard.writeText(url);
    toast.success("Client link copied");
  }

  if (!company) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;

  const counts = {
    pending: posts.filter((p) => p.status === "pending").length,
    approved: posts.filter((p) => p.status === "approved").length,
    rejected: posts.filter((p) => p.status === "rejected").length,
  };
  const view = posts.filter((p) => inGroup(p, viewFilter));

  return (
    <main className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b editorial-rule px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← Studio
          </Link>
          <div className="h-4 w-px bg-foreground/20" />
          <span className="font-display text-xl">{company.name}</span>
          <span className="rounded border editorial-rule px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            /c/{company.slug}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/c/${company.slug}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm border editorial-rule px-3 py-1.5 text-xs"
          >
            Open client view ↗
          </a>
          <button
            onClick={copyClientLink}
            className="rounded-sm border editorial-rule px-3 py-1.5 text-xs"
          >
            Copy client link
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[380px_1fr]">
        {/* LEFT - live phone preview */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded border editorial-rule p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Live preview</p>
            <div className="mt-3">
              <PhonePreview
                platform={platform}
                company={company}
                posts={posts}
                highlights={highlights}
                onTap={setSelected}
              />
            </div>
          </div>
        </aside>

        {/* RIGHT - content management */}
        <section>
          <div className="flex flex-wrap gap-1 border editorial-rule">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`px-3 py-1.5 text-xs uppercase tracking-widest ${platform === p.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 rounded border editorial-rule p-3">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Add</span>
            <div className="flex flex-wrap gap-1 border editorial-rule">
              {POST_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setAddType(t.id)}
                  className={`px-3 py-1.5 text-xs uppercase tracking-widest ${addType === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <label className="ml-auto cursor-pointer rounded-sm bg-foreground px-4 py-2 text-sm text-background">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => e.target.files && uploadFiles(e.target.files)}
              />
              {uploading ? "Uploading…" : `+ Upload ${addType}`}
            </label>
            <p className="w-full text-[11px] text-muted-foreground">
              {addType === "carousel"
                ? "Select multiple files - they become one carousel (first = cover)."
                : `Each file becomes a separate ${addType} on ${platform}. You can also drag tiles to reorder.`}{" "}
              Images or videos, up to{" "}
              <strong className="text-foreground">{MAX_UPLOAD_MB} MB</strong> each.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {/* Separate Posts / Reels / Stories so they're never mixed */}
            <div className="flex gap-1 border editorial-rule">
              {VIEW_GROUPS.map((g) => {
                const n = posts.filter((p) => inGroup(p, g.id)).length;
                return (
                  <button
                    key={g.id}
                    onClick={() => setViewFilter(g.id)}
                    className={`px-3 py-1.5 text-xs uppercase tracking-widest ${viewFilter === g.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {g.label}
                    <span className="ml-1 opacity-60">{n}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>
                <strong className="text-foreground">{counts.pending}</strong> pending
              </span>
              <span>
                <strong className="text-emerald-700">{counts.approved}</strong> approved
              </span>
              <span>
                <strong className="text-rose-700">{counts.rejected}</strong> rejected
              </span>
            </div>
          </div>

          {view.length === 0 ? (
            <p className="mt-10 py-10 text-center text-sm text-muted-foreground">
              No {viewFilter} for {platform} yet. Pick{" "}
              <strong className="text-foreground">{addType}</strong> above and upload.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={view.map((p) => p.id)} strategy={rectSortingStrategy}>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {view.map((p) => (
                    <SortableTile key={p.id} post={p} onOpen={() => setSelected(p)} />
                  ))}
                </div>
                {view.length > 1 && (
                  <p className="mt-3 text-[11px] italic text-muted-foreground">
                    Drag tiles to reorder within {viewFilter}.
                  </p>
                )}
              </SortableContext>
            </DndContext>
          )}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded border editorial-rule p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Client access
              </p>
              <div className="mt-3 space-y-2">
                <ProfileField
                  label="Client password"
                  value={company.client_password ?? ""}
                  onSave={(v) => saveCompany({ client_password: v })}
                />
                <p className="text-[11px] text-muted-foreground">
                  Client visits <span className="font-mono">/c/{company.slug}</span> and enters this
                  password.
                </p>
              </div>
            </div>

            <div className="rounded border editorial-rule p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Profile</p>
              <div className="mt-3 space-y-2">
                <ProfileField
                  label="Username"
                  value={company.username ?? ""}
                  onSave={(v) => saveCompany({ username: v })}
                />
                <ProfileField
                  label="Category"
                  value={company.category ?? ""}
                  onSave={(v) => saveCompany({ category: v })}
                />
                <ProfileField
                  label="Followers"
                  value={company.followers ?? "0"}
                  onSave={(v) => saveCompany({ followers: v })}
                />
                <ProfileField
                  label="Following"
                  value={String(company.following ?? 0)}
                  onSave={(v) => saveCompany({ following: Number(v) || 0 })}
                />
                <ProfileField
                  label="Link"
                  value={company.link ?? ""}
                  onSave={(v) => saveCompany({ link: v })}
                />
                <ProfileField
                  label="Bio"
                  value={company.bio ?? ""}
                  multiline
                  onSave={(v) => saveCompany({ bio: v })}
                />
                <ProfileField
                  label="Profile pic URL"
                  value={company.profile_pic_url ?? ""}
                  onSave={(v) => saveCompany({ profile_pic_url: v })}
                />
                <div>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Cover / banner
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-9 w-16 overflow-hidden rounded bg-foreground/5">
                      {company.cover_url && (
                        <img src={company.cover_url} className="h-full w-full object-cover" />
                      )}
                    </span>
                    <label className="cursor-pointer rounded-sm border editorial-rule px-2 py-1 text-[11px]">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])}
                      />
                      {coverBusy ? "Uploading…" : company.cover_url ? "Replace" : "Upload"}
                    </label>
                    {company.cover_url && (
                      <button
                        onClick={() => saveCompany({ cover_url: null })}
                        className="text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Shown as the banner on Facebook, X &amp; LinkedIn pages.
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <HighlightsCard
                company={company}
                highlights={highlights}
                onChanged={() => loadHighlights(company.id)}
              />
            </div>
          </div>
        </section>
      </div>

      {selected && (
        <PostDialog
          post={selected}
          mode="admin"
          open={!!selected}
          onClose={() => setSelected(null)}
          onChanged={() => loadPosts(company.id, platform)}
        />
      )}
    </main>
  );
}

function SortableTile({ post, onOpen }: { post: Post; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: post.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={`group relative aspect-square touch-none overflow-hidden rounded border editorial-rule bg-foreground/5 ${post.status === "approved" ? "ring-2 ring-emerald-500" : post.status === "rejected" ? "ring-2 ring-rose-500" : ""}`}
    >
      <Media post={post} className="h-full w-full object-cover" />
      {(post.post_type === "reel" || post.media_type === "video") && (
        <Play className="absolute right-1 top-1 h-3.5 w-3.5 fill-white text-white drop-shadow" />
      )}
      {post.post_type === "carousel" && (
        <Images className="absolute right-1 top-1 h-3.5 w-3.5 text-white drop-shadow" />
      )}
      <span className="absolute bottom-1 right-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] uppercase tracking-widest">
        {post.status}
      </span>
      <span className="absolute left-1 top-1 rounded bg-background/90 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
        {post.post_type}
      </span>
    </button>
  );
}

function HighlightsCard({
  company,
  highlights,
  onChanged,
}: {
  company: Company;
  highlights: Highlight[];
  onChanged: () => void;
}) {
  const [emoji, setEmoji] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(image?: string) {
    if (!emoji && !label && !image) return;
    setBusy(true);
    const { error } = await supabase.from("highlights").insert({
      company_id: company.id,
      emoji: emoji || null,
      label: label || null,
      image: image || null,
      position: highlights.length,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setEmoji("");
    setLabel("");
    onChanged();
  }

  async function uploadAndAdd(file: File) {
    setBusy(true);
    try {
      const path = `${company.id}/highlights/${Date.now()}-${safeStorageName(file.name)}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      await add(data.publicUrl);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("highlights").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChanged();
  }

  return (
    <div className="rounded border editorial-rule p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Highlights</p>
      {highlights.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {highlights.map((h) => (
            <div key={h.id} className="flex w-14 flex-col items-center gap-1">
              <div className="relative">
                <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full border editorial-rule bg-foreground/5">
                  {h.image ? (
                    <img src={h.image} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg">{h.emoji || "○"}</span>
                  )}
                </span>
                <button
                  onClick={() => remove(h.id)}
                  className="absolute -right-1 -top-1 rounded-full bg-background p-0.5 shadow"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <span className="max-w-[56px] truncate text-[10px] text-muted-foreground">
                {h.label}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 space-y-2">
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="😎"
            className="w-14 rounded border editorial-rule bg-transparent px-2 py-1.5 text-center text-sm"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label"
            className="flex-1 rounded border editorial-rule bg-transparent px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => add()}
            className="flex-1 rounded-sm bg-foreground py-1.5 text-xs text-background disabled:opacity-50"
          >
            Add
          </button>
          <label className="cursor-pointer rounded-sm border editorial-rule px-3 py-1.5 text-xs">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAndAdd(e.target.files[0])}
            />
            Image
          </label>
        </div>
      </div>
    </div>
  );
}

function ProfileField({
  label,
  value,
  multiline,
  onSave,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onSave: (v: string) => void;
}) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        {v !== value && (
          <button
            onClick={() => onSave(v)}
            className="text-[10px] uppercase tracking-widest text-foreground"
          >
            Save
          </button>
        )}
      </div>
      {multiline ? (
        <textarea
          value={v}
          onChange={(e) => setV(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded border editorial-rule bg-transparent p-2 text-sm"
        />
      ) : (
        <input
          value={v}
          onChange={(e) => setV(e.target.value)}
          className="mt-1 w-full border-b editorial-rule bg-transparent py-1.5 text-sm outline-none focus:border-foreground"
        />
      )}
    </div>
  );
}

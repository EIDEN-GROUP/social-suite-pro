import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Company, Post, Platform, PostType } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import { PhonePreview } from "@/components/PhonePreview";
import { PostDialog } from "@/components/PostDialog";

export const Route = createFileRoute("/_authenticated/admin/companies/$slug")({
  component: CompanyAdmin,
});

function CompanyAdmin() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [posts, setPosts] = useState<Post[]>([]);
  const [selected, setSelected] = useState<Post | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const { data: c } = await supabase.from("companies").select("*").eq("slug", slug).maybeSingle();
    if (!c) { toast.error("Company not found"); return navigate({ to: "/admin" }); }
    setCompany(c as Company);
    const { data: ps } = await supabase
      .from("posts").select("*").eq("company_id", c.id).eq("platform", platform).order("position");
    setPosts((ps ?? []) as Post[]);
  }

  useEffect(() => { void load(); }, [slug, platform]);

  async function uploadFiles(files: FileList) {
    if (!company) return;
    setUploading(true);
    try {
      const startPos = posts.length;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${company.id}/${platform}/${Date.now()}-${i}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("media").upload(path, file);
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365);
        const postType: PostType = platform === "tiktok" ? "reel" : "post";
        const { error: insErr } = await supabase.from("posts").insert({
          company_id: company.id, platform, post_type: postType,
          media_url: signed?.signedUrl ?? null,
          media_type: file.type.startsWith("video") ? "video" : "image",
          position: startPos + i,
        });
        if (insErr) throw insErr;
      }
      toast.success("Uploaded");
      await load();
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

  if (!company) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;

  const counts = {
    pending: posts.filter((p) => p.status === "pending").length,
    approved: posts.filter((p) => p.status === "approved").length,
    rejected: posts.filter((p) => p.status === "rejected").length,
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b editorial-rule px-6 py-4">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Studio</Link>
          <div className="h-4 w-px bg-foreground/20" />
          <span className="font-display text-xl">{company.name}</span>
          <span className="rounded border editorial-rule px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">/c/{company.slug}</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 border editorial-rule">
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
            <label className="cursor-pointer rounded-sm bg-foreground px-4 py-2 text-sm text-background">
              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
              {uploading ? "Uploading…" : "+ Upload media"}
            </label>
          </div>

          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{counts.pending}</strong> pending</span>
            <span><strong className="text-emerald-700">{counts.approved}</strong> approved</span>
            <span><strong className="text-rose-700">{counts.rejected}</strong> rejected</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {posts.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`group relative aspect-square overflow-hidden rounded border editorial-rule bg-foreground/5 ${p.status === "approved" ? "ring-2 ring-emerald-500" : p.status === "rejected" ? "ring-2 ring-rose-500" : ""}`}
              >
                {p.media_url ? <img src={p.media_url} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">empty</div>}
                <span className="absolute bottom-1 right-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] uppercase tracking-widest">{p.status}</span>
              </button>
            ))}
            {posts.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No content for {platform} yet. Upload above.</p>}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded border editorial-rule p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Profile</p>
            <div className="mt-3 space-y-2">
              <ProfileField label="Username" value={company.username ?? ""} onSave={(v) => saveCompany({ username: v })} />
              <ProfileField label="Followers" value={company.followers ?? "0"} onSave={(v) => saveCompany({ followers: v })} />
              <ProfileField label="Bio" value={company.bio ?? ""} multiline onSave={(v) => saveCompany({ bio: v })} />
              <ProfileField label="Profile pic URL" value={company.profile_pic_url ?? ""} onSave={(v) => saveCompany({ profile_pic_url: v })} />
            </div>
          </div>
          <div className="rounded border editorial-rule p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Live preview</p>
            <div className="mt-3">
              <PhonePreview platform={platform} company={company} posts={posts} onTap={setSelected} />
            </div>
          </div>
        </aside>
      </div>

      {selected && <PostDialog post={selected} mode="admin" open={!!selected} onClose={() => setSelected(null)} onChanged={load} />}
    </main>
  );
}

function ProfileField({ label, value, multiline, onSave }: { label: string; value: string; multiline?: boolean; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        {v !== value && (
          <button onClick={() => onSave(v)} className="text-[10px] uppercase tracking-widest text-foreground">Save</button>
        )}
      </div>
      {multiline ? (
        <textarea value={v} onChange={(e) => setV(e.target.value)} rows={2} className="mt-1 w-full rounded border editorial-rule bg-transparent p-2 text-sm" />
      ) : (
        <input value={v} onChange={(e) => setV(e.target.value)} className="mt-1 w-full border-b editorial-rule bg-transparent py-1.5 text-sm outline-none focus:border-foreground" />
      )}
    </div>
  );
}
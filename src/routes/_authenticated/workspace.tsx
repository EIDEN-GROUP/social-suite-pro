import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Company, Post, Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";
import { PhonePreview } from "@/components/PhonePreview";
import { PostDialog } from "@/components/PostDialog";

export const Route = createFileRoute("/_authenticated/workspace")({
  component: Workspace,
});

function Workspace() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [posts, setPosts] = useState<Post[]>([]);
  const [selected, setSelected] = useState<Post | null>(null);

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return navigate({ to: "/auth" });
    const { data: roles } = await supabase.from("user_roles").select("role, company_id").eq("user_id", u.user.id);
    if (roles?.some((r) => r.role === "superadmin")) return navigate({ to: "/admin" });
    const companyId = roles?.find((r) => r.role === "client")?.company_id;
    if (!companyId) { toast.error("No workspace assigned to your account"); return; }
    const { data: c } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();
    if (c) setCompany(c as Company);
    const { data: ps } = await supabase.from("posts").select("*").eq("company_id", companyId).eq("platform", platform).order("position");
    setPosts((ps ?? []) as Post[]);
  }

  useEffect(() => { void load(); }, [platform]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (!company) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  const accent = company.accent_color || "#0d0d0d";

  const counts = {
    pending: posts.filter((p) => p.status === "pending").length,
    approved: posts.filter((p) => p.status === "approved").length,
    rejected: posts.filter((p) => p.status === "rejected").length,
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b editorial-rule px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full" style={{ background: accent }} />
          <span className="font-display text-xl">{company.name}</span>
          <span className="rounded border editorial-rule px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">Approval room</span>
        </div>
        <button onClick={signOut} className="rounded-sm border editorial-rule px-3 py-1.5 text-xs">Sign out</button>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Vol. I · For your approval</p>
        <h1 className="mt-2 font-display text-5xl">Today's lineup</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Tap any post to approve it or leave a comment. Your decisions are sent to the studio in real time.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
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
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span><strong className="text-foreground">{counts.pending}</strong> pending</span>
            <span><strong className="text-emerald-700">{counts.approved}</strong> approved</span>
            <span><strong className="text-rose-700">{counts.rejected}</strong> rejected</span>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[420px_1fr]">
          <div className="order-2 lg:order-1">
            <PhonePreview platform={platform} company={company} posts={posts} onTap={setSelected} />
            <p className="mt-3 text-center text-xs text-muted-foreground">Tap a post in the preview to review.</p>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Queue</p>
            <ul className="mt-3 divide-y editorial-rule border-y editorial-rule">
              {posts.map((p) => (
                <li key={p.id}>
                  <button onClick={() => setSelected(p)} className="flex w-full items-center gap-4 py-3 text-left hover:bg-foreground/[0.02]">
                    <div className="h-14 w-14 overflow-hidden rounded bg-foreground/5">
                      {p.media_url && <img src={p.media_url} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">{p.caption?.slice(0, 60) || <span className="text-muted-foreground italic">No caption</span>}</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.post_type}</div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest ${p.status === "approved" ? "text-emerald-700" : p.status === "rejected" ? "text-rose-700" : "text-muted-foreground"}`}>
                      {p.status}
                    </span>
                  </button>
                </li>
              ))}
              {posts.length === 0 && <li className="py-12 text-center text-sm text-muted-foreground">Nothing to review on {platform} yet.</li>}
            </ul>
          </div>
        </div>
      </div>

      {selected && <PostDialog post={selected} mode="client" open={!!selected} onClose={() => setSelected(null)} onChanged={load} />}
    </main>
  );
}
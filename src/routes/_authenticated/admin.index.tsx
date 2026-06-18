import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Company } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    accent_color: "#0d0d0d",
    client_password: "client123",
  });
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    // Verify admin
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return navigate({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    if (!roles?.some((r) => r.role === "superadmin")) {
      await supabase.auth.signOut();
      return navigate({ to: "/auth" });
    }

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setCompanies((data ?? []) as Company[]);
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  async function createCompany(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const slug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const { error } = await supabase
        .from("companies")
        .insert({
          slug,
          name: form.name,
          accent_color: form.accent_color,
          client_password: form.client_password || "client123",
        })
        .select()
        .single();
      if (error) throw error;
      toast.success("Company created");
      setShowNew(false);
      setForm({ slug: "", name: "", accent_color: "#0d0d0d", client_password: "client123" });
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b editorial-rule px-6 py-4">
        <Link to="/admin" className="font-display text-xl">
          Atelier · Studio
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <span className="uppercase tracking-widest text-muted-foreground">Superadmin</span>
          <button onClick={signOut} className="rounded-sm border editorial-rule px-3 py-1.5">
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Clients</p>
            <h1 className="mt-2 font-display text-5xl">Companies</h1>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="rounded-sm bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            + New company
          </button>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
        ) : companies.length === 0 ? (
          <div className="mt-12 rounded border editorial-rule p-12 text-center">
            <p className="font-display text-2xl">No companies yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first client workspace to start uploading content.
            </p>
          </div>
        ) : (
          <ul className="mt-10 divide-y editorial-rule border-y editorial-rule">
            {companies.map((c) => (
              <li key={c.id}>
                <Link
                  to="/admin/companies/$slug"
                  params={{ slug: c.slug }}
                  className="flex items-center justify-between py-5 hover:bg-foreground/[0.02]"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="h-10 w-10 rounded-full"
                      style={{ background: c.accent_color }}
                    />
                    <div>
                      <div className="font-display text-2xl">{c.name}</div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground">
                        /c/{c.slug}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showNew && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          onClick={() => setShowNew(false)}
        >
          <form
            onSubmit={createCompany}
            className="w-full max-w-md rounded bg-background p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground">New company</p>
            <h2 className="font-display text-3xl">Create a workspace</h2>
            <div className="mt-6 space-y-4 text-sm">
              <Field
                label="Brand name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                required
              />
              <Field
                label="URL slug"
                value={form.slug}
                onChange={(v) => setForm({ ...form, slug: v })}
                required
                placeholder="acme"
              />
              <label className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Accent color
                </span>
                <input
                  type="color"
                  value={form.accent_color}
                  onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                  className="h-8 w-16"
                />
              </label>
              <div className="border-t editorial-rule pt-4">
                <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
                  Client access
                </p>
                <Field
                  label="Client password"
                  value={form.client_password}
                  onChange={(v) => setForm({ ...form, client_password: v })}
                  placeholder="client123"
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Share <span className="font-mono">/c/{form.slug || "slug"}</span> + this password
                  with your client. They approve without an account.
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                disabled={busy}
                className="flex-1 rounded-sm bg-foreground py-2.5 text-sm text-background"
              >
                {busy ? "…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="rounded-sm border editorial-rule px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border-b editorial-rule bg-transparent py-2 outline-none focus:border-foreground"
      />
    </label>
  );
}

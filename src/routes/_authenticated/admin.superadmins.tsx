import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createSuperadmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/superadmins")({
  component: SuperadminsPage,
});

function SuperadminsPage() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
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

    const { count: total } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "superadmin");
    setCount(total ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await createSuperadmin({ data: { email, password } });
      if (result.created) {
        toast.success(`Superadmin created: ${email}`);
      } else {
        toast.success(`Superadmin role added to existing user: ${email}`);
      }
      setEmail("");
      setPassword("");
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b editorial-rule px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            ← Studio
          </Link>
          <div className="h-4 w-px bg-foreground/20" />
          <span className="font-display text-xl">Superadmins</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="rounded border editorial-rule p-6"
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Create superadmin
          </p>
          <h2 className="mt-1 font-display text-3xl">New account</h2>
          <div className="mt-6 space-y-4 text-sm">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full border-b editorial-rule bg-transparent py-2 outline-none focus:border-foreground"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1 w-full border-b editorial-rule bg-transparent py-2 outline-none focus:border-foreground"
              />
            </label>
          </div>
          <button
            disabled={busy}
            className="mt-6 rounded-sm bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create superadmin"}
          </button>
          <p className="mt-3 text-[11px] text-muted-foreground">
            If the email already exists, the superadmin role will be added to the existing account.
          </p>
        </form>

        <div className="mt-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Existing superadmins
          </p>
          {loading ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              {count} superadmin{count !== 1 ? "s" : ""} registered.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

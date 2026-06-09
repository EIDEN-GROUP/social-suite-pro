import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { signUpStudioAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in - Atelier" },
      { name: "description", content: "Sign in to the Atelier approval studio." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapAllowed, setBootstrapAllowed] = useState(false);
  const createStudioAdmin = useServerFn(signUpStudioAdmin);

  function postLoginDest() {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("post_login_redirect") : null;
    if (saved) sessionStorage.removeItem("post_login_redirect");
    return saved && saved.startsWith("/admin") ? saved : "/admin";
  }

  useEffect(() => {
    // Auto-redirect if already signed in (getSession refreshes an expired token)
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) {
        // Check whether any superadmin exists yet (open signup if not)
        const { count } = await supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "superadmin");
        setBootstrapAllowed((count ?? 0) === 0);
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role, company_id")
        .eq("user_id", data.session.user.id);
      const isAdmin = roles?.some((r) => r.role === "superadmin");
      if (isAdmin) navigate({ to: postLoginDest() });
      else { await supabase.auth.signOut(); }
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        // Create the studio admin already-confirmed (no email step), then sign in.
        await createStudioAdmin({ data: { email, password } });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Studio account created.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      const isAdmin = roles?.some((r) => r.role === "superadmin");
      if (isAdmin) navigate({ to: postLoginDest() });
      else { await supabase.auth.signOut(); toast.error("This sign-in is for the studio only."); }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-background text-foreground md:grid-cols-2">
      <div className="hidden flex-col justify-between border-r editorial-rule p-12 md:flex">
        <Link to="/" className="font-display text-2xl">Atelier</Link>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Studio entry</p>
          <h2 className="mt-4 font-display text-5xl leading-tight">
            Where the work is shown, <em>and then approved.</em>
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">© Atelier Studio</p>
      </div>
      <div className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {bootstrapAllowed && mode === "signup" ? "Studio setup" : "Sign in"}
          </p>
          <h1 className="mt-3 font-display text-4xl">
            {mode === "signup" ? "Claim the studio." : "Welcome back."}
          </h1>
          {bootstrapAllowed && (
            <p className="mt-3 text-sm text-muted-foreground">
              First sign-up becomes the superadmin. Clients are added from inside.
            </p>
          )}

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border-b editorial-rule bg-transparent py-2 text-base outline-none focus:border-foreground"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Password</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border-b editorial-rule bg-transparent py-2 text-base outline-none focus:border-foreground"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-sm bg-foreground py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>

          {bootstrapAllowed && (
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="mt-4 w-full text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              {mode === "signup" ? "Have an account? Sign in" : "First time? Create the studio account"}
            </button>
          )}
        </form>
      </div>
    </main>
  );
}
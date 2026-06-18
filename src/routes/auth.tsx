import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { signUpStudioAdmin } from "@/lib/admin.functions";
import { AuthAura } from "@/components/AuthAura";
import { ArrowRight, Sparkles } from "lucide-react";
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
    const saved =
      typeof window !== "undefined" ? sessionStorage.getItem("post_login_redirect") : null;
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
      else {
        await supabase.auth.signOut();
      }
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
      else {
        await supabase.auth.signOut();
        toast.error("This sign-in is for the studio only.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const isSetup = bootstrapAllowed && mode === "signup";

  return (
    <AuthAura>
      <div className="animate-rise w-full max-w-md">
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-2 font-display text-2xl tracking-tight"
        >
          <span className="ig-gradient inline-grid h-8 w-8 place-items-center rounded-xl text-base font-bold text-white shadow-lg">
            A
          </span>
          Atelier
        </Link>

        <div className="auth-card rounded-[2rem] border border-white/40 p-8 sm:p-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-background/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {isSetup ? "Studio setup" : "Studio entry"}
          </span>

          <h1 className="mt-5 font-display text-5xl leading-[0.95]">
            {mode === "signup" ? (
              <>
                Claim the <span className="text-social-gradient">studio.</span>
              </>
            ) : (
              <>
                Welcome <span className="text-social-gradient">back.</span>
              </>
            )}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {isSetup
              ? "First sign-up becomes the superadmin. Clients are added from inside."
              : "Sign in to your proofing room and pick up where you left off."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                className="mt-1.5 w-full rounded-xl border border-foreground/10 bg-background/50 px-4 py-3 text-base outline-none transition focus:border-foreground/40 focus:bg-background/80 focus:ring-4 focus:ring-foreground/5"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Password
              </span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-foreground/10 bg-background/50 px-4 py-3 text-base outline-none transition focus:border-foreground/40 focus:bg-background/80 focus:ring-4 focus:ring-foreground/5"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-bold text-background transition hover:scale-[1.02] active:scale-100 disabled:opacity-50"
            >
              {loading ? "…" : mode === "signup" ? "Create account" : "Sign in"}
              {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
            </button>
          </form>

          {bootstrapAllowed && (
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="mt-5 w-full text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
            >
              {mode === "signup"
                ? "Have an account? Sign in"
                : "First time? Create the studio account"}
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          © Atelier Studio — where the work is shown, and then approved.
        </p>
      </div>
    </AuthAura>
  );
}

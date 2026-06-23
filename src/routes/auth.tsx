import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { signUpStudioAdmin } from "@/lib/admin.functions";
import { AuroraLayer } from "@/components/AuthAura";
import { ArrowRight, Sparkles, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.jpg";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in - SMimulator" },
      { name: "description", content: "Sign in to the SMimulator approval studio." },
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
    <main className="grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-[1fr_1.05fr]">
      {/* LEFT - sticky branded panel (the "something different": editorial aurora rail) */}
      <aside className="relative hidden overflow-hidden border-r editorial-rule bg-[#0d0d0d] text-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col justify-between p-12 xl:p-16">
          <AuroraLayer />

          <Link to="/" className="relative z-10 flex items-center gap-3">
            <img src={logoUrl} alt="SMimulator" className="h-10 w-10 rounded-xl object-cover" />
            <span className="font-display text-xl tracking-tight">SMimulator</span>
          </Link>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">
              <ShieldCheck className="h-3.5 w-3.5" />
              Studio control room
            </span>
            <h2 className="mt-6 font-display text-5xl leading-[0.95] xl:text-6xl">
              Run every
              <br />
              <span className="text-social-gradient">approval</span> from
              <br />
              one place.
            </h2>
            <ul className="mt-9 space-y-3.5 text-sm text-white/75">
              {[
                "Spin up client proofing rooms in seconds",
                "Track approvals, comments and revisions live",
                "Publish-ready mockups for every platform",
              ].map((line) => (
                <li key={line} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/90 text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-[11px] uppercase tracking-[0.3em] text-white/40">
            © SMimulator Studio
          </p>
        </div>
      </aside>

      {/* RIGHT - sign-in form */}
      <section className="relative flex items-center justify-center overflow-hidden p-6 sm:p-10">
        {/* Mobile-only aurora wash since the left panel is hidden */}
        <div className="absolute inset-0 -z-10 opacity-70 lg:hidden">
          <AuroraLayer />
        </div>

        <div className="animate-rise w-full max-w-md">
          {/* Brand header (shows on mobile where the left panel is hidden) */}
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 font-display text-2xl tracking-tight lg:hidden"
          >
            <img src={logoUrl} alt="SMimulator" className="h-8 w-8 rounded-xl object-cover" />
            SMimulator
          </Link>

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
      </section>
    </main>
  );
}

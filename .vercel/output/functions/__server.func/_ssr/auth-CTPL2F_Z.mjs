import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, c as createSsrRpc } from "./createSsrRpc-C9JRgIh7.mjs";
import { s as supabase } from "./client-D2eKXXFb.mjs";
import { c as createServerFn } from "./server-Dk4wVh4H.mjs";
import { A as AuthAura } from "./AuthAura-XaXFcz89.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import { S as Sparkles, A as ArrowRight } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream/promises";
const signUpStudioAdmin = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  email: stringType().email().max(255),
  password: stringType().min(8).max(128)
}).parse(input)).handler(createSsrRpc("3d47a6cc2b9dbeba8f759d2be5af4b50dfe3841787c3e1c7a595383ba82d23c7"));
function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = reactExports.useState("signin");
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const [bootstrapAllowed, setBootstrapAllowed] = reactExports.useState(false);
  const createStudioAdmin = useServerFn(signUpStudioAdmin);
  function postLoginDest() {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("post_login_redirect") : null;
    if (saved) sessionStorage.removeItem("post_login_redirect");
    return saved && saved.startsWith("/admin") ? saved : "/admin";
  }
  reactExports.useEffect(() => {
    supabase.auth.getSession().then(async ({
      data
    }) => {
      if (!data.session?.user) {
        const {
          count
        } = await supabase.from("user_roles").select("*", {
          count: "exact",
          head: true
        }).eq("role", "superadmin");
        setBootstrapAllowed((count ?? 0) === 0);
        return;
      }
      const {
        data: roles
      } = await supabase.from("user_roles").select("role, company_id").eq("user_id", data.session.user.id);
      const isAdmin = roles?.some((r) => r.role === "superadmin");
      if (isAdmin) navigate({
        to: postLoginDest()
      });
      else {
        await supabase.auth.signOut();
      }
    });
  }, [navigate]);
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await createStudioAdmin({
          data: {
            email,
            password
          }
        });
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast.success("Studio account created.");
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
      const {
        data
      } = await supabase.auth.getUser();
      if (!data.user) return;
      const {
        data: roles
      } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      const isAdmin = roles?.some((r) => r.role === "superadmin");
      if (isAdmin) navigate({
        to: postLoginDest()
      });
      else {
        await supabase.auth.signOut();
        toast.error("This sign-in is for the studio only.");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }
  const isSetup = bootstrapAllowed && mode === "signup";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthAura, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-rise w-full max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "mb-5 inline-flex items-center gap-2 font-display text-2xl tracking-tight", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ig-gradient inline-grid h-8 w-8 place-items-center rounded-xl text-base font-bold text-white shadow-lg", children: "A" }),
      "Atelier"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-card rounded-[2rem] border border-white/40 p-8 sm:p-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-background/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5" }),
        isSetup ? "Studio setup" : "Studio entry"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-5 font-display text-5xl leading-[0.95]", children: mode === "signup" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        "Claim the ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-social-gradient", children: "studio." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        "Welcome ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-social-gradient", children: "back." })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: isSetup ? "First sign-up becomes the superadmin. Clients are added from inside." : "Sign in to your proofing room and pick up where you left off." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "mt-8 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] uppercase tracking-[0.2em] text-muted-foreground", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@studio.com", className: "mt-1.5 w-full rounded-xl border border-foreground/10 bg-background/50 px-4 py-3 text-base outline-none transition focus:border-foreground/40 focus:bg-background/80 focus:ring-4 focus:ring-foreground/5" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] uppercase tracking-[0.2em] text-muted-foreground", children: "Password" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", required: true, minLength: 8, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "••••••••", className: "mt-1.5 w-full rounded-xl border border-foreground/10 bg-background/50 px-4 py-3 text-base outline-none transition focus:border-foreground/40 focus:bg-background/80 focus:ring-4 focus:ring-foreground/5" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: loading, className: "group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-bold text-background transition hover:scale-[1.02] active:scale-100 disabled:opacity-50", children: [
          loading ? "…" : mode === "signup" ? "Create account" : "Sign in",
          !loading && /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4 transition group-hover:translate-x-1" })
        ] })
      ] }),
      bootstrapAllowed && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setMode(mode === "signup" ? "signin" : "signup"), className: "mt-5 w-full text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground", children: mode === "signup" ? "Have an account? Sign in" : "First time? Create the studio account" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 text-center text-[11px] text-muted-foreground", children: "© Atelier Studio — where the work is shown, and then approved." })
  ] }) });
}
export {
  AuthPage as component
};

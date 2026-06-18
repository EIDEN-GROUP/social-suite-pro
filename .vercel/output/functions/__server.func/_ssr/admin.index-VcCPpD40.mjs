import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-D2eKXXFb.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
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
function AdminHome() {
  const navigate = useNavigate();
  const [companies, setCompanies] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [showNew, setShowNew] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({
    slug: "",
    name: "",
    accent_color: "#0d0d0d",
    client_password: "client123"
  });
  const [busy, setBusy] = reactExports.useState(false);
  async function load() {
    setLoading(true);
    const {
      data: u
    } = await supabase.auth.getUser();
    if (!u.user) return navigate({
      to: "/auth"
    });
    const {
      data: roles
    } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!roles?.some((r) => r.role === "superadmin")) {
      await supabase.auth.signOut();
      return navigate({
        to: "/auth"
      });
    }
    const {
      data,
      error
    } = await supabase.from("companies").select("*").order("created_at", {
      ascending: false
    });
    if (error) toast.error(error.message);
    setCompanies(data ?? []);
    setLoading(false);
  }
  reactExports.useEffect(() => {
    void load();
  }, []);
  async function createCompany(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const slug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const {
        error
      } = await supabase.from("companies").insert({
        slug,
        name: form.name,
        accent_color: form.accent_color,
        client_password: form.client_password || "client123"
      }).select().single();
      if (error) throw error;
      toast.success("Company created");
      setShowNew(false);
      setForm({
        slug: "",
        name: "",
        accent_color: "#0d0d0d",
        client_password: "client123"
      });
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    await supabase.auth.signOut();
    navigate({
      to: "/auth"
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between border-b editorial-rule px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin", className: "font-display text-xl", children: "Atelier · Studio" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "uppercase tracking-widest text-muted-foreground", children: "Superadmin" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: signOut, className: "rounded-sm border editorial-rule px-3 py-1.5", children: "Sign out" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 py-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-[0.3em] text-muted-foreground", children: "Clients" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-2 font-display text-5xl", children: "Companies" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowNew(true), className: "rounded-sm bg-foreground px-5 py-2.5 text-sm font-medium text-background", children: "+ New company" })
      ] }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-10 text-sm text-muted-foreground", children: "Loading…" }) : companies.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-12 rounded border editorial-rule p-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display text-2xl", children: "No companies yet." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Create your first client workspace to start uploading content." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-10 divide-y editorial-rule border-y editorial-rule", children: companies.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin/companies/$slug", params: {
        slug: c.slug
      }, className: "flex items-center justify-between py-5 hover:bg-foreground/[0.02]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-10 w-10 rounded-full", style: {
            background: c.accent_color
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-2xl", children: c.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: [
              "/c/",
              c.slug
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "Open →" })
      ] }) }, c.id)) })
    ] }),
    showNew && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4", onClick: () => setShowNew(false), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: createCompany, className: "w-full max-w-md rounded bg-background p-6", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "New company" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-3xl", children: "Create a workspace" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Brand name", value: form.name, onChange: (v) => setForm({
          ...form,
          name: v
        }), required: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "URL slug", value: form.slug, onChange: (v) => setForm({
          ...form,
          slug: v
        }), required: true, placeholder: "acme" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: "Accent color" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "color", value: form.accent_color, onChange: (e) => setForm({
            ...form,
            accent_color: e.target.value
          }), className: "h-8 w-16" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t editorial-rule pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs uppercase tracking-widest text-muted-foreground", children: "Client access" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Client password", value: form.client_password, onChange: (v) => setForm({
            ...form,
            client_password: v
          }), placeholder: "client123" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-[11px] text-muted-foreground", children: [
            "Share ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono", children: [
              "/c/",
              form.slug || "slug"
            ] }),
            " + this password with your client. They approve without an account."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: busy, className: "flex-1 rounded-sm bg-foreground py-2.5 text-sm text-background", children: busy ? "…" : "Create" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowNew(false), className: "rounded-sm border editorial-rule px-4 py-2.5 text-sm", children: "Cancel" })
      ] })
    ] }) })
  ] });
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-widest text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type, value, required, placeholder, onChange: (e) => onChange(e.target.value), className: "mt-1 w-full border-b editorial-rule bg-transparent py-2 outline-none focus:border-foreground" })
  ] });
}
export {
  AdminHome as component
};

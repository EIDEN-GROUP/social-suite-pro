import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, ExternalLink, LayoutGrid, List, Search } from "lucide-react";
import type { Company, ApprovalStatus } from "@/lib/types";
import { postedAgo } from "@/lib/posted";

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
  const [stats, setStats] = useState<Record<string, CompanyStats>>({});
  const [query, setQuery] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">(() => {
    try {
      return localStorage.getItem("smim-companies-layout") === "list" ? "list" : "grid";
    } catch {
      return "grid";
    }
  });

  function changeLayout(next: "grid" | "list") {
    setLayout(next);
    try {
      localStorage.setItem("smim-companies-layout", next);
    } catch {
      /* ignore - preference just won't persist */
    }
  }

  async function loadStats() {
    const rows: { company_id: string; status: ApprovalStatus; posted_at: string | null }[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await supabase
        .from("posts")
        .select("company_id, status, posted_at")
        .range(from, from + 999);
      if (!data) break;
      rows.push(...(data as typeof rows));
      if (data.length < 1000) break;
    }
    const next: Record<string, CompanyStats> = {};
    for (const r of rows) {
      const st = (next[r.company_id] ??= {
        pending: 0,
        approved: 0,
        rejected: 0,
        posted: 0,
        lastPosted: null,
      });
      st[r.status] += 1;
      if (r.posted_at && (!st.lastPosted || r.posted_at > st.lastPosted))
        st.lastPosted = r.posted_at;
    }
    setStats(next);
  }

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
    void loadStats();
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

  const visible = companies.filter((c) => {
    const q = query.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b editorial-rule px-6 py-4">
        <Link to="/admin" className="font-display text-xl">
          SMimulator · Studio
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <Link
            to="/admin/calendar"
            className="uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Posted calendar
          </Link>
          <Link
            to="/admin/superadmins"
            className="uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Manage admins
          </Link>
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
          <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <label className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search companies…"
                  className="w-full rounded-sm border editorial-rule bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-foreground"
                />
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {visible.length} of {companies.length}
                </span>
                <div className="flex border editorial-rule">
                  {(
                    [
                      ["grid", LayoutGrid, "Card view"],
                      ["list", List, "List view"],
                    ] as const
                  ).map(([id, Icon, label]) => (
                    <button
                      key={id}
                      aria-label={label}
                      title={label}
                      onClick={() => changeLayout(id)}
                      className={`p-2 ${layout === id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {visible.length === 0 ? (
              <p className="mt-10 py-10 text-center text-sm text-muted-foreground">
                No company matches "{query}".
              </p>
            ) : (
              <ul
                className={
                  layout === "grid"
                    ? "mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                    : "mt-6 divide-y editorial-rule border-y editorial-rule"
                }
              >
                {visible.map((c) => (
                  <CompanyCard key={c.id} company={c} stats={stats[c.id]} layout={layout} />
                ))}
              </ul>
            )}
          </>
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

interface CompanyStats {
  pending: number;
  approved: number;
  rejected: number;
  posted: number;
  lastPosted: string | null;
}

function CompanyLogo({ company, size }: { company: Company; size: number }) {
  const src = company.logo_url || company.profile_pic_url;
  const initials = company.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-background bg-background shadow-sm"
      style={{ width: size, height: size, background: src ? undefined : company.accent_color }}
    >
      {src ? (
        <img src={src} alt={company.name} className="h-full w-full object-cover" />
      ) : (
        <span className="font-display text-white" style={{ fontSize: size * 0.4 }}>
          {initials || "?"}
        </span>
      )}
    </span>
  );
}

function CompanyCard({
  company: c,
  stats,
  layout,
}: {
  company: Company;
  stats?: CompanyStats;
  layout: "grid" | "list";
}) {
  const chips = [
    { n: stats?.pending ?? 0, label: "pending", cls: "bg-amber-400/20 text-amber-700" },
    { n: stats?.approved ?? 0, label: "approved", cls: "bg-emerald-500/15 text-emerald-700" },
    { n: stats?.rejected ?? 0, label: "changes", cls: "bg-rose-500/15 text-rose-700" },
    { n: stats?.posted ?? 0, label: "posted", cls: "bg-sky-500/15 text-sky-700" },
  ];
  const actions = (
    <div className="flex items-center gap-2 text-xs">
      <Link
        to="/admin/calendar"
        search={{ company: c.slug }}
        className="inline-flex items-center gap-1.5 rounded-sm border editorial-rule px-2.5 py-1.5 hover:bg-foreground/5"
      >
        <CalendarDays className="h-3.5 w-3.5" /> Calendar
      </Link>
      <a
        href={`/c/${c.slug}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-sm border editorial-rule px-2.5 py-1.5 hover:bg-foreground/5"
      >
        <ExternalLink className="h-3.5 w-3.5" /> Client view
      </a>
    </div>
  );
  const chipRow = (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((x) => (
        <span
          key={x.label}
          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${x.cls} ${x.n === 0 ? "opacity-40" : ""}`}
        >
          {x.n} {x.label}
        </span>
      ))}
    </div>
  );

  if (layout === "list") {
    return (
      <li className="flex flex-wrap items-center justify-between gap-4 py-4 hover:bg-foreground/[0.02]">
        <Link
          to="/admin/companies/$slug"
          params={{ slug: c.slug }}
          className="flex min-w-0 flex-1 items-center gap-4"
        >
          <CompanyLogo company={c} size={48} />
          <div className="min-w-0">
            <div className="truncate font-display text-2xl">{c.name}</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              /c/{c.slug}
              {stats?.lastPosted && <> · last posted {postedAgo(stats.lastPosted)}</>}
            </div>
          </div>
        </Link>
        <div className="hidden md:block">{chipRow}</div>
        {actions}
      </li>
    );
  }

  return (
    <li className="group overflow-hidden rounded border editorial-rule bg-background transition hover:shadow-md">
      <Link to="/admin/companies/$slug" params={{ slug: c.slug }} className="block">
        <div
          className="h-24 bg-cover bg-center"
          style={{
            backgroundColor: c.accent_color,
            backgroundImage: c.cover_url
              ? `url(${c.cover_url})`
              : `linear-gradient(135deg, ${c.accent_color}, ${c.accent_color}66)`,
          }}
        />
        <div className="px-4 pb-3">
          <div className="-mt-8 flex items-end justify-between">
            <CompanyLogo company={c} size={64} />
            <span className="mb-1 text-xs text-muted-foreground transition group-hover:translate-x-0.5">
              Open →
            </span>
          </div>
          <div className="mt-2 truncate font-display text-2xl">{c.name}</div>
          <div className="truncate text-xs uppercase tracking-widest text-muted-foreground">
            /c/{c.slug}
            {c.category && <> · {c.category}</>}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {stats?.lastPosted
              ? `Last posted ${postedAgo(stats.lastPosted)}`
              : "Nothing posted yet"}
          </p>
        </div>
      </Link>
      <div className="space-y-3 border-t editorial-rule px-4 py-3">
        {chipRow}
        {actions}
      </div>
    </li>
  );
}

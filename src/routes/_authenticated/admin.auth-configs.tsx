import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { Platform } from "@/lib/types";
import {
  listAuthSetups,
  saveCustomAuth,
  useManagedAuth,
  authCredentialFields,
} from "@/lib/social/social.functions";
import { PlatformBadge } from "@/components/social/PlatformBadge";

export const Route = createFileRoute("/_authenticated/admin/auth-configs")({
  component: AuthConfigsPage,
});

type Provider = {
  toolkit: string;
  label: string;
  consoleUrl: string;
  note: string;
};

type Setup = {
  platform: Platform;
  toolkit: string;
  authConfigId: string | null;
  custom: boolean;
  appName: string | null;
  redirectUri: string;
  scopes: string | null;
  provisionedAt: string | null;
  provisioningError: string | null;
  provider: Provider;
  callback: string;
};

type FormState = {
  appName: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  redirectUri: string;
  extra: string;
};

const EMPTY_FORM: FormState = {
  appName: "Simulator",
  clientId: "",
  clientSecret: "",
  scopes: "",
  redirectUri: "",
  extra: "",
};

function AuthConfigsPage() {
  const load = useServerFn(listAuthSetups);
  const save = useServerFn(saveCustomAuth);
  const reset = useServerFn(useManagedAuth);
  const loadFields = useServerFn(authCredentialFields);

  const [setups, setSetups] = useState<Setup[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPlatform, setOpenPlatform] = useState<Platform | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState<Platform | null>(null);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await load({ data: {} });
      setSetups((res.setups as unknown as Setup[]) ?? []);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function openForm(s: Setup) {
    setOpenPlatform(s.platform);
    setRequiredFields([]);
    setForm({
      ...EMPTY_FORM,
      redirectUri: s.redirectUri || s.callback,
      scopes: s.scopes ?? "",
      appName: s.appName || "Simulator",
    });
    loadFields({ data: { platform: s.platform } })
      .then((res) => setRequiredFields(res.fields ?? []))
      .catch(() => setRequiredFields([]));
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy - select it manually");
    }
  }

  async function submit(s: Setup) {
    if (!form.clientId.trim() || !form.clientSecret.trim()) {
      return toast.error("Client ID and client secret are required.");
    }
    setBusy(s.platform);
    const tid = toast.loading(`Creating the ${s.provider.label} auth config...`);
    try {
      await save({
        data: {
          platform: s.platform,
          appName: form.appName.trim() || "Simulator",
          clientId: form.clientId.trim(),
          clientSecret: form.clientSecret.trim(),
          scopes: form.scopes.trim() || undefined,
          redirectUri: form.redirectUri.trim() || s.callback,
          extra: form.extra.trim() || undefined,
        },
      });
      toast.success("Your OAuth app is now used for this platform.", { id: tid });
      setOpenPlatform(null);
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      toast.error((err as Error).message, { id: tid });
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function revert(s: Setup) {
    if (
      !window.confirm(
        `Switch ${s.provider.label} back to Composio-managed auth? Existing connections stay active.`,
      )
    )
      return;
    setBusy(s.platform);
    try {
      await reset({ data: { platform: s.platform } });
      toast.success("Switched to Composio-managed auth.");
      await refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center gap-4 border-b editorial-rule px-6 py-4">
        <Link
          to="/admin"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Studio
        </Link>
        <div className="h-4 w-px bg-foreground/20" />
        <span className="font-display text-xl">Auth setup</span>
        <span className="ml-auto text-[11px] uppercase tracking-widest text-muted-foreground">
          White-label OAuth
        </span>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <section className="rounded border editorial-rule p-5">
          <h1 className="font-display text-2xl">Use your own OAuth apps</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">
            This controls whose name appears on the provider's consent screen (e.g. "Simulator wants
            to access your Instagram"). Register an OAuth app with each provider, add the redirect
            URI below, then paste its client ID and secret here.
          </p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded border editorial-rule p-3">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                1. Register the app
              </p>
              <p className="mt-1 text-foreground/70">
                Use the provider console link on each card. Add your logo, name and scopes.
              </p>
            </div>
            <div className="rounded border editorial-rule p-3">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                2. Redirect URI
              </p>
              <p className="mt-1 text-foreground/70">
                Whitelist the exact URI shown on the card (Composio's shared callback).
              </p>
            </div>
            <div className="rounded border editorial-rule p-3">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                3. Paste credentials
              </p>
              <p className="mt-1 text-foreground/70">
                Client ID + secret are sent to Composio once and never stored in this app.
              </p>
            </div>
          </div>
          <p className="mt-4 flex items-start gap-2 rounded border border-amber-300/60 bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-900">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              The "Secured by Composio" page is Composio's hosted connect page. With your own OAuth
              app we start authorization directly, so that page and its badge never appear — for
              Instagram, Facebook, LinkedIn and TikTok (X additionally needs its Application Bearer
              Token in the extra-credentials field). The provider's own sign-in/consent screens
              still appear, and Composio's callback still shows in the address bar.
            </span>
          </p>
        </section>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading auth setup...</p>
        ) : (
          <div className="space-y-4">
            {setups.map((s) => {
              const isOpen = openPlatform === s.platform;
              return (
                <section key={s.platform} className="rounded border editorial-rule">
                  <div className="flex flex-wrap items-center gap-3 border-b editorial-rule px-5 py-4">
                    <PlatformBadge platform={s.platform} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.provider.label}</p>
                      <p className="truncate text-[11px] uppercase tracking-widest text-muted-foreground">
                        toolkit: {s.toolkit}
                        {s.authConfigId ? ` · ${s.authConfigId}` : " · not configured"}
                      </p>
                    </div>
                    <span
                      className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        s.custom
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-gray-50 text-gray-600"
                      }`}
                    >
                      {s.custom ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" /> Your OAuth app
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" /> Composio-managed
                        </>
                      )}
                    </span>
                  </div>

                  <div className="space-y-3 px-5 py-4">
                    {s.provisioningError && (
                      <p className="rounded border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700">
                        Last attempt failed: {s.provisioningError}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Redirect URI</span>
                      <code className="max-w-full overflow-x-auto rounded bg-foreground/5 px-2 py-1 font-mono text-[11px]">
                        {s.redirectUri || s.callback}
                      </code>
                      <button
                        type="button"
                        onClick={() => copy(s.redirectUri || s.callback)}
                        className="inline-flex items-center gap-1 rounded-sm border editorial-rule px-2 py-1 hover:bg-foreground/5"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                      <a
                        href={s.provider.consoleUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-sm border editorial-rule px-2 py-1 hover:bg-foreground/5"
                      >
                        <ExternalLink className="h-3 w-3" /> Provider console
                      </a>
                    </div>

                    <p className="text-[12px] leading-relaxed text-muted-foreground">
                      {s.provider.note}
                    </p>

                    {s.custom && (
                      <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          {s.appName ?? "Custom app"}
                        </span>
                        {s.scopes && <span>· scopes: {s.scopes}</span>}
                        {s.provisionedAt && (
                          <span>· set {new Date(s.provisionedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => (isOpen ? setOpenPlatform(null) : openForm(s))}
                        className="inline-flex items-center gap-1.5 rounded-sm border editorial-rule px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        {s.custom ? "Replace credentials" : "Use my own OAuth app"}
                      </button>
                      {s.custom && (
                        <button
                          type="button"
                          onClick={() => revert(s)}
                          disabled={busy === s.platform}
                          className="inline-flex items-center gap-1.5 rounded-sm border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Use Composio-managed
                        </button>
                      )}
                    </div>

                    {isOpen && (
                      <form
                        className="mt-2 space-y-3 rounded border editorial-rule bg-foreground/[0.02] p-4"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void submit(s);
                        }}
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block">
                            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                              App name on consent screen
                            </span>
                            <input
                              value={form.appName}
                              onChange={(e) => setForm({ ...form, appName: e.target.value })}
                              placeholder="Simulator"
                              className="mt-1 w-full rounded-sm border editorial-rule bg-background px-3 py-2 text-sm"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                              Scopes (optional)
                            </span>
                            <input
                              value={form.scopes}
                              onChange={(e) => setForm({ ...form, scopes: e.target.value })}
                              placeholder="e.g. instagram_basic,instagram_content_publish"
                              className="mt-1 w-full rounded-sm border editorial-rule bg-background px-3 py-2 text-sm"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                              Client ID
                            </span>
                            <input
                              value={form.clientId}
                              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                              autoComplete="off"
                              className="mt-1 w-full rounded-sm border editorial-rule bg-background px-3 py-2 font-mono text-sm"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                              Client secret
                            </span>
                            <input
                              type="password"
                              value={form.clientSecret}
                              onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
                              autoComplete="new-password"
                              className="mt-1 w-full rounded-sm border editorial-rule bg-background px-3 py-2 font-mono text-sm"
                            />
                          </label>
                          <label className="block sm:col-span-2">
                            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                              Redirect URI (must match the provider exactly)
                            </span>
                            <input
                              value={form.redirectUri}
                              onChange={(e) => setForm({ ...form, redirectUri: e.target.value })}
                              className="mt-1 w-full rounded-sm border editorial-rule bg-background px-3 py-2 font-mono text-[12px]"
                            />
                          </label>
                          <div className="sm:col-span-2">
                            {requiredFields.length > 0 && (
                              <p className="mb-2 text-[11px] text-muted-foreground">
                                Toolkit requires: {requiredFields.join(", ")}
                                {requiredFields.some(
                                  (f) => !["client_id", "client_secret"].includes(f),
                                )
                                  ? " — add the extra fields as JSON below, or this platform will fall back to Composio's hosted page."
                                  : ""}
                              </p>
                            )}
                            <label className="block">
                              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                                Extra credentials (JSON, only if required above)
                              </span>
                              <textarea
                                value={form.extra}
                                onChange={(e) => setForm({ ...form, extra: e.target.value })}
                                rows={2}
                                placeholder='{"generic_id":"your X Application Bearer Token"}'
                                className="mt-1 w-full resize-none rounded-sm border editorial-rule bg-background px-3 py-2 font-mono text-[11px]"
                              />
                            </label>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] text-muted-foreground">
                            The secret is sent to Composio and never stored by us.
                          </p>
                          <button
                            type="submit"
                            disabled={busy === s.platform}
                            className="inline-flex items-center gap-1.5 rounded-sm bg-foreground px-3 py-1.5 text-xs font-medium text-background disabled:opacity-50"
                          >
                            {busy === s.platform ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ArrowRight className="h-3.5 w-3.5" />
                            )}
                            Save auth config
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Existing connections keep working when you switch apps; those accounts were authorized
          under the old app, so reconnect them to show the new consent identity. Full step-by-step
          notes live in <code>docs/white-label-auth.md</code>.
        </p>
      </div>
    </main>
  );
}

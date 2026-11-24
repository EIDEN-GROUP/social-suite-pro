import { Composio } from "@composio/core";
import type { Platform } from "@/lib/types";

/**
 * Server-only Composio wrapper.
 *
 * Everything here runs on the server. The Composio API key and any provider
 * tokens never reach the browser. Connected-account reads are redacted by
 * Composio; we only persist non-secret display metadata.
 */

export const PLATFORM_TOOLKIT: Record<Platform, string> = {
  instagram: "instagram",
  tiktok: "tiktok",
  facebook: "facebook",
  twitter: "twitter",
  linkedin: "linkedin",
};

/** Composio user id for an internal client. One namespace per client, so one
 *  client's authorization can never resolve into another client's context. */
export function composioUserId(companyId: string): string {
  return `client_${companyId}`;
}

export function isComposioConfigured(): boolean {
  return Boolean(process.env.COMPOSIO_API_KEY);
}

let _client: Composio | undefined;
export function composio(): Composio {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) throw new Error("Composio is not configured (COMPOSIO_API_KEY is missing).");
  if (!_client) _client = new Composio({ apiKey });
  return _client;
}

/** Optional pinned toolkit version (Composio requires one for manual execution). */
export function toolkitVersion(toolkit: string): string | undefined {
  return process.env[`COMPOSIO_TOOLKIT_VERSION_${toolkit.toUpperCase()}`] || undefined;
}

// ---------------------------------------------------------------------------
// Auth config resolution (DB first, env fallback, then created managed config)
// ---------------------------------------------------------------------------

export async function getAuthConfigId(
  platform: Platform,
  opts: { create?: boolean } = {},
): Promise<string> {
  const toolkit = PLATFORM_TOOLKIT[platform];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: row } = await supabaseAdmin
    .from("integration_configs")
    .select("auth_config_id")
    .eq("platform", platform)
    .maybeSingle();
  if (row?.auth_config_id) return row.auth_config_id;

  const envId = process.env[`COMPOSIO_AUTH_CONFIG_${platform.toUpperCase()}`];
  if (envId) {
    await persistAuthConfig(platform, toolkit, envId);
    return envId;
  }

  if (!opts.create) {
    throw new Error(
      `No Composio auth config is configured for ${platform}. Add one in the dashboard or set COMPOSIO_AUTH_CONFIG_${platform.toUpperCase()}.`,
    );
  }

  const created = (await composio().authConfigs.create(toolkit, {
    type: "use_composio_managed_auth",
    name: `Simulator ${platform}`,
  } as never)) as { id?: string };
  const id = created?.id;
  if (!id) throw new Error("Composio did not return an auth config id.");
  await persistAuthConfig(platform, toolkit, id);
  return id;
}

async function persistAuthConfig(platform: Platform, toolkit: string, authConfigId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("integration_configs")
    .upsert(
      { platform, toolkit, auth_config_id: authConfigId, enabled: true },
      { onConflict: "platform" },
    );
}

// ---------------------------------------------------------------------------
// White-label OAuth (bring your own OAuth app)
// ---------------------------------------------------------------------------

/**
 * The redirect URI Composio asks the OAuth provider to call back. Register this
 * exact URL in each provider's developer console when using your own OAuth app.
 * @see https://docs.composio.dev/docs/authentication/programmatic-auth-configs
 */
export const COMPOSIO_OAUTH_CALLBACK = "https://backend.composio.dev/api/v3/toolkits/auth/callback";

/** Where a team registers the OAuth app for each platform. */
export const AUTH_PROVIDER_META: Record<
  Platform,
  { toolkit: string; label: string; consoleUrl: string; note: string }
> = {
  instagram: {
    toolkit: "instagram",
    label: "Instagram (via Meta)",
    consoleUrl: "https://developers.facebook.com/apps/",
    note: "Needs a Meta app with the Instagram Graph API product and a Business/Creator account linked to a Page.",
  },
  facebook: {
    toolkit: "facebook",
    label: "Facebook (Meta app)",
    consoleUrl: "https://developers.facebook.com/apps/",
    note: "Same Meta app as Instagram; enable Facebook Login and request pages_* permissions.",
  },
  linkedin: {
    toolkit: "linkedin",
    label: "LinkedIn",
    consoleUrl: "https://www.linkedin.com/developers/apps",
    note: "Request the 'Share on LinkedIn' and 'Sign In with LinkedIn using OpenID Connect' products.",
  },
  twitter: {
    toolkit: "twitter",
    label: "X (Twitter)",
    consoleUrl: "https://developer.x.com/en/portal/dashboard",
    note: "Needs OAuth 2.0 enabled with read+write scopes and a public client.",
  },
  tiktok: {
    toolkit: "tiktok",
    label: "TikTok",
    consoleUrl: "https://developers.tiktok.com/apps/",
    note: "Publishing needs the Content Posting API approved for your app (sandbox apps can't publish).",
  },
};

export type AuthMode = "managed" | "custom";

export type AuthConfigInfo = {
  platform: Platform;
  toolkit: string;
  authConfigId: string | null;
  /** True when using our own OAuth app credentials. */
  custom: boolean;
  appName: string | null;
  redirectUri: string;
  scopes: string | null;
  provisionedAt: string | null;
  provisioningError: string | null;
};

/** Reads the stored auth config for a platform (DB first, env fallback). */
export async function getAuthConfigInfo(platform: Platform): Promise<AuthConfigInfo> {
  const toolkit = PLATFORM_TOOLKIT[platform];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("integration_configs")
    .select(
      "auth_config_id, auth_mode, oauth_redirect_uri, scopes, app_name, provisioned_at, provisioning_error",
    )
    .eq("platform", platform)
    .maybeSingle();

  const envId = process.env[`COMPOSIO_AUTH_CONFIG_${platform.toUpperCase()}`] || null;
  const authConfigId = data?.auth_config_id || envId;
  // Only the DB flag marks a config as "our own app"; env ids may still be
  // Composio-managed, so they default to managed to keep the hosted link path.
  const mode = (data?.auth_mode as AuthMode | undefined) ?? "managed";

  return {
    platform,
    toolkit,
    authConfigId,
    custom: mode === "custom",
    appName: (data?.app_name as string | null) ?? null,
    redirectUri: (data?.oauth_redirect_uri as string | null) ?? COMPOSIO_OAUTH_CALLBACK,
    scopes: (data?.scopes as string | null) ?? null,
    provisionedAt: (data?.provisioned_at as string | null) ?? null,
    provisioningError: (data?.provisioning_error as string | null) ?? null,
  };
}

/**
 * Creates (or replaces) a custom OAuth2 auth config using the team's own OAuth
 * app credentials, then stores the resulting `ac_...` id. The client secret is
 * sent to Composio and never persisted here.
 */
export async function createCustomOAuthConfig(params: {
  platform: Platform;
  appName: string;
  clientId: string;
  clientSecret: string;
  scopes?: string;
  redirectUri?: string;
  /** Extra credential fields some toolkits require (e.g. X's bearer token). */
  extra?: Record<string, string>;
}): Promise<{ authConfigId: string }> {
  const toolkit = PLATFORM_TOOLKIT[params.platform];
  const redirectUri = params.redirectUri?.trim() || COMPOSIO_OAUTH_CALLBACK;
  const credentials: Record<string, string> = { ...(params.extra ?? {}) };
  // Authoritative values last so extras can never shadow them.
  credentials.client_id = params.clientId;
  credentials.client_secret = params.clientSecret;
  credentials.oauth_redirect_uri = redirectUri;
  const scopes = params.scopes?.trim();
  if (scopes) credentials.scopes = scopes;

  const created = await composio().authConfigs.create(toolkit, {
    type: "use_custom_auth",
    authScheme: "OAUTH2",
    name: params.appName,
    credentials,
  });
  const authConfigId = (created as { id?: string }).id;
  if (!authConfigId) throw new Error("Composio did not return an auth config id.");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("integration_configs").upsert(
    {
      platform: params.platform,
      toolkit,
      auth_config_id: authConfigId,
      auth_mode: "custom",
      oauth_redirect_uri: redirectUri,
      scopes: scopes || null,
      app_name: params.appName,
      enabled: true,
      provisioned_at: new Date().toISOString(),
      provisioning_error: null,
    },
    { onConflict: "platform" },
  );
  if (error) throw new Error(error.message);

  return { authConfigId };
}

/**
 * Switches a platform back to Composio-managed auth. Best-effort deletes the
 * remote custom config (it may already be gone) and clears local state so the
 * next connect creates/reuses a managed config.
 */
export async function clearCustomOAuthConfig(platform: Platform): Promise<void> {
  const info = await getAuthConfigInfo(platform);
  if (info.custom && info.authConfigId) {
    try {
      await (
        composio() as unknown as {
          authConfigs: { delete: (id: string) => Promise<unknown> };
        }
      ).authConfigs.delete(info.authConfigId);
    } catch {
      /* leave it in the dashboard if the API refuses; local state still clears */
    }
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("integration_configs").upsert(
    {
      platform,
      toolkit: PLATFORM_TOOLKIT[platform],
      auth_config_id: null,
      auth_mode: "managed",
      oauth_redirect_uri: null,
      scopes: null,
      app_name: null,
      provisioned_at: null,
      provisioning_error: null,
    },
    { onConflict: "platform" },
  );
}

/** Which credential fields the toolkit needs for a custom OAuth2 config. */
export async function getOAuthCredentialFields(platform: Platform): Promise<string[]> {
  try {
    const fields = await (
      composio() as unknown as {
        toolkits: {
          getAuthConfigCreationFields: (
            toolkit: string,
            scheme: string,
            opts?: { requiredOnly?: boolean },
          ) => Promise<Array<{ name?: string }> | { fields?: Array<{ name?: string }> }>;
        };
      }
    ).toolkits.getAuthConfigCreationFields(PLATFORM_TOOLKIT[platform], "OAUTH2", {
      requiredOnly: true,
    });
    const list = Array.isArray(fields) ? fields : (fields?.fields ?? []);
    return list.map((f) => String(f?.name ?? "")).filter(Boolean);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Connection lifecycle
// ---------------------------------------------------------------------------

export async function createConnectionLink(
  companyId: string,
  platform: Platform,
  callbackUrl: string,
): Promise<{ redirectUrl: string; connectionRequestId: string }> {
  const authConfigId = await getAuthConfigId(platform, { create: true });
  const request = await composio().connectedAccounts.link(composioUserId(companyId), authConfigId, {
    callbackUrl,
    // Allow more than one connected account per client/platform (e.g. multiple
    // Instagram/Facebook accounts) instead of failing with "Multiple connected
    // accounts found".
    allowMultiple: true,
  });
  const redirectUrl = (request as { redirectUrl?: string }).redirectUrl;
  const connectionRequestId = (request as { id?: string }).id ?? "";
  if (!redirectUrl) throw new Error("Composio did not return a redirect URL.");
  return { redirectUrl, connectionRequestId };
}

export type ConnectionStart = {
  redirectUrl: string;
  connectionRequestId: string;
  mode: AuthMode;
  /** true when the redirect points straight at the provider (no hosted page). */
  direct: boolean;
};

/**
 * Starts a connection. With a custom OAuth app we initiate the flow ourselves so
 * Composio's hosted Connect Link page is skipped and the browser goes straight to
 * the provider; otherwise we fall back to the hosted Connect Link.
 */
export async function startConnection(
  companyId: string,
  platform: Platform,
  callbackUrl: string,
): Promise<ConnectionStart> {
  const info = await getAuthConfigInfo(platform);
  const authConfigId = info.authConfigId ?? (await getAuthConfigId(platform, { create: true }));

  if (info.custom) {
    try {
      const request = await composio().connectedAccounts.initiate(
        composioUserId(companyId),
        authConfigId,
        {
          callbackUrl,
          allowMultiple: true,
          // Ask for the unshortened provider URL so we can navigate directly.
          config: {
            authScheme: "OAUTH2",
            val: { status: "INITIALIZING", long_redirect_url: true },
          },
        } as never,
      );
      const redirectUrl = (request as { redirectUrl?: string }).redirectUrl;
      const connectionRequestId = (request as { id?: string }).id ?? "";
      if (redirectUrl) {
        return { redirectUrl, connectionRequestId, mode: "custom", direct: true };
      }
    } catch {
      /* fall through to the hosted Connect Link */
    }
  }

  const link = await createConnectionLink(companyId, platform, callbackUrl);
  return {
    redirectUrl: link.redirectUrl,
    connectionRequestId: link.connectionRequestId,
    mode: "managed",
    direct: false,
  };
}

export type NormalizedConnectedAccount = {
  connectedAccountId: string;
  status: string;
  toolkit: string;
  externalAccountId: string | null;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  accountType: string | null;
  raw: Record<string, unknown>;
};

function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

/**
 * Composio's connected-account payload shape has varied across versions, so
 * normalise defensively instead of trusting one field layout.
 */
function normalizeConnectedAccount(item: unknown): NormalizedConnectedAccount | null {
  if (!item || typeof item !== "object") return null;
  const raw = item as Record<string, unknown>;
  const toolkitObj = raw.toolkit as Record<string, unknown> | undefined;
  const accountData = (raw.data ?? raw.params ?? raw.account ?? {}) as Record<string, unknown>;

  const connectedAccountId = String(pick(raw, "id", "nanoid", "connectedAccountId") ?? "");
  if (!connectedAccountId) return null;

  return {
    connectedAccountId,
    status: String(pick(raw, "status", "state") ?? "connected"),
    toolkit: String(pick(toolkitObj ?? {}, "slug", "name") ?? pick(raw, "toolkitSlug") ?? ""),
    externalAccountId:
      (
        pick(accountData, "id", "account_id", "user_id", "ig_user_id", "page_id") as
          string | undefined
      )?.toString() ?? null,
    displayName: String(
      pick(accountData, "name", "display_name", "page_name", "username") ?? "Connected account",
    ),
    username:
      (pick(accountData, "username", "screen_name", "handle") as string | undefined) ?? null,
    avatarUrl:
      (pick(accountData, "avatar_url", "profile_pic_url", "picture") as string | undefined) ?? null,
    accountType: (pick(raw, "accountType", "account_type", "type") as string | undefined) ?? null,
    raw,
  };
}

export async function listConnectedAccounts(
  companyId: string,
  toolkit?: string,
): Promise<NormalizedConnectedAccount[]> {
  const userId = composioUserId(companyId);
  const query = toolkit ? { userIds: [userId], toolkitSlugs: [toolkit] } : { userIds: [userId] };
  const res = await composio().connectedAccounts.list(query);
  const items = (res as { items?: unknown[] }).items ?? [];
  return items
    .map(normalizeConnectedAccount)
    .filter((a): a is NormalizedConnectedAccount => a !== null);
}

export async function getConnectedAccount(
  connectedAccountId: string,
): Promise<NormalizedConnectedAccount | null> {
  const res = await composio().connectedAccounts.get(connectedAccountId);
  return normalizeConnectedAccount(res);
}

export async function deleteConnectedAccount(connectedAccountId: string): Promise<void> {
  await composio().connectedAccounts.delete(connectedAccountId);
}

/** Ask the provider to refresh a connection's credentials (when supported). */
export async function refreshConnectedAccount(connectedAccountId: string): Promise<void> {
  await composio().connectedAccounts.refresh(connectedAccountId);
}

// ---------------------------------------------------------------------------
// Capability discovery: the real available action slugs for a toolkit
// ---------------------------------------------------------------------------

export async function listToolkitToolSlugs(toolkit: string): Promise<string[]> {
  const tools = await composio().tools.getRawComposioTools({ toolkits: [toolkit], limit: 1000 });
  const list = Array.isArray(tools) ? tools : ((tools as { items?: unknown[] }).items ?? []);
  return list
    .map((t) => (t as { slug?: string }).slug)
    .filter((s): s is string => typeof s === "string");
}

// ---------------------------------------------------------------------------
// Publishing destinations (e.g. which Facebook Page to post to)
// ---------------------------------------------------------------------------

export type Destination = { id: string; name: string };

function numOrNull(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}
function strOrNull(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

export type AccountStats = {
  followers: number | null;
  mediaCount: number | null;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
};

/**
 * Fetches account-level stats (followers / post count) from the provider.
 * Only Instagram and Facebook expose these reliably; other platforms return null.
 */
export async function getAccountStats(params: {
  companyId: string;
  platform: Platform;
  connectedAccountId: string;
  externalAccountId: string | null;
}): Promise<AccountStats | null> {
  try {
    if (params.platform === "instagram") {
      const r = await executeTool({
        slug: "INSTAGRAM_GET_USER_INFO",
        companyId: params.companyId,
        connectedAccountId: params.connectedAccountId,
        // Followers/counts are only returned for the authenticated profile ("me").
        arguments: {
          ig_user_id: "me",
          fields: "id,username,name,followers_count,media_count,profile_picture_url",
        },
        toolkit: "instagram",
      });
      if (!r.successful || !r.data) return null;
      const d = r.data as Record<string, unknown>;
      return {
        followers: numOrNull(d.followers_count),
        mediaCount: numOrNull(d.media_count),
        username: strOrNull(d.username),
        name: strOrNull(d.name),
        avatarUrl: strOrNull(d.profile_picture_url),
      };
    }

    if (params.platform === "facebook") {
      if (!params.externalAccountId) return null;
      const r = await executeTool({
        slug: "FACEBOOK_GET_PAGE_DETAILS",
        companyId: params.companyId,
        connectedAccountId: params.connectedAccountId,
        arguments: {
          page_id: params.externalAccountId,
          fields: "id,name,username,fan_count,followers_count,picture",
        },
        toolkit: "facebook",
      });
      if (!r.successful || !r.data) return null;
      const d = r.data as Record<string, unknown>;
      return {
        followers: numOrNull(d.followers_count ?? d.fan_count),
        mediaCount: null,
        username: strOrNull(d.username),
        name: strOrNull(d.name),
        avatarUrl: null,
      };
    }

    if (params.platform === "linkedin") {
      // Only company pages expose follower stats; personal profiles don't.
      const urn = params.externalAccountId;
      if (!urn || !/^urn:li:organization:/i.test(urn)) return null;
      const r = await executeTool({
        slug: "LINKEDIN_GET_ORG_PAGE_STATS",
        companyId: params.companyId,
        connectedAccountId: params.connectedAccountId,
        arguments: { organization: urn, timeGranularityType: "DAY" },
        toolkit: "linkedin",
      });
      if (!r.successful || !r.data) return null;
      return {
        followers:
          deepFindNumber(r.data, "followerCount") ??
          deepFindNumber(r.data, "followersCount") ??
          deepFindNumber(r.data, "totalFollowerCount"),
        mediaCount: null,
        username: null,
        name: null,
        avatarUrl: null,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/** Recursively collect {id,name} pairs from a provider response of unknown shape. */
function extractDestinations(value: unknown): Destination[] {
  const out: Destination[] = [];
  const seen = new Set<string>();
  const visit = (v: unknown) => {
    if (!v) return;
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item && typeof item === "object") {
          const rec = item as Record<string, unknown>;
          const id = rec.id;
          if (typeof id === "string" && id) {
            if (!seen.has(id)) {
              seen.add(id);
              out.push({ id, name: String(rec.name ?? rec.username ?? id) });
            }
          }
        }
      }
      return;
    }
    if (typeof v === "object") {
      const rec = v as Record<string, unknown>;
      for (const key of ["data", "items", "pages", "accounts"]) visit(rec[key]);
    }
  };
  visit(value);
  return out;
}

/** Lists the LinkedIn company pages the member administers (best effort). */
export async function listLinkedInOrganizations(
  _companyId: string,
  connectedAccountId: string,
): Promise<Destination[]> {
  try {
    // LinkedIn's org ACL endpoint returns the pages this member administers.
    // Requires r_organization_admin; when the token lacks it we return [] and
    // the team can enter the organization id manually instead.
    const res = (await composio().tools.proxyExecute({
      endpoint:
        "organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~(id,localizedName,vanityName)))",
      method: "GET",
      connectedAccountId,
    })) as { data?: unknown };
    const out: Destination[] = [];
    const seen = new Set<string>();
    const walk = (v: unknown) => {
      if (!v) return;
      if (Array.isArray(v)) {
        for (const item of v) walk(item);
        return;
      }
      if (typeof v !== "object") return;
      const rec = v as Record<string, unknown>;
      const target = (rec.organizationalTarget ?? rec) as Record<string, unknown>;
      const id = target.id;
      if ((typeof id === "string" || typeof id === "number") && String(id)) {
        const urn = String(id).startsWith("urn:") ? String(id) : `urn:li:organization:${id}`;
        if (!seen.has(urn)) {
          seen.add(urn);
          out.push({
            id: urn,
            name: String(target.localizedName ?? target.vanityName ?? urn),
          });
        }
      }
      for (const val of Object.values(rec)) walk(val);
    };
    walk(res.data);
    return out;
  } catch {
    return [];
  }
}

/** Lists the Facebook Pages the connected account manages. */
export async function listFacebookPages(
  companyId: string,
  connectedAccountId: string,
): Promise<Destination[]> {
  try {
    const result = await executeTool({
      slug: "FACEBOOK_LIST_MANAGED_PAGES",
      companyId,
      connectedAccountId,
      arguments: {},
      toolkit: "facebook",
    });
    if (!result.successful) return [];
    return extractDestinations(result.data);
  } catch {
    return [];
  }
}

/** Resolves the Instagram account (IG user id) for a connection. */
export async function getInstagramAccount(
  companyId: string,
  connectedAccountId: string,
): Promise<Destination | null> {
  // 1) Ask the Instagram Graph for the authenticated account.
  try {
    const res = (await composio().tools.proxyExecute({
      endpoint: "me?fields=id,username,name",
      method: "GET",
      connectedAccountId,
    })) as { data?: Record<string, unknown> };
    const d = res.data ?? {};
    const id = d.id as string | undefined;
    if (id) return { id: String(id), name: String(d.username ?? d.name ?? id) };
  } catch {
    /* fall through to the toolkit action */
  }

  // 2) Fallback to the toolkit action with ig_user_id="me".
  try {
    const result = await executeTool({
      slug: "INSTAGRAM_GET_USER_INFO",
      companyId,
      connectedAccountId,
      arguments: { ig_user_id: "me", fields: "id,username" },
      toolkit: "instagram",
    });
    if (result.successful && result.data) {
      const d = result.data as Record<string, unknown>;
      const id = d.id as string | undefined;
      if (id) return { id: String(id), name: String(d.username ?? id) };
    }
  } catch {
    /* connection not usable */
  }
  return null;
}

/** Resolves the LinkedIn member URN that posts should be authored by. */
export async function getLinkedInAuthor(
  companyId: string,
  connectedAccountId: string,
): Promise<{ urn: string; name: string } | null> {
  try {
    const result = await executeTool({
      slug: "LINKEDIN_GET_MY_INFO",
      companyId,
      connectedAccountId,
      arguments: {},
      toolkit: "linkedin",
    });
    if (!result.successful || !result.data) return null;
    const d = result.data as Record<string, unknown>;
    const id = (d.id ?? d.sub) as string | undefined;
    if (!id) return null;
    const urn = id.startsWith("urn:li:") ? id : `urn:li:person:${id}`;
    const name =
      `${String(d.localizedFirstName ?? "")} ${String(d.localizedLastName ?? "")}`.trim() ||
      String(d.vanityName ?? "LinkedIn");
    return { urn, name };
  } catch {
    return null;
  }
}

/** Uploads a media URL to Composio so it can be attached to a tool call. */
export async function uploadMedia(
  url: string,
  opts: { toolSlug?: string; toolkitSlug?: string } = {},
): Promise<{ name: string; mimetype: string; s3key: string }> {
  const data = await composio().files.upload({
    file: url,
    toolSlug: opts.toolSlug ?? "LINKEDIN_CREATE_LINKED_IN_POST",
    toolkitSlug: opts.toolkitSlug ?? "linkedin",
  });
  return { name: data.name, mimetype: data.mimetype, s3key: data.s3key };
}

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

export type ToolResult = { successful: boolean; data: unknown; error: string | null };

export type PostEngagement = {
  likes: number | null;
  comments: number | null;
  reach: number | null;
  impressions: number | null;
};

/** Recursively finds a numeric metric by name in a provider response. */
function deepFindNumber(value: unknown, key: string): number | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    for (const v of value) {
      const f = deepFindNumber(v, key);
      if (f != null) return f;
    }
    return null;
  }
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    if (key in rec) {
      const n = numOrNull(rec[key]);
      if (n != null) return n;
    }
    if (rec.name === key && Array.isArray(rec.values)) {
      const v0 = rec.values[0] as Record<string, unknown> | undefined;
      if (v0) {
        const n = numOrNull(v0.value);
        if (n != null) return n;
      }
    }
    for (const v of Object.values(rec)) {
      const f = deepFindNumber(v, key);
      if (f != null) return f;
    }
  }
  return null;
}

/** Fetches per-post engagement (likes/reach/impressions) for IG or Facebook. */
export async function getPostEngagement(params: {
  companyId: string;
  platform: Platform;
  connectedAccountId: string;
  externalPostId: string;
}): Promise<PostEngagement | null> {
  try {
    if (params.platform === "instagram") {
      const media = await executeTool({
        slug: "INSTAGRAM_GET_IG_MEDIA",
        companyId: params.companyId,
        connectedAccountId: params.connectedAccountId,
        arguments: { ig_media_id: params.externalPostId, fields: "id,like_count,comments_count" },
        toolkit: "instagram",
      });
      const d = (media.data ?? {}) as Record<string, unknown>;
      let reach: number | null = null;
      try {
        const ins = await executeTool({
          slug: "INSTAGRAM_GET_IG_MEDIA_INSIGHTS",
          companyId: params.companyId,
          connectedAccountId: params.connectedAccountId,
          arguments: { ig_media_id: params.externalPostId, metric: ["reach"] },
          toolkit: "instagram",
        });
        reach = deepFindNumber(ins.data, "reach");
      } catch {
        reach = null;
      }
      return {
        likes: numOrNull(d.like_count),
        comments: numOrNull(d.comments_count),
        reach,
        impressions: null,
      };
    }

    if (params.platform === "facebook") {
      const r = await executeTool({
        slug: "FACEBOOK_GET_POST_INSIGHTS",
        companyId: params.companyId,
        connectedAccountId: params.connectedAccountId,
        arguments: {
          post_id: params.externalPostId,
          metrics: "post_impressions,post_reactions_by_type_total",
        },
        toolkit: "facebook",
      });
      return {
        likes: null,
        comments: null,
        reach: null,
        impressions: deepFindNumber(r.data, "post_impressions"),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function executeTool(params: {
  slug: string;
  companyId: string;
  connectedAccountId: string;
  arguments: Record<string, unknown>;
  toolkit: string;
}): Promise<ToolResult> {
  const version = toolkitVersion(params.toolkit);
  const body: Record<string, unknown> = {
    userId: composioUserId(params.companyId),
    connectedAccountId: params.connectedAccountId,
    arguments: params.arguments,
  };
  if (version) body.version = version;
  else body.dangerouslySkipVersionCheck = true;

  const res = (await composio().tools.execute(params.slug, body as never)) as {
    data?: unknown;
    error?: unknown;
    successful?: boolean;
  };

  const error =
    res.error == null
      ? null
      : typeof res.error === "string"
        ? res.error
        : JSON.stringify(res.error);
  const successful = res.successful ?? error == null;
  return { successful, data: res.data ?? null, error };
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export async function verifyWebhook(params: {
  id: string | null;
  signature: string | null;
  timestamp: string | null;
  payload: string;
}): Promise<unknown> {
  const secret = process.env.COMPOSIO_WEBHOOK_SECRET;
  if (!secret) throw new Error("COMPOSIO_WEBHOOK_SECRET is not configured.");
  return composio().triggers.verifyWebhook({
    id: params.id ?? "",
    signature: params.signature ?? "",
    timestamp: params.timestamp ?? "",
    payload: params.payload,
    secret,
  });
}

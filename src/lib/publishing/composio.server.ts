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
    name: `SMimulator ${platform}`,
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

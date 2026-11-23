import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Platform } from "@/lib/types";

/**
 * Social-connection server functions.
 *
 * Every handler verifies the caller is a superadmin before touching the
 * service-role client. The Composio key and provider tokens never leave the
 * server (connection reads redact credentials).
 */

const PLATFORMS = ["instagram", "tiktok", "facebook", "twitter", "linkedin"] as const;

function mapStatus(
  raw: string,
): "connected" | "attention_required" | "expired" | "disconnected" | "error" {
  const s = raw.toUpperCase();
  if (s === "ACTIVE" || s === "CONNECTED") return "connected";
  if (s === "EXPIRED") return "expired";
  if (s === "FAILED" || s === "ERROR") return "error";
  if (s === "INITIALIZING" || s === "INITIATED" || s === "PENDING") return "attention_required";
  return "attention_required";
}

export const platformAvailability = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({}).parse(input ?? {}))
  .handler(async () => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { isComposioConfigured } = await import("@/lib/publishing/composio.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("integration_configs")
      .select("platform, auth_config_id, enabled");
    const configs = new Map((data ?? []).map((c) => [c.platform, c]));
    return {
      configured: isComposioConfigured(),
      platforms: PLATFORMS.map((p) => ({
        platform: p,
        configured:
          Boolean(configs.get(p)?.auth_config_id) ||
          Boolean(process.env[`COMPOSIO_AUTH_CONFIG_${p.toUpperCase()}`]),
        enabled: configs.get(p)?.enabled ?? true,
      })),
    };
  });

export const listSocialAccounts = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({ companyId: z.string().uuid().optional() })
      .optional()
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("social_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data?.companyId) query = query.eq("company_id", data.companyId);
    const { data: accounts, error } = await query;
    if (error) throw new Error(error.message);

    const companyIds = Array.from(new Set((accounts ?? []).map((a) => a.company_id)));
    const { data: companies } = companyIds.length
      ? await supabaseAdmin
          .from("companies")
          .select("id, name, slug, accent_color")
          .in("id", companyIds)
      : { data: [] as { id: string; name: string; slug: string; accent_color: string }[] };
    const byId = new Map((companies ?? []).map((c) => [c.id, c]));

    return {
      accounts: (accounts ?? []).map((a) => ({ ...a, company: byId.get(a.company_id) ?? null })),
    };
  });

export const getConnectionLink = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ companyId: z.string().uuid(), platform: z.enum(PLATFORMS) }).parse(input),
  )
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { createConnectionLink } = await import("@/lib/publishing/composio.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const requestOrigin = request ? new URL(request.url).origin : "";
    const base = (process.env.APP_BASE_URL || requestOrigin).replace(/\/$/, "");
    if (!base) throw new Error("Could not determine the app base URL for the OAuth callback.");
    const callbackUrl = `${base}/admin/connect?connected=1&company=${data.companyId}&platform=${data.platform}`;
    return createConnectionLink(data.companyId, data.platform as Platform, callbackUrl);
  });

/**
 * Pulls the client's connected accounts from Composio and reconciles them into
 * social_accounts, refreshing status + capabilities.
 */
export const syncSocialAccounts = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ companyId: z.string().uuid(), platform: z.enum(PLATFORMS).optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { listConnectedAccounts, listToolkitToolSlugs, PLATFORM_TOOLKIT, composioUserId } =
      await import("@/lib/publishing/composio.server");
    const { canPublishFor } = await import("@/lib/publishing/platforms");

    const toolkit = data.platform ? PLATFORM_TOOLKIT[data.platform as Platform] : undefined;
    const remote = await listConnectedAccounts(data.companyId, toolkit);

    // Cache capability slugs per toolkit once per sync.
    const capCache = new Map<string, string[]>();
    async function capsFor(tk: string): Promise<string[]> {
      if (!capCache.has(tk)) capCache.set(tk, await listToolkitToolSlugs(tk));
      return capCache.get(tk)!;
    }

    const toolkitToPlatform = new Map(
      (Object.entries(PLATFORM_TOOLKIT) as [Platform, string][]).map(([p, t]) => [t, p]),
    );

    let upserted = 0;
    for (const acct of remote) {
      const platform = toolkitToPlatform.get(acct.toolkit);
      if (!platform) continue;
      const capabilities = await capsFor(acct.toolkit);
      const status = mapStatus(acct.status);
      const { error } = await supabaseAdmin.from("social_accounts").upsert(
        {
          company_id: data.companyId,
          platform,
          composio_user_id: composioUserId(data.companyId),
          connected_account_id: acct.connectedAccountId,
          external_account_id: acct.externalAccountId,
          display_name: acct.displayName,
          username: acct.username,
          avatar_url: acct.avatarUrl,
          account_type: acct.accountType,
          status,
          capabilities,
          can_publish: canPublishFor(platform, capabilities),
          last_checked_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
          last_error: status === "error" ? "Provider reported an error." : null,
        },
        { onConflict: "connected_account_id" },
      );
      if (error) throw new Error(error.message);
      upserted += 1;

      await supabaseAdmin.from("integration_events").insert({
        company_id: data.companyId,
        type: "synced",
        message: `Synced ${platform} account`,
      });
    }

    return { upserted };
  });

export const refreshSocialAccount = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ accountId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getConnectedAccount, listToolkitToolSlugs, PLATFORM_TOOLKIT } =
      await import("@/lib/publishing/composio.server");
    const { canPublishFor } = await import("@/lib/publishing/platforms");

    const { data: account } = await supabaseAdmin
      .from("social_accounts")
      .select("*")
      .eq("id", data.accountId)
      .maybeSingle();
    if (!account) throw new Error("Account not found.");

    const remote = await getConnectedAccount(account.connected_account_id);
    const toolkit = PLATFORM_TOOLKIT[account.platform as Platform];
    const capabilities = await listToolkitToolSlugs(toolkit);
    const status = remote ? mapStatus(remote.status) : "error";

    await supabaseAdmin
      .from("social_accounts")
      .update({
        status,
        capabilities,
        can_publish: canPublishFor(account.platform as Platform, capabilities),
        display_name: remote?.displayName ?? account.display_name,
        username: remote?.username ?? account.username,
        avatar_url: remote?.avatarUrl ?? account.avatar_url,
        external_account_id: remote?.externalAccountId ?? account.external_account_id,
        last_checked_at: new Date().toISOString(),
        last_error: status === "error" ? "Provider reported an error." : null,
      })
      .eq("id", data.accountId);

    await supabaseAdmin.from("integration_events").insert({
      company_id: account.company_id,
      social_account_id: account.id,
      type: status === "error" ? "error" : "synced",
      message: "Refreshed account information",
    });

    return { ok: true, status };
  });

export const disconnectSocialAccount = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ accountId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { deleteConnectedAccount } = await import("@/lib/publishing/composio.server");

    const { data: account } = await supabaseAdmin
      .from("social_accounts")
      .select("*")
      .eq("id", data.accountId)
      .maybeSingle();
    if (!account) throw new Error("Account not found.");

    // Best-effort provider-side revoke; always mark disconnected locally.
    try {
      await deleteConnectedAccount(account.connected_account_id);
    } catch {
      /* provider may already have revoked - continue */
    }

    await supabaseAdmin
      .from("social_accounts")
      .update({ status: "disconnected", can_publish: false, last_error: null })
      .eq("id", data.accountId);
    await supabaseAdmin.from("integration_events").insert({
      company_id: account.company_id,
      social_account_id: account.id,
      type: "disconnected",
      message: "Disconnected by studio",
    });

    return { ok: true };
  });

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
      .select("platform, auth_config_id, enabled, auth_mode");
    const configs = new Map((data ?? []).map((c) => [c.platform, c]));
    return {
      configured: isComposioConfigured(),
      platforms: PLATFORMS.map((p) => ({
        platform: p,
        configured:
          Boolean(configs.get(p)?.auth_config_id) ||
          Boolean(process.env[`COMPOSIO_AUTH_CONFIG_${p.toUpperCase()}`]),
        enabled: configs.get(p)?.enabled ?? true,
        mode: (configs.get(p)?.auth_mode as "managed" | "custom" | undefined) ?? "managed",
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
    const { startConnection } = await import("@/lib/publishing/composio.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const requestOrigin = request ? new URL(request.url).origin : "";
    const base = (process.env.APP_BASE_URL || requestOrigin).replace(/\/$/, "");
    if (!base) throw new Error("Could not determine the app base URL for the OAuth callback.");
    const callbackUrl = `${base}/admin/connect?connected=1&company=${data.companyId}&platform=${data.platform}`;
    return startConnection(data.companyId, data.platform as Platform, callbackUrl);
  });

/**
 * Auth setup for every platform: whether it uses Composio-managed auth or our
 * own OAuth app, the redirect URI to whitelist, and where to register the app.
 * Secrets are never returned.
 */
export const listAuthSetups = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({}).parse(input ?? {}))
  .handler(async () => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { getAuthConfigInfo, AUTH_PROVIDER_META, COMPOSIO_OAUTH_CALLBACK } =
      await import("@/lib/publishing/composio.server");
    const setups = await Promise.all(
      PLATFORMS.map(async (p) => {
        const info = await getAuthConfigInfo(p);
        return { ...info, provider: AUTH_PROVIDER_META[p], callback: COMPOSIO_OAUTH_CALLBACK };
      }),
    );
    return { setups };
  });

/** Creates/updates a custom OAuth config from the team's own OAuth app. */
export const saveCustomAuth = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        platform: z.enum(PLATFORMS),
        appName: z.string().trim().min(1).max(80),
        clientId: z.string().trim().min(8).max(500),
        clientSecret: z.string().trim().min(8).max(500),
        scopes: z.string().trim().max(2000).optional(),
        redirectUri: z.string().url().max(500).optional(),
        /** JSON object of extra credential fields (e.g. X's bearer token). */
        extra: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { createCustomOAuthConfig, getAuthConfigInfo } =
      await import("@/lib/publishing/composio.server");

    let extra: Record<string, string> = {};
    if (data.extra?.trim()) {
      try {
        const parsed = JSON.parse(data.extra) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("not an object");
        }
        extra = Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
        );
      } catch {
        throw new Error(
          'Extra credentials must be a JSON object, e.g. {"generic_id":"your bearer token"}.',
        );
      }
    }

    try {
      const { authConfigId } = await createCustomOAuthConfig({
        platform: data.platform as Platform,
        appName: data.appName,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        scopes: data.scopes,
        redirectUri: data.redirectUri,
        extra,
      });
      await (
        await import("@/integrations/supabase/client.server")
      ).supabaseAdmin
        .from("integration_events")
        .insert({
          type: "auth_config_created",
          message: `Custom OAuth app configured for ${data.platform} (${authConfigId})`,
        })
        .then(({ error }) => {
          if (error) console.warn("auth event not recorded:", error.message);
        });
      return {
        ok: true as const,
        authConfigId,
        info: await getAuthConfigInfo(data.platform as Platform),
      };
    } catch (err) {
      const message = (err as Error).message;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("integration_configs").upsert(
        {
          platform: data.platform,
          toolkit: data.platform,
          provisioning_error: message.slice(0, 500),
        },
        { onConflict: "platform" },
      );
      throw new Error(message);
    }
  });

/** Switches a platform back to Composio-managed auth. */
export const useManagedAuth = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ platform: z.enum(PLATFORMS) }).parse(input))
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { clearCustomOAuthConfig, getAuthConfigInfo } =
      await import("@/lib/publishing/composio.server");
    await clearCustomOAuthConfig(data.platform as Platform);
    await (
      await import("@/integrations/supabase/client.server")
    ).supabaseAdmin
      .from("integration_events")
      .insert({
        type: "auth_config_reset",
        message: `${data.platform} switched back to Composio-managed auth`,
      })
      .then(({ error }) => {
        if (error) console.warn("auth event not recorded:", error.message);
      });
    return { ok: true as const, info: await getAuthConfigInfo(data.platform as Platform) };
  });

/** Required credential fields for a custom OAuth2 config (for the setup form). */
export const authCredentialFields = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ platform: z.enum(PLATFORMS) }).parse(input))
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { getOAuthCredentialFields } = await import("@/lib/publishing/composio.server");
    return { fields: await getOAuthCredentialFields(data.platform as Platform) };
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
    const {
      listConnectedAccounts,
      listToolkitToolSlugs,
      listFacebookPages,
      getLinkedInAuthor,
      getInstagramAccount,
      PLATFORM_TOOLKIT,
      composioUserId,
    } = await import("@/lib/publishing/composio.server");
    const { canPublishFor, destinationRequired } = await import("@/lib/publishing/platforms");

    const toolkit = data.platform ? PLATFORM_TOOLKIT[data.platform as Platform] : undefined;
    const remote = await listConnectedAccounts(data.companyId, toolkit);

    // Accounts the team explicitly disconnected must not be resurrected on sync.
    const { data: existingRows } = await supabaseAdmin
      .from("social_accounts")
      .select("connected_account_id,status")
      .eq("company_id", data.companyId);
    const disconnected = new Set(
      (existingRows ?? [])
        .filter((r) => r.status === "disconnected")
        .map((r) => r.connected_account_id),
    );

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
      if (disconnected.has(acct.connectedAccountId)) continue;
      const capabilities = await capsFor(acct.toolkit);
      const status = mapStatus(acct.status);

      // A Facebook (and Instagram) connection needs a concrete destination id
      // before it can publish. Auto-select when the account manages exactly one
      // Page; otherwise leave it for the user to choose.
      let destinationId = acct.externalAccountId;
      let destinationName: string | null = null;
      if (platform === "facebook" && !destinationId && status === "connected") {
        const pages = await listFacebookPages(data.companyId, acct.connectedAccountId);
        if (pages.length === 1) {
          destinationId = pages[0].id;
          destinationName = pages[0].name;
        }
      }
      if (platform === "linkedin" && !destinationId && status === "connected") {
        const author = await getLinkedInAuthor(data.companyId, acct.connectedAccountId);
        if (author) {
          destinationId = author.urn;
          destinationName = author.name;
        }
      }
      if (platform === "instagram" && !destinationId && status === "connected") {
        const ig = await getInstagramAccount(data.companyId, acct.connectedAccountId);
        if (ig) {
          destinationId = ig.id;
          destinationName = ig.name;
        }
      }

      const canPublish =
        canPublishFor(platform, capabilities) &&
        (!destinationRequired(platform) || Boolean(destinationId));

      const { error } = await supabaseAdmin.from("social_accounts").upsert(
        {
          company_id: data.companyId,
          platform,
          composio_user_id: composioUserId(data.companyId),
          connected_account_id: acct.connectedAccountId,
          external_account_id: destinationId,
          display_name: destinationName ?? acct.displayName,
          username: acct.username,
          avatar_url: acct.avatarUrl,
          account_type: acct.accountType,
          status,
          capabilities,
          can_publish: canPublish,
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
    const { canPublishFor, destinationRequired } = await import("@/lib/publishing/platforms");

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
        can_publish:
          canPublishFor(account.platform as Platform, capabilities) &&
          (!destinationRequired(account.platform as Platform) ||
            Boolean(account.external_account_id)),
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

/**
 * Lists the destinations a connected account can publish to (e.g. the Facebook
 * Pages it manages). Used to pick the correct target before publishing.
 */
export const listSocialDestinations = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ accountId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { listFacebookPages, getInstagramAccount, getLinkedInAuthor, listLinkedInOrganizations } =
      await import("@/lib/publishing/composio.server");

    const { data: account } = await supabaseAdmin
      .from("social_accounts")
      .select("*")
      .eq("id", data.accountId)
      .maybeSingle();
    if (!account) throw new Error("Account not found.");

    if (account.platform === "facebook") {
      const pages = await listFacebookPages(account.company_id, account.connected_account_id);
      return { destinations: pages, selected: account.external_account_id };
    }
    if (account.platform === "instagram") {
      const ig = await getInstagramAccount(account.company_id, account.connected_account_id);
      return { destinations: ig ? [ig] : [], selected: account.external_account_id };
    }
    if (account.platform === "linkedin") {
      const author = await getLinkedInAuthor(account.company_id, account.connected_account_id);
      const destinations: { id: string; name: string }[] = author
        ? [{ id: author.urn, name: `${author.name} (personal profile)` }]
        : [];
      const orgs = await listLinkedInOrganizations(
        account.company_id,
        account.connected_account_id,
      );
      for (const o of orgs) destinations.push({ id: o.id, name: `${o.name} (company page)` });
      return {
        destinations,
        selected: account.external_account_id,
        manual: true,
        manualHint:
          "Paste a company page id (e.g. 2414183) or URN (urn:li:organization:2414183) to post as the company page.",
      };
    }
    return { destinations: [], selected: account.external_account_id };
  });

/** Saves the chosen publishing destination for an account. */
export const setSocialDestination = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        accountId: z.string().uuid(),
        destinationId: z.string().min(1).max(120),
        destinationName: z.string().max(200).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { canPublishFor, destinationRequired } = await import("@/lib/publishing/platforms");

    const { data: account } = await supabaseAdmin
      .from("social_accounts")
      .select("*")
      .eq("id", data.accountId)
      .maybeSingle();
    if (!account) throw new Error("Account not found.");

    const capabilities = (account.capabilities as string[]) ?? [];
    const { normalizeLinkedInAuthor } = await import("@/lib/publishing/platforms");
    const destinationId =
      account.platform === "linkedin"
        ? normalizeLinkedInAuthor(data.destinationId).urn
        : data.destinationId;
    const canPublish =
      canPublishFor(account.platform as Platform, capabilities) &&
      (!destinationRequired(account.platform as Platform) || Boolean(destinationId));

    await supabaseAdmin
      .from("social_accounts")
      .update({
        external_account_id: destinationId,
        display_name: data.destinationName ?? account.display_name,
        can_publish: canPublish,
        last_error: null,
      })
      .eq("id", data.accountId);

    await supabaseAdmin.from("integration_events").insert({
      company_id: account.company_id,
      social_account_id: account.id,
      type: "synced",
      message: `Selected destination ${data.destinationName ?? data.destinationId}`,
    });

    return { ok: true };
  });

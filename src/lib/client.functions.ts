import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Company, Post, Highlight } from "@/lib/types";

/**
 * Client-facing server functions. Clients are NOT Supabase Auth users -
 * each company has a shared `client_password`. These functions validate
 * that password server-side and use the service-role client to read/write,
 * so the database stays locked down to anonymous traffic.
 */

function normalizePost(row: Record<string, unknown>): Post {
  return {
    ...(row as unknown as Post),
    extra_media: Array.isArray(row.extra_media) ? (row.extra_media as string[]) : [],
    post_url: typeof row.post_url === "string" ? (row.post_url as string) : null,
    posted_at: typeof row.posted_at === "string" ? (row.posted_at as string) : null,
  };
}

/** Returns the company row (incl. client_password) or null after validating. */
async function authCompany(slug: string, password: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!company) return { supabaseAdmin, company: null as null };
  if ((company as Company).client_password !== password) {
    return { supabaseAdmin, company: null as null };
  }
  return { supabaseAdmin, company: company as Company };
}

function publicCompany(c: Company): Company {
  // Strip the password before it ever leaves the server.
  const { client_password: _omit, ...rest } = c;
  return rest as Company;
}

export type CompanyBranding = {
  name: string;
  accent_color: string;
  logo_url: string | null;
  profile_pic_url: string | null;
};

/**
 * Public, password-free branding for a workspace slug so the login screen can
 * greet the client in their own colours and logo before they authenticate.
 * Returns only safe display fields - never the password or any content.
 */
export const getCompanyBranding = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("name, accent_color, logo_url, profile_pic_url")
      .eq("slug", data.slug)
      .maybeSingle();
    return { branding: (company as CompanyBranding | null) ?? null };
  });

export const getClientWorkspace = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        slug: z.string().min(1).max(80),
        password: z.string().min(1).max(255),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin, company } = await authCompany(data.slug, data.password);
    if (!company) throw new Error("Wrong password, or that workspace doesn't exist.");

    const [{ data: posts }, { data: highlights }] = await Promise.all([
      supabaseAdmin.from("posts").select("*").eq("company_id", company.id).order("position"),
      supabaseAdmin.from("highlights").select("*").eq("company_id", company.id).order("position"),
    ]);

    return {
      company: publicCompany(company),
      posts: (posts ?? []).map((p) => normalizePost(p as Record<string, unknown>)),
      highlights: (highlights ?? []) as Highlight[],
    };
  });

export type ClientSnapshot = {
  followers: number | null;
  posts: number;
  published: number;
  handles: Array<{ platform: string; username: string | null; followers: number | null }>;
};

const SNAPSHOT_TTL_MS = 5 * 60_000;
const snapshotCache = new Map<string, { at: number; value: ClientSnapshot }>();

/**
 * A light insights snapshot for the client approval room header: live follower
 * counts for connected Instagram / Facebook / LinkedIn (company page) accounts,
 * plus content totals. Cached per company for a few minutes so approving posts
 * doesn't hammer the provider APIs.
 */
export const getClientSnapshot = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        slug: z.string().min(1).max(80),
        password: z.string().min(1).max(255),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<ClientSnapshot> => {
    const { supabaseAdmin, company } = await authCompany(data.slug, data.password);
    if (!company) throw new Error("Session expired. Please sign in again.");

    const cached = snapshotCache.get(company.id);
    if (cached && Date.now() - cached.at < SNAPSHOT_TTL_MS) return cached.value;

    const [{ data: posts }, { data: accounts }] = await Promise.all([
      supabaseAdmin.from("posts").select("status").eq("company_id", company.id),
      supabaseAdmin
        .from("social_accounts")
        .select("platform,status,username,connected_account_id,external_account_id")
        .eq("company_id", company.id)
        .eq("status", "connected"),
    ]);

    const postRows = (posts ?? []) as { status: string }[];
    const connected = (accounts ?? []) as Array<{
      platform: string;
      username: string | null;
      connected_account_id: string;
      external_account_id: string | null;
    }>;

    const handles: ClientSnapshot["handles"] = [];
    let followerTotal = 0;
    let hasFollowers = false;

    try {
      const { getAccountStats } = await import("@/lib/publishing/composio.server");
      for (const a of connected) {
        if (!["instagram", "facebook", "linkedin"].includes(a.platform)) continue;
        const stats = await getAccountStats({
          companyId: company.id,
          platform: a.platform as "instagram" | "facebook" | "linkedin",
          connectedAccountId: a.connected_account_id,
          externalAccountId: a.external_account_id,
        });
        handles.push({
          platform: a.platform,
          username: a.username ?? stats?.username ?? null,
          followers: stats?.followers ?? null,
        });
        if (stats?.followers != null) {
          followerTotal += stats.followers;
          hasFollowers = true;
        }
      }
    } catch {
      /* provider unavailable - still return content totals */
    }

    const value: ClientSnapshot = {
      followers: hasFollowers ? followerTotal : null,
      posts: postRows.length,
      published: postRows.filter((p) => p.status === "posted").length,
      handles,
    };
    snapshotCache.set(company.id, { at: Date.now(), value });
    return value;
  });

export const clientDecide = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        slug: z.string().min(1).max(80),
        password: z.string().min(1).max(255),
        postId: z.string().uuid(),
        status: z.enum(["approved", "rejected"]),
        comment: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin, company } = await authCompany(data.slug, data.password);
    if (!company) throw new Error("Session expired. Please sign in again.");

    if (data.status === "rejected" && !data.comment?.trim()) {
      throw new Error("A comment is required when rejecting a post.");
    }

    // Ensure the post belongs to this company before touching it.
    const { data: post } = await supabaseAdmin
      .from("posts")
      .select("id, company_id, status, content_version")
      .eq("id", data.postId)
      .maybeSingle();
    if (!post || post.company_id !== company.id) {
      throw new Error("That post is not part of this workspace.");
    }
    if (post.status === "posted") {
      throw new Error("This post is already published.");
    }

    const { error } = await supabaseAdmin
      .from("posts")
      .update({
        status: data.status,
        client_comment: data.comment?.trim() || null,
        decided_at: new Date().toISOString(),
        // Snapshot the version the client approved; publishing verifies it matches.
        approved_content_version: data.status === "approved" ? post.content_version : null,
        publish_state: null,
      })
      .eq("id", data.postId);
    if (error) throw new Error(error.message);

    // Notify the internal team (deduped per post+version+decision).
    await supabaseAdmin.from("notifications").upsert(
      {
        type: data.status === "approved" ? "approval_received" : "changes_requested",
        title:
          data.status === "approved"
            ? `${company.name} approved a post`
            : `${company.name} requested changes`,
        body: data.comment?.trim() || null,
        company_id: company.id,
        post_id: data.postId,
        link: `/admin/companies/${company.slug}`,
        dedupe_key: `${data.status}:${data.postId}:${post.content_version}`,
      },
      { onConflict: "dedupe_key", ignoreDuplicates: true },
    );

    return { ok: true };
  });

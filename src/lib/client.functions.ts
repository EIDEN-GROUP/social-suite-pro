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
      .select("id, company_id")
      .eq("id", data.postId)
      .maybeSingle();
    if (!post || post.company_id !== company.id) {
      throw new Error("That post is not part of this workspace.");
    }

    const { error } = await supabaseAdmin
      .from("posts")
      .update({
        status: data.status,
        client_comment: data.comment?.trim() || null,
        decided_at: new Date().toISOString(),
      })
      .eq("id", data.postId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });

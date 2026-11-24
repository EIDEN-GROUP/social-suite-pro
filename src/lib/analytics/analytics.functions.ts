import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PLATFORMS = ["instagram", "tiktok", "facebook", "twitter", "linkedin"] as const;

/**
 * Per-client analytics: content the client has across platforms plus everything
 * the studio published from the site.
 */
export const getClientAnalytics = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: posts }, { data: accounts }, { data: jobs }] = await Promise.all([
      supabaseAdmin
        .from("posts")
        .select("id,platform,post_type,status,posted_at,post_url,caption")
        .eq("company_id", data.companyId),
      supabaseAdmin
        .from("social_accounts")
        .select("id,platform,status,display_name,username,can_publish,external_account_id")
        .eq("company_id", data.companyId),
      supabaseAdmin
        .from("publishing_jobs")
        .select("id,post_id,platform,status,created_at,last_error")
        .eq("company_id", data.companyId),
    ]);

    const postList = posts ?? [];
    const accountList = accounts ?? [];
    const jobList = jobs ?? [];

    const postIds = postList.map((p) => p.id);
    const { data: published } = postIds.length
      ? await supabaseAdmin
          .from("published_posts")
          .select("post_id,platform,external_url,published_at")
          .in("post_id", postIds)
      : {
          data: [] as {
            post_id: string;
            platform: string;
            external_url: string | null;
            published_at: string;
          }[],
        };
    const publishedList = published ?? [];

    const platforms = PLATFORMS.map((pf) => {
      const ps = postList.filter((p) => p.platform === pf);
      const js = jobList.filter((j) => j.platform === pf);
      const accts = accountList.filter((a) => a.platform === pf);
      return {
        platform: pf,
        posts: ps.length,
        pending: ps.filter((p) => p.status === "pending").length,
        approved: ps.filter((p) => p.status === "approved").length,
        rejected: ps.filter((p) => p.status === "rejected").length,
        posted: ps.filter((p) => p.status === "posted").length,
        publishedFromSite: js.filter((j) => j.status === "published").length,
        scheduled: js.filter((j) => j.status === "scheduled").length,
        failed: js.filter((j) => j.status === "failed" || j.status === "requires_attention").length,
        accounts: accts.map((a) => ({
          id: a.id,
          name: a.display_name,
          username: a.username,
          status: a.status,
          canPublish: a.can_publish,
          selected: Boolean(a.external_account_id),
        })),
      };
    });

    const decided = postList.filter((p) => p.status !== "pending").length;
    const approvedOrPosted = postList.filter(
      (p) => p.status === "approved" || p.status === "posted",
    ).length;

    const recentPublished = publishedList
      .slice()
      .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
      .slice(0, 8)
      .map((pp) => {
        const post = postList.find((p) => p.id === pp.post_id);
        return {
          postId: pp.post_id,
          platform: pp.platform,
          url: pp.external_url,
          publishedAt: pp.published_at,
          caption: post?.caption ?? null,
        };
      });

    return {
      totals: {
        posts: postList.length,
        pending: postList.filter((p) => p.status === "pending").length,
        approved: postList.filter((p) => p.status === "approved").length,
        rejected: postList.filter((p) => p.status === "rejected").length,
        posted: postList.filter((p) => p.status === "posted").length,
        publishedFromSite: jobList.filter((j) => j.status === "published").length,
        scheduled: jobList.filter((j) => j.status === "scheduled").length,
        failed: jobList.filter((j) => j.status === "failed" || j.status === "requires_attention")
          .length,
        approvalRate: decided ? Math.round((approvedOrPosted / decided) * 100) : 0,
      },
      platforms,
      recentPublished,
    };
  });

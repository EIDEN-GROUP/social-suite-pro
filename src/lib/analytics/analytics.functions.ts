import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PLATFORMS = ["instagram", "tiktok", "facebook", "twitter", "linkedin"] as const;
type PlatformT = (typeof PLATFORMS)[number];

/**
 * Per-client analytics: content the client has across platforms plus everything
 * the studio published from the site, with a selectable time range.
 */
export const getClientAnalytics = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        companyId: z.string().uuid(),
        range: z.enum(["7d", "30d", "all"]).optional(),
        granularity: z.enum(["week", "month", "year"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: posts }, { data: accounts }, { data: jobs }] = await Promise.all([
      supabaseAdmin
        .from("posts")
        .select("id,platform,post_type,status,posted_at,post_url,caption,created_at")
        .eq("company_id", data.companyId),
      supabaseAdmin
        .from("social_accounts")
        .select(
          "id,platform,status,display_name,username,can_publish,external_account_id,connected_account_id",
        )
        .eq("company_id", data.companyId),
      supabaseAdmin
        .from("publishing_jobs")
        .select("id,post_id,platform,status,created_at,last_error")
        .eq("company_id", data.companyId),
    ]);

    const range = data.range ?? "all";
    const cutoff =
      range === "7d"
        ? Date.now() - 7 * 86_400_000
        : range === "30d"
          ? Date.now() - 30 * 86_400_000
          : null;
    const inRange = (iso: string | null | undefined) =>
      cutoff == null || !iso ? true : new Date(iso).getTime() >= cutoff;

    const accountList = accounts ?? [];
    const postList = (posts ?? []).filter((p) => inRange(p.created_at));
    const jobList = (jobs ?? []).filter((j) => inRange(j.created_at));

    const postIds = postList.map((p) => p.id);
    const { data: published } = postIds.length
      ? await supabaseAdmin
          .from("published_posts")
          .select("post_id,platform,external_url,published_at,external_post_id")
          .in("post_id", postIds)
      : {
          data: [] as {
            post_id: string;
            platform: string;
            external_url: string | null;
            published_at: string;
            external_post_id: string | null;
          }[],
        };
    const publishedList = (published ?? []).filter((p) => inRange(p.published_at));

    const { getAccountStats, getPostEngagement } = await import("@/lib/publishing/composio.server");

    // Live account stats (followers / post counts) where the platform exposes them.
    const statEntries: Array<
      [string, { followers: number | null; mediaCount: number | null } | null]
    > = await Promise.all(
      accountList.map(
        async (
          a,
        ): Promise<[string, { followers: number | null; mediaCount: number | null } | null]> => {
          if (a.status !== "connected") return [a.id, null];
          const stats = await getAccountStats({
            companyId: data.companyId,
            platform: a.platform as PlatformT,
            connectedAccountId: a.connected_account_id,
            externalAccountId: a.external_account_id,
          });
          return [
            a.id,
            stats ? { followers: stats.followers, mediaCount: stats.mediaCount } : null,
          ];
        },
      ),
    );
    const statsById = new Map(statEntries);
    const audience = statEntries.reduce((sum, [, s]) => sum + (s?.followers ?? 0), 0);

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
        accounts: accts.map((a) => {
          const stats = statsById.get(a.id);
          return {
            id: a.id,
            name: a.display_name,
            username: a.username,
            status: a.status,
            canPublish: a.can_publish,
            selected: Boolean(a.external_account_id),
            followers: stats?.followers ?? null,
            mediaCount: stats?.mediaCount ?? null,
          };
        }),
      };
    });

    const decided = postList.filter((p) => p.status !== "pending").length;
    const approvedOrPosted = postList.filter(
      (p) => p.status === "approved" || p.status === "posted",
    ).length;

    const publishAttempted = jobList.filter(
      (j) => j.status === "published" || j.status === "failed" || j.status === "requires_attention",
    ).length;
    const publishSuccessRate = publishAttempted
      ? Math.round(
          (jobList.filter((j) => j.status === "published").length / publishAttempted) * 100,
        )
      : 0;

    // ---- Time series (created vs published) ----
    const granularity = data.granularity ?? (range === "all" ? "month" : "week");
    const pad = (n: number) => String(n).padStart(2, "0");
    const bucketMap = new Map<
      string,
      { key: string; label: string; Created: number; Published: number }
    >();
    const bucket = (iso: string) => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      let key: string;
      let label: string;
      if (granularity === "year") {
        key = String(d.getFullYear());
        label = key;
      } else if (granularity === "month") {
        key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
        label = d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
      } else {
        // Week, starting Monday.
        const start = new Date(d);
        const offset = (start.getDay() + 6) % 7;
        start.setDate(start.getDate() - offset);
        key = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
        label = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      }
      let b = bucketMap.get(key);
      if (!b) {
        b = { key, label, Created: 0, Published: 0 };
        bucketMap.set(key, b);
      }
      return b;
    };
    for (const p of postList) {
      if (p.created_at) {
        const b = bucket(p.created_at);
        if (b) b.Created += 1;
      }
    }
    for (const pp of publishedList) {
      if (pp.published_at) {
        const b = bucket(pp.published_at);
        if (b) b.Published += 1;
      }
    }
    const timeSeries = [...bucketMap.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ label, Created, Published }) => ({ label, Created, Published }));

    // ---- Recently published + engagement ----
    const accountByPlatform = new Map<string, (typeof accountList)[number]>();
    for (const a of accountList)
      if (!accountByPlatform.has(a.platform)) accountByPlatform.set(a.platform, a);

    const recentBase = publishedList
      .slice()
      .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""))
      .slice(0, 6);

    const recentPublished = await Promise.all(
      recentBase.map(async (pp) => {
        const post = postList.find((p) => p.id === pp.post_id);
        let engagement: Awaited<ReturnType<typeof getPostEngagement>> = null;
        const acct = accountByPlatform.get(pp.platform);
        if (
          acct &&
          acct.status === "connected" &&
          pp.external_post_id &&
          (pp.platform === "instagram" || pp.platform === "facebook")
        ) {
          engagement = await getPostEngagement({
            companyId: data.companyId,
            platform: pp.platform as PlatformT,
            connectedAccountId: acct.connected_account_id,
            externalPostId: pp.external_post_id,
          });
        }
        return {
          postId: pp.post_id,
          platform: pp.platform,
          url: pp.external_url,
          publishedAt: pp.published_at,
          caption: post?.caption ?? null,
          engagement,
        };
      }),
    );

    return {
      range,
      granularity,
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
        audience,
        publishSuccessRate,
      },
      platforms,
      timeSeries,
      recentPublished,
    };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Publishing server functions. All superadmin-guarded; all approval checks are
 * re-verified server-side inside the engine (never trusted from the client).
 */

const PLATFORMS = ["instagram", "tiktok", "facebook", "twitter", "linkedin"] as const;

export const publishNow = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ postId: z.string().uuid(), socialAccountId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { userId } = await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { createJob, runJob } = await import("@/lib/publishing/publish.server");
    const job = await createJob({
      postId: data.postId,
      socialAccountId: data.socialAccountId,
      createdBy: userId,
    });
    const result = await runJob(job.id);
    return { ...result, jobId: job.id };
  });

export const schedulePublish = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        postId: z.string().uuid(),
        socialAccountId: z.string().uuid(),
        scheduledFor: z.string().datetime(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { userId } = await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { createJob, runJob } = await import("@/lib/publishing/publish.server");

    const when = new Date(data.scheduledFor);
    // A time in the past (or very near) publishes immediately.
    if (when.getTime() <= Date.now() + 60_000) {
      const job = await createJob({
        postId: data.postId,
        socialAccountId: data.socialAccountId,
        createdBy: userId,
      });
      const result = await runJob(job.id);
      return { ...result, jobId: job.id, scheduled: false };
    }

    const job = await createJob({
      postId: data.postId,
      socialAccountId: data.socialAccountId,
      scheduledFor: when.toISOString(),
      createdBy: userId,
    });
    return { jobId: job.id, status: "scheduled" as const, scheduled: true };
  });

export const cancelPublishingJob = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { userId } = await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { cancelJob } = await import("@/lib/publishing/publish.server");
    return cancelJob(data.id, userId);
  });

export const retryPublishingJob = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { userId } = await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { retryJob } = await import("@/lib/publishing/publish.server");
    return retryJob(data.id, userId);
  });

export const getPublishableContext = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ postId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: post } = await supabaseAdmin
      .from("posts")
      .select("*")
      .eq("id", data.postId)
      .maybeSingle();
    if (!post) throw new Error("Post not found.");

    const [{ data: company }, { data: accounts }] = await Promise.all([
      supabaseAdmin
        .from("companies")
        .select("id, name, slug, accent_color")
        .eq("id", post.company_id)
        .maybeSingle(),
      supabaseAdmin
        .from("social_accounts")
        .select("*")
        .eq("company_id", post.company_id)
        .eq("platform", post.platform)
        .order("created_at"),
    ]);

    const approvalValid =
      post.status === "approved" &&
      post.approved_content_version != null &&
      post.approved_content_version === post.content_version;

    return {
      post,
      company,
      accounts: accounts ?? [],
      approvalValid,
    };
  });

/**
 * Approved posts whose approval is still valid and which have no active or
 * completed publishing job. Drives the internal approval popup.
 */
export const listPendingApprovalPopups = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({}).parse(input ?? {}))
  .handler(async () => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: posts } = await supabaseAdmin
      .from("posts")
      .select("*")
      .eq("status", "approved")
      .not("approved_content_version", "is", null)
      .order("decided_at", { ascending: false })
      .limit(25);

    const valid = (posts ?? []).filter((p) => p.approved_content_version === p.content_version);
    if (valid.length === 0) return { posts: [] };

    const ids = valid.map((p) => p.id);
    const { data: jobs } = await supabaseAdmin
      .from("publishing_jobs")
      .select("post_id, status")
      .in("post_id", ids);
    const busy = new Set(
      (jobs ?? [])
        .filter((j) => ["ready", "scheduled", "processing", "published"].includes(j.status))
        .map((j) => j.post_id),
    );

    const pending = valid.filter((p) => !busy.has(p.id));
    const companyIds = Array.from(new Set(pending.map((p) => p.company_id)));
    const { data: companies } = companyIds.length
      ? await supabaseAdmin
          .from("companies")
          .select("id, name, slug, accent_color")
          .in("id", companyIds)
      : { data: [] as { id: string; name: string; slug: string; accent_color: string }[] };
    const byId = new Map((companies ?? []).map((c) => [c.id, c]));

    return { posts: pending.map((p) => ({ post: p, company: byId.get(p.company_id) ?? null })) };
  });

export const listPublishingJobs = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        companyId: z.string().uuid().optional(),
        status: z
          .enum([
            "ready",
            "scheduled",
            "processing",
            "published",
            "failed",
            "cancelled",
            "requires_attention",
          ])
          .optional(),
        platform: z.enum(PLATFORMS).optional(),
      })
      .optional()
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("publishing_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data?.companyId) query = query.eq("company_id", data.companyId);
    if (data?.status) query = query.eq("status", data.status);
    if (data?.platform) query = query.eq("platform", data.platform);
    const { data: jobs, error } = await query;
    if (error) throw new Error(error.message);

    const jobList = jobs ?? [];
    const postIds = Array.from(new Set(jobList.map((j) => j.post_id)));
    const companyIds = Array.from(new Set(jobList.map((j) => j.company_id)));
    const accountIds = Array.from(
      new Set(jobList.map((j) => j.social_account_id).filter((x): x is string => Boolean(x))),
    );

    const [{ data: posts }, { data: companies }, { data: accounts }, { data: published }] =
      await Promise.all([
        postIds.length
          ? supabaseAdmin.from("posts").select("*").in("id", postIds)
          : Promise.resolve({ data: [] }),
        companyIds.length
          ? supabaseAdmin
              .from("companies")
              .select("id, name, slug, accent_color")
              .in("id", companyIds)
          : Promise.resolve({ data: [] }),
        accountIds.length
          ? supabaseAdmin
              .from("social_accounts")
              .select("id, display_name, username, platform, status")
              .in("id", accountIds)
          : Promise.resolve({ data: [] }),
        jobList.length
          ? supabaseAdmin
              .from("published_posts")
              .select("job_id, external_url, external_post_id, published_at")
              .in(
                "job_id",
                jobList.map((j) => j.id),
              )
          : Promise.resolve({ data: [] }),
      ]);

    const postById = new Map((posts ?? []).map((p) => [p.id, p]));
    const companyById = new Map((companies ?? []).map((c) => [c.id, c]));
    const accountById = new Map((accounts ?? []).map((a) => [a.id, a]));
    const pubByJob = new Map((published ?? []).map((p) => [p.job_id, p]));

    return {
      jobs: jobList.map((j) => ({
        ...j,
        post: postById.get(j.post_id) ?? null,
        company: companyById.get(j.company_id) ?? null,
        account: j.social_account_id ? (accountById.get(j.social_account_id) ?? null) : null,
        published: pubByJob.get(j.id) ?? null,
      })),
    };
  });

export const getPublishingJob = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: job } = await supabaseAdmin
      .from("publishing_jobs")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!job) throw new Error("Job not found.");

    const [
      { data: post },
      { data: company },
      { data: account },
      { data: attempts },
      { data: published },
    ] = await Promise.all([
      supabaseAdmin.from("posts").select("*").eq("id", job.post_id).maybeSingle(),
      supabaseAdmin
        .from("companies")
        .select("id, name, slug, accent_color")
        .eq("id", job.company_id)
        .maybeSingle(),
      job.social_account_id
        ? supabaseAdmin
            .from("social_accounts")
            .select("*")
            .eq("id", job.social_account_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabaseAdmin
        .from("publishing_attempts")
        .select("*")
        .eq("job_id", job.id)
        .order("attempt_no"),
      supabaseAdmin.from("published_posts").select("*").eq("job_id", job.id).maybeSingle(),
    ]);

    return { job, post, company, account, attempts: attempts ?? [], published: published ?? null };
  });

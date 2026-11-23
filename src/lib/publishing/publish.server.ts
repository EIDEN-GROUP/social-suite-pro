import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Platform, Post } from "@/lib/types";
import { composioUserId, executeTool, PLATFORM_TOOLKIT } from "@/lib/publishing/composio.server";
import {
  buildPublishPlan,
  canPublishFor,
  capabilityNote,
  PublishCapabilityError,
  type PublishStep,
} from "@/lib/publishing/platforms";

/**
 * Server-side publishing engine.
 *
 * Guarantees enforced here (never trust the browser):
 *  - a post must still be `approved` AND its approved content version must
 *    match the current version before anything is sent to a provider;
 *  - the target account must belong to the post's client and be connected;
 *  - the account must actually expose the required publish action;
 *  - a confirmed external id is only stored on provider success.
 */

type JobRow = Awaited<ReturnType<typeof loadJob>>;

async function loadJob(jobId: string) {
  const { data, error } = await supabaseAdmin
    .from("publishing_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Publishing job not found.");
  return data;
}

function idempotencyKey(postId: string, accountId: string): string {
  return `post:${postId}:acct:${accountId}`;
}

async function notify(params: {
  type: string;
  title: string;
  body?: string;
  companyId?: string | null;
  postId?: string | null;
  link?: string | null;
  dedupeKey?: string | null;
}) {
  await supabaseAdmin.from("notifications").upsert(
    {
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      company_id: params.companyId ?? null,
      post_id: params.postId ?? null,
      link: params.link ?? null,
      dedupe_key: params.dedupeKey ?? null,
    },
    { onConflict: "dedupe_key", ignoreDuplicates: true },
  );
}

async function audit(params: {
  jobId?: string | null;
  postId?: string | null;
  actorUserId?: string | null;
  actorType?: string;
  action: string;
  detail?: Record<string, unknown>;
}) {
  await supabaseAdmin.from("publishing_audit_logs").insert({
    job_id: params.jobId ?? null,
    post_id: params.postId ?? null,
    actor_user_id: params.actorUserId ?? null,
    actor_type: params.actorType ?? "internal",
    action: params.action,
    detail: (params.detail ?? null) as never,
  });
}

async function updatePostPublishState(postId: string, state: string) {
  await supabaseAdmin.from("posts").update({ publish_state: state }).eq("id", postId);
}

/**
 * Verifies an approval is still valid straight from the database.
 * Returns the post row or throws a descriptive error.
 */
export async function assertPublishable(postId: string): Promise<Post> {
  const { data: post, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!post) throw new Error("Post not found.");
  if (post.status !== "approved") {
    throw new Error("This post is not approved - it cannot be published.");
  }
  if (
    post.approved_content_version == null ||
    post.approved_content_version !== post.content_version
  ) {
    throw new Error(
      "The approved content has changed since approval. Ask the client to re-approve.",
    );
  }
  return post as unknown as Post;
}

export type CreateJobInput = {
  postId: string;
  socialAccountId: string;
  scheduledFor?: string | null;
  createdBy: string | null;
};

export async function createJob(input: CreateJobInput) {
  const post = await assertPublishable(input.postId);

  const { data: account, error: acctErr } = await supabaseAdmin
    .from("social_accounts")
    .select("*")
    .eq("id", input.socialAccountId)
    .maybeSingle();
  if (acctErr) throw new Error(acctErr.message);
  if (!account) throw new Error("Social account not found.");
  if (account.company_id !== post.company_id) {
    throw new Error("That account does not belong to this client.");
  }
  if (account.status !== "connected" && account.status !== "attention_required") {
    throw new Error(`The ${account.platform} account is ${account.status} and cannot be used.`);
  }

  const capabilities = (account.capabilities as string[]) ?? [];
  if (!canPublishFor(account.platform as Platform, capabilities)) {
    throw new Error(
      capabilityNote(account.platform as Platform, capabilities) ??
        "Publishing is unavailable for this account.",
    );
  }

  const scheduled = Boolean(input.scheduledFor);
  const key = idempotencyKey(input.postId, input.socialAccountId);

  const { data: existing } = await supabaseAdmin
    .from("publishing_jobs")
    .select("*")
    .eq("idempotency_key", key)
    .maybeSingle();
  if (existing && existing.status !== "failed" && existing.status !== "cancelled") {
    // Already queued/processing/published for this post+account: don't duplicate.
    return existing;
  }

  const payload = {
    post_id: input.postId,
    company_id: post.company_id,
    social_account_id: input.socialAccountId,
    platform: account.platform,
    kind: scheduled ? ("scheduled" as const) : ("immediate" as const),
    status: scheduled ? ("scheduled" as const) : ("ready" as const),
    scheduled_for: input.scheduledFor ?? null,
    approved_content_version: post.approved_content_version,
    idempotency_key: key,
    attempts_count: 0,
    last_error: null,
    created_by: input.createdBy,
  };

  const { data, error } = await supabaseAdmin
    .from("publishing_jobs")
    .upsert(payload, { onConflict: "idempotency_key" })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await audit({
    jobId: data.id,
    postId: input.postId,
    actorUserId: input.createdBy,
    action: scheduled ? "scheduled" : "queued",
    detail: { platform: account.platform, scheduled_for: input.scheduledFor ?? null },
  });
  await updatePostPublishState(input.postId, scheduled ? "scheduled" : "ready");
  return data;
}

/**
 * Walks tool arguments and replaces any `{ __mediaUpload: { url } }` marker
 * with Composio's uploaded-file descriptor ({name,mimetype,s3key}). Needed for
 * tools whose media fields are `file_uploadable` (e.g. LinkedIn images).
 */
async function resolveMediaUploads(value: unknown): Promise<unknown> {
  if (Array.isArray(value)) {
    return Promise.all(value.map((v) => resolveMediaUploads(v)));
  }
  if (value && typeof value === "object") {
    const rec = value as Record<string, unknown>;
    const marker = rec.__mediaUpload as { url?: string } | undefined;
    if (marker?.url) {
      const { uploadMedia } = await import("@/lib/publishing/composio.server");
      return uploadMedia(marker.url);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rec)) out[k] = await resolveMediaUploads(v);
    return out;
  }
  return value;
}

/**
 * Executes one job. Idempotent: if a publication is already recorded the job
 * is simply reconciled to `published` (so a retry can never double-post).
 */
export async function runJob(jobId: string): Promise<{ status: string; error?: string }> {
  const job = await loadJob(jobId);

  // Already published? reconcile and stop.
  const { data: existingPub } = await supabaseAdmin
    .from("published_posts")
    .select("id")
    .eq("job_id", jobId)
    .maybeSingle();
  if (existingPub) {
    await supabaseAdmin
      .from("publishing_jobs")
      .update({ status: "published", last_error: null })
      .eq("id", jobId);
    return { status: "published" };
  }

  if (job.status === "cancelled") return { status: "cancelled" };

  // Re-verify the approval before doing anything.
  let post: Post;
  try {
    post = await assertPublishable(job.post_id);
  } catch (err) {
    const message = (err as Error).message;
    await supabaseAdmin
      .from("publishing_jobs")
      .update({ status: "requires_attention", last_error: message, locked_at: null })
      .eq("id", jobId);
    await updatePostPublishState(job.post_id, "requires_attention");
    await notify({
      type: "publish_requires_attention",
      title: "Approval no longer valid",
      body: message,
      companyId: job.company_id,
      postId: job.post_id,
      dedupeKey: `attention:${jobId}`,
    });
    return { status: "requires_attention", error: message };
  }

  const { data: account } = await supabaseAdmin
    .from("social_accounts")
    .select("*")
    .eq("id", job.social_account_id ?? "")
    .maybeSingle();

  await supabaseAdmin
    .from("publishing_jobs")
    .update({ status: "processing", locked_at: new Date().toISOString() })
    .eq("id", jobId);
  await updatePostPublishState(job.post_id, "processing");

  const { count: priorAttempts } = await supabaseAdmin
    .from("publishing_attempts")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId);
  const attemptNo = (priorAttempts ?? 0) + 1;

  const attemptRows = await supabaseAdmin
    .from("publishing_attempts")
    .insert({ job_id: jobId, attempt_no: attemptNo, outcome: "pending" })
    .select()
    .single();
  const attempt = attemptRows.data;

  async function fail(status: "failed" | "requires_attention", message: string, code = "error") {
    if (attempt) {
      await supabaseAdmin
        .from("publishing_attempts")
        .update({
          outcome: status,
          error_code: code,
          error_message: message,
          finished_at: new Date().toISOString(),
        })
        .eq("id", attempt.id);
    }
    await supabaseAdmin
      .from("publishing_jobs")
      .update({ status, last_error: message, locked_at: null })
      .eq("id", jobId);
    await updatePostPublishState(job.post_id, status);
    await notify({
      type: status === "failed" ? "publish_failed" : "publish_requires_attention",
      title: status === "failed" ? "Publishing failed" : "Publishing needs attention",
      body: message,
      companyId: job.company_id,
      postId: job.post_id,
      dedupeKey: `${status}:${jobId}:${attemptNo}`,
    });
    return { status, error: message };
  }

  if (!account) return fail("failed", "The connected account no longer exists.");

  const capabilities = (account.capabilities as string[]) ?? [];
  const platform = (account.platform as Platform) ?? (job.platform as Platform);

  let plan: PublishStep[];
  try {
    plan = buildPublishPlan({
      platform,
      post,
      account: {
        connectedAccountId: account.connected_account_id,
        externalAccountId: account.external_account_id,
      },
      capabilities,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publishing is unavailable.";
    const isCapability = err instanceof PublishCapabilityError;
    return fail(
      isCapability ? "requires_attention" : "failed",
      message,
      isCapability ? "capability" : "error",
    );
  }

  const toolkit = PLATFORM_TOOLKIT[platform];
  let lastResponse: unknown = null;

  try {
    for (const step of plan) {
      let args = { ...step.args };

      // Instagram second step needs the container id from the first response.
      if (args.creation_id === "{{creation_id}}") {
        const creationId =
          (lastResponse as { id?: string } | null)?.id ??
          (lastResponse as { data?: { id?: string } } | null)?.data?.id;
        if (!creationId) {
          return fail(
            "requires_attention",
            "Instagram did not return a media container id.",
            "no_creation_id",
          );
        }
        args = { ...args, creation_id: creationId };
      }

      // Replace any media-upload markers with Composio file descriptors.
      args = (await resolveMediaUploads(args)) as Record<string, unknown>;

      const result = await executeTool({
        slug: step.slug,
        companyId: job.company_id,
        connectedAccountId: account.connected_account_id,
        arguments: args,
        toolkit,
      });
      lastResponse = result.data;
      if (!result.successful) {
        return fail("failed", result.error ?? `Provider rejected ${step.slug}.`, "provider_error");
      }
    }
  } catch (err) {
    return fail("failed", (err as Error).message, "exception");
  }

  // Provider confirmed success. Record the external reference.
  const externalId =
    (lastResponse as { id?: string } | null)?.id ??
    (lastResponse as { data?: { id?: string } } | null)?.data?.id ??
    (lastResponse as { media_id?: string } | null)?.media_id ??
    null;
  const externalUrl = extractUrl(lastResponse);

  await supabaseAdmin.from("published_posts").insert({
    job_id: jobId,
    post_id: job.post_id,
    platform,
    external_post_id: externalId,
    external_url: externalUrl,
    raw: (lastResponse ?? null) as never,
  });

  if (attempt) {
    await supabaseAdmin
      .from("publishing_attempts")
      .update({
        outcome: "success",
        finished_at: new Date().toISOString(),
        provider_response: (lastResponse ?? null) as never,
      })
      .eq("id", attempt.id);
  }

  await supabaseAdmin
    .from("publishing_jobs")
    .update({ status: "published", last_error: null, locked_at: null })
    .eq("id", jobId);

  // Reuse the existing "posted" lifecycle so the calendar & client room reflect it.
  await supabaseAdmin
    .from("posts")
    .update({
      publish_state: "published",
      status: "posted",
      post_url: externalUrl ?? undefined,
      posted_at: new Date().toISOString(),
    })
    .eq("id", job.post_id);

  await audit({
    jobId,
    postId: job.post_id,
    action: "published",
    detail: { platform, external_post_id: externalId, external_url: externalUrl },
  });
  await notify({
    type: "publish_succeeded",
    title: "Post published",
    body: `Published to ${platform}.`,
    companyId: job.company_id,
    postId: job.post_id,
    link: externalUrl,
    dedupeKey: `published:${jobId}`,
  });

  return { status: "published" };
}

function extractUrl(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const r = response as Record<string, unknown>;
  const direct = r.permalink ?? r.url ?? r.post_url ?? r.share_url;
  if (typeof direct === "string") return direct;
  const nested = (r.data as Record<string, unknown> | undefined) ?? {};
  const n = nested.permalink ?? nested.url ?? nested.post_url;
  return typeof n === "string" ? n : null;
}

export async function cancelJob(jobId: string, actorUserId: string | null) {
  const job = await loadJob(jobId);
  if (job.status === "published") throw new Error("This job is already published.");
  if (job.status === "processing") throw new Error("This job is already processing.");
  await supabaseAdmin
    .from("publishing_jobs")
    .update({ status: "cancelled", locked_at: null })
    .eq("id", jobId);
  await updatePostPublishState(job.post_id, "cancelled");
  await audit({ jobId, postId: job.post_id, actorUserId, action: "cancelled" });
  return { ok: true };
}

export async function retryJob(jobId: string, actorUserId: string | null) {
  const job = await loadJob(jobId);
  if (job.status === "published") throw new Error("This job is already published.");
  await supabaseAdmin
    .from("publishing_jobs")
    .update({ status: "ready", last_error: null, locked_at: null })
    .eq("id", jobId);
  await audit({ jobId, postId: job.post_id, actorUserId, action: "retried" });
  return runJob(jobId);
}

export type { JobRow };

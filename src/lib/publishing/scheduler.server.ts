import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { runJob } from "@/lib/publishing/publish.server";

/**
 * Scheduled publishing runner.
 *
 * `claim_due_jobs` atomically moves due scheduled jobs to `processing` using
 * FOR UPDATE SKIP LOCKED, so concurrent runners never grab the same job.
 */
export async function runDueJobs(limit = 5) {
  const { data: claimed, error } = await supabaseAdmin.rpc("claim_due_publishing_jobs", {
    p_limit: limit,
  });
  if (error) throw new Error(error.message);

  const results: Array<{ id: string; status: string; error?: string }> = [];
  for (const job of claimed ?? []) {
    try {
      const outcome = await runJob(job.id);
      results.push({ id: job.id, ...outcome });
    } catch (err) {
      results.push({ id: job.id, status: "error", error: (err as Error).message });
    }
  }
  return results;
}

/**
 * Reconciles jobs stuck in `processing` past a threshold.
 *
 * We never assume a timeout means failure: if a publication was already
 * recorded we mark it published; otherwise we flag it for a human instead of
 * risking a duplicate post.
 */
export async function reapStaleJobs(staleMinutes = 15): Promise<number> {
  const cutoff = new Date(Date.now() - staleMinutes * 60_000).toISOString();
  const { data: stale } = await supabaseAdmin
    .from("publishing_jobs")
    .select("id")
    .eq("status", "processing")
    .lt("locked_at", cutoff);

  let handled = 0;
  for (const job of stale ?? []) {
    const { data: published } = await supabaseAdmin
      .from("published_posts")
      .select("id")
      .eq("job_id", job.id)
      .maybeSingle();

    if (published) {
      await supabaseAdmin
        .from("publishing_jobs")
        .update({ status: "published", last_error: null, locked_at: null })
        .eq("id", job.id);
    } else {
      await supabaseAdmin
        .from("publishing_jobs")
        .update({
          status: "requires_attention",
          last_error: "Timed out while publishing. Check the platform before retrying.",
          locked_at: null,
        })
        .eq("id", job.id);
    }
    handled += 1;
  }
  return handled;
}

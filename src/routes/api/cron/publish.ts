import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled publishing runner. Called by Vercel Cron (or any scheduler) with
 * `Authorization: Bearer $CRON_SECRET`. Claims due jobs atomically and runs
 * them; also reconciles jobs stuck in `processing`.
 */
async function run(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  // Fail closed: if the secret is not configured, do not run anything.
  if (!secret) {
    return new Response("Cron is not configured (CRON_SECRET is missing).", { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { runDueJobs, reapStaleJobs } = await import("@/lib/publishing/scheduler.server");
  const reaped = await reapStaleJobs();
  const results = await runDueJobs(10);
  return Response.json({ reaped, processed: results.length, results });
}

export const Route = createFileRoute("/api/cron/publish")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request),
    },
  },
});

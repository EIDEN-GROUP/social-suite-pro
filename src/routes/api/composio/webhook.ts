import { createFileRoute } from "@tanstack/react-router";

/**
 * Composio trigger/webhook receiver.
 *
 * Verifies the signature with the project webhook secret, records the event and
 * reconciles the affected connected account when we can identify it.
 */
export const Route = createFileRoute("/api/composio/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.text();

        let verified: unknown;
        try {
          const { verifyWebhook } = await import("@/lib/publishing/composio.server");
          verified = await verifyWebhook({
            id: request.headers.get("webhook-id"),
            signature: request.headers.get("webhook-signature"),
            timestamp: request.headers.get("webhook-timestamp"),
            payload,
          });
        } catch {
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const body = verified as { payload?: { triggerSlug?: string } } | undefined;
          const triggerSlug = body?.payload?.triggerSlug ?? "unknown";

          await supabaseAdmin.from("integration_events").insert({
            type: "synced",
            message: `Webhook: ${triggerSlug}`,
            payload: verified as never,
          });

          // Try to reconcile a connected account referenced by the payload.
          const accountId = findConnectedAccountId(verified);
          if (accountId) {
            const { data: account } = await supabaseAdmin
              .from("social_accounts")
              .select("*")
              .eq("connected_account_id", accountId)
              .maybeSingle();
            if (account) {
              const { getConnectedAccount } = await import("@/lib/publishing/composio.server");
              const remote = await getConnectedAccount(accountId);
              if (remote) {
                const status = /active|connected/i.test(remote.status)
                  ? "connected"
                  : /expired/i.test(remote.status)
                    ? "expired"
                    : /fail|error/i.test(remote.status)
                      ? "error"
                      : "attention_required";
                await supabaseAdmin
                  .from("social_accounts")
                  .update({ status, last_checked_at: new Date().toISOString() })
                  .eq("id", account.id);
              }
            }
          }
        } catch {
          // Never fail the webhook because our bookkeeping failed.
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});

function findConnectedAccountId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  for (const key of ["connected_account_id", "connectedAccountId", "connectedAccountID"]) {
    const v = obj[key];
    if (typeof v === "string") return v;
  }
  for (const v of Object.values(obj)) {
    const found = findConnectedAccountId(v);
    if (found) return found;
  }
  return null;
}

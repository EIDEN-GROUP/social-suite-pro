import { getRequest } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";

/**
 * Verifies the caller of a server function is an authenticated superadmin.
 *
 * Server functions are publicly reachable RPC endpoints - a client-side route
 * guard protects the UI, not the endpoint. Any handler that touches the
 * service-role client (which bypasses RLS) MUST call this first.
 *
 * Returns the caller's user id on success, throws on failure.
 *
 * Server-only: imports here are dynamic so nothing node/secret-y is pulled
 * into the client bundle.
 */
export async function requireSuperadmin(): Promise<{ userId: string }> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase server environment is not configured.");

  const request = getRequest();
  const authHeader = request?.headers?.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) throw new Error("Unauthorized");

  const [{ createClient }, { default: ws }] = await Promise.all([
    import("@supabase/supabase-js"),
    import("ws"),
  ]);

  const client = createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as unknown as typeof WebSocket },
  });

  const { data, error } = await client.auth.getClaims(token);
  const userId = data?.claims?.sub as string | undefined;
  if (error || !userId) throw new Error("Unauthorized");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: role } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "superadmin")
    .maybeSingle();
  if (!role) throw new Error("Forbidden");

  return { userId };
}

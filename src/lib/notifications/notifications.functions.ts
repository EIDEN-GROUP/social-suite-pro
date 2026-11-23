import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Internal notification feed (approvals, publishing outcomes, account issues).
 * Superadmin-only. Notifications are written by server code (client approval,
 * publishing engine) and read here.
 */

export const listNotifications = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({}).parse(input ?? {}))
  .handler(async () => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: items } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);

    const unread = (items ?? []).filter((n) => !n.read_at).length;
    return { items: items ?? [], unread };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({}).parse(input ?? {}))
  .handler(async () => {
    await (await import("@/lib/server-auth.server")).requireSuperadmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    return { ok: true };
  });

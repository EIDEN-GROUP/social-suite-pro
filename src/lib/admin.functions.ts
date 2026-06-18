import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Bootstraps the single studio superadmin without email confirmation.
 * Only works while no superadmin exists yet (the studio is "unclaimed").
 * Creates the account already-confirmed via the service-role admin API,
 * so sign-in works immediately regardless of the project's email settings.
 */
export const signUpStudioAdmin = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email().max(255),
        password: z.string().min(8).max(128),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "superadmin");
    if ((count ?? 0) > 0) throw new Error("The studio account already exists. Please sign in.");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (createErr || !created.user)
      throw new Error(createErr?.message ?? "Failed to create studio account");

    // The DB trigger assigns superadmin to the first user; ensure it exists either way.
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", created.user.id)
      .eq("role", "superadmin")
      .maybeSingle();
    if (!existing) {
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: created.user.id, role: "superadmin" });
      if (roleErr) {
        await supabaseAdmin.auth.admin.deleteUser(created.user.id);
        throw new Error(roleErr.message);
      }
    }

    return { user_id: created.user.id };
  });

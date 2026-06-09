import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Public contact-form submission. Anyone can submit (no auth), so we validate
 * strictly and write with the service-role client - the `contacts` table itself
 * stays locked to anon traffic. The studio reads leads via the superadmin RLS
 * policy. After saving, the client also opens WhatsApp with a prefilled message.
 */
export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        name: z.string().trim().min(1, "Please add your name").max(120),
        email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")),
        phone: z.string().trim().max(40).optional().or(z.literal("")),
        message: z.string().trim().min(1, "Tell us a little about your project").max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contacts").insert({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

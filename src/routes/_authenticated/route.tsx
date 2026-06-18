import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Use getSession() (local + auto-refreshes an expired access token via the
    // refresh token) rather than getUser() (server validation that fails the
    // moment the 1h access token expires, falsely logging the admin out).
    let user = null;
    try {
      const { data } = await supabase.auth.getSession();
      user = data.session?.user ?? null;
    } catch {
      user = null;
    }
    if (!user) {
      if (typeof window !== "undefined")
        sessionStorage.setItem("post_login_redirect", location.href);
      throw redirect({ to: "/auth" });
    }

    // Admin area is superadmin-only. A plain session is NOT enough - verify the
    // role before letting anyone past the gate, and sign out non-admins.
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "superadmin");
    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }

    return { user };
  },
  component: () => <Outlet />,
});

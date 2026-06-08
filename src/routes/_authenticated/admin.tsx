import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route for everything under /admin. It MUST render <Outlet /> so that
// child routes (the companies list at /admin and the detail at
// /admin/companies/$slug) have somewhere to display.
export const Route = createFileRoute("/_authenticated/admin")({
  component: () => <Outlet />,
});

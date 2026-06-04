
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.user_company_id(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_superadmin() FROM public, anon, authenticated;

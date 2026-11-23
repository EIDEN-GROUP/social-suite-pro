-- ================================================================
-- Harden the first-superadmin bootstrap against concurrent claims.
--
-- The original trigger ran a plain "IF NOT EXISTS ... INSERT", which two
-- concurrent auth.users inserts could both pass. Taking a transaction-scoped
-- advisory lock serialises the check+insert so only one account can ever be
-- granted superadmin during bootstrap.
-- ================================================================

CREATE OR REPLACE FUNCTION public.bootstrap_first_superadmin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Serialise bootstrap attempts; the lock is released at transaction end.
  PERFORM pg_advisory_xact_lock(918273645);

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'superadmin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'superadmin');
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_first_superadmin() FROM public, anon, authenticated;
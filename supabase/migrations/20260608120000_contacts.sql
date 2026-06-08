-- Contact form leads. Submissions arrive only through the validated
-- `submitContact` server function (service-role insert), so the table stays
-- fully locked to anon/authenticated traffic. The studio superadmin can read.
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin reads contacts" ON public.contacts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

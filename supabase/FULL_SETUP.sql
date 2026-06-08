-- ================================================================
-- Atelier - FULL database setup for a fresh Supabase project.
-- Paste this whole file into the Supabase SQL Editor and Run.
-- Safe order: base schema first, then the full-port additions.
-- ================================================================

-- >>>>>>>>>>>>>>>>>>>>  20260604211322_f6d61358-6a06-4b17-b16b-6dedbb62fb8f.sql  <<<<<<<<<<<<<<<<<<<<

CREATE TYPE public.app_role AS ENUM ('superadmin', 'client');
CREATE TYPE public.platform AS ENUM ('instagram', 'tiktok', 'facebook', 'twitter', 'linkedin');
CREATE TYPE public.post_type AS ENUM ('post', 'reel', 'story', 'carousel');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  accent_color text NOT NULL DEFAULT '#0d0d0d',
  logo_url text,
  bio text,
  username text,
  profile_pic_url text,
  followers text DEFAULT '0',
  following integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT ON public.companies TO anon;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, company_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.user_company_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.user_roles WHERE user_id = _user_id AND role = 'client' LIMIT 1
$$;

CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform public.platform NOT NULL,
  post_type public.post_type NOT NULL DEFAULT 'post',
  media_url text,
  media_type text DEFAULT 'image',
  caption text,
  position integer NOT NULL DEFAULT 0,
  status public.approval_status NOT NULL DEFAULT 'pending',
  client_comment text,
  decided_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_posts_company_platform ON public.posts(company_id, platform, position);

CREATE POLICY "Superadmin manages companies" ON public.companies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin')) WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Clients view own company" ON public.companies FOR SELECT TO authenticated
  USING (id = public.user_company_id(auth.uid()));
CREATE POLICY "Anon view company branding" ON public.companies FOR SELECT TO anon USING (true);

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin manages posts" ON public.posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin')) WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Clients view own posts" ON public.posts FOR SELECT TO authenticated
  USING (company_id = public.user_company_id(auth.uid()));
CREATE POLICY "Clients update own posts" ON public.posts FOR UPDATE TO authenticated
  USING (company_id = public.user_company_id(auth.uid()))
  WITH CHECK (company_id = public.user_company_id(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER trg_companies_touch BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_posts_touch BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.bootstrap_first_superadmin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'superadmin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'superadmin');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_bootstrap_superadmin AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_superadmin();


-- >>>>>>>>>>>>>>>>>>>>  20260604211336_3a163add-50f7-4979-8051-6edf4fcead84.sql  <<<<<<<<<<<<<<<<<<<<

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.user_company_id(uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_superadmin() FROM public, anon, authenticated;


-- >>>>>>>>>>>>>>>>>>>>  20260604211358_47535604-9f04-4ee9-975d-dfd3f03ffc8a.sql  <<<<<<<<<<<<<<<<<<<<

CREATE POLICY "Auth read media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media');
CREATE POLICY "Auth upload media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');
CREATE POLICY "Superadmin manage media" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'superadmin'));


-- >>>>>>>>>>>>>>>>>>>>  20260604211400_full_port.sql  <<<<<<<<<<<<<<<<<<<<
-- ================================================================
-- Full port: media bucket, per-company client password, profile
-- extras, carousel media, and highlights.
-- Idempotent - safe to re-run.
-- ================================================================

-- ----------------------------------------------------------------
-- Storage: public "media" bucket (uploads + permanent public URLs)
-- ----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ----------------------------------------------------------------
-- Companies: simple per-company client password + profile extras
-- ----------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS client_password text NOT NULL DEFAULT 'client123',
  ADD COLUMN IF NOT EXISTS link text,
  ADD COLUMN IF NOT EXISTS category text;

-- client_password must never be exposed to anonymous visitors.
-- Clients reach their workspace through a server function that
-- validates the password server-side, so anon needs no table read.
DROP POLICY IF EXISTS "Anon view company branding" ON public.companies;
REVOKE SELECT ON public.companies FROM anon;

-- ----------------------------------------------------------------
-- Posts: extra media for carousels (array of additional URLs)
-- ----------------------------------------------------------------
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS extra_media jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ----------------------------------------------------------------
-- Highlights (Instagram story highlights - one set per company)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  label text,
  emoji text,
  image text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.highlights TO authenticated;
GRANT ALL ON public.highlights TO service_role;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_highlights_company ON public.highlights(company_id, position);

DROP POLICY IF EXISTS "Superadmin manages highlights" ON public.highlights;
CREATE POLICY "Superadmin manages highlights" ON public.highlights FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- ----------------------------------------------------------------
-- Realtime: let the studio see client approvals/rejections live
-- ----------------------------------------------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;



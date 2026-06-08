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

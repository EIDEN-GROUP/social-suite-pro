-- ================================================================
-- Simulator - Composio social accounts + publishing
--
-- ADDITIVE ONLY. Nothing existing is dropped or rewritten. This adds:
--   * social connection tables (accounts, integration configs, events)
--   * a server-side publishing queue (jobs, attempts, published posts, audit)
--   * a minimal internal notification table
--   * three non-destructive columns on public.posts + an approval
--     invalidation trigger.
--
-- Idempotent - safe to re-run.
-- ================================================================

-- ----------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.social_account_status AS ENUM
    ('connected', 'attention_required', 'expired', 'disconnected', 'error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.publishing_job_status AS ENUM
    ('ready', 'scheduled', 'processing', 'published', 'failed', 'cancelled', 'requires_attention');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.publishing_job_kind AS ENUM ('immediate', 'scheduled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.integration_event_type AS ENUM
    ('connected', 'reconnected', 'disconnected', 'expired', 'error', 'synced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------
-- posts: content versioning so an edit invalidates an approval
-- without disturbing the client-facing status flow.
--   content_version          - bumped whenever the client-visible content changes
--   approved_content_version - the version the client approved
--   publish_state            - lightweight mirror of the publishing job state
-- ----------------------------------------------------------------
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS content_version integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_content_version integer,
  ADD COLUMN IF NOT EXISTS publish_state text;

-- Reset an approval when the approved content is edited. Fires BEFORE UPDATE
-- so the new row is stored already-correct.
CREATE OR REPLACE FUNCTION public.invalidate_post_approval()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status = 'approved' AND (
       NEW.caption      IS DISTINCT FROM OLD.caption
    OR NEW.post_type    IS DISTINCT FROM OLD.post_type
    OR NEW.media_url    IS DISTINCT FROM OLD.media_url
    OR NEW.extra_media  IS DISTINCT FROM OLD.extra_media
  ) THEN
    NEW.content_version := OLD.content_version + 1;
    NEW.status := 'pending';
    NEW.decided_at := NULL;
    NEW.client_comment := NULL;
    NEW.approved_content_version := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_posts_invalidate_approval ON public.posts;
CREATE TRIGGER trg_posts_invalidate_approval BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.invalidate_post_approval();

-- ----------------------------------------------------------------
-- integration_configs: which Composio auth config each platform uses.
-- Lets ops rotate an auth config without a redeploy. Env vars remain a fallback.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform public.platform NOT NULL UNIQUE,
  toolkit text NOT NULL,
  auth_config_id text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_configs TO authenticated;
GRANT ALL ON public.integration_configs TO service_role;
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin manages integration configs" ON public.integration_configs;
CREATE POLICY "Superadmin manages integration configs" ON public.integration_configs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- ----------------------------------------------------------------
-- social_accounts: the mapping between an internal client and a Composio
-- connected account. composio_user_id is derived from the company id so a
-- client's authorization context can never bleed into another client's.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform public.platform NOT NULL,
  composio_user_id text NOT NULL,
  connected_account_id text NOT NULL UNIQUE,
  external_account_id text,
  display_name text NOT NULL DEFAULT '',
  username text,
  avatar_url text,
  account_type text,
  status public.social_account_status NOT NULL DEFAULT 'connected',
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  can_publish boolean NOT NULL DEFAULT false,
  last_checked_at timestamptz,
  last_synced_at timestamptz,
  last_error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, connected_account_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_social_accounts_company ON public.social_accounts(company_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_status ON public.social_accounts(status);

DROP POLICY IF EXISTS "Superadmin manages social accounts" ON public.social_accounts;
CREATE POLICY "Superadmin manages social accounts" ON public.social_accounts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- ----------------------------------------------------------------
-- publishing_jobs: the server-side queue. One row per publish request.
-- idempotency_key prevents accidental duplicate publications.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.publishing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  social_account_id uuid REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  platform public.platform NOT NULL,
  kind public.publishing_job_kind NOT NULL DEFAULT 'immediate',
  status public.publishing_job_status NOT NULL DEFAULT 'ready',
  scheduled_for timestamptz,
  approved_content_version integer,
  idempotency_key text NOT NULL UNIQUE,
  attempts_count integer NOT NULL DEFAULT 0,
  locked_at timestamptz,
  last_error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publishing_jobs TO authenticated;
GRANT ALL ON public.publishing_jobs TO service_role;
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_jobs_status_sched ON public.publishing_jobs(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_jobs_post ON public.publishing_jobs(post_id);

DROP POLICY IF EXISTS "Superadmin manages publishing jobs" ON public.publishing_jobs;
CREATE POLICY "Superadmin manages publishing jobs" ON public.publishing_jobs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- ----------------------------------------------------------------
-- publishing_attempts: one row per execution attempt (never deleted)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.publishing_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.publishing_jobs(id) ON DELETE CASCADE,
  attempt_no integer NOT NULL,
  outcome text NOT NULL DEFAULT 'pending',
  provider_request_id text,
  provider_response jsonb,
  error_code text,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publishing_attempts TO authenticated;
GRANT ALL ON public.publishing_attempts TO service_role;
ALTER TABLE public.publishing_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_attempts_job ON public.publishing_attempts(job_id, attempt_no);

DROP POLICY IF EXISTS "Superadmin manages publishing attempts" ON public.publishing_attempts;
CREATE POLICY "Superadmin manages publishing attempts" ON public.publishing_attempts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- ----------------------------------------------------------------
-- published_posts: confirmed external references (only on provider success)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.published_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.publishing_jobs(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  platform public.platform NOT NULL,
  external_post_id text,
  external_url text,
  published_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.published_posts TO authenticated;
GRANT ALL ON public.published_posts TO service_role;
ALTER TABLE public.published_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin manages published posts" ON public.published_posts;
CREATE POLICY "Superadmin manages published posts" ON public.published_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- ----------------------------------------------------------------
-- integration_events: connection lifecycle audit trail
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  social_account_id uuid REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  type public.integration_event_type NOT NULL,
  message text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_events TO authenticated;
GRANT ALL ON public.integration_events TO service_role;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_integration_events_company ON public.integration_events(company_id, created_at DESC);

DROP POLICY IF EXISTS "Superadmin manages integration events" ON public.integration_events;
CREATE POLICY "Superadmin manages integration events" ON public.integration_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- ----------------------------------------------------------------
-- publishing_audit_logs: who did what, to which job
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.publishing_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.publishing_jobs(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  actor_user_id uuid,
  actor_type text NOT NULL DEFAULT 'internal',
  action text NOT NULL,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publishing_audit_logs TO authenticated;
GRANT ALL ON public.publishing_audit_logs TO service_role;
ALTER TABLE public.publishing_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_audit_job ON public.publishing_audit_logs(job_id, created_at DESC);

DROP POLICY IF EXISTS "Superadmin manages publishing audit logs" ON public.publishing_audit_logs;
CREATE POLICY "Superadmin manages publishing audit logs" ON public.publishing_audit_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- ----------------------------------------------------------------
-- notifications: minimal internal notification store. Deduped by dedupe_key.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  link text,
  dedupe_key text UNIQUE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read_at, created_at DESC);

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Superadmin manages notifications" ON public.notifications;
CREATE POLICY "Superadmin manages notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- ----------------------------------------------------------------
-- claim_due_publishing_jobs: atomically claim due scheduled jobs so two
-- runners can never pick up the same job (FOR UPDATE SKIP LOCKED).
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_due_publishing_jobs(p_limit integer DEFAULT 5)
RETURNS SETOF public.publishing_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  UPDATE public.publishing_jobs j
     SET status = 'processing',
         locked_at = now(),
         attempts_count = j.attempts_count + 1,
         updated_at = now()
   WHERE j.id IN (
     SELECT id FROM public.publishing_jobs
      WHERE status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= now()
      ORDER BY scheduled_for
      FOR UPDATE SKIP LOCKED
      LIMIT p_limit
   )
  RETURNING j.*;
END $$;

REVOKE EXECUTE ON FUNCTION public.claim_due_publishing_jobs(integer) FROM public, anon, authenticated;

-- Realtime: let the studio react to job state changes.
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.publishing_jobs;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

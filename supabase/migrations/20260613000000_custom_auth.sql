-- =============================================================================
-- White-label OAuth (bring your own OAuth app)
-- =============================================================================
-- Lets ops switch a platform between Composio-managed auth and our own OAuth
-- app without a redeploy, and records what the provider must whitelist.
--
-- No client secrets are stored here: secrets go straight to Composio when the
-- custom auth config is created. We only keep non-secret metadata.
-- -----------------------------------------------------------------------------

ALTER TABLE public.integration_configs
  ADD COLUMN IF NOT EXISTS auth_mode text NOT NULL DEFAULT 'managed',
  ADD COLUMN IF NOT EXISTS oauth_redirect_uri text,
  ADD COLUMN IF NOT EXISTS scopes text,
  ADD COLUMN IF NOT EXISTS app_name text,
  ADD COLUMN IF NOT EXISTS provisioned_at timestamptz,
  ADD COLUMN IF NOT EXISTS provisioning_error text;

COMMENT ON COLUMN public.integration_configs.auth_mode IS
  'managed = Composio-managed OAuth app; custom = our own OAuth app credentials.';
COMMENT ON COLUMN public.integration_configs.oauth_redirect_uri IS
  'Redirect URI registered with the provider (usually Composio''s shared callback).';
COMMENT ON COLUMN public.integration_configs.scopes IS
  'Comma-separated scopes requested by the custom OAuth app (optional).';

-- Audit event for auth-config changes (nullable company = studio-wide).
ALTER TYPE public.integration_event_type ADD VALUE IF NOT EXISTS 'auth_config_created';
ALTER TYPE public.integration_event_type ADD VALUE IF NOT EXISTS 'auth_config_reset';

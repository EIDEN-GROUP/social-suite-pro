-- Posted status: live-post link + posted timestamp.
-- Admin sets post_url after approval; saving transitions approved -> posted.
-- Safe to re-run.

-- 1) New columns
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS post_url text,
  ADD COLUMN IF NOT EXISTS posted_at timestamptz;

-- 2) New enum value (standalone statement - do not wrap with others in a transaction)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'approval_status' AND e.enumlabel = 'posted'
  ) THEN
    ALTER TYPE public.approval_status ADD VALUE 'posted';
  END IF;
END $$;

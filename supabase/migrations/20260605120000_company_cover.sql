-- Cover / banner image per company (used on Facebook, X, LinkedIn page headers).
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cover_url text;

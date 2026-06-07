-- Add AI-generated content fields to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS html_code TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS brand_identity JSONB;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS telegram_handle TEXT;

-- Add index for faster queries on owner and status
CREATE INDEX IF NOT EXISTS projects_owner_status_idx ON public.projects(owner_id, status, updated_at DESC);

-- Free plan video export limits
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS videos_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS videos_limit INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS reset_at TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month');

-- Reset usage at month boundary on read/update
CREATE OR REPLACE FUNCTION public.reset_video_quota_if_needed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.reset_at <= now() THEN
    NEW.videos_used := 0;
    NEW.reset_at := date_trunc('month', now()) + interval '1 month';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_reset_video_quota ON public.profiles;
CREATE TRIGGER profiles_reset_video_quota
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.reset_video_quota_if_needed();

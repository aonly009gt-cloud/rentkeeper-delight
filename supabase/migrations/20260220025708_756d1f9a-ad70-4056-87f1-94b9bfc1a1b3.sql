
-- Add liff_id to user_settings for each dorm owner's LINE LIFF configuration
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS liff_id text DEFAULT '';

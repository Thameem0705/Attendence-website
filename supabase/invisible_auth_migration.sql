-- THIS SCRIPT MIGRATES ALL OLD USERS TO THE NEW INVISIBLE SUPABASE AUTH SYSTEM --

-- 1. Create Supabase Auth accounts for all existing users in the `profiles` table
-- This assigns them their unique "@attendancesystem.local" email based on their username.
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
SELECT 
  id, 
  '00000000-0000-0000-0000-000000000000', 
  'authenticated', 
  'authenticated', 
  LOWER(username) || '@attendancesystem.local', 
  crypt(assigned_password, gen_salt('bf')), 
  now(), 
  created_at, 
  created_at,
  '',
  ''
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- 2. Link auth.identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(), 
  id, 
  jsonb_build_object('sub', id, 'email', LOWER(username) || '@attendancesystem.local'),
  'email', 
  id, 
  now(), 
  created_at, 
  created_at
FROM public.profiles
ON CONFLICT DO NOTHING;

-- 3. Update the trigger function so new users get proper auth cleanup
-- We must drop the old version first because we are removing the service_role key reliance
CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS trigger AS $$
BEGIN
  -- When a profile is deleted, delete the core auth.users record.
  -- This replaces the need for the frontend to do it recursively (which requires the service key)
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to recreate
DROP TRIGGER IF EXISTS on_profile_delete ON public.profiles;

CREATE TRIGGER on_profile_delete
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_user();

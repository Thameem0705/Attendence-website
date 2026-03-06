-- ==========================================
-- FIX: Update the role check constraint
-- to allow 'staff' and 'trainee' roles
-- ==========================================
-- Run this in the Supabase SQL Editor

-- Drop the old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Create the new constraint allowing staff and trainee
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'user', 'staff', 'trainee'));

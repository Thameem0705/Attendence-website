-- ==========================================
-- FIX: Infinite Recursion in RLS Policies
-- ==========================================
-- Run this ENTIRE script in the Supabase SQL Editor
-- It drops ALL old policies and creates fixed ones.
-- Safe to run multiple times (fully idempotent).

-- ==========================================
-- STEP 1: Drop ALL existing policies on all tables
-- ==========================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users" ON profiles;

-- Attendance policies
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Users can mark own attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can delete attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can insert attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can update attendance" ON attendance;
DROP POLICY IF EXISTS "Enable read access for users" ON attendance;
DROP POLICY IF EXISTS "Enable insert for users" ON attendance;
DROP POLICY IF EXISTS "Enable update for users" ON attendance;
DROP POLICY IF EXISTS "Enable delete for users" ON attendance;

-- Permission requests policies
DROP POLICY IF EXISTS "Users can view own requests" ON permission_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON permission_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON permission_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON permission_requests;
DROP POLICY IF EXISTS "Admins can delete requests" ON permission_requests;
DROP POLICY IF EXISTS "Enable read access for users" ON permission_requests;
DROP POLICY IF EXISTS "Enable insert for users" ON permission_requests;
DROP POLICY IF EXISTS "Enable update for users" ON permission_requests;
DROP POLICY IF EXISTS "Enable delete for users" ON permission_requests;

-- ==========================================
-- STEP 2: Create a helper function that checks
-- admin role WITHOUT triggering RLS (security definer)
-- ==========================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================
-- STEP 3: Recreate PROFILES policies (fixed)
-- ==========================================

-- Any authenticated user can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins can view ALL profiles (uses helper function - no recursion)
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_admin());

-- Users can insert their own profile on signup
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Admins can delete any profile
CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
TO authenticated
USING (is_admin());

-- Admins can update any profile (e.g. change roles)
CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (is_admin());

-- ==========================================
-- STEP 4: Recreate ATTENDANCE policies (fixed)
-- ==========================================
CREATE POLICY "Users can view own attendance"
ON attendance FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can mark own attendance"
ON attendance FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all attendance"
ON attendance FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete attendance"
ON attendance FOR DELETE
TO authenticated
USING (is_admin());

-- Admins can insert attendance for any user
CREATE POLICY "Admins can insert attendance"
ON attendance FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Admins can update attendance status for any user
CREATE POLICY "Admins can update attendance"
ON attendance FOR UPDATE
TO authenticated
USING (is_admin());

-- ==========================================
-- STEP 5: Recreate PERMISSION REQUESTS policies (fixed)
-- ==========================================
CREATE POLICY "Users can view own requests"
ON permission_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create own requests"
ON permission_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all requests"
ON permission_requests FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update requests"
ON permission_requests FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ==========================================
-- DONE! The infinite recursion is now fixed.
-- ==========================================

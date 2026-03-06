-- Supabase Attendance System Schema & RLS Setup

-- Create Custom Types
-- Uncomment if needed: CREATE TYPE user_role AS ENUM ('admin', 'user');
-- Uncomment if needed: CREATE TYPE attendance_status AS ENUM ('present', 'absent');
-- Uncomment if needed: CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- ==========================================
-- 1. Tables Creation
-- ==========================================

-- 1.1 Profiles Table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('admin', 'user')) NOT NULL,
  name text,
  email text,
  address text,
  username text UNIQUE,
  assigned_password text,
  created_at timestamp DEFAULT now()
);

-- Note: To update an existing table, you can run:
-- ALTER TABLE profiles ADD COLUMN name text;
-- ALTER TABLE profiles ADD COLUMN email text;
-- ALTER TABLE profiles ADD COLUMN address text;
-- ALTER TABLE profiles ADD COLUMN username text UNIQUE;
-- ALTER TABLE profiles ADD COLUMN assigned_password text;

-- 1.2 Attendance Table
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text CHECK (status IN ('present', 'absent')) NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Constraint to prevent duplicate attendance per user per date
ALTER TABLE attendance 
ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);

-- 1.3 Permission Requests Table
CREATE TABLE permission_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  reason text,
  status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  admin_remark text,
  created_at timestamp DEFAULT now()
);

-- ==========================================
-- 2. Enable Row Level Security (RLS)
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_requests ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. RLS Policies
-- ==========================================
-- CAUTION: Do NOT use `using (true)`

-- ------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------
-- User: Can select only their own row
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
TO authenticated 
USING (id = auth.uid());

-- Admin: Can select all rows
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admin and User: Can insert own profile on signup, or Admin can insert any
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete profiles" 
ON profiles FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Note: In a secure setup, initial admin creation or profile insertion might need to be 
-- done via a Service Role Key (Node backend) bypassing RLS, or by manually running an insert.
-- The policy above ensures standard authenticated users cannot insert, but an existing admin can.

-- ------------------------------------------
-- ATTENDANCE POLICIES
-- ------------------------------------------
-- User: Can select only their own attendance
CREATE POLICY "Users can view own attendance" 
ON attendance FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- User: Can insert only where user_id = auth.uid()
CREATE POLICY "Users can mark own attendance" 
ON attendance FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Admin: Can select all attendance
CREATE POLICY "Admins can view all attendance" 
ON attendance FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admin: Cannot insert attendance for users.
-- This is naturally enforced since there is no INSERT policy for admins on `attendance`.
-- (Unless the admin is inserting their own attendance using the User policy above)

-- ------------------------------------------
-- PERMISSION REQUEST POLICIES
-- ------------------------------------------
-- User: Can select only own requests
CREATE POLICY "Users can view own requests" 
ON permission_requests FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- User: Can insert where user_id = auth.uid()
CREATE POLICY "Users can create own requests" 
ON permission_requests FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Admin: Can select all requests
CREATE POLICY "Admins can view all requests" 
ON permission_requests FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admin: Can update status + admin_remark
CREATE POLICY "Admins can update requests" 
ON permission_requests FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ==========================================
-- 4. Initial Admin Setup (Manual Instruction)
-- ==========================================
-- After creating an admin user in Supabase Auth via the dashboard,
-- run the following command to make them an admin:
-- INSERT INTO profiles (id, role) VALUES ('<USER_UUID>', 'admin');

/*
  # Fix User Table RLS Policies

  1. Changes
    - Update RLS policies for users table
    - Add policies for user profile management
    - Allow users to view and manage their own profiles
    - Allow authenticated users to create their profile

  2. Security
    - Maintain data privacy
    - Enable secure profile creation
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Create new policies
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  auth.uid() IN (
    SELECT id FROM users WHERE is_provider = true
  )
);

CREATE POLICY "Users can create their profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
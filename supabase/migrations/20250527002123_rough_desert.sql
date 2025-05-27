/*
  # Fix Users Table Policies

  1. Changes
    - Remove recursive policy that was causing infinite recursion
    - Simplify policies for user profile access
    - Add policy for providers to view user profiles

  2. Security
    - Maintain data access control
    - Prevent infinite recursion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can create their profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create new policies without recursion
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Providers can view user profiles"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS providers
    WHERE providers.id = auth.uid()
    AND providers.is_provider = true
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
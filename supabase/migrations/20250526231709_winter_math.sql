/*
  # Add Unique Profiles and Authentication Requirements

  1. Changes
    - Add unique constraints to user profiles
    - Add policies to require authentication for purchases
    - Add validation for user email uniqueness

  2. Security
    - Enforce authentication for all purchase-related operations
    - Ensure profile data integrity
*/

-- Add unique constraints to user profiles
ALTER TABLE users
ADD CONSTRAINT unique_user_email UNIQUE (email);

-- Add policy to require authentication for purchases
CREATE POLICY "Require authentication for purchases"
ON reservations
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add policy to ensure users can only access their own profile data
CREATE POLICY "Users can only access their own profile"
ON users
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
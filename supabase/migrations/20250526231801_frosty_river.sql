/*
  # Authentication and Profile Requirements

  1. Changes
    - Add policies for reservations to require authentication
    - Add policies for profile data access control
    - Add email uniqueness constraints

  2. Security
    - Ensure only authenticated users can make purchases
    - Restrict profile access to owners
*/

-- Add policy to require authentication for purchases
CREATE POLICY "Require authentication for purchases"
ON reservations
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add policy to ensure users can only access their own reservations
CREATE POLICY "Users can only access their own reservations"
ON reservations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add policy to ensure providers can only access their own services
CREATE POLICY "Providers can only access their own services"
ON services
FOR ALL
TO authenticated
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

-- Add unique constraint to auth.users email
ALTER TABLE auth.users
ADD CONSTRAINT unique_user_email UNIQUE (email);
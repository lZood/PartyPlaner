/*
  # Authentication and Authorization Policies

  1. Changes
    - Add policies to require authentication for purchases
    - Ensure users can only access their own reservations
    - Ensure providers can only access their own services

  2. Security
    - Enforce user authentication for purchases
    - Restrict access to user-specific data
    - Protect service provider data
*/

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Require authentication for purchases" ON reservations;
  DROP POLICY IF EXISTS "Users can only access their own reservations" ON reservations;
  DROP POLICY IF EXISTS "Providers can only access their own services" ON services;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

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
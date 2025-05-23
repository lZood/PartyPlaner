/*
  # Add Service Provider Features

  1. Changes
    - Add provider_id to services table
    - Add provider details to services
    - Add policies for service providers

  2. Security
    - Enable RLS for service providers
    - Add policies for managing services
*/

-- Add provider_id to services
ALTER TABLE services 
ADD COLUMN provider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN provider_name text,
ADD COLUMN provider_phone text,
ADD COLUMN provider_email text,
ADD COLUMN is_approved boolean DEFAULT false;

-- Add provider management policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' 
    AND policyname = 'Providers can insert their own services'
  ) THEN
    CREATE POLICY "Providers can insert their own services" 
    ON services FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = provider_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' 
    AND policyname = 'Providers can update their own services'
  ) THEN
    CREATE POLICY "Providers can update their own services" 
    ON services FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = provider_id)
    WITH CHECK (auth.uid() = provider_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' 
    AND policyname = 'Providers can delete their own services'
  ) THEN
    CREATE POLICY "Providers can delete their own services" 
    ON services FOR DELETE 
    TO authenticated 
    USING (auth.uid() = provider_id);
  END IF;
END $$;
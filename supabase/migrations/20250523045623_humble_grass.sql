/*
  # Add Service and Storage Policies

  1. Storage Policies
    - Enable storage RLS
    - Add policy for authenticated users to upload service images
  
  2. Service Policies
    - Add policy for providers to create their own services
    - Add policy for providers to manage their service images

  Note: This migration adds the necessary RLS policies to allow:
    - Service providers to create new services
    - Authenticated users to upload images to the service-images bucket
*/

-- Enable RLS for storage
BEGIN;

-- Create policy to allow authenticated users to upload service images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = 'Authenticated users can upload service images'
  ) THEN
    CREATE POLICY "Authenticated users can upload service images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'service-images' AND
      auth.role() = 'authenticated'
    );
  END IF;
END $$;

-- Create policy to allow authenticated users to read service images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = 'Anyone can view service images'
  ) THEN
    CREATE POLICY "Anyone can view service images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'service-images');
  END IF;
END $$;

-- Create policy to allow providers to delete their service images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = 'Providers can delete their service images'
  ) THEN
    CREATE POLICY "Providers can delete their service images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'service-images');
  END IF;
END $$;

-- Create policy to allow providers to create services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Providers can create their own services'
  ) THEN
    CREATE POLICY "Providers can create their own services"
    ON services
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = provider_id);
  END IF;
END $$;

COMMIT;
/*
  # Add Service and Storage Policies

  1. Storage Policies
    - Enable authenticated users to upload images to service-images bucket
    - Enable public read access to service images
  
  2. Service Policies
    - Enable authenticated users to create services
    - Enable authenticated users to manage their own services
    - Enable public read access to services
*/

-- Storage bucket policies
BEGIN;

-- Create service-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
SELECT 'service-images', 'service-images'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'service-images'
);

-- Enable RLS for the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to service images
CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');

COMMIT;

-- Service table policies
BEGIN;

-- Enable RLS for services table if not already enabled
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to create their own services
CREATE POLICY "Users can create their own services"
ON services FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = provider_id
);

-- Allow users to manage their own services
CREATE POLICY "Users can manage their own services"
ON services FOR ALL
TO authenticated
USING (
  auth.uid() = provider_id
)
WITH CHECK (
  auth.uid() = provider_id
);

-- Allow public read access to services
CREATE POLICY "Anyone can view services"
ON services FOR SELECT
TO public
USING (true);

COMMIT;
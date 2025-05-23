/*
  # Storage and Service Policies

  1. Storage Bucket
    - Create service-images bucket if it doesn't exist
    - Add policies for upload, read, and delete operations

  2. Service Policies
    - Add policy for providers to create services
*/

-- Create service-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('service-images', 'service-images')
ON CONFLICT (id) DO NOTHING;

-- Storage bucket policies
CREATE POLICY "Authenticated users can upload service images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'service-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'service-images');

CREATE POLICY "Providers can delete their service images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'service-images');

-- Service policies
CREATE POLICY "Providers can create their own services"
ON services FOR INSERT TO authenticated
WITH CHECK (auth.uid() = provider_id);
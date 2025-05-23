/*
  # Create storage bucket for service images

  1. Storage
    - Create 'service-images' bucket for storing service-related images
  
  2. Security
    - Enable public read access to images
    - Allow authenticated users to upload and manage their own images
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true);

-- Policy to allow public read access to images
CREATE POLICY "Service images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');

-- Policy to allow authenticated users to upload images
CREATE POLICY "Users can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images'
  AND (storage.foldername(name))[1] = 'services'
);

-- Policy to allow users to update and delete their own images
CREATE POLICY "Users can update and delete their own service images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-images'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
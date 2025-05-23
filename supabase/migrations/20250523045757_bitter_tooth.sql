/*
  # Add Service and Storage Policies

  1. Changes
    - Add storage bucket policies for service-images
    - Add RLS policies for services table to allow authenticated users to manage their own services
    - Add RLS policies for service_images table to allow authenticated users to manage their service images

  2. Security
    - Enable RLS on services and service_images tables
    - Add policies for authenticated users to:
      - Create new services (where they are the provider)
      - Upload images to service-images bucket
      - Manage their service images
*/

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
SELECT 'service-images', 'service-images'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'service-images'
);

-- Enable RLS for storage bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage bucket policies
CREATE POLICY "Authenticated users can upload service images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'service-images' AND
  (storage.foldername(name))[1] = 'services'
);

CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'service-images');

CREATE POLICY "Users can update their own service images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'service-images')
WITH CHECK (bucket_id = 'service-images');

CREATE POLICY "Users can delete their own service images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'service-images');

-- Service images policies
CREATE POLICY "Users can manage their service images"
ON service_images FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM services
    WHERE services.id = service_images.service_id
    AND services.provider_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM services
    WHERE services.id = service_images.service_id
    AND services.provider_id = auth.uid()
  )
);

-- Services policies
CREATE POLICY "Users can create their own services"
ON services FOR INSERT TO authenticated
WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Users can update their own services"
ON services FOR UPDATE TO authenticated
USING (provider_id = auth.uid())
WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Users can delete their own services"
ON services FOR DELETE TO authenticated
USING (provider_id = auth.uid());

CREATE POLICY "Anyone can view services"
ON services FOR SELECT TO public
USING (true);
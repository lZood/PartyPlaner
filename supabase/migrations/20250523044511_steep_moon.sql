/*
  # Add Image Storage Support

  1. New Tables
    - `service_images`
      - Stores metadata for service images including main image and gallery
      - Links images to services
      - Tracks upload status and metadata

  2. Security
    - Enable RLS
    - Add policies for secure access
*/

-- Create service_images table
CREATE TABLE IF NOT EXISTS service_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  is_main_image boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;

-- Policies for service_images
CREATE POLICY "Images are viewable by everyone" 
ON service_images FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Providers can manage their service images" 
ON service_images 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM services 
    WHERE services.id = service_images.service_id 
    AND services.provider_id = auth.uid()
  )
);
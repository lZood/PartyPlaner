/*
  # Add Service Provider Features

  1. Changes
    - Add provider fields to services table
    - Create service_images table
    - Set up storage policies
    - Add provider management policies

  2. Security
    - Enable RLS for service images
    - Add policies for managing services and images
*/

-- Add provider fields to services if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE services 
    ADD COLUMN provider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD COLUMN provider_name text,
    ADD COLUMN provider_phone text,
    ADD COLUMN provider_email text,
    ADD COLUMN is_approved boolean DEFAULT false;
  END IF;
END $$;

-- Create service_images table if it doesn't exist
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

-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Service images are publicly accessible'
  ) THEN
    CREATE POLICY "Service images are publicly accessible"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'service-images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can upload service images'
  ) THEN
    CREATE POLICY "Users can upload service images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'service-images'
      AND (storage.foldername(name))[1] = 'services'
    );
  END IF;
END $$;

-- Service provider policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' 
    AND policyname = 'Users can create their own services'
  ) THEN
    CREATE POLICY "Users can create their own services"
    ON services FOR INSERT
    TO authenticated
    WITH CHECK (provider_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' 
    AND policyname = 'Users can update their own services'
  ) THEN
    CREATE POLICY "Users can update their own services"
    ON services FOR UPDATE
    TO authenticated
    USING (provider_id = auth.uid())
    WITH CHECK (provider_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' 
    AND policyname = 'Users can delete their own services'
  ) THEN
    CREATE POLICY "Users can delete their own services"
    ON services FOR DELETE
    TO authenticated
    USING (provider_id = auth.uid());
  END IF;
END $$;

-- Service images policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_images' 
    AND policyname = 'Users can manage their service images'
  ) THEN
    CREATE POLICY "Users can manage their service images"
    ON service_images FOR ALL
    TO authenticated
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
  END IF;
END $$;

-- Add unique constraint for main image
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_main_image_per_service 
ON service_images (service_id)
WHERE is_main_image = true;
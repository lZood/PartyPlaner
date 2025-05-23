/*
  # Update Service Images Schema

  1. Changes
    - Remove legacy image columns from services table
    - Add index for optimizing image position queries
    - Add partial unique constraint for main service image

  2. Security
    - No changes to existing RLS policies
*/

-- Remove old image columns from services
ALTER TABLE services
DROP COLUMN IF EXISTS image_url,
DROP COLUMN IF EXISTS gallery;

-- Add image position index
CREATE INDEX IF NOT EXISTS idx_service_images_position 
ON service_images(service_id, position);

-- Add partial unique constraint for main image
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_main_image_per_service 
ON service_images (service_id)
WHERE is_main_image = true;
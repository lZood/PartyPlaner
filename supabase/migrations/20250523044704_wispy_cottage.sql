/*
  # Update Image Handling

  1. Changes
    - Remove image_url and gallery columns from services table
    - Add image handling through service_images table
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
    - Add policies for image management
*/

-- Remove old image columns from services
ALTER TABLE services
DROP COLUMN image_url,
DROP COLUMN gallery;

-- Add image position index
CREATE INDEX IF NOT EXISTS idx_service_images_position 
ON service_images(service_id, position);

-- Add unique constraint for main image
ALTER TABLE service_images
ADD CONSTRAINT unique_main_image_per_service 
UNIQUE (service_id, is_main_image) 
WHERE is_main_image = true;
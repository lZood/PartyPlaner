/*
  # Complete Database Schema

  1. New Tables
    - `users` - Extended user profile data
    - `services` - Service listings with provider details
    - `service_images` - Images for services
    - `service_availability` - Service availability tracking
    - `reservations` - User bookings/purchases
    - `favorites` - User favorite services
    - `cart_items` - Shopping cart items
    - `reviews` - Service reviews and ratings

  2. Security
    - Enable RLS on all tables
    - Add policies for secure access
    - Set up storage for images
*/

-- Create users table to extend auth.users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text UNIQUE,
  phone text,
  avatar_url text,
  is_provider boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id text NOT NULL,
  subcategory_id text NOT NULL,
  name text NOT NULL,
  short_description text NOT NULL,
  description text NOT NULL,
  price numeric,
  features text[] NOT NULL DEFAULT '{}',
  rating numeric NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  provider_name text,
  provider_phone text,
  provider_email text,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Create service_availability table
CREATE TABLE IF NOT EXISTS service_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_capacity integer NOT NULL,
  booked_capacity integer NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(service_id, date)
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  total_price numeric NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  event_location text NOT NULL,
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, service_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES reservations(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(reservation_id)
);

-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id, subcategory_id);
CREATE INDEX IF NOT EXISTS idx_service_images_position ON service_images(service_id, position);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_main_image_per_service ON service_images(service_id) WHERE is_main_image = true;
CREATE INDEX IF NOT EXISTS idx_availability_date ON service_availability(service_id, date);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_service ON reservations(service_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service_id);

-- Policies for users table
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policies for services
CREATE POLICY "Anyone can view published services"
ON services FOR SELECT TO public
USING (is_approved = true);

CREATE POLICY "Providers can manage their own services"
ON services FOR ALL TO authenticated
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

-- Policies for service images
CREATE POLICY "Anyone can view service images"
ON service_images FOR SELECT TO public
USING (true);

CREATE POLICY "Providers can manage their service images"
ON service_images FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM services
  WHERE services.id = service_images.service_id
  AND services.provider_id = auth.uid()
));

-- Policies for service availability
CREATE POLICY "Anyone can view service availability"
ON service_availability FOR SELECT TO public
USING (true);

CREATE POLICY "Providers can manage their service availability"
ON service_availability FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM services
  WHERE services.id = service_availability.service_id
  AND services.provider_id = auth.uid()
));

-- Policies for reservations
CREATE POLICY "Users can view their own reservations"
ON reservations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations"
ON reservations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policies for favorites
CREATE POLICY "Users can manage their favorites"
ON favorites FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for cart items
CREATE POLICY "Users can manage their cart"
ON cart_items FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for reviews
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT TO public
USING (true);

CREATE POLICY "Users can create reviews for their reservations"
ON reviews FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM reservations
    WHERE reservations.id = reservation_id
    AND reservations.user_id = auth.uid()
    AND reservations.status = 'completed'
  )
);

-- Storage policies
CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'service-images');

CREATE POLICY "Providers can upload service images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'service-images' AND
  (storage.foldername(name))[1] = 'services'
);

CREATE POLICY "Providers can manage their uploaded images"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'service-images' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
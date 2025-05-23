/*
  # Services and Availability Schema

  1. New Tables
    - `services`
      - Core service information including name, description, pricing
    - `service_availability`
      - Tracks available dates and capacity for each service
    - `reservations`
      - Stores customer reservations and booking details

  2. Security
    - Enable RLS on all tables
    - Add policies for secure access
*/

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text NOT NULL,
  subcategory_id text NOT NULL,
  name text NOT NULL,
  short_description text NOT NULL,
  description text NOT NULL,
  price numeric,
  image_url text NOT NULL,
  gallery text[] NOT NULL DEFAULT '{}',
  features text[] NOT NULL DEFAULT '{}',
  rating numeric NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service availability table
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

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Policies for services
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'services' 
    AND policyname = 'Services are viewable by everyone'
  ) THEN
    CREATE POLICY "Services are viewable by everyone" 
    ON services FOR SELECT 
    TO public 
    USING (true);
  END IF;
END $$;

-- Policies for service_availability
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_availability' 
    AND policyname = 'Availability is viewable by everyone'
  ) THEN
    CREATE POLICY "Availability is viewable by everyone" 
    ON service_availability FOR SELECT 
    TO public 
    USING (true);
  END IF;
END $$;

-- Policies for reservations
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' 
    AND policyname = 'Users can view their own reservations'
  ) THEN
    CREATE POLICY "Users can view their own reservations" 
    ON reservations FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reservations' 
    AND policyname = 'Users can create reservations'
  ) THEN
    CREATE POLICY "Users can create reservations" 
    ON reservations FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Functions
CREATE OR REPLACE FUNCTION check_service_availability(
  p_service_id uuid,
  p_date date
) RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM service_availability
    WHERE service_id = p_service_id 
    AND date = p_date
    AND is_available = true
    AND booked_capacity < total_capacity
  );
END;
$$;
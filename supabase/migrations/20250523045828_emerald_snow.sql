/*
  # Storage and Service Policies

  1. Services
    - Add policies for CRUD operations on services table
    - Ensure providers can only manage their own services
    - Allow public read access

  2. Service Images
    - Add policies for managing service images
    - Link permissions to service ownership
*/

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
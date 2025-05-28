// Type definitions for the application
export interface AppUser {
  id: string;
  email: string;
  name: string;
  phone?: string; // Asegúrate de que 'phone' esté aquí
  avatar_url?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  icon: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  categoryId: string;
}

export interface ServiceCoverageArea {
  id: string;
  service_id: string;
  area_name: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  // latitude?: number; // Descomenta si los añades en el SQL
  // longitude?: number; // Descomenta si los añades en el SQL
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  shortDescription: string; // Coincide con short_description en DB
  price: number | null;
  imageUrl: string;
  gallery: string[];
  categoryId: string; // Coincide con category_id en DB
  subcategoryId: string; // Coincide con subcategory_id en DB
  rating: number;
  reviewCount: number; // Coincide con review_count en DB
  features: string[];
  options?: ServiceOption[];
  availability?: ServiceAvailability[]; // Ya existe

  // Nuevos campos de la migración
  service_type: 'fixed_location' | 'delivery_area' | 'multiple_areas';
  specific_address?: string;
  base_latitude?: number;
  base_longitude?: number;
  delivery_radius_km?: number;
  coverage_areas?: ServiceCoverageArea[]; // Para cuando se obtengan las áreas de cobertura
  provider_id?: string; // Asegúrate de que este campo esté si lo usas para validaciones
  // Campos del proveedor que ya estaban en la tabla services
  provider_name?: string;
  provider_phone?: string;
  provider_email?: string;
  is_approved?: boolean;
}

export interface ServiceOption {
  id: string;
  name: string;
  description?: string;
  priceModifier: number;
}

export interface ServiceAvailability {
  id: string;
  serviceId: string;
  date: string;
  totalCapacity: number;
  bookedCapacity: number;
  isAvailable: boolean;
}

// En src/types/index.ts
export interface Reservation {
  id: string;
  user_id: string; // o userId si así lo mapeas
  service_id: string; // o serviceId
  event_date: string; // YYYY-MM-DD
  quantity: number;
  status: string;
  total_price: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_location: string;
  comments?: string;
  created_at: string; // Opcional si no lo usas directamente
  updated_at?: string; // Opcional
  service?: { // Para la información unida del servicio
    name: string;
    imageUrl?: string; // Este es el alias de main_image_storage_path
    provider_name?: string;
  };
}

export interface Review {
  id: string;
  serviceId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}
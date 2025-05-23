// Type definitions for the application

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

export interface Service {
  id: string;
  name: string;
  description: string;
  availability?: ServiceAvailability[];
  shortDescription: string;
  price: number | null; // null means "request quote"
  imageUrl: string;
  gallery: string[];
  categoryId: string;
  subcategoryId: string;
  rating: number;
  reviewCount: number;
  features: string[];
  options?: ServiceOption[];
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

export interface Reservation {
  id: string;
  userId: string;
  serviceId: string;
  eventDate: string;
  quantity: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  totalPrice: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventLocation: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  serviceId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}
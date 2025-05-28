// src/pages/ProfilePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  User, Mail, Phone, Plus, Package, Star, Upload, Image as ImageIcon,
  Loader2, MapPin, Compass, Milestone, SearchCheck, CalendarDays,
  ShoppingCart, X, Trash2, Edit,
  Edit3,
  Calendar as CalendarIconLucide,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Heart, 
  ListChecks
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { categories } from '../data/categories';
import { AppUser, Reservation, Service as AppServiceType, ServiceCoverageArea } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'react-toastify';
import { geocodeAddressNominatim, GeocodingResult } from '../utils/geocoding';
import ServiceCard from '../components/search/ServiceCard';

// Define ServiceImage type
interface ServiceImage {
  id: string;
  service_id: string;
  storage_path: string;
  is_main_image?: boolean;
  position?: number;
  created_at?: string;
  updated_at?: string;
}

interface ImageUpload {
  file: File;
  preview: string;
  isMain?: boolean;
  id?: string;
  storage_path?: string;
}

interface ServiceFormData {
  id?: string;
  name: string;
  categoryId: string;
  subcategoryId: string;
  shortDescription: string;
  description: string;
  price: string;
  features: string[];
  service_type: 'fixed_location' | 'delivery_area' | 'multiple_areas';
  specific_address: string;
  base_latitude?: string;
  base_longitude?: string;
  delivery_radius_km?: string;
  coverage_areas: Array<Partial<ServiceCoverageArea & { temp_id: string | number; id?: string; to_delete?: boolean }>>;
  default_total_capacity: string;
  default_is_available: boolean;
  is_approved?: boolean; // Added for provider visibility control
}

interface ProviderService extends AppServiceType {
  reservations?: Reservation[];
  service_images?: ServiceImage[];
  service_coverage_areas?: ServiceCoverageArea[];
  default_total_capacity?: number; 
  default_is_available?: boolean;
}

interface FavoriteItem extends AppServiceType {
    favorite_id: string;
    favorited_at: string;
}

const supabase: SupabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, setUser: setAuthUser, fetchFavorites, favoriteServiceIds } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [activeTab, setActiveTab] = useState<'profile' | 'myServices' | 'myPurchases' | 'myFavorites'>('profile');
  
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<ProviderService | null>(null);
  const [mainImage, setMainImage] = useState<ImageUpload | null>(null);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [isDeletingService, setIsDeletingService] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<ImageUpload[]>([]);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [formData, setFormData] = useState<Partial<AppUser>>({
    name: '',
    email: '',
    phone: '',
    avatar_url: '',
  });

  const initialServiceFormData: ServiceFormData = {
    name: '',
    categoryId: '',
    subcategoryId: '',
    shortDescription: '',
    description: '',
    price: '',
    features: [''],
    service_type: 'fixed_location',
    specific_address: '',
    base_latitude: '',
    base_longitude: '',
    delivery_radius_km: '',
    coverage_areas: [],
    default_total_capacity: '1',
    default_is_available: true,
    is_approved: true, // Default new services to visible by provider
  };

  const [serviceFormData, setServiceFormData] = useState<ServiceFormData>(initialServiceFormData);
  const [myServices, setMyServices] = useState<ProviderService[]>([]);
  const [myPurchases, setMyPurchases] = useState<Reservation[]>([]);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [myFavoriteServices, setMyFavoriteServices] = useState<FavoriteItem[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  // MOVED fetchProviderServicesAndReservations earlier
  const fetchProviderServicesAndReservations = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingServices(true);
    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*, service_coverage_areas(*), service_images(*)') // Fetch all necessary related data
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;
      if (!servicesData) {
        setMyServices([]);
        // setIsLoadingServices(false); // finally block handles this
        return;
      }

      const servicesWithDetails = await Promise.all(
        servicesData.map(async (service) => {
          const mainImageRecord = service.service_images?.find((img: ServiceImage) => img.is_main_image) || service.service_images?.[0];
          let publicUrl = 'https://placehold.co/300x200?text=Sin+Imagen';
          if (mainImageRecord?.storage_path) {
            const { data: urlData } = supabase.storage
              .from('service-images')
              .getPublicUrl(mainImageRecord.storage_path);
            if (urlData?.publicUrl) publicUrl = urlData.publicUrl;
          }

          const { data: reservationsForThisService, error: reservationsError } = await supabase
            .from('reservations')
            .select('id, customer_name, event_date, quantity, status, customer_email, customer_phone')
            .eq('service_id', service.id)
            .order('event_date', { ascending: true });
          if (reservationsError) console.error(`Error cargando reservaciones para servicio ${service.id}:`, reservationsError.message);

          return { 
              ...service, 
              imageUrl: publicUrl, 
              reservations: (reservationsForThisService as Reservation[]) || [],
              // Ensure all fields from ProviderService are correctly mapped if not directly present on 'service'
              service_images: service.service_images || [],
              service_coverage_areas: service.service_coverage_areas || [],
          } as ProviderService;
        })
      );
      setMyServices(servicesWithDetails);
    } catch (err: any) {
      toast.error(`Error al cargar tus servicios y reservaciones: ${err.message}`);
      setMyServices([]);
    } finally {
      setIsLoadingServices(false);
    }
  }, [user?.id, supabase]); // Added supabase as dependency

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const state = location.state as { activeTab?: typeof activeTab };
    if (state && state.activeTab) {
        if (['profile', 'myServices', 'myPurchases', 'myFavorites'].includes(state.activeTab)) {
            setActiveTab(state.activeTab);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }
  }, [location.state, navigate, location.pathname]);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (user?.id) {
      document.title = 'Mi Perfil | CABETG Party Planner';
    }
  }, [isAuthenticated, navigate, user?.id]);

  // This useEffect now correctly uses the defined fetchProviderServicesAndReservations
  useEffect(() => {
    if (user?.id && (activeTab === 'myServices' || showServiceForm)) {
        fetchProviderServicesAndReservations();
    }
  }, [user?.id, activeTab, showServiceForm, fetchProviderServicesAndReservations]);

  useEffect(() => {
    if (activeTab === 'myPurchases' && user?.id) {
      const fetchPurchases = async () => {
        setIsLoadingPurchases(true);
        setMyPurchases([]);
        try {
          const { data: reservationsData, error: reservationsError } = await supabase
            .from('reservations')
            .select(`
              id, user_id, service_id, event_date, quantity, status, total_price,
              customer_name, customer_email, customer_phone, event_location,
              comments, created_at, updated_at,
              service: services ( name, provider_name ) 
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (reservationsError) throw reservationsError;
          if (!reservationsData) {
            setMyPurchases([]);
            // setIsLoadingPurchases(false); // finally handles this
            return;
          }

          const purchasesWithFullServiceInfo = await Promise.all(
            reservationsData.map(async (purchase) => {
              let serviceImageUrl = 'https://placehold.co/100x80?text=Servicio';
              let fetchedServiceData = purchase.service as { name: string, provider_name: string } | null;

              if (purchase.service_id) {
                const { data: mainImageData } = await supabase
                  .from('service_images')
                  .select('storage_path')
                  .eq('service_id', purchase.service_id)
                  .eq('is_main_image', true)
                  .maybeSingle();

                if (mainImageData?.storage_path) {
                  const { data: urlData } = supabase.storage
                    .from('service-images')
                    .getPublicUrl(mainImageData.storage_path);
                  if (urlData?.publicUrl) serviceImageUrl = urlData.publicUrl;
                }
              }
              
              const finalServiceData = fetchedServiceData 
                ? { ...fetchedServiceData, imageUrl: serviceImageUrl } 
                : { name: 'Servicio no disponible', provider_name: 'N/A', imageUrl: serviceImageUrl };

              return { ...purchase, service: finalServiceData };
            })
          );
          setMyPurchases(purchasesWithFullServiceInfo as unknown as Reservation[]);
        } catch (err: any) {
          toast.error(`Error al cargar tus compras: ${err.message}`);
          setMyPurchases([]);
        } finally {
          setIsLoadingPurchases(false);
        }
      };
      fetchPurchases();
    }
  }, [activeTab, user?.id, supabase]);

  useEffect(() => {
    const loadFavoritesDetails = async () => {
      if (user?.id && favoriteServiceIds.length > 0) {
        setIsLoadingFavorites(true);
        try {
          const { data: favoritesData, error } = await supabase
            .from('favorites')
            .select(`
              id, 
              created_at, 
              service: services (
                *, 
                service_images (storage_path, is_main_image)
              )
            `)
            .eq('user_id', user.id)
            .in('service_id', favoriteServiceIds);

          if (error) throw error;

          const populatedFavorites = favoritesData?.map(fav => {
            const service = fav.service as any; // Cast to any for easier access, ensure proper type mapping
            if (!service) return null;

            let imageUrl = 'https://placehold.co/300x200?text=Sin+Imagen';
            const mainImageRecord = service.service_images?.find((img: any) => img.is_main_image) || service.service_images?.[0];
            if (mainImageRecord?.storage_path) {
              const { data: urlData } = supabase.storage.from('service-images').getPublicUrl(mainImageRecord.storage_path);
              if (urlData?.publicUrl) imageUrl = urlData.publicUrl;
            }
            
            // Explicitly map fields to AppServiceType
            const serviceDetails: AppServiceType = {
                id: service.id,
                name: service.name,
                description: service.description,
                shortDescription: service.short_description,
                price: service.price,
                imageUrl: imageUrl,
                gallery: service.gallery || [], // Assuming gallery is array of strings from DB or needs mapping
                categoryId: service.category_id,
                subcategoryId: service.subcategory_id,
                rating: service.rating ?? 0, // Default if null
                reviewCount: service.review_count ?? 0, // Default if null
                features: service.features || [],
                options: service.options || [], 
                availability: service.availability || [], // Ensure this is properly typed/mapped if complex
                service_type: service.service_type,
                specific_address: service.specific_address,
                base_latitude: service.base_latitude,
                base_longitude: service.base_longitude,
                delivery_radius_km: service.delivery_radius_km,
                coverage_areas: service.coverage_areas || [],
                provider_id: service.provider_id,
                provider_name: service.provider_name,
                provider_phone: service.provider_phone,
                provider_email: service.provider_email,
                is_approved: service.is_approved 
            };

            return {
              ...serviceDetails,
              favorite_id: fav.id,
              favorited_at: fav.created_at,
            };
          }).filter(Boolean) as FavoriteItem[]; 

          setMyFavoriteServices(populatedFavorites || []);
        } catch (err: any) {
          toast.error(`Error al cargar los detalles de tus favoritos: ${err.message}`);
          setMyFavoriteServices([]);
        } finally {
          setIsLoadingFavorites(false);
        }
      } else {
        setMyFavoriteServices([]); 
        setIsLoadingFavorites(false);
      }
    };
    
    if (activeTab === 'myFavorites') {
        loadFavoritesDetails();
    }
  }, [activeTab, user?.id, favoriteServiceIds, supabase]);

  const resetServiceForm = () => {
    setServiceFormData(initialServiceFormData);
    setMainImage(null);
    setGalleryImages([]);
    setImagesToDelete([]);
    setEditingService(null);
  };

  const handleOpenServiceForm = (serviceToEdit: ProviderService | null = null) => {
    resetServiceForm(); // Always reset first
    if (serviceToEdit) {
      setEditingService(serviceToEdit);
      setServiceFormData({
        id: serviceToEdit.id,
        name: serviceToEdit.name || '',
        categoryId: serviceToEdit.categoryId || '',
        subcategoryId: serviceToEdit.subcategoryId || '',
        shortDescription: serviceToEdit.shortDescription || '',
        description: serviceToEdit.description || '',
        price: serviceToEdit.price?.toString() || '',
        features: serviceToEdit.features?.length ? serviceToEdit.features : [''],
        service_type: serviceToEdit.service_type || 'fixed_location',
        specific_address: serviceToEdit.specific_address || '',
        base_latitude: serviceToEdit.base_latitude?.toString() || '',
        base_longitude: serviceToEdit.base_longitude?.toString() || '',
        delivery_radius_km: serviceToEdit.delivery_radius_km?.toString() || '',
        coverage_areas: serviceToEdit.service_coverage_areas?.map(ca => ({ ...ca, temp_id: ca.id || Date.now() + Math.random(), to_delete: false })) || [],
        default_total_capacity: serviceToEdit.default_total_capacity?.toString() || '1', // Use service's value or default
        default_is_available: serviceToEdit.default_is_available === undefined ? true : serviceToEdit.default_is_available,
        is_approved: serviceToEdit.is_approved, // Load current visibility status
      });
  
      const existingImages = serviceToEdit.service_images || [];
      const mainImgRecord = existingImages.find(img => img.is_main_image);
      if (mainImgRecord?.storage_path) {
        const { data: urlData } = supabase.storage.from('service-images').getPublicUrl(mainImgRecord.storage_path);
        if (urlData.publicUrl) {
          setMainImage({
            preview: urlData.publicUrl,
            file: new File([], mainImgRecord.storage_path.split('/').pop() || "main_existing.jpg", { type: "image/jpeg" }), // Placeholder file
            isMain: true,
            id: mainImgRecord.id, // Store existing image ID
            storage_path: mainImgRecord.storage_path, // Store existing storage_path
          });
        }
      }
  
      const galleryImgRecords = existingImages.filter(img => !img.is_main_image);
      setGalleryImages(
        galleryImgRecords.map(img => {
          const { data: urlData } = supabase.storage.from('service-images').getPublicUrl(img.storage_path);
          return {
            preview: urlData.publicUrl || '',
            file: new File([], img.storage_path.split('/').pop() || "gallery_existing.jpg", { type: "image/jpeg" }), // Placeholder
            id: img.id, // Store existing image ID
            storage_path: img.storage_path, // Store existing storage_path
            isMain: false,
          };
        }).filter(img => img.preview) // Ensure only images with valid previews are added
      );
    } else {
      // For new service, ensure is_approved is set from initialServiceFormData
      setServiceFormData(prev => ({ ...initialServiceFormData, id: undefined }));
    }
    setShowServiceForm(true);
  };
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // For single main image or multiple gallery images
    Array.from(files).forEach(file => {
        if (file.size > maxSize) {
            toast.error('El archivo es demasiado grande. El tamaño máximo es 5MB.');
            return; // Skip this file
        }
        const reader = new FileReader();
        reader.onload = (eventReader) => {
            const preview = eventReader.target?.result as string;
            const imageUpload: ImageUpload = { file, preview, isMain };

            if (isMain) {
                // If there's an existing main image (from DB), mark it for deletion
                if (mainImage?.storage_path) {
                    setImagesToDelete(prev => [...new Set([...prev, mainImage.storage_path!])]);
                }
                setMainImage(imageUpload);
            } else {
                setGalleryImages(prev => {
                    if (prev.length < 5) {
                        return [...prev, imageUpload];
                    } else {
                        toast.warn('Puedes subir un máximo de 5 imágenes a la galería.');
                        return prev;
                    }
                });
            }
        };
        reader.readAsDataURL(file);
    });
    e.target.value = ''; // Reset file input to allow selecting the same file again if needed
  };

  const removeImage = (indexOrPath: number | string, isMain: boolean = false) => {
    if (isMain && mainImage) {
      if (mainImage.storage_path) { // If it's an existing image from DB
        setImagesToDelete(prev => [...new Set([...prev, mainImage.storage_path!])]);
      }
      setMainImage(null);
    } else if (typeof indexOrPath === 'number') { // Removing a gallery image by index (could be new or existing if order is stable)
        const imgToRemove = galleryImages[indexOrPath];
        if (imgToRemove?.storage_path) { // If it's an existing image from DB
            setImagesToDelete(prev => [...new Set([...prev, imgToRemove.storage_path!])]);
        }
        setGalleryImages(prev => prev.filter((_, i) => i !== indexOrPath));
    } else if (typeof indexOrPath === 'string') { // Removing gallery image by storage_path (definitely existing)
        setImagesToDelete(prev => [...new Set([...prev, indexOrPath])]);
        setGalleryImages(prev => prev.filter(img => img.storage_path !== indexOrPath));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) { toast.error('Usuario no autenticado.'); return; }
    if (isSubmittingProfile) return;
    setIsSubmittingProfile(true);
    try {
      const updates: Partial<AppUser> = { name: formData.name, phone: formData.phone, avatar_url: formData.avatar_url || null };
      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) throw error;
      toast.success('Perfil actualizado!');
      if(setAuthUser) setAuthUser(prevUser => prevUser ? ({ ...prevUser, ...updates }) : null);
    } catch (error: any) {
      toast.error(`Error al actualizar: ${error.message}`);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleServiceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    if (name === "is_approved_visibility") { // Handle the specific visibility checkbox
        setServiceFormData(prev => ({ ...prev, is_approved: checked }));
    } else {
        setServiceFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...serviceFormData.features];
    newFeatures[index] = value;
    setServiceFormData(prev => ({ ...prev, features: newFeatures }));
  };
  const handleAddFeature = () => setServiceFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  const handleRemoveFeature = (index: number) => setServiceFormData(prev => ({ ...prev, features: serviceFormData.features.filter((_, i) => i !== index)}));

  const handleAddCoverageArea = () => setServiceFormData(prev => ({ ...prev, coverage_areas: [...prev.coverage_areas, { temp_id: Date.now().toString(), area_name: '', city: '', state: '', postal_code: '' }]}));
  
  const handleCoverageAreaChange = (temp_id_or_id: string | number, field: keyof Omit<ServiceCoverageArea, 'id' | 'service_id' | 'created_at' | 'updated_at' | 'country'>, value: string) => {
    setServiceFormData(prev => ({
        ...prev,
        coverage_areas: prev.coverage_areas.map(area =>
            (area.temp_id === temp_id_or_id || area.id === temp_id_or_id) ? { ...area, [field]: value } : area
        )
    }));
  };

  const handleRemoveCoverageArea = (temp_id_or_id: string | number) => {
    setServiceFormData(prev => {
        const updatedAreas = prev.coverage_areas.map(area => {
            if (area.id && (area.id === temp_id_or_id || area.temp_id === temp_id_or_id)) { // Check against both temp_id and id if area might be existing
                return { ...area, to_delete: true }; 
            }
            return area;
        }).filter(area => {
            // If it's a new area (no 'id') and matches temp_id_or_id, filter it out directly
            if (!area.id && area.temp_id === temp_id_or_id) return false;
            // Keep areas not marked for deletion (if they were existing and didn't match)
            return !(area.to_delete && (area.id === temp_id_or_id || area.temp_id === temp_id_or_id));
        });
        return { ...prev, coverage_areas: updatedAreas };
    });
  };

  const handleGeocodeServiceAddress = async () => {
    const addressToGeocode = serviceFormData.specific_address;
    if (!addressToGeocode) { toast.warn('Ingresa una dirección.'); return; }
    setIsGeocoding(true);
    toast.info('Obteniendo coordenadas...', { autoClose: 1500 });
    try {
      const result = await geocodeAddressNominatim(addressToGeocode);
      if (result) {
        toast.success(`Coordenadas: ${result.displayName.substring(0,50)}...`, { autoClose: 2500 });
        setServiceFormData(prev => ({ ...prev, base_latitude: result.latitude.toString(), base_longitude: result.longitude.toString() }));
      } else {
        toast.error('No se pudieron obtener coordenadas.');
        setServiceFormData(prev => ({ ...prev, base_latitude: '', base_longitude: ''}));
      }
    } catch (error) {
        toast.error('Error en geocodificación.');
    } finally {
        setIsGeocoding(false);
    }
  };
  
  const handleToggleServiceVisibility = async (serviceId: string, serviceName: string, newVisibility: boolean) => {
    if (!user?.id) {
      toast.error('Debes estar autenticado para cambiar la visibilidad del servicio.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('services')
        .update({ is_approved: newVisibility }) // Using is_approved for provider visibility
        .eq('id', serviceId)
        .eq('provider_id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        toast.success(`Servicio "${serviceName}" ahora está ${newVisibility ? 'Disponible' : 'No Disponible'}.`);
        setMyServices(prevServices =>
          prevServices.map(s =>
            s.id === serviceId ? { ...s, is_approved: newVisibility } : s
          )
        );
        if (editingService?.id === serviceId) {
          setEditingService(prev => prev ? ({...prev, is_approved: newVisibility }) : null);
          setServiceFormData(prev => ({...prev, is_approved: newVisibility }));
        }
      }
    } catch (err: any) {
      toast.error(`Error al cambiar visibilidad: ${err.message}`);
      console.error("Error toggling service visibility:", err);
    }
  };

const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !user.name || !user.email) {
        toast.error("Perfil de usuario incompleto.");
        setActiveTab('profile');
        return;
    }
    if (isSubmittingService) return;
    setIsSubmittingService(true);

    const isEditMode = !!editingService;
    const currentServiceId = editingService?.id;
    let tempImagesToDeleteFromStorage = [...imagesToDelete];

    try {
        // 1. Guardar/Actualizar Servicio Principal para obtener/confirmar finalServiceId
        const servicePayload = {
            name: serviceFormData.name,
            category_id: serviceFormData.categoryId,
            subcategory_id: serviceFormData.subcategoryId,
            short_description: serviceFormData.shortDescription,
            description: serviceFormData.description,
            price: serviceFormData.price ? parseFloat(serviceFormData.price) : null,
            provider_id: user.id,
            provider_name: user.name,
            provider_email: user.email,
            provider_phone: user.phone || null,
            features: serviceFormData.features.filter(f => f.trim() !== ''),
            service_type: serviceFormData.service_type,
            specific_address: (serviceFormData.service_type === 'fixed_location' || serviceFormData.service_type === 'delivery_area') ? serviceFormData.specific_address : null,
            base_latitude: serviceFormData.base_latitude ? parseFloat(serviceFormData.base_latitude) : null,
            base_longitude: serviceFormData.base_longitude ? parseFloat(serviceFormData.base_longitude) : null,
            delivery_radius_km: serviceFormData.service_type === 'delivery_area' && serviceFormData.delivery_radius_km ? parseInt(serviceFormData.delivery_radius_km, 10) : null,
            is_approved: serviceFormData.is_approved ?? (isEditMode ? editingService.is_approved : true),
            rating: editingService?.rating || 0,
            review_count: editingService?.reviewCount || 0,
        };

        let savedServiceData: AppServiceType;
        if (isEditMode && currentServiceId) {
            const { data, error } = await supabase.from('services').update(servicePayload).eq('id', currentServiceId).select().single();
            if (error) throw error;
            savedServiceData = data as AppServiceType;
        } else {
            const { data, error } = await supabase.from('services').insert(servicePayload).select().single();
            if (error) throw error;
            savedServiceData = data as AppServiceType;
        }
        const finalServiceId = savedServiceData.id;

        // --- MANEJO DE IMÁGENES ---
        let finalMainImageStoragePath: string | null = null;
        let newMainImageUploaded = false;

        // A. Subir nueva imagen principal si se seleccionó un archivo
        if (mainImage && mainImage.file.size > 0) {
            const mainImgFileName = `public/${user.id}/${finalServiceId}/${Date.now()}_main_${mainImage.file.name.replace(/\s/g, '_')}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('service-images').upload(mainImgFileName, mainImage.file);
            if (uploadError) throw uploadError;
            finalMainImageStoragePath = uploadData.path;
            newMainImageUploaded = true;
            
            const oldMainImageRecord = editingService?.service_images?.find(img => img.is_main_image);
            if (oldMainImageRecord?.storage_path && oldMainImageRecord.storage_path !== finalMainImageStoragePath) {
                tempImagesToDeleteFromStorage.push(oldMainImageRecord.storage_path);
            }
        } else if (mainImage && mainImage.storage_path) {
            finalMainImageStoragePath = mainImage.storage_path;
        } else if (!mainImage && isEditMode) {
            const oldMainImageRecord = editingService?.service_images?.find(img => img.is_main_image);
            if (oldMainImageRecord?.storage_path) {
                 tempImagesToDeleteFromStorage.push(oldMainImageRecord.storage_path);
            }
            // finalMainImageStoragePath permanece null
        }

        // B. Subir nuevas imágenes de galería
        const uploadedGalleryImageObjects: { storage_path: string }[] = []; // Solo necesitamos el path para nuevas
        
        for (const img of galleryImages) {
            if (img.file.size > 0) { 
                const galleryFileName = `public/${user.id}/${finalServiceId}/${Date.now()}_gallery_${galleryImages.indexOf(img)}_${img.file.name.replace(/\s/g, '_')}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('service-images').upload(galleryFileName, img.file);
                if (uploadError) throw uploadError;
                uploadedGalleryImageObjects.push({ storage_path: uploadData.path });
            }
        }
        
        // C. Identificar imágenes de galería existentes a mantener y las que se eliminaron del UI
        const keptExistingGalleryImageStoragePaths = new Set<string>();
        if (isEditMode) {
            galleryImages.forEach(uiImg => {
                if (uiImg.storage_path && uiImg.id) { // Si es una imagen existente que se mantuvo en el UI
                    keptExistingGalleryImageStoragePaths.add(uiImg.storage_path);
                }
            });

            editingService?.service_images?.forEach(existingDbImg => {
                if (!existingDbImg.is_main_image && !keptExistingGalleryImageStoragePaths.has(existingDbImg.storage_path)) {
                    // Esta imagen de galería de la BD ya no está en el UI, marcar para eliminar del storage
                    tempImagesToDeleteFromStorage.push(existingDbImg.storage_path);
                }
            });
        }
        tempImagesToDeleteFromStorage = [...new Set(tempImagesToDeleteFromStorage)];

        // D. ANTES del UPSERT final, asegurarse que no haya otra imagen principal en la DB para este servicio
        if (finalServiceId) { // Solo si tenemos un ID de servicio (creado o editado)
            const updatePayloadMainImage: {is_main_image: boolean} = { is_main_image: false };
            if(finalMainImageStoragePath){ // Si vamos a tener una imagen principal
                 await supabase
                    .from('service_images')
                    .update(updatePayloadMainImage)
                    .eq('service_id', finalServiceId)
                    .neq('storage_path', finalMainImageStoragePath); // Desmarca todas MENOS la nueva principal
            } else { // Si NO vamos a tener imagen principal (fue eliminada o nunca hubo)
                 await supabase
                    .from('service_images')
                    .update(updatePayloadMainImage)
                    .eq('service_id', finalServiceId); // Desmarca todas
            }
        }

        // E. Construir el array final para upsert en service_images
        const imagesForDbUpsert: Partial<ServiceImage>[] = [];
        let finalPositionCounter = 0;

        if (finalMainImageStoragePath) {
            const mainImageEntry: Partial<ServiceImage> = {
                service_id: finalServiceId,
                storage_path: finalMainImageStoragePath,
                is_main_image: true,
                position: finalPositionCounter++,
            };
            // Si estamos editando y la imagen principal es una que ya existía (no se subió un nuevo archivo para ella),
            // necesitamos su ID para que el upsert la actualice en lugar de crear una nueva.
            if (isEditMode && !newMainImageUploaded && mainImage?.id) {
                mainImageEntry.id = mainImage.id;
            }
            // Si es una imagen principal completamente nueva (newMainImageUploaded = true), NO se pone ID.
            imagesForDbUpsert.push(mainImageEntry);
        }

        // Añadir imágenes de galería que se mantuvieron (existentes)
        galleryImages.forEach(uiImg => {
            if (uiImg.id && uiImg.storage_path && keptExistingGalleryImageStoragePaths.has(uiImg.storage_path)) {
                imagesForDbUpsert.push({
                    id: uiImg.id, // ID existente
                    service_id: finalServiceId,
                    storage_path: uiImg.storage_path,
                    is_main_image: false,
                    position: finalPositionCounter++,
                });
            }
        });
        
        // Añadir nuevas imágenes de galería subidas (sin ID)
        uploadedGalleryImageObjects.forEach(newImgObj => {
            imagesForDbUpsert.push({
                service_id: finalServiceId,
                storage_path: newImgObj.storage_path,
                is_main_image: false,
                position: finalPositionCounter++,
            });
        });
        
        // F. Eliminar de la BD los registros de service_images que ya no aplican
        // (ej. imágenes de galería que fueron deseleccionadas o una principal que fue reemplazada y no desmarcada arriba)
        if (isEditMode && editingService?.service_images) {
            const currentImagePathsInDbPayload = new Set(imagesForDbUpsert.map(img => img.storage_path));
            const dbImagesToDeleteCompletely = editingService.service_images
                .filter(dbImg => !currentImagePathsInDbPayload.has(dbImg.storage_path))
                .map(dbImg => dbImg.id);
            
            if (dbImagesToDeleteCompletely.length > 0) {
                await supabase.from('service_images').delete().in('id', dbImagesToDeleteCompletely);
            }
        }


        // G. Upsert de imágenes a la base de datos
        if (imagesForDbUpsert.length > 0) {
            const { error: siError } = await supabase
                .from('service_images')
                .upsert(imagesForDbUpsert, { onConflict: 'id' }); 
            if (siError) {
                console.error('Supabase service_images upsert error:', siError);
                throw siError; 
            }
        } else if (finalServiceId) { // Si no hay imágenes para upsert (ej. todas eliminadas)
            await supabase.from('service_images').delete().eq('service_id', finalServiceId);
        }
        
        // H. Eliminar archivos del Storage
        if (tempImagesToDeleteFromStorage.length > 0) {
            const { error: storageError } = await supabase.storage.from('service-images').remove(tempImagesToDeleteFromStorage);
            if (storageError) {
                console.warn("Advertencia al eliminar imágenes del storage:", storageError.message);
            }
        }
        setImagesToDelete([]); 

        // I. Manejar Áreas de Cobertura
        if (isEditMode && currentServiceId) {
            const areasToDeleteInDb = serviceFormData.coverage_areas.filter(a => a.id && a.to_delete).map(a => a.id!);
            if (areasToDeleteInDb.length > 0) {
                await supabase.from('service_coverage_areas').delete().in('id', areasToDeleteInDb);
            }
            if (serviceFormData.service_type !== 'multiple_areas') { 
                await supabase.from('service_coverage_areas').delete().eq('service_id', currentServiceId);
            }
        }
        if (serviceFormData.service_type === 'multiple_areas') {
            const coverageAreasToUpsert = serviceFormData.coverage_areas
                .filter(a => a.area_name && a.area_name.trim() !== '' && !a.to_delete)
                .map(a => ({ 
                    id: a.id, 
                    service_id: finalServiceId, 
                    area_name: a.area_name!, 
                    city: a.city || null, 
                    state: a.state || null, 
                    postal_code: a.postal_code || null 
                }));
            if (coverageAreasToUpsert.length > 0) {
                const { error: coverageError } = await supabase.from('service_coverage_areas').upsert(coverageAreasToUpsert, { onConflict: 'id' });
                if (coverageError) throw coverageError;
            }
        }

        // J. Default Availability for NEW services
        if (!isEditMode) {
            const availabilityEntries = [];
            const today = new Date();
            for (let i = 0; i < 90; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                availabilityEntries.push({
                    service_id: finalServiceId,
                    date: date.toISOString().split('T')[0],
                    total_capacity: parseInt(serviceFormData.default_total_capacity, 10) || 1,
                    booked_capacity: 0,
                    is_available: serviceFormData.default_is_available,
                });
            }
            if (availabilityEntries.length > 0) {
                const { error: availabilityError } = await supabase.from('service_availability').insert(availabilityEntries);
                if (availabilityError) console.warn("Error setting default availability:", availabilityError.message);
            }
        }

        toast.success(`Servicio ${isEditMode ? 'actualizado' : 'publicado'}! ${!isEditMode && !savedServiceData.is_approved ? 'Pendiente de aprobación.' : ''}`);
        setShowServiceForm(false);
        resetServiceForm();
        fetchProviderServicesAndReservations(); 

    } catch (error: any) {
        console.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} servicio:`, error);
        toast.error(`Error: ${error.message || 'Error desconocido durante el guardado del servicio.'}`);
    } finally {
        setIsSubmittingService(false);
    }
};
  
  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!user?.id) return;
    if (!window.confirm(`¿Seguro que quieres eliminar "${serviceName}"?`)) return;
    setIsDeletingService(serviceId);
    try {
      const { error } = await supabase.rpc('delete_service_by_provider', { p_service_id: serviceId, p_provider_id: user.id });
      if (error) throw error;
      toast.success(`"${serviceName}" eliminado.`);
      setMyServices(prev => prev.filter(s => s.id !== serviceId));
      if (editingService?.id === serviceId) resetServiceForm();
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err.message}`);
    } finally {
      setIsDeletingService(null);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <p className="ml-3 text-lg">Redirigiendo...</p>
      </div>
    );
  }
  
  // Main JSX Return
  return (
    <div className="bg-gray-50 py-8 sm:py-12">
      <div className="container-custom max-w-5xl">
        {/* ... Tabs and Profile Form ... */}
        <div className="flex flex-wrap border-b border-gray-300 mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-3 text-xs sm:text-sm font-medium focus:outline-none transition-colors duration-150 ease-in-out ${activeTab === 'profile' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-400'}`}
          > <User size={16} className="inline mr-1.5" /> Perfil </button>
          <button
            onClick={() => setActiveTab('myServices')}
            className={`px-3 py-3 text-xs sm:text-sm font-medium focus:outline-none transition-colors duration-150 ease-in-out ${activeTab === 'myServices' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-400'}`}
          > <Package size={16} className="inline mr-1.5" /> Mis Servicios </button>
          <button
            onClick={() => setActiveTab('myPurchases')}
            className={`px-3 py-3 text-xs sm:text-sm font-medium focus:outline-none transition-colors duration-150 ease-in-out ${activeTab === 'myPurchases' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-400'}`}
          > <ListChecks size={16} className="inline mr-1.5" /> Mis Compras </button>
          <button
            onClick={() => setActiveTab('myFavorites')}
            className={`px-3 py-3 text-xs sm:text-sm font-medium focus:outline-none transition-colors duration-150 ease-in-out ${activeTab === 'myFavorites' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-400'}`}
          > <Heart size={16} className="inline mr-1.5" /> Mis Favoritos </button>
        </div>

        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center mb-8">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4 sm:mb-0 sm:mr-6 overflow-hidden border-2 border-primary-200">
                {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/96x96?text=Error')}/>
                ) : ( <User size={48} className="text-primary-500" /> )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{formData.name || 'Nombre no especificado'}</h2>
                <p className="text-gray-600">{formData.email || ''}</p>
              </div>
            </div>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label htmlFor="profileName" className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none"><User size={18} /></span>
                  <input type="text" id="profileName" name="name" value={formData.name || ''}  onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"/>
                </div>
              </div>
              <div>
                <label htmlFor="profileEmail" className="block text-sm font-medium text-gray-700 mb-1">Correo (no editable)</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none"><Mail size={18} /></span>
                  <input type="email" id="profileEmail" value={formData.email || ''} readOnly disabled className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none focus:ring-0"/>
                </div>
              </div>
              <div>
                <label htmlFor="profilePhone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none"><Phone size={18} /></span>
                  <input type="tel" id="profilePhone" name="phone" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Ej. 5512345678"/>
                </div>
              </div>
              <div>
                <label htmlFor="profileAvatarUrl" className="block text-sm font-medium text-gray-700 mb-1">URL del Avatar (opcional)</label>
                <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none"><ImageIcon size={18} /></span>
                    <input type="url" id="profileAvatarUrl" name="avatar_url" value={formData.avatar_url || ''} onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="https://ejemplo.com/imagen.png"/>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-200">
                <button type="submit" disabled={isSubmittingProfile} className="w-full sm:w-auto bg-primary-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-70 flex items-center justify-center shadow-sm hover:shadow-md">
                  {isSubmittingProfile ? ( <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Guardando...</> ) : ( 'Guardar Cambios' )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'myServices' && (
           <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Mis Servicios Publicados</h2>
              <button 
                onClick={() => handleOpenServiceForm(null)} 
                className="btn btn-primary flex items-center px-3 py-2 sm:px-4 text-sm"
              > <Plus size={18} className="mr-1 sm:mr-2" /> Nuevo Servicio </button>
            </div>
            {isLoadingServices ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    <p className="ml-3 text-gray-600">Cargando tus servicios...</p>
                </div>
            ) : myServices.length === 0 && !showServiceForm ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Package size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">Aún no has publicado ningún servicio.</p>
                <button onClick={() => handleOpenServiceForm(null)} className="mt-6 btn btn-primary py-2.5 px-6" > Publicar mi primer servicio </button>
              </div>
            ) : !showServiceForm && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myServices.map(service => ( 
                    <div key={service.id} className="bg-white rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-shadow duration-300">
                        <Link to={`/service/${service.id}`} className="block">
                            <img src={service.imageUrl || 'https://placehold.co/300x200?text=Sin+Imagen'} alt={service.name} className="w-full h-48 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x200?text=Error+Img'; }}/>
                        </Link>
                        <div className="p-4 sm:p-5">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                                <Link to={`/service/${service.id}`}>{service.name}</Link>
                            </h3>
                             {/* MODIFIED Visibility Button */}
                            <button
                              onClick={() => handleToggleServiceVisibility(service.id, service.name, !service.is_approved)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors duration-150 ease-in-out
                                ${service.is_approved ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}
                              `}
                            >
                              {service.is_approved ? 'Disponible' : 'No Disponible'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mb-1"> Categoría: {categories.find(c=>c.id === service.categoryId)?.name || 'N/A'} </p>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3 h-10">{service.shortDescription}</p>
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <Star className="text-yellow-400 fill-current" size={16} />
                            <span className="ml-1 font-medium text-gray-700">{service.rating?.toFixed(1) || '0.0'}</span>
                            <span className="mx-1.5">·</span>
                            <span>({service.reviewCount || 0} reseñas)</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                            <button onClick={() => handleOpenServiceForm(service)} className="btn-outline text-xs py-1 px-2.5 rounded-md flex items-center"> <Edit3 size={13} className="mr-1"/> Editar </button>
                            <button onClick={() => handleDeleteService(service.id, service.name)} disabled={isDeletingService === service.id} className="btn-outline text-xs py-1 px-2.5 rounded-md flex items-center text-red-600 border-red-300 hover:bg-red-50"> {isDeletingService === service.id ? <Loader2 size={13} className="animate-spin mr-1"/> : <Trash2 size={13} className="mr-1"/>} Eliminar </button>
                            <button onClick={() => navigate(`/service/${service.id}/manage-availability`)} className="btn-outline text-xs py-1 px-2.5 rounded-md flex items-center"> <CalendarIconLucide size={13} className="mr-1"/> Disponibilidad </button>
                            {service.reservations && (
                                <button onClick={() => setExpandedServiceId(expandedServiceId === service.id ? null : service.id)} className="btn-outline text-xs py-1 px-2.5 rounded-md flex items-center"> Reservaciones ({service.reservations.length}) {expandedServiceId === service.id ? <ChevronUp size={14} className="ml-1"/> : <ChevronDown size={14} className="ml-1"/>} </button>
                            )}
                          </div>
                           {expandedServiceId === service.id && service.reservations && service.reservations.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold mb-2 text-gray-700">Reservaciones:</h4>
                                    <ul className="space-y-1 text-xs max-h-40 overflow-y-auto">
                                        {service.reservations.map(res => ( <li key={res.id} className="p-1.5 bg-gray-50 rounded"> <span className="font-medium">{res.customer_name}</span> - {new Date(res.event_date + 'T00:00:00Z').toLocaleDateString('es-MX')} ({res.status})</li> ))}
                                    </ul>
                                </div>
                           )}
                        </div>
                    </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'myPurchases' && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">Historial de Compras</h2>
            {isLoadingPurchases ? (
              <div className="flex justify-center items-center py-10"> <Loader2 className="h-8 w-8 animate-spin text-primary-500" /> <p className="ml-3 text-gray-600">Cargando...</p> </div>
            ) : myPurchases.length === 0 ? (
              <div className="text-center py-10"> <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" /> <p className="text-gray-600 text-lg">No has realizado compras.</p> <Link to="/" className="mt-6 btn btn-primary">Explorar</Link> </div>
            ) : (
              <div className="space-y-6">
                {myPurchases.map((purchase) => (
                  <div key={purchase.id} className="border rounded-lg p-4 hover:shadow-md bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <img src={purchase.service?.imageUrl || 'https://placehold.co/120x90?text=Servicio'} alt={purchase.service?.name || 'Servicio'} className="w-full sm:w-28 h-auto sm:h-24 object-cover rounded-md border" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/120x90?text=Error'; }} />
                      <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-1">
                          <h3 className="text-md sm:text-lg font-semibold text-primary-700 hover:underline"> <Link to={`/service/${purchase.service_id}`}>{purchase.service?.name || 'Desconocido'}</Link> </h3>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap mt-1 sm:mt-0 ${ purchase.status === 'confirmed' || purchase.status === 'approved_by_provider' ? 'bg-green-100 text-green-800' : purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ['cancelled', 'cancelled_by_provider', 'cancelled_by_user'].includes(purchase.status) ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800' }`}> {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)} </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1.5"> Proveedor: {purchase.service?.provider_name || 'N/A'} </p>
                        <div className="text-xs sm:text-sm text-gray-700 space-y-0.5">
                          <p><strong>Fecha Evento:</strong> {(() => {   if (!purchase.event_date) return ''; // Manejo por si la fecha no estuviera definida   const [year, month, day] = purchase.event_date.split('-').map(Number);   // El constructor de Date usa mes 0-indexado (0 para Enero, etc.)   const localDate = new Date(year, month - 1, day);    return localDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }); })()}</p>
                          <p><strong>Cantidad:</strong> {purchase.quantity}</p>
                          <p><strong>Total:</strong>Fixed Text</p>
                          <p className="text-gray-500"><strong>Reservado el:</strong> {new Date(purchase.created_at).toLocaleDateString('es-MX', {day:'numeric', month:'short', year:'numeric'})}</p>
                          {purchase.event_location && <p className="text-gray-500"><strong>Lugar:</strong> {purchase.event_location}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'myFavorites' && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">Mis Servicios Favoritos</h2>
            {isLoadingFavorites ? (
              <div className="flex justify-center items-center py-10"> <Loader2 className="h-8 w-8 animate-spin text-primary-500" /> <p className="ml-3 text-gray-600">Cargando favoritos...</p> </div>
            ) : myFavoriteServices.length === 0 ? (
              <div className="text-center py-10"> <Heart size={48} className="mx-auto text-gray-400 mb-4" /> <p className="text-gray-600 text-lg">No tienes servicios favoritos.</p> <Link to="/" className="mt-6 btn btn-primary">Explorar</Link> </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myFavoriteServices.map((service) => ( <ServiceCard key={service.favorite_id || service.id} service={service} /> ))}
              </div>
            )}
          </div>
        )}
        
        {showServiceForm && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl">
                  <div className="flex justify-between items-center mb-5 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800">{editingService ? 'Editar Servicio' : 'Publicar Nuevo Servicio'}</h3>
                    <button onClick={() => {setShowServiceForm(false); resetServiceForm();}} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"><X size={22} /></button>
                  </div>
                  <form onSubmit={handleServiceSubmit} className="space-y-3 sm:space-y-4 text-sm">
                    {/* ... other form fields ... */}
                    <div><label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-0.5">Nombre del Servicio*</label><input type="text" name="name" id="name" value={serviceFormData.name} onChange={handleServiceInputChange} required className="w-full p-2 border rounded-md"/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                        <div><label htmlFor="categoryId" className="block text-xs font-medium">Categoría*</label><select name="categoryId" id="categoryId" value={serviceFormData.categoryId} onChange={e => setServiceFormData(prev => ({...prev, categoryId: e.target.value, subcategoryId: ''}))} required className="w-full p-2 border rounded-md"><option value="">Seleccionar</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><label htmlFor="subcategoryId" className="block text-xs font-medium">Subcategoría*</label><select name="subcategoryId" id="subcategoryId" value={serviceFormData.subcategoryId} onChange={handleServiceInputChange} required disabled={!serviceFormData.categoryId || categories.find(c=>c.id===serviceFormData.categoryId)?.subcategories.length === 0} className="w-full p-2 border rounded-md disabled:bg-gray-50"><option value="">Seleccionar</option>{categories.find(c=>c.id===serviceFormData.categoryId)?.subcategories.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    </div>
                    <div><label htmlFor="shortDescription" className="block text-xs font-medium">Desc. Corta* (Máx 150)</label><input type="text" name="shortDescription" id="shortDescription" value={serviceFormData.shortDescription} onChange={handleServiceInputChange} required maxLength={150} className="w-full p-2 border rounded-md"/></div>
                    <div><label htmlFor="description" className="block text-xs font-medium">Desc. Detallada*</label><textarea name="description" id="description" value={serviceFormData.description} onChange={handleServiceInputChange} required rows={4} className="w-full p-2 border rounded-md"></textarea></div>
                    <div><label htmlFor="price" className="block text-xs font-medium">Precio (MXN) - Vacío para 'Cotizar'</label><input type="number" name="price" id="price" value={serviceFormData.price} onChange={handleServiceInputChange} placeholder="Ej: 1500.00" min="0" step="0.01" className="w-full p-2 border rounded-md"/></div>
                    <div>
                        <label htmlFor="is_approved_visibility" className="flex items-center text-xs font-medium text-gray-700 cursor-pointer mt-2 mb-1">
                        <input
                            type="checkbox"
                            name="is_approved" // Connect to is_approved in ServiceFormData
                            id="is_approved_visibility"
                            checked={serviceFormData.is_approved ?? true} // Default to true if undefined (for new services)
                            onChange={handleServiceInputChange} // Uses the existing handler
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mr-2 shadow-sm"
                        />
                        Marcar como Disponible (visible para clientes)
                        </label>
                    </div>
                    <div>
                      <label htmlFor="service_type" className="block text-xs font-medium">Tipo de Ubicación*</label>
                      <select name="service_type" id="service_type" value={serviceFormData.service_type} onChange={handleServiceInputChange} className="w-full p-2 border rounded-md">
                        <option value="fixed_location">Ubicación Fija</option>
                        <option value="delivery_area">Servicio a Domicilio (Radio)</option>
                        <option value="multiple_areas">Múltiples Áreas</option>
                      </select>
                    </div>
                    {(serviceFormData.service_type === 'fixed_location' || serviceFormData.service_type === 'delivery_area') && (
                      <div className="p-3 border rounded-md bg-gray-50 space-y-2">
                        <label htmlFor="specific_address" className="block text-xs font-medium"> {serviceFormData.service_type === 'fixed_location' ? 'Dirección del Local*' : 'Dirección Base*'} </label>
                        <div className="flex items-stretch gap-2">
                          <div className="relative flex-grow"> <span className="absolute left-2.5 top-1/2 -translate-y-1/2"><MapPin size={15}/></span> <input type="text" name="specific_address" value={serviceFormData.specific_address} onChange={handleServiceInputChange} required={serviceFormData.service_type !== 'multiple_areas'} className="w-full pl-8 p-2 border rounded-md" placeholder="Calle, No., Colonia, CP, Estado"/> </div>
                          <button type="button" onClick={handleGeocodeServiceAddress} disabled={isGeocoding || !serviceFormData.specific_address} className="p-2 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"> <SearchCheck size={14} className="mr-1"/>Coords</button>
                        </div>
                        {(serviceFormData.base_latitude && serviceFormData.base_longitude) && ( <p className="text-xs text-green-600">Coords: {parseFloat(serviceFormData.base_latitude).toFixed(5)}, {parseFloat(serviceFormData.base_longitude).toFixed(5)}</p> )}
                      </div>
                    )}
                    {serviceFormData.service_type === 'delivery_area' && ( <div><label htmlFor="delivery_radius_km" className="block text-xs font-medium">Radio de Cobertura (km)*</label><input type="number" name="delivery_radius_km" value={serviceFormData.delivery_radius_km || ''} onChange={handleServiceInputChange} required={serviceFormData.service_type === 'delivery_area'} min="1" className="w-full p-2 border rounded-md" placeholder="Ej. 10"/></div> )}
                    {serviceFormData.service_type === 'multiple_areas' && (
                      <div className="space-y-2 p-3 border rounded-md bg-gray-50">
                        <h4 className="text-xs font-medium">Áreas de Cobertura</h4>
                        {serviceFormData.coverage_areas.filter(a => !a.to_delete).map((area, index) => (
                          <div key={area.temp_id || area.id} className="p-2 border rounded bg-white space-y-1">
                            <div className="flex justify-between items-center"><p className="text-xs font-semibold">Área {index + 1}</p><button type="button" onClick={() => handleRemoveCoverageArea(area.temp_id || area.id!)} className="text-red-500"><Trash2 size={14}/></button></div>
                            <input type="text" placeholder="Nombre del Área*" value={area.area_name} onChange={(e) => handleCoverageAreaChange(area.temp_id || area.id!, 'area_name', e.target.value)} required className="w-full text-xs p-1.5 border rounded-md"/>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                              <input type="text" placeholder="Ciudad" value={area.city || ''} onChange={(e) => handleCoverageAreaChange(area.temp_id || area.id!, 'city', e.target.value)} className="w-full text-xs p-1.5 border rounded-md"/>
                              <input type="text" placeholder="Estado" value={area.state || ''} onChange={(e) => handleCoverageAreaChange(area.temp_id || area.id!, 'state', e.target.value)} className="w-full text-xs p-1.5 border rounded-md"/>
                              <input type="text" placeholder="C.P." value={area.postal_code || ''} onChange={(e) => handleCoverageAreaChange(area.temp_id || area.id!, 'postal_code', e.target.value)} className="w-full text-xs p-1.5 border rounded-md"/>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={handleAddCoverageArea} className="text-xs text-primary-600"><Plus size={14} className="mr-1 inline"/>Agregar Área</button>
                      </div>
                    )}
                     <div className="p-3 border rounded-md bg-gray-50">
                        <h4 className="text-xs font-medium mb-1">Disponibilidad por Defecto</h4>
                        <p className="text-xs text-gray-500 mb-1.5">Capacidad diaria y disponibilidad predeterminada.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-end">
                             <div><label htmlFor="default_total_capacity" className="block text-xs font-medium">Capacidad/Día*</label><input type="number" name="default_total_capacity" id="default_total_capacity" value={serviceFormData.default_total_capacity} onChange={handleServiceInputChange} required min="1" className="w-full p-2 border rounded-md" placeholder="Ej. 1"/></div>
                            <div className="pt-1"><label htmlFor="default_is_available" className="flex items-center text-xs cursor-pointer"><input type="checkbox" name="default_is_available" id="default_is_available" checked={serviceFormData.default_is_available} onChange={handleServiceInputChange} className="h-3.5 w-3.5 mr-1.5"/>Disponible</label></div>
                        </div>
                    </div>
                    <div> <label className="block text-xs font-medium">Imagen Principal*</label><div className={`relative border-2 border-dashed rounded-lg p-3 ${mainImage ? 'border-green-500' : 'border-gray-300'}`}><input type="file" accept="image/*" onChange={(e) => handleImageSelect(e, true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>{mainImage ? (<div className="relative group"><img src={mainImage.preview} alt="Preview" className="w-full h-32 object-cover rounded-md"/><button type="button" onClick={() => removeImage(0, true)} className="absolute top-1 right-1"><Trash2 size={14}/></button></div>) : (<div className="text-center py-8"><Upload className="mx-auto h-8 w-8" /><p className="mt-1 text-xs">Clic o arrastra (Max 5MB)</p></div>)}</div></div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Galería de Imágenes (hasta 5 adicionales)</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {galleryImages.map((img, idx) => (
                          <div key={img.id || idx} className="relative group aspect-square">
                            <img src={img.preview} alt={`Galería ${idx + 1}`} className="w-full h-full object-cover rounded-md border border-gray-200"/>
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(img.storage_path || idx, false);}}
                              className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full p-0.5 shadow-md transition-opacity opacity-0 group-hover:opacity-100 z-10"
                            > <Trash2 size={12} className="text-red-500" /> </button>
                          </div>
                        ))}
                        {galleryImages.length < 5 && (
                          <div className="relative border-2 border-dashed border-gray-300 rounded-md h-full min-h-[6rem] flex items-center justify-center hover:border-primary-500 transition-colors aspect-square">
                            <label htmlFor="galleryUpload" className="absolute inset-0 w-full h-full flex flex-col items-center justify-center cursor-pointer p-2" >
                              <ImageIcon className="mx-auto h-6 w-6 text-gray-400" />
                              <p className="mt-1 text-xs text-gray-500 text-center">Añadir</p>
                            </label>
                            <input id="galleryUpload" type="file" accept="image/jpeg,image/png,image/webp" multiple
                              onChange={(e) => handleImageSelect(e, false)}
                              onClick={(e) => e.stopPropagation()} // Stop click propagation
                              className="opacity-0 w-0 h-0" // Keep it completely hidden
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div> <label className="block text-xs font-medium">Características Clave</label>{serviceFormData.features.map((feat, idx) => <div key={idx} className="flex gap-1 mb-1.5"><input type="text" value={feat} onChange={e=>handleFeatureChange(idx, e.target.value)} className="flex-1 p-2 border rounded-md" placeholder={`Característica ${idx+1}`}/>{serviceFormData.features.length > 1 && <button type="button" onClick={()=>handleRemoveFeature(idx)}><Trash2 size={14}/></button>}</div>)}<button type="button" onClick={handleAddFeature} className="text-xs text-primary-600"><Plus size={14} className="mr-1 inline"/>Agregar</button></div>
                    <div className="flex justify-end space-x-3 pt-4 border-t mt-2">
                      <button type="button" onClick={() => {setShowServiceForm(false); resetServiceForm();}} className="px-4 py-2 text-sm border rounded-lg">Cancelar</button>
                      <button type="submit" disabled={isSubmittingService || (!mainImage && !editingService)} className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg disabled:opacity-70">
                        {isSubmittingService ? <Loader2 className="mr-2 h-4 w-4 animate-spin inline"/> : ''}
                        {editingService ? 'Actualizar' : 'Publicar'}
                      </button>
                    </div>
                  </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
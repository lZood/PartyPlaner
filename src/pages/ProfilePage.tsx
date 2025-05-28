import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  User, Mail, Phone, Plus, Package, Star, Upload, Image as ImageIcon,
  Loader2, MapPin, Compass, Milestone, SearchCheck, CalendarDays,
  ShoppingCart, X, Trash2, Edit // Edit para el futuro
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { categories } from '../data/categories';
import { AppUser, Reservation, Service as AppServiceType, ServiceCoverageArea } from '../types';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-toastify';
import { geocodeAddressNominatim, GeocodingResult } from '../utils/geocoding';

interface ImageUpload {
  file: File; // El archivo real si es nuevo, o un placeholder si es existente
  preview: string;
  isMain?: boolean;
  id?: string; // ID de la imagen en la tabla service_images (para edición)
  storage_path?: string; // Path en Supabase Storage (para saber si hay que eliminar)
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
  coverage_areas: Array<Partial<ServiceCoverageArea & { temp_id: string | number; id?: string; to_delete?: boolean }>>; // temp_id para nuevas, id para existentes, to_delete para marcar
  default_total_capacity: string;
  default_is_available: boolean;
}

// (Opcional pero recomendado) Define un tipo para los servicios del proveedor que incluya sus imágenes y áreas
interface ProviderService extends AppServiceType {
  reservations?: Reservation[]; // Ya lo tenías para la pestaña de proveedor
  service_images?: ServiceImage[]; // Añade esto para cargar imágenes al editar
  service_coverage_areas?: ServiceCoverageArea[]; // Añade esto para cargar áreas al editar
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, setUser: setAuthUser } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'myServices' | 'myPurchases'>('profile');
  
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<ProviderService | null>(null); // NUEVO: Para el servicio en edición
  const [mainImage, setMainImage] = useState<ImageUpload | null>(null);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]); // NUEVO: Para paths de storage a eliminar
  const [isDeletingService, setIsDeletingService] = useState<string | null>(null); // NUEVO: ID del servicio que se está eliminando
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
  };

  const [serviceFormData, setServiceFormData] = useState<ServiceFormData>(initialServiceFormData);
  const [myServices, setMyServices] = useState<ProviderService[]>([]); // MODIFICADO: Usar ProviderService
  const [myPurchases, setMyPurchases] = useState<Reservation[]>([]);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null); // NUEVO: (Si no lo tenías para las reservaciones)
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

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
  if (location.state && (location.state as any).activeTab) {
    const tabFromState = (location.state as any).activeTab;
    if (tabFromState === 'myPurchases' || tabFromState === 'myServices' || tabFromState === 'profile') {
      setActiveTab(tabFromState);
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
      if (activeTab === 'myServices' || showServiceForm) {
        setIsLoadingServices(true);
        const fetchProviderServices = async () => {
          try {
            const { data: servicesData, error: servicesError } = await supabase
              .from('services')
              .select('*, service_coverage_areas(*), service_images(*)') // MODIFICADO: Añadir service_images(*)
              .eq('provider_id', user.id)
              .order('created_at', { ascending: false });

            if (servicesError) throw servicesError;

            if (servicesData) {
              const servicesWithImages = await Promise.all(
                servicesData.map(async (service) => {
                  const { data: mainImageData } = await supabase
                    .from('service_images')
                    .select('storage_path')
                    .eq('service_id', service.id)
                    .eq('is_main_image', true)
                    .maybeSingle(); // Usar maybeSingle para evitar error si no hay imagen

                  let publicUrl = 'https://placehold.co/300x200?text=Sin+Imagen';
                  if (mainImageData?.storage_path) {
                    const { data: urlData } = supabase.storage
                      .from('service-images')
                      .getPublicUrl(mainImageData.storage_path);
                    if (urlData?.publicUrl) publicUrl = urlData.publicUrl;
                  }
                  return { 
                      ...service, 
                      imageUrl: publicUrl, 
                      // gallery: se manejará al editar, no es necesario poblar aquí
                      reservations: (reservationsData as Reservation[]) || [], // Asumiendo que cargas reservaciones aquí
                      service_images: service.service_images || [], // AÑADIDO: Pasar las imágenes cargadas
                      service_coverage_areas: service.service_coverage_areas || [] // AÑADIDO: Pasar las áreas
                  } as ProviderService; // MODIFICADO: Usar ProviderService
                })
              );
              setMyServices(servicesWithImages);
            } else {
              setMyServices([]);
            }
          } catch (error: any) {
            toast.error(`Error al cargar tus servicios: ${error.message}`);
            setMyServices([]);
          } finally {
            setIsLoadingServices(false);
          }
        };
        fetchProviderServices();
      }
    }
  }, [isAuthenticated, navigate, user?.id, activeTab, showServiceForm, supabase]); // user?.id y supabase como dependencias

  // CORREGIDO useEffect para cargar las compras del cliente
  useEffect(() => {
    if (activeTab === 'myPurchases' && user?.id) {
      const fetchPurchases = async () => {
        setIsLoadingPurchases(true);
        setMyPurchases([]); // Limpiar compras anteriores antes de cargar nuevas
        try {
          // Paso 1: Obtener reservaciones con información básica del servicio.
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

          if (reservationsError) {
            throw reservationsError;
          }

          if (!reservationsData) {
            setMyPurchases([]);
            setIsLoadingPurchases(false);
            return;
          }

          // Paso 2: Para cada reservación, obtener la imagen principal del servicio.
          const purchasesWithFullServiceInfo = await Promise.all(
            reservationsData.map(async (purchase) => {
              let serviceImageUrl = 'https://placehold.co/100x80?text=Servicio';
              
              // El objeto 'service' anidado ya viene de la consulta anterior
              let fetchedServiceData = purchase.service as { name: string, provider_name: string } | null;

              if (purchase.service_id) {
                const { data: mainImageData, error: imageError } = await supabase
                  .from('service_images')
                  .select('storage_path')
                  .eq('service_id', purchase.service_id)
                  .eq('is_main_image', true)
                  .maybeSingle(); // Usar maybeSingle para evitar error si no hay imagen principal

                if (imageError) {
                  console.error(`Error al obtener imagen para servicio ${purchase.service_id}: ${imageError.message}`);
                } else if (mainImageData?.storage_path) {
                  const { data: urlData } = supabase.storage
                    .from('service-images')
                    .getPublicUrl(mainImageData.storage_path);
                  if (urlData?.publicUrl) {
                    serviceImageUrl = urlData.publicUrl;
                  }
                }
              }
              
              // Reconstruir el objeto 'service' para el tipo Reservation
              const finalServiceData = fetchedServiceData 
                ? { ...fetchedServiceData, imageUrl: serviceImageUrl } 
                : { name: 'Servicio no disponible', provider_name: 'N/A', imageUrl: serviceImageUrl };

              return {
                ...purchase, // Todas las propiedades de la reservación
                service: finalServiceData, // El objeto 'service' con la imageUrl
              };
            })
          );
          // Asegúrate que el tipo Reservation en src/types/index.ts coincida con esta estructura.
          setMyPurchases(purchasesWithFullServiceInfo as unknown as Reservation[]);

        } catch (err: any) {
          console.error("Error completo al cargar compras:", err);
          toast.error(`Error al cargar tus compras: ${err.message}`);
          setMyPurchases([]);
        } finally {
          setIsLoadingPurchases(false);
        }
      };
      fetchPurchases();
    }
  }, [activeTab, user?.id, supabase]); // user?.id y supabase como dependencias

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean = false) => {
    const files = e.target.files;
    if (!files) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        toast.error('El archivo es demasiado grande. El tamaño máximo es 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (eventReader) => {
        const preview = eventReader.target?.result as string;
        const imageUpload: ImageUpload = { file, preview, isMain };
        if (isMain) {
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
    e.target.value = '';
  };

  const removeImage = (index: number, isMain: boolean = false) => {
    if (isMain) {
      setMainImage(null);
    } else {
      setGalleryImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Usuario no autenticado.');
      return;
    }
    if (isSubmittingProfile) return;
    setIsSubmittingProfile(true);
    try {
      const updates: Partial<AppUser> = { 
        name: formData.name, 
        phone: formData.phone, 
        avatar_url: formData.avatar_url || null
      };
      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) throw error;
      toast.success('Perfil actualizado exitosamente!');
      if(setAuthUser) {
        setAuthUser(prevUser => prevUser ? ({ ...prevUser, ...updates }) : null);
      }
    } catch (error: any) {
      toast.error(`Error al actualizar el perfil: ${error.message}`);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleServiceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setServiceFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...serviceFormData.features];
    newFeatures[index] = value;
    setServiceFormData(prev => ({ ...prev, features: newFeatures }));
  };
  const handleAddFeature = () => setServiceFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  const handleRemoveFeature = (index: number) => setServiceFormData(prev => ({ ...prev, features: serviceFormData.features.filter((_, i) => i !== index)}));

  const handleAddCoverageArea = () => setServiceFormData(prev => ({ ...prev, coverage_areas: [...prev.coverage_areas, { temp_id: Date.now().toString(), area_name: '', city: '', state: '', postal_code: '' }]}));
  const handleCoverageAreaChange = (temp_id: string, field: keyof Omit<ServiceCoverageArea, 'id' | 'service_id' | 'created_at' | 'updated_at' | 'country'>, value: string) => {
    setServiceFormData(prev => ({
      ...prev,
      coverage_areas: prev.coverage_areas.map(area =>
        area.temp_id === temp_id ? { ...area, [field]: value } : area
      )
    }));
  };
  const handleRemoveCoverageArea = (temp_id: string) => setServiceFormData(prev => ({ ...prev, coverage_areas: prev.coverage_areas.filter(area => area.temp_id !== temp_id)}));

  const handleGeocodeServiceAddress = async () => {
    const addressToGeocode = serviceFormData.specific_address;
    if (!addressToGeocode) {
      toast.warn('Por favor, ingresa una dirección para geocodificar.');
      return;
    }
    setIsGeocoding(true);
    toast.info('Obteniendo coordenadas...', { autoClose: 1500 });
    try {
      const result = await geocodeAddressNominatim(addressToGeocode);
      if (result) {
        toast.success(`Coordenadas obtenidas: ${result.displayName.substring(0,50)}...`, { autoClose: 2500 });
        setServiceFormData(prev => ({
          ...prev,
          base_latitude: result.latitude.toString(),
          base_longitude: result.longitude.toString(),
        }));
      } else {
        toast.error('No se pudieron obtener las coordenadas para la dirección proporcionada.');
        setServiceFormData(prev => ({ ...prev, base_latitude: '', base_longitude: ''}));
      }
    } catch (error) {
        toast.error('Error durante la geocodificación.');
        console.error("Geocoding error in profile:", error);
    } finally {
        setIsGeocoding(false);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !user.name || !user.email) {
        toast.error("Tu perfil de usuario está incompleto. Por favor, actualízalo antes de publicar servicios.");
        setActiveTab('profile');
        return;
    }
    if (isSubmittingService) return;
    setIsSubmittingService(true);

    try {
      if (!mainImage) {
        toast.error('La imagen principal del servicio es requerida.');
        setIsSubmittingService(false);
        return;
      }

      const mainImageFileName = `public/${user.id}/${Date.now()}_${mainImage.file.name.replace(/\s/g, '_')}`;
      const { data: mainUploadData, error: mainImageError } = await supabase.storage
        .from('service-images')
        .upload(mainImageFileName, mainImage.file);

      if (mainImageError) throw mainImageError;

      const galleryStoragePathsData = await Promise.all(
        galleryImages.map(async (img) => {
          const fName = `public/${user.id}/${Date.now()}_${img.file.name.replace(/\s/g, '_')}`;
          const { data, error } = await supabase.storage.from('service-images').upload(fName, img.file);
          if (error) throw error;
          return data.path; 
        })
      );

      const serviceToInsert = {
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
        is_approved: false, 
        rating: 0, 
        review_count: 0,
      };

      const { data: newService, error: serviceError } = await supabase
        .from('services')
        .insert(serviceToInsert)
        .select()
        .single();

      if (serviceError) throw serviceError;
      if (!newService) throw new Error("El servicio no pudo ser creado.");

      const serviceImagesToInsert = [
        { service_id: newService.id, storage_path: mainUploadData.path, is_main_image: true, position: 0 },
        ...galleryStoragePathsData.map((path, i) => ({ service_id: newService.id, storage_path: path, is_main_image: false, position: i + 1 }))
      ];
      const { error: serviceImagesError } = await supabase.from('service_images').insert(serviceImagesToInsert);
      if (serviceImagesError) throw serviceImagesError;

      if (serviceFormData.service_type === 'multiple_areas' && serviceFormData.coverage_areas.length > 0) {
        const coverageAreasToInsert = serviceFormData.coverage_areas
            .filter(a => a.area_name && a.area_name.trim() !== '')
            .map(a => ({ 
                service_id: newService.id, 
                area_name: a.area_name!,
                city: a.city || null, 
                state: a.state || null, 
                postal_code: a.postal_code || null 
            }));
        if (coverageAreasToInsert.length > 0) {
            const { error: coverageError } = await supabase.from('service_coverage_areas').insert(coverageAreasToInsert);
            if (coverageError) throw coverageError;
        }
      }
      
      if (serviceFormData.default_is_available && serviceFormData.default_total_capacity) {
        const capacity = parseInt(serviceFormData.default_total_capacity, 10);
        if (capacity > 0) {
            const availabilityEntries: { service_id: string; date: string; total_capacity: number; booked_capacity: number; is_available: boolean; }[] = [];
            const startDate = new Date(); startDate.setHours(0,0,0,0);
            const endDate = new Date(startDate); endDate.setFullYear(startDate.getFullYear() + 1);
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
              availabilityEntries.push({ 
                service_id: newService.id, 
                date: new Date(d).toISOString().split('T')[0], 
                total_capacity: capacity, 
                booked_capacity: 0, 
                is_available: true 
              });
            }
            if (availabilityEntries.length > 0) {
              const { error: availabilityError } = await supabase.from('service_availability').insert(availabilityEntries);
              if (availabilityError) {
                console.error("Error al crear disponibilidad por defecto:", availabilityError);
                toast.warn("Servicio creado, pero falló al establecer la disponibilidad por defecto.");
              }
            }
        }
      }

      toast.success('¡Servicio publicado exitosamente! Está pendiente de aprobación por un administrador.');
      setShowServiceForm(false); 
      setMainImage(null); 
      setGalleryImages([]); 
      setServiceFormData(initialServiceFormData);
      
      // Actualizar la UI con el nuevo servicio
      const newServiceWithImageUrl = {
        ...newService,
        imageUrl: supabase.storage.from('service-images').getPublicUrl(mainUploadData.path).data.publicUrl,
        gallery: [], // La galería completa no se carga aquí por simplicidad
        coverage_areas: serviceFormData.service_type === 'multiple_areas' ? serviceFormData.coverage_areas.map(ca => ({...ca, service_id: newService.id, id: ca.temp_id! })) : [], // Simplificado
        reservations: [] // Nuevo servicio no tiene reservaciones
      } as AppServiceType;
      setMyServices(prev => [newServiceWithImageUrl, ...prev]);


    } catch (error: any) {
      console.error('[ProfilePage] Error creating service:', error);
      toast.error(`Error al crear el servicio: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsSubmittingService(false);
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
  
  return (
    <div className="bg-gray-50 py-8 sm:py-12">
      <div className="container-custom max-w-5xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Mi Cuenta</h1>
        </div>

        <div className="flex flex-wrap space-x-1 sm:space-x-2 mb-8 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-3 text-xs sm:text-sm font-medium focus:outline-none ${activeTab === 'profile' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-primary-500'}`}
          >
            <User size={16} className="inline mr-1 sm:mr-2" /> Perfil
          </button>
          <button
            onClick={() => setActiveTab('myServices')}
            className={`px-3 py-3 text-xs sm:text-sm font-medium focus:outline-none ${activeTab === 'myServices' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-primary-500'}`}
          >
            <Package size={16} className="inline mr-1 sm:mr-2" /> Mis Servicios
          </button>
          <button
            onClick={() => setActiveTab('myPurchases')}
            className={`px-3 py-3 text-xs sm:text-sm font-medium focus:outline-none ${activeTab === 'myPurchases' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500 hover:text-primary-500'}`}
          >
            <ShoppingCart size={16} className="inline mr-1 sm:mr-2" /> Mis Compras
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center mb-8">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4 sm:mb-0 sm:mr-6 overflow-hidden border-2 border-primary-200">
                {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <User size={48} className="text-primary-500" />
                )}
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
                onClick={() => { setServiceFormData(initialServiceFormData); setMainImage(null); setGalleryImages([]); setShowServiceForm(true);}} 
                className="btn btn-primary flex items-center px-3 py-2 sm:px-4 text-sm"
              >
                <Plus size={18} className="mr-1 sm:mr-2" /> Nuevo Servicio
              </button>
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
                <button 
                    onClick={() => { setServiceFormData(initialServiceFormData); setMainImage(null); setGalleryImages([]); setShowServiceForm(true);}} 
                    className="mt-6 btn btn-primary py-2.5 px-6"
                >
                    Publicar mi primer servicio
                </button>
              </div>
            ) : !showServiceForm && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myServices.map(service => {
                  const displayImageUrl = service.imageUrl || 'https://placehold.co/300x200?text=Sin+Imagen';
                  return (
                    <div key={service.id} className="bg-white rounded-xl shadow-lg overflow-hidden group hover:shadow-xl transition-shadow duration-300">
                        <Link to={`/service/${service.id}`} className="block">
                            <img src={displayImageUrl} alt={service.name} className="w-full h-48 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x200?text=Error+Img'; }}/>
                        </Link>
                        <div className="p-4 sm:p-5">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                                <Link to={`/service/${service.id}`}>{service.name}</Link>
                            </h3>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ service.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {service.is_approved ? 'Aprobado' : 'Pendiente Admin'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">
                            Categoría: {categories.find(c=>c.id === service.categoryId)?.name || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3 h-10">{service.shortDescription}</p>
                          
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <Star className="text-yellow-400 fill-current" size={16} />
                            <span className="ml-1 font-medium text-gray-700">{service.rating?.toFixed(1) || '0.0'}</span>
                            <span className="mx-1.5">·</span>
                            <span>({service.reviewCount || 0} reseñas)</span>
                          </div>

                          <div className="mt-4 flex space-x-2 border-t pt-3">
                            <button onClick={(e) => { e.preventDefault(); toast.info('Función de editar próximamente');}} className="btn-outline text-xs p-1.5 px-2.5 rounded-md flex items-center text-gray-600 hover:text-primary-600 border-gray-300 hover:border-primary-500"><Edit size={14} className="mr-1.5"/> Editar</button>
                            <button onClick={(e) => { e.preventDefault(); toast.warn('Función de eliminar no implementada');}} className="btn-outline text-xs p-1.5 px-2.5 rounded-md text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500 flex items-center"><Trash2 size={14} className="mr-1.5"/> Eliminar</button>
                          </div>
                        </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'myPurchases' && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800">Historial de Compras</h2>
            {isLoadingPurchases ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <p className="ml-3 text-gray-600">Cargando tus compras...</p>
              </div>
            ) : myPurchases.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">Aún no has realizado ninguna compra.</p>
                <Link to="/" className="mt-6 btn btn-primary inline-block py-2.5 px-6">Explorar servicios</Link>
              </div>
            ) : (
              <div className="space-y-6">
                {myPurchases.map((purchase) => (
                  <div key={purchase.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <img 
                        src={purchase.service?.imageUrl || 'https://placehold.co/120x90?text=Servicio'} 
                        alt={purchase.service?.name || 'Servicio'}
                        className="w-full sm:w-28 h-auto sm:h-24 object-cover rounded-md flex-shrink-0 border"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/120x90?text=Img+Error'; }}
                      />
                      <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-1">
                          <h3 className="text-md sm:text-lg font-semibold text-primary-700 hover:underline">
                            <Link to={`/service/${purchase.service_id}`}>{purchase.service?.name || 'Servicio Desconocido'}</Link>
                          </h3>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap mt-1 sm:mt-0 ${
                            purchase.status === 'confirmed' || purchase.status === 'approved_by_provider' ? 'bg-green-100 text-green-800' :
                            purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            purchase.status === 'cancelled' || purchase.status === 'cancelled_by_provider' || purchase.status === 'cancelled_by_user' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {purchase.status === 'confirmed' ? 'Confirmada' :
                             purchase.status === 'approved_by_provider' ? 'Aprobada Proveedor' :
                             purchase.status === 'pending' ? 'Pendiente' :
                             purchase.status === 'cancelled' ? 'Cancelada' :
                             purchase.status === 'cancelled_by_provider' ? 'Cancelada (Prov.)' :
                             purchase.status === 'cancelled_by_user' ? 'Cancelada (Tú)' :
                             purchase.status?.toString().charAt(0).toUpperCase() + purchase.status?.toString().slice(1) || 'Desconocido'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1.5">
                          Proveedor: {purchase.service?.provider_name || 'N/A'}
                        </p>
                        <div className="text-xs sm:text-sm text-gray-700 space-y-0.5">
                          <p><strong>Fecha Evento:</strong> {new Date(purchase.event_date + 'T00:00:00Z').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          <p><strong>Cantidad:</strong> {purchase.quantity}</p>
                          <p><strong>Total:</strong> ${purchase.total_price.toLocaleString('es-MX')}</p>
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
        
        {showServiceForm && (
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl">
                  <div className="flex justify-between items-center mb-5 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800">Publicar Nuevo Servicio</h3>
                    <button onClick={() => setShowServiceForm(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"><X size={22} /></button>
                  </div>
                  <form onSubmit={handleServiceSubmit} className="space-y-3 sm:space-y-4 text-sm">
                    <div><label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-0.5">Nombre del Servicio*</label><input type="text" name="name" id="name" value={serviceFormData.name} onChange={handleServiceInputChange} required className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500"/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                        <div><label htmlFor="categoryId" className="block text-xs font-medium text-gray-700 mb-0.5">Categoría*</label><select name="categoryId" id="categoryId" value={serviceFormData.categoryId} onChange={e => setServiceFormData(prev => ({...prev, categoryId: e.target.value, subcategoryId: ''}))} required className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500"><option value="">Seleccionar</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><label htmlFor="subcategoryId" className="block text-xs font-medium text-gray-700 mb-0.5">Subcategoría*</label><select name="subcategoryId" id="subcategoryId" value={serviceFormData.subcategoryId} onChange={handleServiceInputChange} required disabled={!serviceFormData.categoryId} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"><option value="">Seleccionar</option>{categories.find(c=>c.id===serviceFormData.categoryId)?.subcategories.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    </div>
                    <div><label htmlFor="shortDescription" className="block text-xs font-medium text-gray-700 mb-0.5">Descripción Corta* (Máx 150 caracteres)</label><input type="text" name="shortDescription" id="shortDescription" value={serviceFormData.shortDescription} onChange={handleServiceInputChange} required maxLength={150} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500"/></div>
                    <div><label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-0.5">Descripción Detallada*</label><textarea name="description" id="description" value={serviceFormData.description} onChange={handleServiceInputChange} required rows={4} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500"></textarea></div>
                    <div><label htmlFor="price" className="block text-xs font-medium text-gray-700 mb-0.5">Precio (MXN) - Dejar vacío para 'Cotizar'</label><input type="number" name="price" id="price" value={serviceFormData.price} onChange={handleServiceInputChange} placeholder="Ej: 1500.00" min="0" step="0.01" className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500"/></div>

                    <div>
                      <label htmlFor="service_type" className="block text-xs font-medium text-gray-700 mb-0.5">Tipo de Ubicación del Servicio*</label>
                      <select name="service_type" id="service_type" value={serviceFormData.service_type} onChange={handleServiceInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500">
                        <option value="fixed_location">Ubicación Fija (El cliente va a tu local)</option>
                        <option value="delivery_area">Servicio a Domicilio (Radio desde tu base)</option>
                        <option value="multiple_areas">Múltiples Áreas de Cobertura (Listado)</option>
                      </select>
                    </div>

                    {(serviceFormData.service_type === 'fixed_location' || serviceFormData.service_type === 'delivery_area') && (
                      <div className="p-3 border rounded-md bg-gray-50 space-y-2">
                        <label htmlFor="specific_address" className="block text-xs font-medium text-gray-700">
                          {serviceFormData.service_type === 'fixed_location' ? 'Dirección de tu Local/Servicio Fijo*' : 'Tu Dirección Base para Servicio a Domicilio*'}
                        </label>
                        <div className="flex items-stretch gap-2">
                          <div className="relative flex-grow">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"><MapPin size={15}/></span>
                            <input type="text" name="specific_address" value={serviceFormData.specific_address} onChange={handleServiceInputChange} required className="w-full pl-8 p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Calle, No., Colonia, Alcaldía/Municipio, CP, Estado"/>
                          </div>
                          <button type="button" onClick={handleGeocodeServiceAddress} disabled={isGeocoding || !serviceFormData.specific_address} className="p-2 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center whitespace-nowrap shadow-sm"><SearchCheck size={14} className="mr-1"/>Obtener Coords</button>
                        </div>
                        {(serviceFormData.base_latitude && serviceFormData.base_longitude) && (
                            <p className="text-xs text-green-600">Coords: {parseFloat(serviceFormData.base_latitude).toFixed(5)}, {parseFloat(serviceFormData.base_longitude).toFixed(5)}</p>
                        )}
                      </div>
                    )}

                    {serviceFormData.service_type === 'delivery_area' && (
                      <div><label htmlFor="delivery_radius_km" className="block text-xs font-medium text-gray-700 mb-0.5">Radio de Cobertura desde tu Base (km)*</label><input type="number" name="delivery_radius_km" value={serviceFormData.delivery_radius_km} onChange={handleServiceInputChange} required min="1" className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Ej. 10"/></div>
                    )}

                    {serviceFormData.service_type === 'multiple_areas' && (
                      <div className="space-y-2 p-3 border rounded-md bg-gray-50">
                        <h4 className="text-xs font-medium text-gray-700">Especifica las Áreas de Cobertura</h4>
                        {serviceFormData.coverage_areas.map((area, index) => (
                          <div key={area.temp_id} className="p-2 border rounded bg-white space-y-1 shadow-sm">
                            <div className="flex justify-between items-center"><p className="text-xs font-semibold text-gray-600">Área de Cobertura {index + 1}</p><button type="button" onClick={() => handleRemoveCoverageArea(area.temp_id!)} className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-50"><Trash2 size={14}/></button></div>
                            <input type="text" placeholder="Nombre del Área (ej. Polanco, Condesa)*" value={area.area_name} onChange={(e) => handleCoverageAreaChange(area.temp_id!, 'area_name', e.target.value)} required className="w-full text-xs p-1.5 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"/>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                              <input type="text" placeholder="Ciudad (opcional)" value={area.city} onChange={(e) => handleCoverageAreaChange(area.temp_id!, 'city', e.target.value)} className="w-full text-xs p-1.5 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"/>
                              <input type="text" placeholder="Estado (opcional)" value={area.state} onChange={(e) => handleCoverageAreaChange(area.temp_id!, 'state', e.target.value)} className="w-full text-xs p-1.5 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"/>
                              <input type="text" placeholder="C.P. (opcional)" value={area.postal_code} onChange={(e) => handleCoverageAreaChange(area.temp_id!, 'postal_code', e.target.value)} className="w-full text-xs p-1.5 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"/>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={handleAddCoverageArea} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center mt-1 p-1 rounded hover:bg-primary-50"><Plus size={14} className="mr-1"/> Agregar Otra Área de Cobertura</button>
                      </div>
                    )}

                     <div className="p-3 border rounded-md bg-gray-50">
                        <h4 className="text-xs font-medium text-gray-700 mb-1">Disponibilidad General por Defecto</h4>
                        <p className="text-xs text-gray-500 mb-1.5">Establece la capacidad diaria y si estará disponible de forma predeterminada para el próximo año. Podrás ajustar días específicos más adelante.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-end">
                             <div><label htmlFor="default_total_capacity" className="block text-xs font-medium text-gray-700 mb-0.5">Capacidad por Día* (ej: 1 evento, 10 personas)</label><input type="number" name="default_total_capacity" id="default_total_capacity" value={serviceFormData.default_total_capacity} onChange={handleServiceInputChange} required min="1" className="w-full p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500" placeholder="Ej. 1"/></div>
                            <div className="pt-1"><label htmlFor="default_is_available" className="flex items-center text-xs text-gray-700 cursor-pointer"><input type="checkbox" name="default_is_available" id="default_is_available" checked={serviceFormData.default_is_available} onChange={handleServiceInputChange} className="h-3.5 w-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mr-1.5 shadow-sm"/>Disponible por defecto</label></div>
                        </div>
                    </div>

                    <div> <label className="block text-xs font-medium text-gray-700 mb-1">Imagen Principal*</label><div className={`relative border-2 border-dashed rounded-lg p-3 hover:border-primary-500 transition-colors ${mainImage ? 'border-green-500' : 'border-gray-300'}`}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageSelect(e, true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>{mainImage ? (<div className="relative group"><img src={mainImage.preview} alt="Preview" className="w-full h-32 object-cover rounded-md"/><button type="button" onClick={() => removeImage(0, true)} className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full p-1 shadow-md transition-opacity opacity-0 group-hover:opacity-100"><Trash2 size={14} className="text-red-500"/></button></div>) : (<div className="text-center py-8"><Upload className="mx-auto h-8 w-8 text-gray-400" /><p className="mt-1 text-xs text-gray-600">Clic o arrastra tu imagen principal (Max 5MB)</p></div>)}</div></div>
                    <div> <label className="block text-xs font-medium text-gray-700 mb-1">Galería de Imágenes (hasta 5 adicionales)</label><div className="grid grid-cols-3 sm:grid-cols-5 gap-2">{galleryImages.map((img, idx) => <div key={idx} className="relative group aspect-square"><img src={img.preview} alt={`Galería ${idx+1}`} className="w-full h-full object-cover rounded-md"/><button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/80 hover:bg-white rounded-full p-0.5 shadow-md transition-opacity opacity-0 group-hover:opacity-100"><Trash2 size={12} className="text-red-500"/></button></div>)}{galleryImages.length < 5 && <label className="relative border-2 border-dashed border-gray-300 rounded-md p-2 h-full min-h-[6rem] flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors aspect-square"><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageSelect} className="absolute inset-0 w-full h-full opacity-0"/><div className="text-center"><ImageIcon className="mx-auto h-6 w-6 text-gray-400"/><p className="mt-1 text-xs text-gray-500">Añadir</p></div></label>}</div></div>
                    <div> <label className="block text-xs font-medium text-gray-700 mb-1">Características Clave (una por línea)</label>{serviceFormData.features.map((feat, idx) => <div key={idx} className="flex gap-1 mb-1.5"><input type="text" value={feat} onChange={e=>handleFeatureChange(idx, e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-primary-500 focus:border-primary-500" placeholder={`Característica ${idx+1}`}/>{serviceFormData.features.length > 1 && <button type="button" onClick={()=>handleRemoveFeature(idx)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50"><Trash2 size={14}/></button>}</div>)}<button type="button" onClick={handleAddFeature} className="text-xs text-primary-600 hover:text-primary-700 font-medium p-1 rounded hover:bg-primary-50 mt-0.5 flex items-center"><Plus size={14} className="mr-1"/> Agregar característica</button></div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-2">
                      <button type="button" onClick={() => setShowServiceForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 shadow-sm">Cancelar</button>
                      <button type="submit" disabled={isSubmittingService} className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-70 flex items-center shadow-sm hover:shadow-md">
                        {isSubmittingService ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Publicando...</> : 'Publicar Servicio'}
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
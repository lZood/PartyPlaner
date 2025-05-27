import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, Plus, Package, Star, Edit, Trash2, X, Upload, Image as ImageIcon, Loader2, MapPin, Compass, Milestone, CalendarDays } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { categories } from '../data/categories';
import { Service, ServiceCoverageArea } from '../types'; // Asegúrate que ServiceCoverageArea esté en tus tipos
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-toastify';
import { AppUser } from '../contexts/AuthContext';

interface ImageUpload {
  file: File;
  preview: string;
  isMain?: boolean;
}

// Define el tipo para el serviceFormData más explícitamente
interface ServiceFormData {
  name: string;
  categoryId: string;
  subcategoryId: string;
  shortDescription: string;
  description: string;
  price: string; // Mantener como string para el input, convertir a número al enviar
  features: string[];
  service_type: 'fixed_location' | 'delivery_area' | 'multiple_areas';
  specific_address?: string;
  base_latitude?: string; // Mantener como string para el input
  base_longitude?: string; // Mantener como string para el input
  delivery_radius_km?: string; // Mantener como string para el input
  coverage_areas: Array<Partial<ServiceCoverageArea & { temp_id: string }>>; // Añadir temp_id para manejo en UI
  // Para disponibilidad simplificada por ahora:
  default_total_capacity: string; // Capacidad por defecto por día
  default_is_available: boolean; // Si está disponible por defecto
}


const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, setUser: setAuthUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'services'>('profile');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [mainImage, setMainImage] = useState<ImageUpload | null>(null);
  const [galleryImages, setGalleryImages] = useState<ImageUpload[]>([]);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingService, setIsSubmittingService] = useState(false);

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
    service_type: 'fixed_location', // Valor por defecto
    specific_address: '',
    base_latitude: '',
    base_longitude: '',
    delivery_radius_km: '',
    coverage_areas: [],
    default_total_capacity: '1', // Por defecto, 1 evento/servicio por día
    default_is_available: true, // Por defecto, disponible
  };

  const [serviceFormData, setServiceFormData] = useState<ServiceFormData>(initialServiceFormData);
  const [myServices, setMyServices] = useState<Service[]>([]);


  // --- (useEffect para formData y fetchServices se mantiene igual, pero fetchServices ahora debe poblar los nuevos campos) ---
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
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (user?.id) {
      document.title = 'Mi Perfil | CABETG Party Planner';
      const fetchServices = async () => {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*, service_coverage_areas(*)') // Incluir coverage_areas
          .eq('provider_id', user.id);

        if (servicesError) {
          toast.error(`Error al cargar tus servicios: ${servicesError.message}`);
          return;
        }

        if (servicesData) {
          const servicesWithImages = await Promise.all(
            servicesData.map(async (service) => {
              const { data: mainImageData, error: mainImageError } = await supabase
                .from('service_images')
                .select('storage_path')
                .eq('service_id', service.id)
                .eq('is_main_image', true)
                .single();

              let publicUrl = 'https://placehold.co/300x200?text=Sin+Imagen';
              if (!mainImageError && mainImageData?.storage_path) {
                const { data: urlData } = supabase.storage
                  .from('service-images')
                  .getPublicUrl(mainImageData.storage_path);
                if (urlData) {
                  publicUrl = urlData.publicUrl;
                }
              }
              return { ...service, imageUrl: publicUrl, gallery: [] }; // gallery se llena en ServiceDetailPage
            })
          );
          setMyServices(servicesWithImages as unknown as Service[]);
        } else {
          setMyServices([]);
        }
      };
      fetchServices();
    }
  }, [isAuthenticated, navigate, user]);


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
            if (prev.length >= 5) {
              toast.warn('Máximo 5 imágenes en la galería');
              return prev;
            }
            return [...prev, imageUpload];
          });
        }
      };
      reader.readAsDataURL(file);
    });
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
    if (!user || !user.id) {
      toast.error('Usuario no autenticado. No se puede actualizar el perfil.');
      return;
    }
    if (isSubmittingProfile) return;
    setIsSubmittingProfile(true);
    try {
      const updates: Partial<AppUser> = {
        name: formData.name,
        phone: formData.phone,
        avatar_url: formData.avatar_url || null,
      };
      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) throw error;
      toast.success('Perfil actualizado con éxito!');
      // Actualizar el usuario en el contexto si es necesario
      if(setAuthUser) {
        setAuthUser(prev => prev ? ({...prev, ...updates}) : null);
      }
    } catch (error: any) {
      toast.error(`Error al actualizar el perfil: ${error.message}`);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleServiceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setServiceFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setServiceFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...serviceFormData.features];
    newFeatures[index] = value;
    setServiceFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const handleAddFeature = () => {
    setServiceFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const handleRemoveFeature = (index: number) => {
    const newFeatures = serviceFormData.features.filter((_, i) => i !== index);
    setServiceFormData(prev => ({ ...prev, features: newFeatures }));
  };

  // Coverage Area Management
  const handleAddCoverageArea = () => {
    setServiceFormData(prev => ({
      ...prev,
      coverage_areas: [
        ...prev.coverage_areas,
        { temp_id: Date.now().toString(), area_name: '', city: '', state: '', postal_code: '' }
      ]
    }));
  };

  const handleCoverageAreaChange = (temp_id: string, field: keyof ServiceCoverageArea, value: string) => {
    setServiceFormData(prev => ({
      ...prev,
      coverage_areas: prev.coverage_areas.map(area =>
        area.temp_id === temp_id ? { ...area, [field]: value } : area
      )
    }));
  };

  const handleRemoveCoverageArea = (temp_id: string) => {
    setServiceFormData(prev => ({
      ...prev,
      coverage_areas: prev.coverage_areas.filter(area => area.temp_id !== temp_id)
    }));
  };


  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id || !user.name || !user.email) {
      toast.error("Debes estar autenticado y tu perfil debe estar completo para crear un servicio.");
      return;
    }
    setIsSubmittingService(true);

    try {
      if (!mainImage) {
        toast.error('Por favor selecciona una imagen principal');
        setIsSubmittingService(false);
        return;
      }

      // 1. Upload main image
      const mainImageFileName = `${user.id}/${Date.now()}_${mainImage.file.name.replace(/\s/g, '_')}`;
      const { data: mainUploadData, error: mainImageError } = await supabase.storage
        .from('service-images')
        .upload(mainImageFileName, mainImage.file);
      if (mainImageError) throw mainImageError;
      const mainImageStoragePath = mainUploadData.path;

      // 2. Upload gallery images
      const galleryStoragePaths: string[] = [];
      for (const image of galleryImages) {
        const galleryImageFileName = `${user.id}/${Date.now()}_${image.file.name.replace(/\s/g, '_')}`;
        const { data: galleryUploadData, error: galleryError } = await supabase.storage
          .from('service-images')
          .upload(galleryImageFileName, image.file);
        if (galleryError) throw galleryError;
        galleryStoragePaths.push(galleryUploadData.path);
      }

      // 3. Insert service into 'services' table
      const serviceToInsert = {
        name: serviceFormData.name,
        category_id: serviceFormData.categoryId,
        subcategory_id: serviceFormData.subcategoryId,
        short_description: serviceFormData.shortDescription,
        description: serviceFormData.description,
        price: serviceFormData.price ? parseFloat(serviceFormData.price) : null,
        provider_id: user.id,
        provider_name: user.name,
        provider_email: user.email, // Make sure user.email is available
        provider_phone: user.phone, // Make sure user.phone is available
        features: serviceFormData.features.filter(f => f.trim() !== ''),
        is_approved: false, // Default, admin should approve
        rating: 0,
        review_count: 0,
        service_type: serviceFormData.service_type,
        specific_address: serviceFormData.service_type === 'fixed_location' ? serviceFormData.specific_address : null,
        base_latitude: serviceFormData.base_latitude ? parseFloat(serviceFormData.base_latitude) : null,
        base_longitude: serviceFormData.base_longitude ? parseFloat(serviceFormData.base_longitude) : null,
        delivery_radius_km: serviceFormData.delivery_radius_km ? parseInt(serviceFormData.delivery_radius_km, 10) : null,
      };

      const { data: newService, error: serviceError } = await supabase
        .from('services')
        .insert(serviceToInsert)
        .select()
        .single();
      if (serviceError) throw serviceError;
      if (!newService) throw new Error("No se pudo obtener el servicio creado.");

      // 4. Insert service images into 'service_images'
      const serviceImagesToInsert = [{
        service_id: newService.id, storage_path: mainImageStoragePath,
        is_main_image: true, position: 0
      }];
      galleryStoragePaths.forEach((path, index) => {
        serviceImagesToInsert.push({
          service_id: newService.id, storage_path: path,
          is_main_image: false, position: index + 1
        });
      });
      const { error: serviceImagesError } = await supabase.from('service_images').insert(serviceImagesToInsert);
      if (serviceImagesError) throw serviceImagesError;

      // 5. Insert coverage areas if type is 'multiple_areas'
      if (serviceFormData.service_type === 'multiple_areas' && serviceFormData.coverage_areas.length > 0) {
        const coverageAreasToInsert = serviceFormData.coverage_areas.map(area => ({
          service_id: newService.id,
          area_name: area.area_name,
          city: area.city,
          state: area.state,
          postal_code: area.postal_code,
        }));
        const { error: coverageError } = await supabase.from('service_coverage_areas').insert(coverageAreasToInsert);
        if (coverageError) throw coverageError;
      }
      
      // 6. Insert default availability (Simplified approach)
      // For a real app, you'd likely want a calendar UI for the provider to set many dates.
      // Here, we'll just set a wide range of dates with default availability as an example.
      // This is NOT ideal for production but demonstrates the concept.
      // A better approach is a dedicated UI for the provider to manage this.
      if (serviceFormData.default_is_available && serviceFormData.default_total_capacity) {
          const availabilityEntries = [];
          const startDate = new Date();
          const endDate = new Date();
          endDate.setFullYear(startDate.getFullYear() + 1); // Available for 1 year by default

          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
              availabilityEntries.push({
                  service_id: newService.id,
                  date: new Date(d).toISOString().split('T')[0], // Format YYYY-MM-DD
                  total_capacity: parseInt(serviceFormData.default_total_capacity, 10),
                  booked_capacity: 0,
                  is_available: true,
              });
          }
          if (availabilityEntries.length > 0) {
            // Batch insert can be large, consider chunking if necessary
            const { error: availabilityError } = await supabase.from('service_availability').insert(availabilityEntries);
            if (availabilityError) {
                console.warn("Error setting default availability, but service created:", availabilityError);
                toast.warn("Servicio creado, pero hubo un problema al establecer la disponibilidad por defecto.");
            }
          }
      }


      toast.success('Servicio publicado con éxito! Pendiente de aprobación.');
      setShowServiceForm(false);
      setMainImage(null);
      setGalleryImages([]);
      setServiceFormData(initialServiceFormData); // Reset form
      // Re-fetch services
      if (user?.id) {
        const { data: updatedServicesData } = await supabase
          .from('services').select('*, service_coverage_areas(*)').eq('provider_id', user.id);
        if (updatedServicesData) setMyServices(updatedServicesData as unknown as Service[]);
      }

    } catch (error: any) {
      console.error('[ProfilePage] Error creating service:', error);
      toast.error(`Error al crear el servicio: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsSubmittingService(false);
    }
  };


  if (!isAuthenticated || !user) {
    return <div className="flex justify-center items-center min-h-screen">Cargando perfil...</div>;
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
        {/* ... (pestañas de perfil y mis servicios) ... */}
         <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'profile'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Perfil
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'services'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Mis Servicios
            </button>
          </div>
        </div>


        {activeTab === 'profile' ? (
          // --- (Formulario de perfil se mantiene igual) ---
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
          <div className="flex items-center mb-8">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={40} className="text-primary-500" />
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold">{formData.name || ''}</h2>
              <p className="text-gray-600">{formData.email || ''}</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Name, Email, Phone, Avatar URL inputs - sin cambios */}
            <div>
              <label htmlFor="profileName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User size={18} />
                </span>
                <input
                  type="text"
                  id="profileName"
                  value={formData.name || ''} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profileEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico (no editable)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={18} />
                </span>
                <input
                  type="email"
                  id="profileEmail"
                  value={formData.email || ''} 
                  readOnly 
                  disabled 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profilePhone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone size={18} />
                </span>
                <input
                  type="tel"
                  id="profilePhone"
                  value={formData.phone || ''} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                  placeholder="Ej. 5512345678"
                />
              </div>
            </div>
            <div>
              <label htmlFor="profileAvatarUrl" className="block text-sm font-medium text-gray-700 mb-1">
                URL del Avatar (opcional)
              </label>
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <ImageIcon size={18} />
                </span>
                <input
                  type="url"
                  id="profileAvatarUrl"
                  value={formData.avatar_url || ''}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                  placeholder="https://ejemplo.com/imagen.png"
                />
              </div>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="w-full sm:w-auto bg-primary-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-70 flex items-center justify-center"
              >
                {isSubmittingProfile ? ( <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Guardando...</> ) : ( 'Guardar Cambios' )}
              </button>
            </div>
          </form>
        </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Mis Servicios Publicados</h2>
              <button
                onClick={() => {
                    setServiceFormData(initialServiceFormData); // Reset form when opening
                    setShowServiceForm(true);
                }}
                className="flex items-center bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Nuevo Servicio
              </button>
            </div>

            {showServiceForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Publicar Nuevo Servicio</h3>
                    <button onClick={() => setShowServiceForm(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleServiceSubmit} className="space-y-6">
                    {/* Campos existentes: Name, Category, Subcategory, ShortDescription, Description, Price, Features, Images */}
                    {/* ... (estos campos se mantienen como los tenías, solo asegúrate que `onChange` apunte a `handleServiceInputChange`) ... */}
                    <div>
                      <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio *</label>
                      <input type="text" id="serviceName" name="name" required value={serviceFormData.name} onChange={handleServiceInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="serviceCategory" className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                        <select id="serviceCategory" name="categoryId" required value={serviceFormData.categoryId} onChange={(e) => setServiceFormData(prev => ({...prev, categoryId: e.target.value, subcategoryId: ''}))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300">
                          <option value="">Seleccionar categoría</option>
                          {categories.map(category => (<option key={category.id} value={category.id}>{category.name}</option>))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="serviceSubcategory" className="block text-sm font-medium text-gray-700 mb-1">Subcategoría *</label>
                        <select id="serviceSubcategory" name="subcategoryId" required disabled={!serviceFormData.categoryId} value={serviceFormData.subcategoryId} onChange={handleServiceInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:bg-gray-100">
                          <option value="">Seleccionar subcategoría</option>
                          {categories.find(cat => cat.id === serviceFormData.categoryId)?.subcategories.map(subcat => (<option key={subcat.id} value={subcat.id}>{subcat.name}</option>))}
                        </select>
                      </div>
                    </div>
                    <div><label htmlFor="serviceShortDescription" className="block text-sm font-medium text-gray-700 mb-1">Descripción Corta * (Máx. 100 caracteres)</label><input type="text" id="serviceShortDescription" name="shortDescription" required value={serviceFormData.shortDescription} onChange={handleServiceInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300" maxLength={100}/></div>
                    <div><label htmlFor="serviceDescription" className="block text-sm font-medium text-gray-700 mb-1">Descripción Detallada *</label><textarea id="serviceDescription" name="description" required value={serviceFormData.description} onChange={handleServiceInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300" rows={4}/></div>
                    <div><label htmlFor="servicePrice" className="block text-sm font-medium text-gray-700 mb-1">Precio (opcional)</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span><input type="number" id="servicePrice" name="price" value={serviceFormData.price} onChange={handleServiceInputChange} className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="Dejar vacío para 'Solicitar Cotización'" min="0" step="0.01"/></div></div>


                    {/* Tipo de Servicio */}
                    <div>
                      <label htmlFor="service_type" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ubicación del Servicio *</label>
                      <select name="service_type" id="service_type" value={serviceFormData.service_type} onChange={handleServiceInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300">
                        <option value="fixed_location">Ubicación Fija (ej. Salón, local)</option>
                        <option value="delivery_area">Servicio a Domicilio (radio de cobertura)</option>
                        <option value="multiple_areas">Múltiples Áreas de Cobertura</option>
                      </select>
                    </div>

                    {/* Campos condicionales para Ubicación */}
                    {serviceFormData.service_type === 'fixed_location' && (
                      <div>
                        <label htmlFor="specific_address" className="block text-sm font-medium text-gray-700 mb-1">Dirección Específica del Servicio *</label>
                        <div className="relative"><span className="absolute left-3 top-3 text-gray-400"><MapPin size={18}/></span><input type="text" name="specific_address" id="specific_address" value={serviceFormData.specific_address} onChange={handleServiceInputChange} required className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" placeholder="Calle, Número, Colonia, Ciudad, CP"/></div>
                      </div>
                    )}

                    {(serviceFormData.service_type === 'fixed_location' || serviceFormData.service_type === 'delivery_area') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="base_latitude" className="block text-sm font-medium text-gray-700 mb-1">Latitud Base (Opcional)</label>
                           <div className="relative"><span className="absolute left-3 top-3 text-gray-400"><Compass size={18}/></span><input type="number" name="base_latitude" id="base_latitude" value={serviceFormData.base_latitude} onChange={handleServiceInputChange} step="any" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" placeholder="Ej. 19.4326"/></div>
                        </div>
                        <div>
                          <label htmlFor="base_longitude" className="block text-sm font-medium text-gray-700 mb-1">Longitud Base (Opcional)</label>
                          <div className="relative"><span className="absolute left-3 top-3 text-gray-400"><Compass size={18}/></span><input type="number" name="base_longitude" id="base_longitude" value={serviceFormData.base_longitude} onChange={handleServiceInputChange} step="any" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" placeholder="Ej. -99.1332"/></div>
                        </div>
                      </div>
                    )}

                    {serviceFormData.service_type === 'delivery_area' && (
                      <div>
                        <label htmlFor="delivery_radius_km" className="block text-sm font-medium text-gray-700 mb-1">Radio de Cobertura (km) *</label>
                        <div className="relative"><span className="absolute left-3 top-3 text-gray-400"><Milestone size={18}/></span><input type="number" name="delivery_radius_km" id="delivery_radius_km" value={serviceFormData.delivery_radius_km} onChange={handleServiceInputChange} required min="1" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" placeholder="Ej. 10"/></div>
                      </div>
                    )}

                    {/* Gestión de Múltiples Áreas de Cobertura */}
                    {serviceFormData.service_type === 'multiple_areas' && (
                      <div className="space-y-4 p-4 border rounded-md">
                        <h4 className="font-medium text-gray-700">Áreas de Cobertura Específicas</h4>
                        {serviceFormData.coverage_areas.map((area, index) => (
                          <div key={area.temp_id} className="p-3 border rounded bg-gray-50 space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium">Área {index + 1}</p>
                                <button type="button" onClick={() => handleRemoveCoverageArea(area.temp_id!)} className="text-error-500 hover:text-error-700">
                                <Trash2 size={16}/>
                                </button>
                            </div>
                            <input type="text" placeholder="Nombre del Área (ej. Polanco, CDMX)" value={area.area_name} onChange={(e) => handleCoverageAreaChange(area.temp_id!, 'area_name', e.target.value)} required className="w-full text-sm p-2 border rounded-md"/>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input type="text" placeholder="Ciudad" value={area.city} onChange={(e) => handleCoverageAreaChange(area.temp_id!, 'city', e.target.value)} className="w-full text-sm p-2 border rounded-md"/>
                                <input type="text" placeholder="Estado" value={area.state} onChange={(e) => handleCoverageAreaChange(area.temp_id!, 'state', e.target.value)} className="w-full text-sm p-2 border rounded-md"/>
                                <input type="text" placeholder="Código Postal" value={area.postal_code} onChange={(e) => handleCoverageAreaChange(area.temp_id!, 'postal_code', e.target.value)} className="w-full text-sm p-2 border rounded-md"/>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={handleAddCoverageArea} className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center">
                          <Plus size={16} className="mr-1"/> Agregar Área de Cobertura
                        </button>
                      </div>
                    )}
                    
                    {/* Gestión de Disponibilidad Simplificada */}
                    <div className="p-4 border rounded-md bg-gray-50">
                        <h4 className="font-medium text-gray-700 mb-2">Configuración de Disponibilidad por Defecto</h4>
                        <p className="text-xs text-gray-500 mb-3">Establece la disponibilidad general. Podrás bloquear fechas específicas o ajustar la capacidad más adelante (próximamente).</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="default_total_capacity" className="block text-sm font-medium text-gray-700 mb-1">Capacidad por Día</label>
                                 <div className="relative"><span className="absolute left-3 top-3 text-gray-400"><Package size={18}/></span><input type="number" name="default_total_capacity" id="default_total_capacity" value={serviceFormData.default_total_capacity} onChange={handleServiceInputChange} required min="1" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" placeholder="Ej. 1 (para 1 evento/día)"/></div>
                            </div>
                            <div className="flex items-center pt-6">
                                <input type="checkbox" name="default_is_available" id="default_is_available" checked={serviceFormData.default_is_available} onChange={handleServiceInputChange} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/>
                                <label htmlFor="default_is_available" className="ml-2 block text-sm text-gray-900">Disponible por defecto</label>
                            </div>
                        </div>
                    </div>


                    {/* ... (Imágenes y Features como antes, con handleServiceInputChange y funciones específicas) ... */}
                     <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Imagen Principal * (Max 5MB, JPG/PNG)</label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
                        <input type="file" accept="image/jpeg, image/png" onChange={(e) => handleImageSelect(e, true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Subir imagen principal"/>
                        {mainImage ? (<div className="relative group"><img src={mainImage.preview} alt="Vista previa imagen principal" className="w-full h-48 object-cover rounded-lg"/><button type="button" onClick={() => removeImage(0, true)} className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Eliminar imagen principal"><Trash2 size={18} className="text-error-500" /></button></div>) : (<div className="text-center"><Upload className="mx-auto h-12 w-12 text-gray-400" /><p className="mt-2 text-sm text-gray-600">Haz clic para subir o arrastra una imagen aquí</p><p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p></div>)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Galería de Imágenes (Máx. 5 imágenes, Max 5MB c/u, JPG/PNG)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {galleryImages.map((image, index) => (<div key={index} className="relative group"><img src={image.preview} alt={`Imagen de galería ${index + 1}`} className="w-full h-32 object-cover rounded-lg"/><button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Eliminar imagen de galería ${index + 1}`}><Trash2 size={16} className="text-error-500" /></button></div>))}
                        {galleryImages.length < 5 && (<label className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors h-32 flex items-center justify-center cursor-pointer"><input type="file" accept="image/jpeg, image/png" multiple onChange={handleImageSelect} className="absolute inset-0 w-full h-full opacity-0" aria-label="Agregar imágenes a galería"/><div className="text-center"><ImageIcon className="mx-auto h-8 w-8 text-gray-400" /><p className="mt-1 text-xs text-gray-500">Agregar imagen(es)</p></div></label>)}
                      </div>
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Características (una por línea)</label>
                      {serviceFormData.features.map((feature, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input type="text" value={feature} onChange={(e) => handleFeatureChange(index, e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder={`Característica ${index + 1}`}/>
                          {serviceFormData.features.length > 1 && (<button type="button" onClick={() => handleRemoveFeature(index)} className="p-2 text-gray-400 hover:text-error-500" aria-label={`Eliminar característica ${index + 1}`}><Trash2 size={20} /></button>)}
                        </div>
                      ))}
                      <button type="button" onClick={handleAddFeature} className="text-sm text-primary-500 hover:text-primary-600 font-medium">+ Agregar otra característica</button>
                    </div>


                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <button type="button" onClick={() => setShowServiceForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                      <button type="submit" disabled={isSubmittingService} className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-70 flex items-center justify-center">
                        {isSubmittingService ? ( <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Publicando...</> ) : ( 'Publicar Servicio' )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ... (lista de servicios publicados se mantiene igual, pero ahora `service.imageUrl` debería funcionar) ... */}
            {myServices.length === 0 && !showServiceForm ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4"><Package className="text-primary-500" size={32} /></div>
                <h3 className="text-xl font-semibold mb-2">No tienes servicios publicados</h3>
                <p className="text-gray-600 mb-6">Comienza a ofrecer tus servicios haciendo clic en "Nuevo Servicio"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myServices.map(service => {
                  const displayImageUrl = service.imageUrl || 'https://placehold.co/300x200?text=Sin+Imagen';
                  return (
                    <Link key={service.id} to={`/service/${service.id}`} className="block group">
                      <div className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col group-hover:shadow-lg transition-shadow duration-300">
                        <img src={displayImageUrl} alt={service.name} className="w-full h-48 object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/300x200?text=Error+Img')}/>
                        <div className="p-6 flex flex-col flex-grow">
                          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-500 transition-colors">{service.name}</h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">{service.shortDescription}</p>
                          <div className="flex items-center justify-between text-sm mt-auto">
                            <div className="flex items-center">
                              <Star className="text-warning-500 fill-current" size={18} />
                              <span className="ml-1 font-medium">{service.rating || 0}</span>
                              <span className="mx-1 text-gray-400">·</span>
                              <span className="text-gray-600">({service.reviewCount || 0} reseñas)</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ service.is_approved ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                              {service.is_approved ? 'Aprobado' : 'Pendiente'}
                            </span>
                          </div>
                          <div className="mt-4 flex space-x-2">
                            <button onClick={(e) => { e.preventDefault(); console.log('Editar servicio:', service.id);}} className="p-2 text-gray-500 hover:text-primary-500 bg-gray-100 hover:bg-gray-200 rounded-md" aria-label="Editar servicio"><Edit size={18} /></button>
                            <button onClick={(e) => { e.preventDefault(); console.log('Eliminar servicio:', service.id);}} className="p-2 text-gray-500 hover:text-error-500 bg-gray-100 hover:bg-gray-200 rounded-md" aria-label="Eliminar servicio"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
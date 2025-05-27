import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Phone, Plus, Package, Star, Edit, Trash2, X, Upload, Image as ImageIcon,
  Loader2, MapPin, Compass, Milestone, SearchCheck, CalendarDays // Asegúrate que SearchCheck esté aquí
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { categories } from '../data/categories';
import { Service, ServiceCoverageArea } from '../types'; // Asegúrate que ServiceCoverageArea esté en tus tipos
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-toastify';
import { AppUser } from '../contexts/AuthContext';
import { geocodeAddressNominatim, GeocodingResult } from '../utils/geocoding'; // Importar la utilidad

interface ImageUpload {
  file: File;
  preview: string;
  isMain?: boolean;
}

interface ServiceFormData {
  name: string;
  categoryId: string;
  subcategoryId: string;
  shortDescription: string;
  description: string;
  price: string;
  features: string[];
  service_type: 'fixed_location' | 'delivery_area' | 'multiple_areas';
  specific_address: string; // Siempre presente, usado para fixed_location y como base para delivery_area
  base_latitude?: string;
  base_longitude?: string;
  delivery_radius_km?: string;
  coverage_areas: Array<Partial<ServiceCoverageArea & { temp_id: string }>>;
  default_total_capacity: string;
  default_is_available: boolean;
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
  const [isGeocoding, setIsGeocoding] = useState(false); // Estado para geocodificación

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
    specific_address: '', // Dirección base para fixed_location y delivery_area
    base_latitude: '',
    base_longitude: '',
    delivery_radius_km: '',
    coverage_areas: [],
    default_total_capacity: '1',
    default_is_available: true,
  };

  const [serviceFormData, setServiceFormData] = useState<ServiceFormData>(initialServiceFormData);
  const [myServices, setMyServices] = useState<Service[]>([]);

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
          .select('*, service_coverage_areas(*)')
          .eq('provider_id', user.id);

        if (servicesError) {
          toast.error(`Error al cargar tus servicios: ${servicesError.message}`);
          return;
        }

        if (servicesData) {
          const servicesWithImages = await Promise.all(
            servicesData.map(async (service) => {
              const { data: mainImageData } = await supabase
                .from('service_images')
                .select('storage_path')
                .eq('service_id', service.id)
                .eq('is_main_image', true)
                .single();

              let publicUrl = 'https://placehold.co/300x200?text=Sin+Imagen';
              if (mainImageData?.storage_path) {
                const { data: urlData } = supabase.storage
                  .from('service-images')
                  .getPublicUrl(mainImageData.storage_path);
                if (urlData) publicUrl = urlData.publicUrl;
              }
              return { ...service, imageUrl: publicUrl, gallery: [] };
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
    const maxSize = 5 * 1024 * 1024;
    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        toast.error('El archivo es demasiado grande. El tamaño máximo es 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (eventReader) => {
        const preview = eventReader.target?.result as string;
        const imageUpload: ImageUpload = { file, preview, isMain };
        if (isMain) setMainImage(imageUpload);
        else setGalleryImages(prev => prev.length < 5 ? [...prev, imageUpload] : (toast.warn('Máximo 5 imágenes en la galería'), prev));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number, isMain: boolean = false) => {
    if (isMain) setMainImage(null);
    else setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return toast.error('Usuario no autenticado.');
    if (isSubmittingProfile) return;
    setIsSubmittingProfile(true);
    try {
      const updates: Partial<AppUser> = { name: formData.name, phone: formData.phone, avatar_url: formData.avatar_url || null };
      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) throw error;
      toast.success('Perfil actualizado!');
      if(setAuthUser) setAuthUser(prev => prev ? ({...prev, ...updates}) : null);
    } catch (error: any) { toast.error(`Error: ${error.message}`); }
    finally { setIsSubmittingProfile(false); }
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
  const handleRemoveFeature = (index: number) => setServiceFormData(prev => ({ ...prev, features: serviceFormData.features.filter((_, i) => i !== index) }));

  const handleAddCoverageArea = () => setServiceFormData(prev => ({ ...prev, coverage_areas: [...prev.coverage_areas, { temp_id: Date.now().toString(), area_name: '', city: '', state: '', postal_code: '' }]}));
  const handleCoverageAreaChange = (temp_id: string, field: keyof Omit<ServiceCoverageArea, 'id' | 'service_id' | 'created_at' | 'updated_at' | 'country'>, value: string) => setServiceFormData(prev => ({ ...prev, coverage_areas: prev.coverage_areas.map(area => area.temp_id === temp_id ? { ...area, [field]: value } : area)}));
  const handleRemoveCoverageArea = (temp_id: string) => setServiceFormData(prev => ({ ...prev, coverage_areas: prev.coverage_areas.filter(area => area.temp_id !== temp_id)}));

  const handleGeocodeServiceAddress = async () => {
    const addressToGeocode = serviceFormData.specific_address;
    if (!addressToGeocode) {
      toast.warn('Por favor, ingresa una dirección para geocodificar.');
      return;
    }
    setIsGeocoding(true);
    toast.info('Obteniendo coordenadas...');
    const result = await geocodeAddressNominatim(addressToGeocode);
    setIsGeocoding(false);
    if (result) {
      toast.success(`Coordenadas obtenidas: ${result.displayName.substring(0,50)}...`);
      setServiceFormData(prev => ({
        ...prev,
        base_latitude: result.latitude.toString(),
        base_longitude: result.longitude.toString(),
      }));
    } else {
      toast.error('No se pudieron obtener las coordenadas.');
      setServiceFormData(prev => ({ ...prev, base_latitude: '', base_longitude: ''}));
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !user.name || !user.email) return toast.error("Perfil incompleto.");
    setIsSubmittingService(true);
    try {
      if (!mainImage) {setIsSubmittingService(false); return toast.error('Imagen principal requerida.');}
      const mainImageFileName = `${user.id}/${Date.now()}_${mainImage.file.name.replace(/\s/g, '_')}`;
      const { data: mainUploadData, error: mainImageError } = await supabase.storage.from('service-images').upload(mainImageFileName, mainImage.file);
      if (mainImageError) throw mainImageError;

      const galleryStoragePaths: string[] = await Promise.all(galleryImages.map(async img => {
        const fName = `${user.id}/${Date.now()}_${img.file.name.replace(/\s/g, '_')}`;
        const { data, error } = await supabase.storage.from('service-images').upload(fName, img.file);
        if (error) throw error;
        return data.path;
      }));

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
        provider_phone: user.phone,
        features: serviceFormData.features.filter(f => f.trim() !== ''),
        service_type: serviceFormData.service_type,
        specific_address: (serviceFormData.service_type === 'fixed_location' || serviceFormData.service_type === 'delivery_area') ? serviceFormData.specific_address : null,
        base_latitude: serviceFormData.base_latitude ? parseFloat(serviceFormData.base_latitude) : null,
        base_longitude: serviceFormData.base_longitude ? parseFloat(serviceFormData.base_longitude) : null,
        delivery_radius_km: serviceFormData.service_type === 'delivery_area' && serviceFormData.delivery_radius_km ? parseInt(serviceFormData.delivery_radius_km, 10) : null,
        is_approved: false, rating: 0, review_count: 0,
      };
      const { data: newService, error: serviceError } = await supabase.from('services').insert(serviceToInsert).select().single();
      if (serviceError) throw serviceError;
      if (!newService) throw new Error("Servicio no creado.");

      const serviceImagesToInsert = [{ service_id: newService.id, storage_path: mainUploadData.path, is_main_image: true, position: 0 }, ...galleryStoragePaths.map((path, i) => ({ service_id: newService.id, storage_path: path, is_main_image: false, position: i + 1 }))];
      const { error: serviceImagesError } = await supabase.from('service_images').insert(serviceImagesToInsert);
      if (serviceImagesError) throw serviceImagesError;

      if (serviceFormData.service_type === 'multiple_areas' && serviceFormData.coverage_areas.length > 0) {
        const coverageAreasToInsert = serviceFormData.coverage_areas.map(a => ({ service_id: newService.id, area_name: a.area_name!, city: a.city, state: a.state, postal_code: a.postal_code }));
        const { error: coverageError } = await supabase.from('service_coverage_areas').insert(coverageAreasToInsert);
        if (coverageError) throw coverageError;
      }

      if (serviceFormData.default_is_available && serviceFormData.default_total_capacity) {
        const availabilityEntries: { service_id: string; date: string; total_capacity: number; booked_capacity: number; is_available: boolean; }[] = [];
        const startDate = new Date(); startDate.setHours(0,0,0,0);
        const endDate = new Date(startDate); endDate.setFullYear(startDate.getFullYear() + 1);
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          availabilityEntries.push({ service_id: newService.id, date: new Date(d).toISOString().split('T')[0], total_capacity: parseInt(serviceFormData.default_total_capacity, 10), booked_capacity: 0, is_available: true });
        }
        if (availabilityEntries.length > 0) {
          const { error: availabilityError } = await supabase.from('service_availability').insert(availabilityEntries);
          if (availabilityError) toast.warn("Servicio creado, pero falló la disponibilidad por defecto.");
        }
      }

      toast.success('Servicio publicado! Pendiente de aprobación.');
      setShowServiceForm(false); setMainImage(null); setGalleryImages([]); setServiceFormData(initialServiceFormData);
      const { data: updatedServicesData } = await supabase.from('services').select('*, service_coverage_areas(*)').eq('provider_id', user.id);
      if (updatedServicesData) setMyServices(updatedServicesData as unknown as Service[]);
    } catch (error: any) {
      console.error('[ProfilePage] Error creating service:', error);
      toast.error(`Error al crear el servicio: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsSubmittingService(false);
    }
  };

  if (!isAuthenticated || !user) return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;

  return (
    <div className="bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <div className="flex space-x-4">
            <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-lg ${activeTab === 'profile' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>Perfil</button>
            <button onClick={() => setActiveTab('services')} className={`px-4 py-2 rounded-lg ${activeTab === 'services' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>Mis Servicios</button>
          </div>
        </div>

        {activeTab === 'profile' ? (
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
            {/* ... (Formulario de perfil JSX como antes) ... */}
            <div className="flex items-center mb-8">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center"><User size={40} className="text-primary-500" /></div>
            <div className="ml-6"><h2 className="text-2xl font-bold">{formData.name || ''}</h2><p className="text-gray-600">{formData.email || ''}</p></div>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div><label htmlFor="profileName" className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><User size={18} /></span><input type="text" id="profileName" value={formData.name || ''}  onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"/></div></div>
            <div><label htmlFor="profileEmail" className="block text-sm font-medium text-gray-700 mb-1">Correo (no editable)</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={18} /></span><input type="email" id="profileEmail" value={formData.email || ''} readOnly disabled className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed focus:outline-none focus:ring-0"/></div></div>
            <div><label htmlFor="profilePhone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={18} /></span><input type="tel" id="profilePhone" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500" placeholder="Ej. 5512345678"/></div></div>
            <div><label htmlFor="profileAvatarUrl" className="block text-sm font-medium text-gray-700 mb-1">URL del Avatar</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><ImageIcon size={18} /></span><input type="url" id="profileAvatarUrl" value={formData.avatar_url || ''} onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500" placeholder="https://ejemplo.com/imagen.png"/></div></div>
            <div className="pt-6 border-t border-gray-200"><button type="submit" disabled={isSubmittingProfile} className="w-full sm:w-auto bg-primary-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-70 flex items-center justify-center">{isSubmittingProfile ? ( <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Guardando...</> ) : ( 'Guardar Cambios' )}</button></div>
          </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Mis Servicios Publicados</h2>
              <button onClick={() => { setServiceFormData(initialServiceFormData); setShowServiceForm(true);}} className="flex items-center bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"><Plus size={20} className="mr-2" />Nuevo Servicio</button>
            </div>

            {showServiceForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Publicar Nuevo Servicio</h3>
                    <button onClick={() => setShowServiceForm(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                  </div>
                  <form onSubmit={handleServiceSubmit} className="space-y-4 text-sm"> {/* Reducido space-y y tamaño de texto */}
                    {/* Campos básicos del servicio */}
                    <div><label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-0.5">Nombre del Servicio*</label><input type="text" name="name" id="name" value={serviceFormData.name} onChange={handleServiceInputChange} required className="w-full p-2 border border-gray-300 rounded-md text-sm"/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                        <div><label htmlFor="categoryId" className="block text-xs font-medium text-gray-700 mb-0.5">Categoría*</label><select name="categoryId" id="categoryId" value={serviceFormData.categoryId} onChange={e => setServiceFormData(prev => ({...prev, categoryId: e.target.value, subcategoryId: ''}))} required className="w-full p-2 border border-gray-300 rounded-md text-sm"><option value="">Seleccionar</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><label htmlFor="subcategoryId" className="block text-xs font-medium text-gray-700 mb-0.5">Subcategoría*</label><select name="subcategoryId" id="subcategoryId" value={serviceFormData.subcategoryId} onChange={handleServiceInputChange} required disabled={!serviceFormData.categoryId} className="w-full p-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"><option value="">Seleccionar</option>{categories.find(c=>c.id===serviceFormData.categoryId)?.subcategories.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                    </div>
                    <div><label htmlFor="shortDescription" className="block text-xs font-medium text-gray-700 mb-0.5">Descripción Corta*</label><input type="text" name="shortDescription" id="shortDescription" value={serviceFormData.shortDescription} onChange={handleServiceInputChange} required maxLength={150} className="w-full p-2 border border-gray-300 rounded-md text-sm"/></div>
                    <div><label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-0.5">Descripción Detallada*</label><textarea name="description" id="description" value={serviceFormData.description} onChange={handleServiceInputChange} required rows={3} className="w-full p-2 border border-gray-300 rounded-md text-sm"></textarea></div>
                    <div><label htmlFor="price" className="block text-xs font-medium text-gray-700 mb-0.5">Precio (MXN)</label><input type="number" name="price" id="price" value={serviceFormData.price} onChange={handleServiceInputChange} placeholder="Dejar vacío para 'Cotizar'" min="0" step="0.01" className="w-full p-2 border border-gray-300 rounded-md text-sm"/></div>

                    {/* Tipo de Ubicación y campos condicionales */}
                    <div>
                      <label htmlFor="service_type" className="block text-xs font-medium text-gray-700 mb-0.5">Tipo de Ubicación*</label>
                      <select name="service_type" id="service_type" value={serviceFormData.service_type} onChange={handleServiceInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm">
                        <option value="fixed_location">Ubicación Fija</option>
                        <option value="delivery_area">Servicio a Domicilio (Radio)</option>
                        <option value="multiple_areas">Múltiples Áreas de Cobertura</option>
                      </select>
                    </div>

                    {(serviceFormData.service_type === 'fixed_location' || serviceFormData.service_type === 'delivery_area') && (
                      <div className="p-3 border rounded-md bg-gray-50">
                        <label htmlFor="specific_address" className="block text-xs font-medium text-gray-700 mb-1">
                          {serviceFormData.service_type === 'fixed_location' ? 'Dirección del Servicio*' : 'Dirección Base para Domicilio*'}
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-grow">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"><MapPin size={16}/></span>
                            <input type="text" name="specific_address" value={serviceFormData.specific_address} onChange={handleServiceInputChange} required className="w-full pl-8 p-2 border border-gray-300 rounded-md text-sm" placeholder="Calle, No., Colonia, Ciudad"/>
                          </div>
                          <button type="button" onClick={handleGeocodeServiceAddress} disabled={isGeocoding || !serviceFormData.specific_address} className="p-2 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center"><SearchCheck size={14} className="mr-1"/>Coords</button>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 mt-2">
                          <div><label htmlFor="base_latitude" className="block text-xs font-medium text-gray-500 mb-0.5">Latitud</label><input type="number" name="base_latitude" value={serviceFormData.base_latitude} onChange={handleServiceInputChange} step="any" className="w-full p-2 border bg-gray-100 border-gray-300 rounded-md text-sm" readOnly/></div>
                          <div><label htmlFor="base_longitude" className="block text-xs font-medium text-gray-500 mb-0.5">Longitud</label><input type="number" name="base_longitude" value={serviceFormData.base_longitude} onChange={handleServiceInputChange} step="any" className="w-full p-2 border bg-gray-100 border-gray-300 rounded-md text-sm" readOnly/></div>
                        </div>
                      </div>
                    )}

                    {serviceFormData.service_type === 'delivery_area' && (
                      <div><label htmlFor="delivery_radius_km" className="block text-xs font-medium text-gray-700 mb-0.5">Radio de Cobertura (km)*</label><input type="number" name="delivery_radius_km" value={serviceFormData.delivery_radius_km} onChange={handleServiceInputChange} required min="1" className="w-full p-2 border border-gray-300 rounded-md text-sm" placeholder="Ej. 10"/></div>
                    )}

                    {serviceFormData.service_type === 'multiple_areas' && (
                      <div className="space-y-2 p-3 border rounded-md bg-gray-50">
                        <h4 className="text-xs font-medium text-gray-700">Áreas de Cobertura Específicas</h4>
                        {serviceFormData.coverage_areas.map((area, index) => (
                          <div key={area.temp_id} className="p-2 border rounded bg-white space-y-1">
                            <div className="flex justify-between items-center"><p className="text-xs font-medium">Área {index + 1}</p><button type="button" onClick={() => handleRemoveCoverageArea(area.temp_id!)} className="text-error-500 hover:text-error-700"><Trash2 size={14}/></button></div>
                            <input type="text" placeholder="Nombre del Área (ej. Polanco)" value={area.area_name} onChange={(e) => handleCoverageAreaChange(area.temp_id!, 'area_name', e.target.value)} required className="w-full text-xs p-1.5 border rounded-md"/>
                            <div className="grid grid-cols-3 gap-1">
                              <input type="text" placeholder="Ciudad" value={area.city} onChange={(e) => handleCoverageAreaChange(area.temp_id!, 'city', e.target.value)} className="w-full text-xs p-1.5 border rounded-md"/>
                              <input type="text" placeholder="Estado" value={area.state} onChange={(e) => handleCoverageAreaChange(area.temp_id!, 'state', e.target.value)} className="w-full text-xs p-1.5 border rounded-md"/>
                              <input type="text" placeholder="CP" value={area.postal_code} onChange={(e) => handleCoverageAreaChange(area.temp_id!, 'postal_code', e.target.value)} className="w-full text-xs p-1.5 border rounded-md"/>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={handleAddCoverageArea} className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center"><Plus size={14} className="mr-1"/> Agregar Área</button>
                      </div>
                    )}

                    {/* Disponibilidad por defecto */}
                     <div className="p-3 border rounded-md bg-gray-50">
                        <h4 className="text-xs font-medium text-gray-700 mb-1">Disponibilidad por Defecto</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-center">
                             <div><label htmlFor="default_total_capacity" className="block text-xs font-medium text-gray-700 mb-0.5">Capacidad por Día</label><input type="number" name="default_total_capacity" id="default_total_capacity" value={serviceFormData.default_total_capacity} onChange={handleServiceInputChange} required min="1" className="w-full p-2 border border-gray-300 rounded-md text-sm" placeholder="Ej. 1"/></div>
                            <div className="pt-3"><input type="checkbox" name="default_is_available" id="default_is_available" checked={serviceFormData.default_is_available} onChange={handleServiceInputChange} className="h-3.5 w-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/><label htmlFor="default_is_available" className="ml-2 text-xs text-gray-900">Disponible por defecto</label></div>
                        </div>
                    </div>

                    {/* Imágenes y Features */}
                    {/* ... (JSX para imágenes y features sin cambios, sólo asegurarse que onChange llame a handleServiceInputChange o la función específica) ... */}
                    <div> <label className="block text-xs font-medium text-gray-700 mb-1">Imagen Principal*</label><div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-500"><input type="file" accept="image/jpeg,image/png" onChange={(e) => handleImageSelect(e, true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>{mainImage ? (   <div className="relative group">     <img src={mainImage?.preview} alt="Preview" className="w-full h-32 object-cover rounded-lg"/>     <button type="button" onClick={() => removeImage(0, true)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100">       <Trash2 size={14} className="text-error-500"/>     </button>   </div> ) : (   <div className="text-center">     <Upload className="mx-auto h-8 w-8 text-gray-400" />     <p className="mt-1 text-xs text-gray-600">Clic o arrastra (Max 5MB)</p>   </div> )}</div></div>
                    <div> <label className="block text-xs font-medium text-gray-700 mb-1">Galería (hasta 5)</label><div className="grid grid-cols-3 gap-2">{galleryImages.map((img, idx) => <div key={idx} className="relative group"><img src={img.preview} alt={`Galería ${idx+1}`} className="w-full h-20 object-cover rounded-lg"/><button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100"><Trash2 size={12} className="text-error-500"/></button></div>)}{galleryImages.length < 5 && <label className="border-2 border-dashed rounded-lg p-4 h-20 flex items-center justify-center cursor-pointer hover:border-primary-500"><input type="file" accept="image/jpeg,image/png" multiple onChange={handleImageSelect} className="absolute inset-0 w-full h-full opacity-0"/><div className="text-center"><ImageIcon className="mx-auto h-6 w-6 text-gray-400"/><p className="mt-1 text-xs text-gray-500">Añadir</p></div></label>}</div></div>
                    <div> <label className="block text-xs font-medium text-gray-700 mb-1">Características</label>{serviceFormData.features.map((feat, idx) => <div key={idx} className="flex gap-1 mb-1"><input type="text" value={feat} onChange={e=>handleFeatureChange(idx, e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-md text-sm" placeholder={`Característica ${idx+1}`}/>{serviceFormData.features.length > 1 && <button type="button" onClick={()=>handleRemoveFeature(idx)} className="p-1.5 text-gray-400 hover:text-error-500"><Trash2 size={14}/></button>}</div>)}<button type="button" onClick={handleAddFeature} className="text-xs text-primary-500 hover:text-primary-600 font-medium">+ Agregar característica</button></div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button type="button" onClick={() => setShowServiceForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                      <button type="submit" disabled={isSubmittingService} className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-70 flex items-center">{isSubmittingService ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Publicando...</> : 'Publicar Servicio'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {myServices.length === 0 && !showServiceForm ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center"> /* ... (Mensaje "No tienes servicios") ... */ </div>
            ) : !showServiceForm && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ... (Renderizado de myServices como antes) ... */}
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
                            <button onClick={(e) => { e.preventDefault(); toast.info('Función de editar próximamente');}} className="p-2 text-gray-500 hover:text-primary-500 bg-gray-100 hover:bg-gray-200 rounded-md" aria-label="Editar servicio"><Edit size={18} /></button>
                            <button onClick={(e) => { e.preventDefault(); toast.info('Función de eliminar próximamente');}} className="p-2 text-gray-500 hover:text-error-500 bg-gray-100 hover:bg-gray-200 rounded-md" aria-label="Eliminar servicio"><Trash2 size={18} /></button>
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
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Plus, Package, Star, Edit, Trash2, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { categories } from '../data/categories'; //
import { Service } from '../types'; //
import { createClient } from '@supabase/supabase-js'; //
import { toast } from 'react-toastify';
import { AppUser } from '../contexts/AuthContext'; //

interface ImageUpload {
  file: File;
  preview: string;
  isMain?: boolean;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, setUser: setAuthUser } = useAuth(); //
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

  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    categoryId: '',
    subcategoryId: '',
    shortDescription: '',
    description: '',
    price: '',
    features: [''],
  });
  const [myServices, setMyServices] = useState<Service[]>([]);

  useEffect(() => {
    if (user) {
      console.log('[ProfilePage] useEffect updating formData from user context:', user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]); //

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
            if (prev.length >= 5) { //
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

  useEffect(() => {
  if (!isAuthenticated) {
    console.log('[ProfilePage] Not authenticated, navigating to home.');
    navigate('/');
    return;
  }
  if (user?.id) {
    document.title = 'Mi Perfil | CABETG Party Planner';
    const fetchServices = async () => {
      console.log(`[ProfilePage] Fetching services for provider_id: ${user.id}`);
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', user.id);

      if (servicesError) {
        console.error('[ProfilePage] Error fetching services:', servicesError);
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

            // Use a more reliable placeholder
            let publicUrl = 'https://placehold.co/300x200?text=Sin+Imagen';
            if (mainImageError) {
              console.warn(`[ProfilePage] Error fetching main image for service ${service.id}:`, mainImageError.message);
            } else if (mainImageData && mainImageData.storage_path) {
              const { data: urlData } = supabase.storage
                .from('service-images') // Ensure this is your bucket name
                .getPublicUrl(mainImageData.storage_path);
              if (urlData) {
                publicUrl = urlData.publicUrl;
              } else {
                 console.warn(`[ProfilePage] Could not get public URL for ${mainImageData.storage_path}`);
              }
            }
            // Assuming 'imageUrl' in your Service type is meant to hold the final display URL
            return { ...service, imageUrl: publicUrl, gallery: [] }; // Add gallery: [] if your type requires it and it's not fetched here
          })
        );
        console.log('[ProfilePage] Services fetched with images:', servicesWithImages);
        setMyServices(servicesWithImages as Service[]);
      } else {
        setMyServices([]);
      }
    };
    fetchServices();
  }
}, [isAuthenticated, navigate, user, supabase]); // Add supabase to dependency array if it's not stable

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id) {
      toast.error('Usuario no autenticado. No se puede actualizar el perfil.');
      return;
    }
    
    if (isSubmittingProfile) {
        console.warn('[ProfilePage] Profile update already in progress. Aborting.');
        return;
    }
    
    console.log('[ProfilePage] Setting isSubmittingProfile to true.');
    setIsSubmittingProfile(true); 

    try {
      const updates: Partial<AppUser> = {
        name: formData.name,
        phone: formData.phone,
        avatar_url: formData.avatar_url ? formData.avatar_url : null,
        // No enviar 'updated_at' desde el cliente; deja que la base de datos lo maneje.
      };

      console.log('[ProfilePage] Attempting to update profile for user ID:', user.id, 'with data:', updates);

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select(); 

      console.log('[ProfilePage] Supabase update call finished.');
      console.log('[ProfilePage] Supabase update response data:', data);
      console.log('[ProfilePage] Supabase update response error:', error);

      if (error) {
        console.error('[ProfilePage] Error updating profile in Supabase:', error);
        toast.error(`Error al actualizar el perfil: ${error.message}`);
      } else {
        toast.success('Perfil actualizado con éxito!');
        console.log('[ProfilePage] Profile updated successfully in Supabase.');
      }
    } catch (errorCatch) { 
      console.error('[ProfilePage] Catch block: Unexpected error updating profile:', errorCatch);
      toast.error('Ocurrió un error inesperado al actualizar el perfil.');
    } finally {
      console.log('[ProfilePage] handleProfileSubmit finally block. Setting isSubmittingProfile to false.');
      setIsSubmittingProfile(false); 
    }
  };
  
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id || !user.name || !user.email) { //
        toast.error("Debes estar autenticado y tu perfil debe estar completo para crear un servicio."); //
        return;
    }
    setIsSubmittingService(true); //
    try {
      if (!mainImage) { //
        toast.error('Por favor selecciona una imagen principal'); //
        setIsSubmittingService(false); //
        return;
      }
      const mainImageFileName = `${user.id}/${Date.now()}_${mainImage.file.name.replace(/\s/g, '_')}`; //
      const { data: mainUploadData, error: mainImageError } = await supabase.storage //
        .from('service-images') //
        .upload(mainImageFileName, mainImage.file); //
      if (mainImageError) throw mainImageError; //
      const mainImageStoragePath = mainUploadData.path; //

      const galleryStoragePaths: string[] = []; //
      for (const image of galleryImages) { //
        const galleryImageFileName = `${user.id}/${Date.now()}_${image.file.name.replace(/\s/g, '_')}`; //
        const { data: galleryUploadData, error: galleryError } = await supabase.storage //
          .from('service-images') //
          .upload(galleryImageFileName, image.file); //
        if (galleryError) throw galleryError; //
        galleryStoragePaths.push(galleryUploadData.path); //
      }

      const serviceToInsert = { //
        name: serviceFormData.name, //
        category_id: serviceFormData.categoryId, //
        subcategory_id: serviceFormData.subcategoryId, //
        short_description: serviceFormData.shortDescription, //
        description: serviceFormData.description, //
        price: serviceFormData.price ? parseFloat(serviceFormData.price) : null, //
        provider_id: user.id, //
        provider_name: user.name, //
        provider_email: user.email, //
        features: serviceFormData.features.filter(f => f.trim() !== ''), //
        is_approved: false, rating: 0, review_count: 0 //
      };
      const { data: newService, error: serviceError } = await supabase //
        .from('services') //
        .insert(serviceToInsert).select().single(); //
      if (serviceError) throw serviceError; //
      if (!newService) throw new Error("No se pudo obtener el servicio creado."); //

      const serviceImagesToInsert = [{ //
        service_id: newService.id, storage_path: mainImageStoragePath, //
        is_main_image: true, position: 0 //
      }];
      galleryStoragePaths.forEach((path, index) => { //
        serviceImagesToInsert.push({ //
          service_id: newService.id, storage_path: path, //
          is_main_image: false, position: index + 1 //
        });
      });
      const { error: serviceImagesError } = await supabase.from('service_images').insert(serviceImagesToInsert); //
      if (serviceImagesError) throw serviceImagesError; //

      toast.success('Servicio publicado con éxito! Pendiente de aprobación.'); //
      setShowServiceForm(false); setMainImage(null); setGalleryImages([]); //
      setServiceFormData({ //
        name: '', categoryId: '', subcategoryId: '', shortDescription: '', //
        description: '', price: '', features: [''], //
      });
      if (user?.id) { //
            const { data: updatedServicesData, error: fetchError } = await supabase //
            .from('services').select('*').eq('provider_id', user.id); //
            if (fetchError) console.error('[ProfilePage] Error fetching updated services after creation:', fetchError); //
            else if (updatedServicesData) setMyServices(updatedServicesData as Service[]); //
      }
    } catch (error: any) {
      console.error('[ProfilePage] Error creating service:', error);
      toast.error(`Error al crear el servicio: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsSubmittingService(false); //
    }
  };

  const handleAddFeature = () => {
    setServiceFormData(prev => ({ ...prev, features: [...prev.features, ''] })); //
  };
  
  if (!isAuthenticated || !user) { //
    console.log('[ProfilePage] Rendering loading/redirect: isAuthenticated:', isAuthenticated, 'user:', user); //
    return <div className="flex justify-center items-center min-h-screen">Cargando perfil...</div>; //
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
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
                {isSubmittingProfile ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Guardando...
                    </>
                ) : (
                    'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Mis Servicios Publicados</h2>
              <button
                onClick={() => setShowServiceForm(true)}
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
                    <button
                      onClick={() => setShowServiceForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleServiceSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Servicio *
                      </label>
                      <input
                        type="text"
                        id="serviceName"
                        required
                        value={serviceFormData.name}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="serviceCategory" className="block text-sm font-medium text-gray-700 mb-1">
                          Categoría *
                        </label>
                        <select
                          id="serviceCategory"
                          required
                          value={serviceFormData.categoryId}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, categoryId: e.target.value, subcategoryId: '' })} 
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                        >
                          <option value="">Seleccionar categoría</option>
                          {categories.map(category => ( //
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="serviceSubcategory" className="block text-sm font-medium text-gray-700 mb-1">
                          Subcategoría *
                        </label>
                        <select
                          id="serviceSubcategory"
                          required
                          disabled={!serviceFormData.categoryId}
                          value={serviceFormData.subcategoryId}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, subcategoryId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:bg-gray-100"
                        >
                          <option value="">Seleccionar subcategoría</option>
                          {categories //
                            .find(cat => cat.id === serviceFormData.categoryId)
                            ?.subcategories.map(subcat => ( //
                              <option key={subcat.id} value={subcat.id}>
                                {subcat.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="serviceShortDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción Corta * (Máx. 100 caracteres)
                      </label>
                      <input
                        type="text"
                        id="serviceShortDescription"
                        required
                        value={serviceFormData.shortDescription}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, shortDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label htmlFor="serviceDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción Detallada *
                      </label>
                      <textarea
                        id="serviceDescription"
                        required
                        value={serviceFormData.description}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label htmlFor="servicePrice" className="block text-sm font-medium text-gray-700 mb-1">
                        Precio (opcional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          id="servicePrice"
                          value={serviceFormData.price}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                          placeholder="Dejar vacío para 'Solicitar Cotización'"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imagen Principal * (Max 5MB, JPG/PNG)
                      </label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
                        <input
                          type="file"
                          accept="image/jpeg, image/png"
                          onChange={(e) => handleImageSelect(e, true)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          aria-label="Subir imagen principal"
                        />
                        {mainImage ? (
                          <div className="relative group">
                            <img
                              src={mainImage.preview}
                              alt="Vista previa imagen principal"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(0, true)}
                              className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Eliminar imagen principal"
                            >
                              <Trash2 size={18} className="text-error-500" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              Haz clic para subir o arrastra una imagen aquí
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Galería de Imágenes (Máx. 5 imágenes, Max 5MB c/u, JPG/PNG)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {galleryImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image.preview}
                              alt={`Imagen de galería ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label={`Eliminar imagen de galería ${index + 1}`}
                            >
                              <Trash2 size={16} className="text-error-500" />
                            </button>
                          </div>
                        ))}
                        {galleryImages.length < 5 && (
                          <label className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors h-32 flex items-center justify-center cursor-pointer">
                            <input
                              type="file"
                              accept="image/jpeg, image/png"
                              multiple
                              onChange={handleImageSelect}
                              className="absolute inset-0 w-full h-full opacity-0"
                              aria-label="Agregar imágenes a galería"
                            />
                            <div className="text-center">
                              <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                              <p className="mt-1 text-xs text-gray-500">
                                Agregar imagen(es)
                              </p>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Características (una por línea)
                      </label>
                      {serviceFormData.features.map((feature, index) => ( //
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => {
                              const newFeatures = [...serviceFormData.features]; //
                              newFeatures[index] = e.target.value; //
                              setServiceFormData({ ...serviceFormData, features: newFeatures }); //
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                            placeholder={`Característica ${index + 1}`}
                          />
                          {serviceFormData.features.length > 1 && ( //
                            <button
                                type="button"
                                onClick={() => { //
                                const newFeatures = serviceFormData.features.filter((_, i) => i !== index); //
                                setServiceFormData({ ...serviceFormData, features: newFeatures }); //
                                }}
                                className="p-2 text-gray-400 hover:text-error-500"
                                aria-label={`Eliminar característica ${index + 1}`}
                            >
                                <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                      >
                        + Agregar otra característica
                      </button>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <button
                        type="button"
                        onClick={() => setShowServiceForm(false)}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingService} //
                        className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-70 flex items-center justify-center"
                      >
                        {isSubmittingService ? ( //
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Publicando...
                            </>
                        ) : (
                            'Publicar Servicio'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {myServices.length === 0 && !showServiceForm ? ( //
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="text-primary-500" size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2">No tienes servicios publicados</h3>
                <p className="text-gray-600 mb-6">
                  Comienza a ofrecer tus servicios haciendo clic en "Nuevo Servicio"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myServices.map(service => {
  const displayImageUrl = service.imageUrl || 'https://placehold.co/300x200?text=Sin+Imagen';
  return (
    <Link key={service.id} to={`/service/${service.id}`} className="block group"> {/* Añade el Link aquí */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden h-full flex flex-col group-hover:shadow-lg transition-shadow duration-300"> {/* Añade clases para hover effect si deseas */}
        <img
          src={displayImageUrl}
          alt={service.name}
          className="w-full h-48 object-cover"
          onError={(e) => (e.currentTarget.src = 'https://placehold.co/300x200?text=Error+Img')}
        />
        <div className="p-6 flex flex-col flex-grow"> {/* flex-grow para que el contenido ocupe espacio */}
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-500 transition-colors">{service.name}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">{service.shortDescription}</p> {/* flex-grow para la descripción */}
          <div className="flex items-center justify-between text-sm mt-auto"> {/* mt-auto para empujar al fondo */}
            <div className="flex items-center">
              <Star className="text-warning-500 fill-current" size={18} />
              <span className="ml-1 font-medium">{service.rating || 0}</span>
              <span className="mx-1 text-gray-400">·</span>
              <span className="text-gray-600">({service.reviewCount || 0} reseñas)</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ (service as any).is_approved ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
              {(service as any).is_approved ? 'Aprobado' : 'Pendiente'}
            </span>
          </div>
          <div className="mt-4 flex space-x-2">
            <button 
              onClick={(e) => {
                e.preventDefault(); // Prevenir la navegación del Link padre
                // Lógica para editar el servicio aquí (ej. abrir un modal)
                console.log('Editar servicio:', service.id);
              }}
              className="p-2 text-gray-500 hover:text-primary-500 bg-gray-100 hover:bg-gray-200 rounded-md" 
              aria-label="Editar servicio"
            >
              <Edit size={18} />
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault(); // Prevenir la navegación del Link padre
                // Lógica para eliminar el servicio aquí
                console.log('Eliminar servicio:', service.id);
              }}
              className="p-2 text-gray-500 hover:text-error-500 bg-gray-100 hover:bg-gray-200 rounded-md" 
              aria-label="Eliminar servicio"
            >
              <Trash2 size={18} />
            </button>
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
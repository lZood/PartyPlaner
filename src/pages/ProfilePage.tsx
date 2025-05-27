import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Plus, Package, Star, Edit, Trash2, X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { categories } from '../data/categories';
import { Service } from '../types'; // Asegúrate que esta importación sea correcta
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-toastify';

interface ImageUpload {
  file: File;
  preview: string;
  isMain?: boolean;
}

// Define AppUser aquí si no lo tienes globalmente o importado de AuthContext
// Esta definición debe coincidir con la que uses en AuthContext (id, email, name)
if (setAuthUser && user) {
  const updatedUserData: AppUser = { // Tipar explícitamente
    id: user.id,
    email: user.email, // El email no se modifica desde el formulario
    name: formData.name,
    phone: formData.phone,
    // avatar_url: user.avatar_url, // Mantener si no se actualiza aquí
  };
  console.log('[ProfilePage] Calling setAuthUser with:', updatedUserData);
  setAuthUser(updatedUserData);
}


const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, setUser: setAuthUser } = useAuth(); // setUser de AuthContext
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'services'>('profile');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [mainImage, setMainImage] = useState<ImageUpload | null>(null);
  const [galleryImages, setGalleryImages] = useState<ImageUpload[]>([]);
  // const [uploadProgress, setUploadProgress] = useState(0); // Comentado si no se usa aún
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingService, setIsSubmittingService] = useState(false);


  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    // avatar_url: '', // Si vas a manejar avatar_url
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
  const [myServices, setMyServices] = useState<Service[]>([]); // Asumiendo que Service es tu tipo correcto

  // Efecto para inicializar y actualizar el formulario cuando el usuario cambie
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: (user as any).phone || '', // Asumiendo que phone puede estar en user
        // avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);


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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    } else {
        document.title = 'Mi Perfil | CABETG Party Planner';
        // Fetch user's services
        const fetchServices = async () => {
          if (!user?.id) return; // Asegurarse que user.id existe
          
          console.log(`Workspaceing services for provider_id: ${user.id}`);
          const { data: servicesData, error } = await supabase
            .from('services')
            .select('*')
            .eq('provider_id', user.id);

          if (error) {
            console.error('Error fetching services:', error);
            toast.error(`Error al cargar tus servicios: ${error.message}`);
            return;
          }
          console.log('Services fetched:', servicesData);
          // Asegúrate de que los datos coinciden con la interfaz Service
          // Puede que necesites transformar los datos si los nombres de columna son diferentes (ej. short_description vs shortDescription)
          setMyServices(servicesData as Service[]);
        };

        if (user?.id) {
          fetchServices();
        }
    }
  }, [isAuthenticated, navigate, user?.id]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.id) {
      toast.error('Usuario no autenticado.');
      return;
    }
    setIsSubmittingProfile(true);
    try {
      // Solo actualizamos 'name' y 'phone'. 'email' no se envía para actualización.
      // 'avatar_url' se manejaría por separado si fuera un campo de subida de archivo.
      const updates = {
        name: formData.name,
        phone: formData.phone,
        // Si tienes avatar_url y lo manejas como un string:
        // avatar_url: formData.avatar_url,
        updated_at: new Date().toISOString(), // Actualizar timestamp
      };

      console.log('Updating profile for user ID:', user.id, 'with data:', updates);

      const { error } = await supabase
        .from('users') // Tu tabla pública 'users'
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error(`Error al actualizar el perfil: ${error.message}`);
        throw error;
      }

      toast.success('Perfil actualizado con éxito!');
      console.log('Profile updated successfully.');

      // Actualizar el estado del usuario en AuthContext si es necesario
      // Esto es importante para que los cambios se reflejen en toda la app (ej. Header)
      if (setAuthUser) {
        const updatedUser = { ...user, name: formData.name, phone: formData.phone };
        setAuthUser(updatedUser as AppUser); // Asegúrate que AppUser es el tipo correcto
      }

    } catch (error) {
      // El toast de error ya se muestra arriba si es un error de Supabase
      console.error('Catch block error updating profile:', error);
    } finally {
      setIsSubmittingProfile(false);
    }
  };


  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast.error("Debes estar autenticado para crear un servicio.");
        return;
    }
    setIsSubmittingService(true);

    try {
      if (!mainImage) {
        toast.error('Por favor selecciona una imagen principal');
        return;
      }

      // 1. Subir imagen principal
      const mainImageFileName = `${user.id}/${Date.now()}_${mainImage.file.name.replace(/\s/g, '_')}`;
      const { data: mainUploadData, error: mainImageError } = await supabase.storage
        .from('service-images') // Nombre de tu bucket
        .upload(mainImageFileName, mainImage.file);

      if (mainImageError) throw mainImageError;
      // const mainImageUrl = supabase.storage.from('service-images').getPublicUrl(mainUploadData.path).data.publicUrl;
      // Por ahora guardaremos solo el path, ya que la URL pública se puede construir.
      const mainImageStoragePath = mainUploadData.path;


      // 2. Subir imágenes de galería
      const galleryStoragePaths: string[] = [];
      for (const image of galleryImages) {
        const galleryImageFileName = `${user.id}/${Date.now()}_${image.file.name.replace(/\s/g, '_')}`;
        const { data: galleryUploadData, error: galleryError } = await supabase.storage
          .from('service-images')
          .upload(galleryImageFileName, image.file);
        if (galleryError) throw galleryError;
        galleryStoragePaths.push(galleryUploadData.path);
      }

      // 3. Crear registro del servicio en la tabla 'services'
      const serviceToInsert = {
        name: serviceFormData.name,
        category_id: serviceFormData.categoryId,
        subcategory_id: serviceFormData.subcategoryId,
        short_description: serviceFormData.shortDescription,
        description: serviceFormData.description,
        price: serviceFormData.price ? parseFloat(serviceFormData.price) : null,
        provider_id: user.id,
        provider_name: user.name, // Puedes tomarlo del user de AuthContext
        provider_email: user.email, // Puedes tomarlo del user de AuthContext
        features: serviceFormData.features.filter(f => f.trim() !== ''),
        // No incluyas imageUrl o gallery aquí, se manejarán con service_images
        is_approved: false, // Por defecto podría ser false hasta revisión de admin
        rating: 0, // Valor inicial
        review_count: 0 // Valor inicial
      };

      console.log('Inserting new service:', serviceToInsert);

      const { data: newService, error: serviceError } = await supabase
        .from('services')
        .insert(serviceToInsert)
        .select()
        .single();

      if (serviceError) throw serviceError;
      if (!newService) throw new Error("No se pudo obtener el servicio creado.");

      console.log('New service created:', newService);

      // 4. Crear registros en 'service_images'
      const serviceImagesToInsert = [];
      // Imagen principal
      serviceImagesToInsert.push({
        service_id: newService.id,
        storage_path: mainImageStoragePath, // Usar el path de storage
        is_main_image: true,
        position: 0
      });
      // Imágenes de galería
      galleryStoragePaths.forEach((path, index) => {
        serviceImagesToInsert.push({
          service_id: newService.id,
          storage_path: path, // Usar el path de storage
          is_main_image: false,
          position: index + 1
        });
      });

      const { error: serviceImagesError } = await supabase
        .from('service_images')
        .insert(serviceImagesToInsert);

      if (serviceImagesError) throw serviceImagesError;

      toast.success('Servicio publicado con éxito! Pendiente de aprobación.');
      setShowServiceForm(false);
      setMainImage(null);
      setGalleryImages([]);
      setServiceFormData({ // Resetear formulario de servicio
        name: '', categoryId: '', subcategoryId: '', shortDescription: '',
        description: '', price: '', features: [''],
      });

      // Refrescar la lista de servicios del usuario
        if (user?.id) {
            const { data: updatedServicesData, error: fetchError } = await supabase
            .from('services')
            .select('*') // Ajusta las columnas que necesitas
            .eq('provider_id', user.id);

            if (fetchError) {
            console.error('Error fetching updated services:', fetchError);
            } else if (updatedServicesData) {
                // Transforma los datos si es necesario para que coincidan con tu interfaz Service
                const transformedServices = updatedServicesData.map(s => ({
                    ...s,
                    // Aquí puedes necesitar buscar la imagen principal de service_images
                    // Por simplicidad, lo omito, pero en una app real lo harías
                    imageUrl: s.imageUrl || 'https://via.placeholder.com/300', // Placeholder
                    gallery: s.gallery || [], // Placeholder
                    features: Array.isArray(s.features) ? s.features : [],
                    options: Array.isArray(s.options) ? s.options : [],
                }));
                setMyServices(transformedServices as Service[]);
            }
        }

    } catch (error: any) {
      console.error('Error creating service:', error);
      toast.error(`Error al crear el servicio: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsSubmittingService(false);
    }
  };


  const handleAddFeature = () => {
    setServiceFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  if (!isAuthenticated || !user) { // Asegurar que user también exista
    // navigate('/'); // Esto podría causar un bucle si se renderiza antes de que el auth esté listo.
    // Es mejor que AuthProvider muestre un loader o maneje la redirección.
    return <div className="flex justify-center items-center min-h-screen">Cargando perfil...</div>;
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
              {/* Aquí podrías mostrar user.avatar_url si lo implementas */}
              <User size={40} className="text-primary-500" />
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold">{formData.name || user?.name}</h2>
              <p className="text-gray-600">{formData.email || user?.email}</p>
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
                  value={formData.name}
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
                  value={formData.email}
                  readOnly // Hacer el campo de solo lectura
                  disabled // Deshabilitar el campo
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
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                  placeholder="Ej. 5512345678"
                />
              </div>
            </div>

            {/* Aquí podrías añadir un campo para avatar_url si lo implementas */}

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
          // ... (resto del código para la pestaña "Mis Servicios" sin cambios)
          <div className="space-y-6">
            {/* Services Header */}
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

            {/* Service Form Modal */}
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
                          onChange={(e) => setServiceFormData({ ...serviceFormData, categoryId: e.target.value, subcategoryId: '' })} // Reset subcategory
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                        >
                          <option value="">Seleccionar categoría</option>
                          {categories.map(category => (
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
                          {categories
                            .find(cat => cat.id === serviceFormData.categoryId)
                            ?.subcategories.map(subcat => (
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
                      {serviceFormData.features.map((feature, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => {
                              const newFeatures = [...serviceFormData.features];
                              newFeatures[index] = e.target.value;
                              setServiceFormData({ ...serviceFormData, features: newFeatures });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                            placeholder={`Característica ${index + 1}`}
                          />
                          {serviceFormData.features.length > 1 && (
                            <button
                                type="button"
                                onClick={() => {
                                const newFeatures = serviceFormData.features.filter((_, i) => i !== index);
                                setServiceFormData({ ...serviceFormData, features: newFeatures });
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
                        disabled={isSubmittingService}
                        className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-70 flex items-center justify-center"
                      >
                        {isSubmittingService ? (
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

            {/* Services List */}
            {myServices.length === 0 && !showServiceForm ? ( // Ocultar si el formulario está abierto
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
                  // Intenta obtener la URL completa de la imagen principal desde service_images
                  // Esto es una simplificación; idealmente, la consulta inicial a 'services'
                  // haría un JOIN o una subconsulta para obtener la imagen principal.
                  // O, el objeto 'service' ya vendría con la URL completa.
                  // Por ahora, asumimos que service.imageUrl es el path de Supabase Storage
                  // o una URL completa si ya la tienes.

                  // Si `service.imageUrl` es solo un path, necesitas construir la URL pública.
                  // let displayImageUrl = service.imageUrl; // Asume que ya es una URL o placeholder
                  // Si tienes el path de storage y necesitas la URL pública:
                  // if (service.storage_path_main_image) { // Si tienes un campo así
                  //   displayImageUrl = supabase.storage.from('service-images').getPublicUrl(service.storage_path_main_image).data.publicUrl;
                  // }

                  // Para este ejemplo, usaré service.imageUrl asumiendo que es usable o un placeholder
                  const displayImageUrl = service.imageUrl || 'https://via.placeholder.com/300x200?text=Sin+Imagen';


                  return (
                    <div key={service.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                        <img
                        src={displayImageUrl}
                        alt={service.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Error+Img')} // Fallback
                        />
                        <div className="p-6">
                        <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.shortDescription}</p>
                        <div className="flex items-center justify-between text-sm">
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
                            <button className="p-2 text-gray-500 hover:text-primary-500 bg-gray-100 hover:bg-gray-200 rounded-md" aria-label="Editar servicio">
                                <Edit size={18} />
                            </button>
                            <button className="p-2 text-gray-500 hover:text-error-500 bg-gray-100 hover:bg-gray-200 rounded-md" aria-label="Eliminar servicio">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        </div>
                    </div>
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
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Plus, Package, Star, Edit, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { categories } from '../data/categories';
import { Service } from '../types';
import { createClient } from '@supabase/supabase-js';

interface ImageUpload {
  file: File;
  preview: string;
  isMain?: boolean;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'services'>('profile');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [mainImage, setMainImage] = useState<ImageUpload | null>(null);
  const [galleryImages, setGalleryImages] = useState<ImageUpload[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean = false) => {
    const files = e.target.files;
    if (!files) return;

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        alert('El archivo es demasiado grande. El tamaño máximo es 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        const imageUpload: ImageUpload = { file, preview, isMain };

        if (isMain) {
          setMainImage(imageUpload);
        } else {
          setGalleryImages(prev => {
            if (prev.length >= 5) {
              alert('Máximo 5 imágenes en la galería');
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
    }
    document.title = 'Mi Perfil | CABETG Party Planner';
    
    // Fetch user's services
    const fetchServices = async () => {
      const { data: services, error } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', user?.id);

      if (error) {
        console.error('Error fetching services:', error);
        return;
      }

      setMyServices(services);
    };

    if (user?.id) {
      fetchServices();
    }
  }, [isAuthenticated, navigate, user?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle profile update logic here
    console.log('Profile update:', formData);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!mainImage) {
        alert('Por favor selecciona una imagen principal');
        return;
      }

      // Upload main image
      const mainImagePath = `services/${Date.now()}_${mainImage.file.name}`;
      const { error: mainImageError } = await supabase.storage
        .from('service-images')
        .upload(mainImagePath, mainImage.file);

      if (mainImageError) throw mainImageError;

      // Upload gallery images
      const galleryPaths = await Promise.all(
        galleryImages.map(async (image) => {
          const path = `services/${Date.now()}_${image.file.name}`;
          const { error } = await supabase.storage
            .from('service-images')
            .upload(path, image.file);
          
          if (error) throw error;
          return path;
        })
      );

      // Create service record
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .insert({
          name: serviceFormData.name,
          category_id: serviceFormData.categoryId,
          subcategory_id: serviceFormData.subcategoryId,
          short_description: serviceFormData.shortDescription,
          description: serviceFormData.description,
          price: serviceFormData.price ? parseFloat(serviceFormData.price) : null,
          provider_id: user?.id,
          provider_name: user?.name,
          provider_email: user?.email,
          features: serviceFormData.features.filter(f => f.trim()),
        })
        .select()
        .single();

      if (serviceError) throw serviceError;

      // Create image records
      await supabase.from('service_images').insert([
        {
          service_id: service.id,
          storage_path: mainImagePath,
          is_main_image: true,
          position: 0
        },
        ...galleryPaths.map((path, index) => ({
          service_id: service.id,
          storage_path: path,
          is_main_image: false,
          position: index + 1
        }))
      ]);

      setShowServiceForm(false);
      // Refresh services list
      const { data: updatedServices } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', user?.id);

      if (updatedServices) {
        setMyServices(updatedServices);
      }
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Error al crear el servicio. Por favor intenta de nuevo.');
    }
  };

  const handleAddFeature = () => {
    setServiceFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  if (!isAuthenticated) return null;

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
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                />
                <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                />
                <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                />
                <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="w-full sm:w-auto bg-primary-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
        ) : (
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
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Servicio *
                      </label>
                      <input
                        type="text"
                        required
                        value={serviceFormData.name}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Categoría *
                        </label>
                        <select
                          required
                          value={serviceFormData.categoryId}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, categoryId: e.target.value })}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subcategoría *
                        </label>
                        <select
                          required
                          value={serviceFormData.subcategoryId}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, subcategoryId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción Corta *
                      </label>
                      <input
                        type="text"
                        required
                        value={serviceFormData.shortDescription}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, shortDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción Detallada *
                      </label>
                      <textarea
                        required
                        value={serviceFormData.description}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={serviceFormData.price}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
                          placeholder="Dejar vacío para 'Solicitar Cotización'"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imagen Principal * (Max 5MB)
                      </label>
                      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageSelect(e, true)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {mainImage ? (
                          <div className="relative">
                            <img
                              src={mainImage.preview}
                              alt="Vista previa"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(0, true)}
                              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                            >
                              <Trash2 size={16} className="text-error-500" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              Haz clic para subir o arrastra una imagen aquí
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Galería de Imágenes (Max 5 imágenes)
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {galleryImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image.preview}
                              alt={`Galería ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                            >
                              <Trash2 size={16} className="text-error-500" />
                            </button>
                          </div>
                        ))}
                        {galleryImages.length < 5 && (
                          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors h-32 flex items-center justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-center">
                              <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                              <p className="mt-1 text-xs text-gray-500">
                                Agregar imagen
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Características
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
                            placeholder="Característica del servicio"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newFeatures = serviceFormData.features.filter((_, i) => i !== index);
                              setServiceFormData({ ...serviceFormData, features: newFeatures });
                            }}
                            className="text-gray-400 hover:text-error-500"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                      >
                        + Agregar característica
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
                        className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                      >
                        Publicar Servicio
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Services List */}
            {myServices.length === 0 ? (
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
                {myServices.map(service => (
                  <div key={service.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                      <p className="text-gray-600 text-sm mb-4">{service.shortDescription}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Star className="text-warning-500" size={18} />
                          <span className="ml-1 text-sm font-medium">{service.rating}</span>
                          <span className="mx-1 text-gray-400">·</span>
                          <span className="text-sm text-gray-600">{service.reviewCount} reseñas</span>
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-2 text-gray-400 hover:text-primary-500">
                            <Edit size={18} />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-error-500">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
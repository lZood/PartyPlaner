import React, { useEffect, useState } from 'react';
import { services as mockServicesData } from '../data/services'; // Import mock services
import { Service as AppServiceType, Category as AppCategoryType, Subcategory as AppSubcategoryType } from '../types';
import { Link, useParams } from 'react-router-dom';
import Slider from 'react-slick';
import { Star, Heart, CheckCircle, Truck, Calendar, Clock, MinusCircle, PlusCircle, Loader2 } from 'lucide-react';
// Remove mock data import for services if you are fetching live data
// import { services as mockServices } from '../data/services'; // KEEP THIS IF USED FOR 'similarServices' and not replacing that logic yet
import { categories as mockCategories } from '../data/categories'; // Keep for category/subcategory name lookup if not fetching from DB
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import AuthModal from '../components/auth/AuthModal';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { addToCart, isInCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const [service, setService] = useState<AppServiceType | null>(null);
  const [category, setCategory] = useState<AppCategoryType | null>(null);
  const [subcategory, setSubcategory] = useState<AppSubcategoryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!serviceId) {
        setIsLoading(false);
        setService(null);
        return;
      }

      setIsLoading(true);
      try {
        // 1. Fetch service data from 'services' table
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('*')
          .eq('id', serviceId)
          .maybeSingle(); // Use maybeSingle() if it's possible the service doesn't exist

        if (serviceError) {
          console.error('Error fetching service data:', serviceError);
          setService(null);
          setIsLoading(false);
          return;
        }

        if (!serviceData) {
          console.log('Service not found in database with ID:', serviceId);
          setService(null);
          setIsLoading(false);
          return;
        }

        // 2. Fetch gallery images from 'service_images' table
        const { data: galleryData, error: galleryError } = await supabase
          .from('service_images')
          .select('storage_path, is_main_image') // Select is_main_image as well
          .eq('service_id', serviceId)
          .order('position', { ascending: true });

        if (galleryError) {
          console.error('Error fetching gallery images:', galleryError);
          // Fallback or decide how to handle this, for now, continue
        }

        let mainImageUrl = 'https://placehold.co/600x400?text=No+Principal';
        const galleryImageUrls: string[] = [];

        if (galleryData && galleryData.length > 0) {
          let mainImageRecord = galleryData.find(img => img.is_main_image);
          if (!mainImageRecord) { // If no explicit main image, take the first by position
            mainImageRecord = galleryData[0];
          }

          if (mainImageRecord && mainImageRecord.storage_path) {
             const { data: mainUrlData } = supabase.storage
              .from('service-images')
              .getPublicUrl(mainImageRecord.storage_path);
            if (mainUrlData) {
              mainImageUrl = mainUrlData.publicUrl;
            }
          }

          galleryData.forEach(img => {
            if (img.storage_path) {
              const { data: urlData } = supabase.storage
                .from('service-images')
                .getPublicUrl(img.storage_path);
              if (urlData) {
                galleryImageUrls.push(urlData.publicUrl);
              }
            }
          });
        }


        // 4. Map to the Service type
        const populatedService: AppServiceType = {
          id: serviceData.id,
          name: serviceData.name,
          description: serviceData.description,
          shortDescription: serviceData.short_description, // DB uses snake_case
          price: serviceData.price,
          imageUrl: mainImageUrl,
          gallery: galleryImageUrls.length > 0 ? galleryImageUrls : [mainImageUrl],
          categoryId: serviceData.category_id, // DB uses snake_case
          subcategoryId: serviceData.subcategory_id, // DB uses snake_case
          rating: serviceData.rating,
          reviewCount: serviceData.review_count, // DB uses snake_case
          features: serviceData.features || [],
          // availability and options would need to be fetched if they are in separate tables
          // For now, initializing as empty or undefined if not directly on serviceData
           availability: serviceData.availability || [], // Placeholder
           options: serviceData.options || [], // Placeholder
        };
        setService(populatedService);

        // Fetch category and subcategory details from mockCategories
        // In a full DB setup, these would also be fetched or joined.
        const cat = mockCategories.find((c) => c.id === populatedService.categoryId); //
        if (cat) {
          setCategory(cat);
          const subcat = cat.subcategories.find((s) => s.id === populatedService.subcategoryId); //
          setSubcategory(subcat || null);
        } else {
            setCategory(null);
            setSubcategory(null);
        }

      } catch (error) {
        console.error('Failed to fetch service details:', error);
        setService(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId]); // Removed supabase from dependencies for now, assuming it's stable. Add if needed.

  // Original useEffect for document title and scroll
  useEffect(() => {
    if (service) {
      document.title = `${service.name} | CABETG Party Planner`;
      window.scrollTo(0, 0);
    } else if (!isLoading && service === null) {
      document.title = 'Servicio no encontrado | CABETG Party Planner';
    }
  }, [service, isLoading]);


  // Calculate price with options (keep existing logic)
  const calculateTotalPrice = () => {
    if (!service || !service.price) return null;
    let totalPrice = service.price * quantity;
    if (service.options) {
      service.options.forEach((option) => {
        if (selectedOptions.includes(option.id)) {
          totalPrice += option.priceModifier * quantity;
        }
      });
    }
    return totalPrice;
  };
  const totalPrice = calculateTotalPrice();

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  };

  // Similar services: This part might still use mock data or need adjustment
  // For now, let's assume it tries to filter based on the loaded service's category/subcategory.
  // You might need to fetch these separately or adjust logic if mockServices is removed.
  const { services: mockServices } = React.useContext(require('../data/services')); // If you need mockServices

  const similarServices = service ? mockServices // Use mockServices (or your actual services data source)
    .filter(
      (s: AppServiceType) =>
        s.id !== serviceId &&
        s.categoryId === service?.categoryId &&
        s.subcategoryId === service?.subcategoryId
    )
    .slice(0, 3) : [];


  const handleToggleOption = (optionId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (service) {
      addToCart(service, quantity);
    }
  };

  if (isLoading) {
    return (
      <div className="container-custom py-16 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-500" />
        <p className="mt-4 text-lg">Cargando detalles del servicio...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container-custom py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Servicio no encontrado</h2>
        <p className="mb-8">Lo sentimos, el servicio que buscas no existe o no pudo ser cargado.</p>
        <Link to="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
    );
  }
  
  // Conditional rendering for breadcrumbs if category/subcategory names are not found
  const categoryName = category ? category.name : service.categoryId;
  const subcategoryName = subcategory ? subcategory.name : service.subcategoryId;


  return (
    <div className="bg-gray-50 py-12">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          if (service) {
            addToCart(service, quantity);
          }
        }}
        pendingService={service}
        pendingQuantity={quantity}
      />

      <div className="container-custom">
        <nav className="mb-8 text-sm">
          <ol className="flex flex-wrap items-center">
            <li className="flex items-center">
              <Link to="/" className="text-gray-500 hover:text-primary-500">Inicio</Link>
              <span className="mx-2 text-gray-400">/</span>
            </li>
            {category && (
              <li className="flex items-center">
                <Link to={`/category/${category.id}`} className="text-gray-500 hover:text-primary-500">
                  {categoryName}
                </Link>
                <span className="mx-2 text-gray-400">/</span>
              </li>
            )}
            {subcategory && category && (
              <li className="flex items-center">
                <Link to={`/category/${category.id}/${subcategory.id}`} className="text-gray-500 hover:text-primary-500">
                  {subcategoryName}
                </Link>
                <span className="mx-2 text-gray-400">/</span>
              </li>
            )}
            <li className="text-primary-500 font-medium">{service.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {service.gallery && service.gallery.length > 0 ? (
                <Slider {...sliderSettings}>
                  {service.gallery.map((image, index) => (
                    <div key={index} className="h-96"> {/* Ensure consistent height for slider images */}
                      <img
                        src={image}
                        alt={`${service.name} - Imagen ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Error+Img')}
                      />
                    </div>
                  ))}
                </Slider>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-100">
                   <img
                        src={service.imageUrl} // Fallback to main imageUrl if gallery is empty
                        alt={service.name}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Error+Img')}
                      />
                </div>
              )}
            </div>
          </div>

          {/* Service Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl font-bold">{service.name}</h1>
                <button
                  className="text-gray-400 hover:text-secondary-500"
                  aria-label="Añadir a favoritos"
                >
                  <Heart size={24} />
                </button>
              </div>

              <div className="flex items-center mb-4">
                <div className="flex text-warning-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      fill={i < Math.floor(service.rating) ? "currentColor" : "none"}
                      strokeWidth={i < Math.floor(service.rating) ? 0 : 1.5}
                    />
                  ))}
                </div>
                <span className="text-gray-600 text-sm ml-2">
                  {service.rating.toFixed(1)} ({service.reviewCount} reseñas)
                </span>
              </div>

              <div className="mb-6">
                <div className="text-lg font-bold mb-2">
                  {service.price ? (
                    `$${service.price.toLocaleString('es-MX')}`
                  ) : (
                    <span className="text-primary-500">Solicitar Cotización</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {service.price
                    ? "Precio base por unidad/servicio"
                    : "El precio varía según especificaciones"}
                </p>
              </div>

              {service.price && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">Cantidad</div>
                    <div className="flex items-center">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="text-gray-500 hover:text-primary-500 disabled:opacity-50"
                        disabled={quantity <= 1}
                      >
                        <MinusCircle size={20} />
                      </button>
                      <span className="mx-4 w-8 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="text-gray-500 hover:text-primary-500"
                      >
                        <PlusCircle size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {service.options && service.options.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Opciones Adicionales</h3>
                  <div className="space-y-3">
                    {service.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start p-3 border rounded-lg cursor-pointer hover:border-primary-300 transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 mr-3"
                          checked={selectedOptions.includes(option.id)}
                          onChange={() => handleToggleOption(option.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{option.name}</div>
                          {option.description && (
                            <div className="text-sm text-gray-600">
                              {option.description}
                            </div>
                          )}
                        </div>
                        <div className="font-medium">
                          +${option.priceModifier.toLocaleString('es-MX')}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="grid grid-cols-2 gap-3">
                  {/* Service Highlights - consider fetching these or making them generic */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck size={16} className="mr-2 text-primary-500" />
                    <span>Disponibilidad variable</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2 text-primary-500" />
                    <span>Reserva con anticipación</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-2 text-primary-500" />
                    <span>Duración según servicio</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle size={16} className="mr-2 text-primary-500" />
                    <span>Proveedor verificado</span>
                  </div>
                </div>
              </div>

              {totalPrice !== null && (
                <div className="flex justify-between items-center py-3 mb-4 border-t border-b border-gray-200">
                  <div className="text-lg font-medium">Total</div>
                  <div className="text-xl font-bold">
                    ${totalPrice.toLocaleString('es-MX')}
                  </div>
                </div>
              )}

              {isInCart(service.id) ? (
                <div className="space-y-3">
                  <Link
                    to="/cart"
                    className="btn w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium"
                  >
                    Ver mi carrito
                  </Link>
                  <button
                    onClick={handleAddToCart} // This could be 'updateCartItem'
                    className="btn w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium"
                  >
                    Actualizar Cantidad y Opciones
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="btn w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium"
                >
                  {service.price ? 'Añadir a Mi Lista' : 'Solicitar Cotización'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Description and Features */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Descripción</h2>
              <p className="text-gray-700 mb-6 whitespace-pre-line">{service.description}</p> {/* Added whitespace-pre-line */}

              <h3 className="font-bold mb-3">Características</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {service.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle size={18} className="text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reviews: This section would need a separate data fetching logic */}
            <div className="bg-white rounded-xl shadow-md p-6">
              {/* ... existing reviews placeholder ... */}
            </div>
          </div>

          {/* Similar Services: This section still uses mock data */}
          <div className="lg:col-span-1">
             {/* ... existing similar services placeholder ... */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
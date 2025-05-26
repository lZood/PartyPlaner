import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Slider from 'react-slick';
import { Star, Heart, CheckCircle, Truck, Calendar, Clock, MinusCircle, PlusCircle } from 'lucide-react';
import { services } from '../data/services';
import { categories } from '../data/categories';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import AuthModal from '../components/auth/AuthModal';

const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { addToCart, isInCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  
  const service = services.find((s) => s.id === serviceId);
  
  const category = service
    ? categories.find((cat) => cat.id === service.categoryId)
    : undefined;
  
  const subcategory = category?.subcategories.find(
    (subcat) => subcat.id === service?.subcategoryId
  );
  
  // Calculate price with options
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
  
  // Similar services from the same subcategory
  const similarServices = services
    .filter(
      (s) =>
        s.id !== serviceId &&
        s.categoryId === service?.categoryId &&
        s.subcategoryId === service?.subcategoryId
    )
    .slice(0, 3);
  
  useEffect(() => {
    if (service) {
      document.title = `${service.name} | CABETG Party Planner`;
    }
  }, [service]);

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

  if (!service || !category || !subcategory) {
    return (
      <div className="container-custom py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Servicio no encontrado</h2>
        <p className="mb-8">Lo sentimos, el servicio que buscas no existe.</p>
        <Link to="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12">
      {/* Auth Modal */}
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
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <ol className="flex flex-wrap items-center">
            <li className="flex items-center">
              <Link to="/" className="text-gray-500 hover:text-primary-500">Inicio</Link>
              <span className="mx-2 text-gray-400">/</span>
            </li>
            <li className="flex items-center">
              <Link to={`/category/${category.id}`} className="text-gray-500 hover:text-primary-500">
                {category.name}
              </Link>
              <span className="mx-2 text-gray-400">/</span>
            </li>
            <li className="flex items-center">
              <Link to={`/category/${category.id}/${subcategory.id}`} className="text-gray-500 hover:text-primary-500">
                {subcategory.name}
              </Link>
              <span className="mx-2 text-gray-400">/</span>
            </li>
            <li className="text-primary-500 font-medium">{service.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <Slider {...sliderSettings}>
                {service.gallery.map((image, index) => (
                  <div key={index} className="h-96">
                    <img
                      src={image}
                      alt={`${service.name} - Imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </Slider>
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
                  {service.rating} ({service.reviewCount} reseñas)
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

              {/* Service Highlights */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck size={16} className="mr-2 text-primary-500" />
                    <span>Disponibilidad: 7 días</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2 text-primary-500" />
                    <span>Reserva anticipada</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-2 text-primary-500" />
                    <span>Duración: 5 horas</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle size={16} className="mr-2 text-primary-500" />
                    <span>Proveedor verificado</span>
                  </div>
                </div>
              </div>

              {/* Total and CTA */}
              {totalPrice && (
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
                    onClick={handleAddToCart}
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
              <p className="text-gray-700 mb-6">{service.description}</p>

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

            {/* Reviews would go here */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Reseñas</h2>
                <button className="text-primary-500 font-medium hover:underline">
                  Ver todas
                </button>
              </div>

              <div className="space-y-6">
                {[1, 2].map((_, index) => (
                  <div key={index} className="pb-6 border-b border-gray-200 last:border-0">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-300 mr-3"></div>
                        <div>
                          <div className="font-medium">Cliente Satisfecho</div>
                          <div className="text-sm text-gray-500">Hace 2 semanas</div>
                        </div>
                      </div>
                      <div className="flex text-warning-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700">
                      Excelente servicio, totalmente recomendado. Cumplieron con todas las expectativas y el personal fue muy amable.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Similar Services */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Servicios Similares</h2>
              <div className="space-y-4">
                {similarServices.length > 0 ? (
                  similarServices.map((similarService) => (
                    <Link
                      key={similarService.id}
                      to={`/service/${similarService.id}`}
                      className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={similarService.imageUrl}
                        alt={similarService.name}
                        className="w-20 h-16 object-cover rounded mr-3"
                      />
                      <div>
                        <h3 className="font-medium hover:text-primary-500 transition-colors">
                          {similarService.name}
                        </h3>
                        <div className="flex items-center text-sm mb-1">
                          <div className="flex text-warning-500">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                fill={i < Math.floor(similarService.rating) ? "currentColor" : "none"}
                                strokeWidth={i < Math.floor(similarService.rating) ? 0 : 1.5}
                              />
                            ))}
                          </div>
                          <span className="text-gray-600 ml-1">
                            ({similarService.reviewCount})
                          </span>
                        </div>
                        <div className="font-medium">
                          {similarService.price ? (
                            `$${similarService.price.toLocaleString('es-MX')}`
                          ) : (
                            <span className="text-primary-500">Cotizar</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-gray-600">
                    No hay servicios similares disponibles en este momento.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
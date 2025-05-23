import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { services } from '../../data/services';
import { categories } from '../../data/categories';
import { useCart } from '../../contexts/CartContext';

const FeaturedServices: React.FC = () => {
  const { addToCart, isInCart } = useCart();
  
  // Get 4 featured services
  const featuredServices = services.slice(0, 4);

  return (
    <section className="section bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Servicios Destacados
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Los proveedores y servicios más solicitados para eventos inolvidables.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredServices.map((service) => (
            <div key={service.id} className="card group">
              <div className="relative overflow-hidden">
                {/* Service Image */}
                <Link to={`/service/${service.id}`}>
                  <img 
                    src={service.imageUrl} 
                    alt={service.name} 
                    className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                
                {/* Favorite Button */}
                <button 
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white bg-opacity-80 flex items-center justify-center hover:bg-opacity-100 transition-colors"
                  aria-label="Añadir a favoritos"
                >
                  <Heart size={18} className="text-gray-600 hover:text-secondary-500" />
                </button>
              </div>
              
              <div className="p-4">
                {/* Category */}
                <div className="text-sm text-primary-500 font-medium mb-2">
                  {categories.find(cat => cat.id === service.categoryId)?.name}
                </div>
                
                {/* Title */}
                <Link to={`/service/${service.id}`}>
                  <h3 className="font-semibold text-xl mb-2 group-hover:text-primary-500 transition-colors">
                    {service.name}
                  </h3>
                </Link>
                
                {/* Description */}
                <p className="text-gray-600 text-sm mb-3">
                  {service.shortDescription}
                </p>
                
                {/* Rating */}
                <div className="flex items-center mb-4">
                  <div className="flex text-warning-500">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        fill={i < Math.floor(service.rating) ? "currentColor" : "none"}
                        strokeWidth={i < Math.floor(service.rating) ? 0 : 1.5}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 text-sm ml-2">
                    ({service.reviewCount})
                  </span>
                </div>
                
                {/* Price and Action */}
                <div className="flex justify-between items-center">
                  <div className="font-semibold">
                    {service.price ? (
                      `$${service.price.toLocaleString('es-MX')}`
                    ) : (
                      <span className="text-primary-500">Cotizar</span>
                    )}
                  </div>
                  
                  {isInCart(service.id) ? (
                    <Link 
                      to="/cart" 
                      className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded text-sm"
                    >
                      Ver cotización
                    </Link>
                  ) : (
                    <button 
                      onClick={() => addToCart(service)}
                      className="btn bg-primary-500 hover:bg-primary-600 text-white py-1 px-3 rounded text-sm"
                    >
                      Añadir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link 
            to="/category/music" 
            className="btn-outline py-3 px-8 rounded-full inline-block"
          >
            Ver Todos los Servicios
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedServices;
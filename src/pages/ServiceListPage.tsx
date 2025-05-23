import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star, Heart, Filter } from 'lucide-react';
import { categories } from '../data/categories';
import { services } from '../data/services';
import { useCart } from '../contexts/CartContext';

const ServiceListPage: React.FC = () => {
  const { categoryId, subcategoryId } = useParams<{ categoryId: string; subcategoryId: string }>();
  const { addToCart, isInCart } = useCart();
  const [showFilters, setShowFilters] = useState(false);

  const category = categories.find((cat) => cat.id === categoryId);
  const subcategory = category?.subcategories.find(
    (subcat) => subcat.id === subcategoryId
  );

  const filteredServices = services.filter(
    (service) => service.categoryId === categoryId && service.subcategoryId === subcategoryId
  );

  useEffect(() => {
    if (subcategory) {
      document.title = `${subcategory.name} | CABETG Party Planner`;
    }
  }, [subcategory]);

  if (!category || !subcategory) {
    return (
      <div className="container-custom py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Subcategoría no encontrada</h2>
        <p className="mb-8">Lo sentimos, la subcategoría que buscas no existe.</p>
        <Link to="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-gray-100 py-4">
        <div className="container-custom">
          <nav className="text-sm">
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
              <li className="text-primary-500 font-medium">{subcategory.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <div className="container-custom py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{subcategory.name}</h1>
            <p className="text-gray-600">{subcategory.description}</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg lg:hidden"
          >
            <Filter size={18} className="mr-2" />
            <span>Filtros</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-lg mb-4">Filtros</h3>
              
              <div className="mb-6">
                <h4 className="font-medium mb-3">Precio</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span>Menos de $5,000</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span>$5,000 - $10,000</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span>$10,000 - $20,000</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span>Más de $20,000</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span>Solicitar cotización</span>
                  </label>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium mb-3">Calificación</h4>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <div className="flex text-warning-500">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            fill={i < rating ? "currentColor" : "none"}
                            strokeWidth={i < rating ? 0 : 1.5}
                          />
                        ))}
                      </div>
                      <span className="ml-2">y más</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Características</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span>Disponible de inmediato</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span>Entrega incluida</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span>Personalizable</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Filters - Mobile */}
          {showFilters && (
            <div className="lg:hidden fixed inset-0 z-40 bg-gray-900 bg-opacity-50 flex justify-end">
              <div className="w-4/5 max-w-md bg-white h-full overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-lg">Filtros</h3>
                    <button 
                      onClick={() => setShowFilters(false)}
                      className="text-gray-500"
                    >
                      &times;
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Precio</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Menos de $5,000</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>$5,000 - $10,000</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>$10,000 - $20,000</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Más de $20,000</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Solicitar cotización</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Calificación</h4>
                    <div className="space-y-2">
                      {[4, 3, 2, 1].map((rating) => (
                        <label key={rating} className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          <div className="flex text-warning-500">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={16} 
                                fill={i < rating ? "currentColor" : "none"}
                                strokeWidth={i < rating ? 0 : 1.5}
                              />
                            ))}
                          </div>
                          <span className="ml-2">y más</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Características</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Disponible de inmediato</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Entrega incluida</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-2" />
                        <span>Personalizable</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-8">
                    <button 
                      onClick={() => setShowFilters(false)}
                      className="flex-1 py-2 border border-gray-300 rounded-lg"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => setShowFilters(false)}
                      className="flex-1 py-2 bg-primary-500 text-white rounded-lg"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Listings */}
          <div className="flex-1">
            {filteredServices.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <h3 className="text-xl font-semibold mb-4">No hay servicios disponibles</h3>
                <p className="text-gray-600 mb-6">
                  Todavía no hay servicios disponibles en esta categoría. Estamos trabajando en añadir más opciones.
                </p>
                <Link to={`/category/${category.id}`} className="btn btn-primary">
                  Volver a {category.name}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceListPage;
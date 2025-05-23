import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, ChevronRight } from 'lucide-react';
import { categories } from '../../data/categories';
import { services } from '../../data/services';

const CategoryShowcase: React.FC = () => {
  // Get featured categories (first 6)
  const featuredCategories = categories.slice(0, 6);

  return (
    <div className="py-16">
      <div className="container-custom">
        {/* Category Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Explora por Categoría</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredCategories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="group relative aspect-square rounded-lg overflow-hidden"
              >
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-medium text-sm group-hover:text-primary-300 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Services by Category */}
        {categories.map((category) => {
          const categoryServices = services
            .filter((service) => service.categoryId === category.id)
            .slice(0, 4);

          if (categoryServices.length === 0) return null;

          return (
            <div key={category.id} className="mb-16">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{category.name}</h2>
                  <p className="text-gray-600">{category.description}</p>
                </div>
                <Link
                  to={`/category/${category.id}`}
                  className="text-primary-500 hover:text-primary-600 font-medium flex items-center"
                >
                  Ver más
                  <ChevronRight size={20} className="ml-1" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {categoryServices.map((service) => (
                  <Link
                    key={service.id}
                    to={`/service/${service.id}`}
                    className="group block hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden bg-white"
                  >
                    <div className="relative aspect-w-16 aspect-h-9 overflow-hidden">
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
                      />
                      <button 
                        className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Heart size={16} className="text-gray-600" />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center mb-1">
                        <Star size={16} className="text-warning-500 fill-current" />
                        <span className="ml-1 text-sm font-medium">{service.rating}</span>
                        <span className="mx-1 text-gray-400">·</span>
                        <span className="text-sm text-gray-600">{service.reviewCount} reseñas</span>
                      </div>
                      <h3 className="font-medium text-lg group-hover:text-primary-500 transition-colors mb-1">
                        {service.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {service.shortDescription}
                      </p>
                      {service.price && (
                        <p className="mt-2 font-semibold">
                          ${service.price.toLocaleString('es-MX')}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryShowcase;
import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Palette, CarFront as ChairFront, Coffee, Candy, Package } from 'lucide-react';
import { categories } from '../../data/categories';

const CategorySection: React.FC = () => {
  // Map category IDs to icons
  const categoryIcons: Record<string, React.ReactNode> = {
    music: <Music size={40} className="mb-4 text-primary-500" />,
    decoration: <Palette size={40} className="mb-4 text-secondary-500" />,
    furniture: <ChairFront size={40} className="mb-4 text-accent-500" />,
    food: <Coffee size={40} className="mb-4 text-success-500" />,
    candy: <Candy size={40} className="mb-4 text-warning-500" />,
    disposables: <Package size={40} className="mb-4 text-gray-500" />,
  };

  return (
    <section className="section bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Explora Nuestras Categorías
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Encuentra todo lo que necesitas para tu evento en un solo lugar. Selecciona una categoría para comenzar.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              to={`/category/${category.id}`}
              className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 group"
            >
              {categoryIcons[category.id]}
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-500 transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-gray-600 mt-2 hidden md:block">
                {category.description.length > 60 
                  ? `${category.description.substring(0, 60)}...` 
                  : category.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
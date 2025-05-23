import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { categories } from '../data/categories';

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  
  const category = categories.find((cat) => cat.id === categoryId);
  
  useEffect(() => {
    if (category) {
      document.title = `${category.name} | CABETG Party Planner`;
    }
  }, [category]);

  if (!category) {
    return (
      <div className="container-custom py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Categoría no encontrada</h2>
        <p className="mb-8">Lo sentimos, la categoría que buscas no existe.</p>
        <Link to="/" className="btn btn-primary">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Banner */}
      <div className="relative h-[40vh] min-h-[300px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${category.imageUrl})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        <div className="relative container-custom h-full flex flex-col justify-center text-white z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.name}</h1>
          <p className="text-lg md:text-xl max-w-2xl">{category.description}</p>
        </div>
      </div>

      {/* Subcategories */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">Explora {category.name}</h2>
            <p className="text-lg text-gray-600">
              Selecciona una subcategoría para ver todos los servicios disponibles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {category.subcategories.map((subcategory) => (
              <Link
                key={subcategory.id}
                to={`/category/${categoryId}/${subcategory.id}`}
                className="group"
              >
                <div className="card overflow-hidden h-full">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={subcategory.imageUrl}
                      alt={subcategory.name}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary-500 transition-colors">
                      {subcategory.name}
                    </h3>
                    <p className="text-gray-600 mb-4">{subcategory.description}</p>
                    <div className="text-primary-500 font-medium group-hover:text-primary-600 flex items-center">
                      <span>Ver servicios</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 ml-1 transform group-hover:translate-x-1 transition-transform"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;
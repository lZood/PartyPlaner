import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../data/categories';
import { services } from '../data/services';

const CategoriesPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Categorías | CABETG Party Planer';
  }, []);

  return (
    <div className="bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-3xl font-bold mb-8">Nuestras Categorías</h1>

        <div className="space-y-16">
          {categories.map((category) => {
            const categoryServices = services
              .filter((service) => service.categoryId === category.id)
              .slice(0, 3);

            return (
              <div key={category.id} className="bg-white rounded-xl shadow-md p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{category.name}</h2>
                    <p className="text-gray-600 max-w-2xl">{category.description}</p>
                  </div>
                  <Link
                    to={`/category/${category.id}`}
                    className="mt-4 md:mt-0 inline-flex items-center text-primary-500 hover:text-primary-600 font-medium"
                  >
                    Ver todo
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 ml-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {categoryServices.map((service) => (
                    <Link
                      key={service.id}
                      to={`/service/${service.id}`}
                      className="group block"
                    >
                      <div className="relative h-48 rounded-lg overflow-hidden mb-3">
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="font-medium group-hover:text-primary-500 transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {service.shortDescription}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../data/categories'; // Asegúrate que la ruta a tus datos sea correcta
import { ChevronDown, ChevronUp } from 'lucide-react';

// Helper para obtener un ícono basado en el ID de la categoría (puedes expandir esto)
import { Music, Palette, CarFront as ChairFront, Coffee, Candy, Package as PackageIcon, ShoppingBag, Camera, Home } from 'lucide-react';

const CategoryIcon: React.FC<{ iconId: string | undefined; className?: string }> = ({ iconId, className = "w-8 h-8 text-primary-500" }) => {
  switch (iconId) {
    case 'music': return <Music className={className} />;
    case 'decoration': return <Palette className={className} />;
    case 'furniture': return <ChairFront className={className} />;
    case 'food': return <Coffee className={className} />;
    case 'candy':
    case 'snacks':
      return <Candy className={className} />;
    case 'disposables': return <PackageIcon className={className} />;
    case 'venues': return <Home className={className} />
    // Añade más casos según los IDs de tus categorías
    default: return <ShoppingBag className={className} />; // Un ícono por defecto
  }
};


const CategoriesPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Todas las Categorías | CABETG Party Planner';
  }, []);

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  // Es buena práctica tener slugs amigables para URL, pero usaremos los IDs directamente como en tu código original.
  // Si tus IDs no son amigables para URL (ej. contienen espacios, ñ, etc.), considera crear slugs.
  // Por ejemplo: const createSlug = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

  return (
    <div className="bg-white py-12 md:py-16">
      <div className="container-custom">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Explora Nuestros Servicios</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Encuentra todo lo que necesitas para tu evento perfecto, organizado por categorías.
          </p>
        </div>

        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl">
              <div
                className="flex flex-col md:flex-row items-center justify-between p-6 cursor-pointer"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="mr-5 p-3 bg-primary-100 rounded-full">
                    <CategoryIcon iconId={category.icon || category.id} className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 hover:text-primary-600 transition-colors">
                      {category.name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 hidden md:block">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {/* El enlace "Ver Todo en {category.name}" puede ir a una página que liste todo de la categoría principal,
                      o también a la página de búsqueda solo con el filtro de categoría.
                      Por ahora lo dejo como estaba, pero podrías querer cambiarlo a:
                      to={`/searchresultpage?categoria=${category.id}`}
                  */}
                  <Link
                    to={`/category/${category.id}`} // O considera: `/searchresultpage?categoria=${category.id}`
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium py-2 px-4 rounded-lg hover:bg-primary-50 transition-colors mr-3"
                  >
                    Ver Todo en {category.name}
                  </Link>
                  <button
                    aria-expanded={expandedCategory === category.id}
                    className="p-2 rounded-full hover:bg-gray-100 text-primary-500"
                  >
                    {expandedCategory === category.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 px-6 pb-4 md:hidden">{category.description}</p>

              {expandedCategory === category.id && (
                <div className="bg-gray-50 px-6 py-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Subcategorías en {category.name}:</h3>
                  {category.subcategories && category.subcategories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.subcategories.map((subcategory) => {
                        // Construimos la URL para la página de resultados de búsqueda
                        // Usamos category.id y subcategory.id como parámetros
                        // Si tus IDs no son URL-friendly, considera usar slugs
                        // const categorySlug = createSlug(category.id); // o category.slug si lo tienes
                        // const subcategorySlug = createSlug(subcategory.id); // o subcategory.slug

                        const searchPath = `/searchresultpage?categoria=${encodeURIComponent(category.id)}&subcategoria=${encodeURIComponent(subcategory.id)}`;

                        return (
                          <Link
                            key={subcategory.id}
                            to={searchPath} // <--- AQUÍ EL CAMBIO PRINCIPAL
                            className="group block p-4 bg-white rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out"
                          >
                            <div className="flex items-center">
                              {/* Podrías tener iconos para subcategorías también */}
                              {/* <CategoryIcon iconId={subcategory.icon} className="w-6 h-6 text-secondary-500 mr-3" /> */}
                              <div>
                                <h4 className="font-medium text-gray-800 group-hover:text-secondary-600 transition-colors">
                                  {subcategory.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{subcategory.description}</p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No hay subcategorías disponibles.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
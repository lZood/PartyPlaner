import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { AppServiceType } from '../types';
import ServiceCard from '../components/search/ServiceCard';
import SearchBar from '../components/search/SearchBar';
import { categories } from '../data/categories';
import { Loader2, SearchSlash, Filter, Star as StarIcon, X, RotateCcw } from 'lucide-react'; // Added RotateCcw for clear filters

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface ActiveFilters {
  priceRanges: string[];
  minRating: number;
  features: string[];
}

const initialActiveFilters: ActiveFilters = {
  priceRanges: [],
  minRating: 0,
  features: [],
};

const priceOptions = [
  { id: 'lt5000', label: 'Menos de $5,000', min: 0, max: 4999.99 },
  { id: '5000-10000', label: '$5,000 - $10,000', min: 5000, max: 10000 },
  { id: '10000-20000', label: '$10,000 - $20,000', min: 10001, max: 20000 },
  { id: 'gt20000', label: 'Más de $20,000', min: 20001, max: Infinity },
  { id: 'quotable', label: 'Solicitar cotización', quotable: true },
];

const availableFeatures = ['Entrega incluida', 'Personalizable', 'Equipo de sonido', 'Iluminación básica'];


const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [originalServices, setOriginalServices] = useState<AppServiceType[]>([]);
  const [filteredServices, setFilteredServices] = useState<AppServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('Resultados de Búsqueda');
  const [searchSummary, setSearchSummary] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(initialActiveFilters);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setIsLoading(true);
      setError(null);
      setOriginalServices([]);
      setFilteredServices([]);
      setSearchSummary('');
      // Reset filters on new search, or load from URL if you implement that
      // setActiveFilters(initialActiveFilters); 

      const locationTextParam = searchParams.get('location_text');
      const latParam = searchParams.get('lat');
      const lonParam = searchParams.get('lon');
      const categoryParam = searchParams.get('category');
      const dateParam = searchParams.get('date');

      let titleParts = [];
      let summaryParts = [];

      if (categoryParam) {
        const categoryDetails = categories.find(c => c.id === categoryParam);
        if (categoryDetails) {
          titleParts.push(categoryDetails.name);
          summaryParts.push(categoryDetails.name);
        } else {
          summaryParts.push(`categoría "${categoryParam}"`);
        }
      } else {
        summaryParts.push("todos los servicios");
      }

      if (locationTextParam) {
        titleParts.push(`en ${locationTextParam}`);
        summaryParts.push(`en "${locationTextParam}"`);
      } else if (latParam && lonParam) {
        summaryParts.push(`cerca de tus coordenadas`);
      }

      if (dateParam) {
        try {
            const dateObj = new Date(dateParam + 'T00:00:00');
            const formattedDate = dateObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
            titleParts.push(`para ${formattedDate}`);
            summaryParts.push(`para el ${formattedDate}`);
        } catch(e) { /* no hacer nada si la fecha es inválida */ }
      }
      const dynamicTitle = titleParts.length > 0 ? titleParts.join(' ') : 'Resultados de Búsqueda';
      setPageTitle(dynamicTitle);
      document.title = `${dynamicTitle} | CABETG Party Planner`;
      setSearchSummary(summaryParts.join(' '));

      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('search_services_rpc', {
          p_category_id: categoryParam || null,
          p_search_date: dateParam || null,
          p_location_text: locationTextParam || null,
          p_user_latitude: latParam ? parseFloat(latParam) : null,
          p_user_longitude: lonParam ? parseFloat(lonParam) : null,
        });

        if (rpcError) {
          console.error("RPC Error:", rpcError);
          throw rpcError;
        }
        
        const processedServices = rpcData?.map((service: any) => {
          let imageUrl = 'https://placehold.co/300x200?text=Sin+Imagen';
          if (service.main_image_storage_path) {
            const { data: urlData } = supabase.storage
              .from('service-images')
              .getPublicUrl(service.main_image_storage_path);
            if (urlData) {
              imageUrl = urlData.publicUrl;
            }
          }
          return {
            ...service,
            id: service.id,
            name: service.name,
            shortDescription: service.short_description,
            description: service.description,
            price: service.price,
            imageUrl: imageUrl,
            gallery: [], 
            categoryId: service.category_id,
            subcategoryId: service.subcategory_id,
            rating: service.rating,
            reviewCount: service.review_count,
            features: service.features || [],
            service_type: service.service_type,
            specific_address: service.specific_address,
            base_latitude: service.base_latitude,
            base_longitude: service.base_longitude,
            delivery_radius_km: service.delivery_radius_km,
            provider_id: service.provider_id,
            provider_name: service.provider_name,
            provider_email: service.provider_email,
            provider_phone: service.provider_phone,
            is_approved: service.is_approved,
          } as AppServiceType;
        }) || [];

        setOriginalServices(processedServices);

      } catch (e: any) {
        console.error("Error fetching search results:", e);
        setError(e.message || 'Error al buscar servicios.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchParams]);

  useEffect(() => {
    let servicesToFilter = [...originalServices];

    if (activeFilters.priceRanges.length > 0) {
      servicesToFilter = servicesToFilter.filter(service => {
        return activeFilters.priceRanges.some(rangeId => {
          const option = priceOptions.find(p => p.id === rangeId);
          if (!option) return false;
          if (option.quotable) return service.price === null;
          if (service.price === null) return false;
          return service.price >= (option.min || 0) && service.price <= (option.max || Infinity);
        });
      });
    }

    if (activeFilters.minRating > 0) {
      servicesToFilter = servicesToFilter.filter(service => service.rating >= activeFilters.minRating);
    }

    if (activeFilters.features.length > 0) {
      servicesToFilter = servicesToFilter.filter(service =>
        activeFilters.features.every(feature => service.features.includes(feature))
      );
    }

    setFilteredServices(servicesToFilter);
  }, [originalServices, activeFilters]);


  const handleFilterChange = (filterType: keyof ActiveFilters, value: string | number) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (filterType === 'priceRanges') {
        const currentRanges = newFilters.priceRanges;
        if (currentRanges.includes(value as string)) {
          newFilters.priceRanges = currentRanges.filter(r => r !== value);
        } else {
          newFilters.priceRanges = [...currentRanges, value as string];
        }
      } else if (filterType === 'minRating') {
        newFilters.minRating = newFilters.minRating === value ? 0 : (value as number);
      } else if (filterType === 'features') {
        const currentFeatures = newFilters.features;
        if (currentFeatures.includes(value as string)) {
          newFilters.features = currentFeatures.filter(f => f !== value);
        } else {
          newFilters.features = [...currentFeatures, value as string];
        }
      }
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters(initialActiveFilters);
  };

  const FilterPanel: React.FC<{isMobile?: boolean}> = ({ isMobile = false }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 ${isMobile ? 'h-full overflow-y-auto flex flex-col' : 'sticky top-28'}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-lg text-gray-800">Filtros</h3>
        {isMobile ? (
           <button onClick={() => setShowMobileFilters(false)} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        ) : (
          <button
            onClick={clearAllFilters}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center"
            title="Limpiar todos los filtros"
          >
            <RotateCcw size={14} className="mr-1" />
            Limpiar
          </button>
        )}
      </div>
      
      <div className={isMobile ? 'flex-grow overflow-y-auto pr-2 -mr-2 space-y-6' : 'space-y-6'}>
        {/* Price Filter */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-800 mb-3">Precio</h4>
          <div className="space-y-2">
            {priceOptions.map(option => (
              <label key={option.id} className="flex items-center text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  checked={activeFilters.priceRanges.includes(option.id)}
                  onChange={() => handleFilterChange('priceRanges', option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Rating Filter */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-800 mb-3">Calificación</h4>
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="ratingFilter"
                  className="mr-2 h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  checked={activeFilters.minRating === rating}
                  onChange={() => handleFilterChange('minRating', rating)}
                />
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon 
                      key={i} 
                      size={16} 
                      fill={i < rating ? "currentColor" : "none"}
                      strokeWidth={i < rating ? 0 : 1.5}
                      className={i< rating ? "text-yellow-400" : "text-gray-300"}
                    />
                  ))}
                </div>
                <span className="ml-2">y más</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Features Filter */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Características</h4>
          <div className="space-y-2">
            {availableFeatures.map(feature => (
              <label key={feature} className="flex items-center text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  checked={activeFilters.features.includes(feature)}
                  onChange={() => handleFilterChange('features', feature)}
                />
                <span>{feature}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {isMobile && (
        <div className="mt-auto pt-6 border-t border-gray-200 space-y-3">
            <button 
                onClick={clearAllFilters}
                className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center"
            >
                <RotateCcw size={16} className="mr-2" />
                Limpiar Filtros
            </button>
            <button 
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600"
            >
                Aplicar Filtros
            </button>
        </div>
      )}
    </div>
  );


  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-primary-500 py-8 shadow-md">
        <SearchBar />
      </div>
      
      <div className="container-custom py-8">
        <div className="flex justify-between items-center mb-6">
            {isLoading && originalServices.length === 0 ? ( // Show "Buscando servicios..." only on initial load
                <h1 className="text-2xl font-bold text-gray-700">Buscando servicios...</h1>
            ) : error ? (
                <h1 className="text-2xl font-bold text-red-600">Error en la búsqueda</h1>
            ) : (
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {filteredServices.length} resultado{filteredServices.length !== 1 ? 's' : ''} para tu búsqueda
                    </h1>
                    {searchSummary && <p className="text-md text-gray-600 mt-1">Buscaste: {searchSummary}</p>}
                </div>
            )}
            <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
                <Filter size={18} className="mr-2" />
                Filtros
            </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
            <FilterPanel />
          </div>

          {showMobileFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
              <div className="w-4/5 max-w-sm bg-white h-full shadow-xl">
                <FilterPanel isMobile={true} />
              </div>
            </div>
          )}

          <div className="flex-1">
            {isLoading && originalServices.length === 0 ? ( // Show loader only on initial load
              <div className="flex flex-col justify-center items-center py-20 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
                <p className="mt-4 text-lg text-gray-600">Cargando resultados...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-300 text-red-700 px-6 py-4 rounded-lg shadow-md text-center" role="alert">
                <strong className="font-bold text-lg block mb-2">¡Oops! Algo salió mal.</strong>
                <span className="block sm:inline text-md">{error}</span>
                <p className="mt-4 text-sm">Por favor, intenta tu búsqueda de nuevo o <Link to="/contact" className="text-red-700 underline hover:text-red-900">contacta a soporte</Link> si el problema persiste.</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 md:p-12 text-center">
                <SearchSlash className="mx-auto h-16 w-16 text-gray-400 mb-6" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                  {originalServices.length > 0 ? 'No hay servicios que coincidan con tus filtros' : 'No se encontraron resultados'}
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {originalServices.length > 0 ? 'Intenta ajustar o limpiar los filtros.' : `No pudimos encontrar servicios que coincidan con "${pageTitle}". Intenta ampliar tu búsqueda.`}
                </p>
                {originalServices.length > 0 && (
                   <button
                    onClick={clearAllFilters}
                    className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-6 rounded-lg font-medium mr-0 mb-3 sm:mr-4 sm:mb-0"
                >
                    Limpiar Filtros
                </button>
                )}
                <Link
                    to="/"
                    className="btn bg-primary-500 hover:bg-primary-600 text-white py-2.5 px-6 rounded-lg font-medium"
                >
                    Volver al inicio
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredServices.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
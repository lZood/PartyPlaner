import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom'; // Added Link
import { createClient } from '@supabase/supabase-js';
import { AppServiceType } from '../types';
import ServiceCard from '../components/search/ServiceCard';
import SearchBar from '../components/search/SearchBar';
import { categories } from '../data/categories';
import { Loader2, SearchSlash } from 'lucide-react'; // Added SearchSlash

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [filteredServices, setFilteredServices] = useState<AppServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('Resultados de Búsqueda');
  const [searchSummary, setSearchSummary] = useState('');

  useEffect(() => {
    const fetchSearchResults = async () => {
      setIsLoading(true);
      setError(null);
      setFilteredServices([]);
      setSearchSummary('');

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
            const dateObj = new Date(dateParam + 'T00:00:00'); // Ensure correct parsing
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

        setFilteredServices(processedServices);

      } catch (e: any) {
        console.error("Error fetching search results:", e);
        setError(e.message || 'Error al buscar servicios.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchParams]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-primary-500 py-8 shadow-md">
        <SearchBar />
      </div>
      
      <div className="container-custom py-8">
        <div className="mb-6">
          {isLoading ? (
            <h1 className="text-2xl font-bold text-gray-700">Buscando servicios...</h1>
          ) : error ? (
            <h1 className="text-2xl font-bold text-red-600">Error en la búsqueda</h1>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-800">
                {filteredServices.length} resultado{filteredServices.length !== 1 ? 's' : ''} para tu búsqueda
              </h1>
              {searchSummary && <p className="text-md text-gray-600 mt-1">Buscaste: {searchSummary}</p>}
            </>
          )}
        </div>

        {isLoading ? (
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">No se encontraron resultados</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No pudimos encontrar servicios que coincidan con "{pageTitle}".
              Intenta ajustar los filtros o ampliar tu búsqueda.
            </p>
            <Link
                to="/"
                className="btn bg-primary-500 hover:bg-primary-600 text-white py-2.5 px-6 rounded-lg font-medium"
            >
                Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
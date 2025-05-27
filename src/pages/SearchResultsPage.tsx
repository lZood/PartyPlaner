import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Service as AppServiceType } from '../types';
import ServiceCard from '../components/search/ServiceCard';
import SearchBar from '../components/search/SearchBar';
import { categories } from '../data/categories';
import { Loader2 } from 'lucide-react';

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

  useEffect(() => {
    const fetchSearchResults = async () => {
      setIsLoading(true);
      setError(null);
      setFilteredServices([]);

      const locationParam = searchParams.get('location');
      const categoryParam = searchParams.get('category');
      const dateParam = searchParams.get('date');

      // Actualizar título de la página dinámicamente
      let titleParts = [];
      if (categoryParam) {
        const categoryDetails = categories.find(c => c.id === categoryParam);
        if (categoryDetails) titleParts.push(categoryDetails.name);
      }
      if (locationParam) titleParts.push(`en ${locationParam}`);
      if (dateParam) {
        try {
            const dateObj = new Date(dateParam + 'T00:00:00');
            titleParts.push(`para ${dateObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}`);
        } catch(e) { /* no hacer nada */ }
      }
      const dynamicTitle = titleParts.length > 0 ? titleParts.join(' ') : 'Resultados de Búsqueda';
      setPageTitle(dynamicTitle);
      document.title = `${dynamicTitle} | CABETG Party Planner`;

      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('search_services_rpc', {
          p_category_id: categoryParam || null,
          p_search_date: dateParam || null,
          p_location_text: locationParam || null,
          // p_user_latitude: null, // Necesitarías geocodificar locationParam para esto
          // p_user_longitude: null,
        });

        if (rpcError) {
          console.error("RPC Error:", rpcError);
          throw rpcError;
        }
        
        const processedServices = rpcData?.map((service: any) => { // 'any' aquí, idealmente el tipo de retorno de la RPC
          let imageUrl = 'https://placehold.co/300x200?text=Sin+Imagen';
          if (service.main_image_storage_path) {
            const { data: urlData } = supabase.storage
              .from('service-images') // Tu bucket de imágenes
              .getPublicUrl(service.main_image_storage_path);
            if (urlData) {
              imageUrl = urlData.publicUrl;
            }
          }
          // Mapear campos snake_case de la DB/RPC a camelCase de AppServiceType
          return {
            ...service, // Incluye todos los campos retornados por la RPC
            id: service.id,
            name: service.name,
            shortDescription: service.short_description,
            description: service.description,
            price: service.price,
            imageUrl: imageUrl,
            gallery: [], // La galería completa se carga en ServiceDetailPage
            categoryId: service.category_id,
            subcategoryId: service.subcategory_id,
            rating: service.rating,
            reviewCount: service.review_count,
            features: service.features || [],
            // Campos de ubicación y tipo
            service_type: service.service_type,
            specific_address: service.specific_address,
            base_latitude: service.base_latitude,
            base_longitude: service.base_longitude,
            delivery_radius_km: service.delivery_radius_km,
            // Campos del proveedor
            provider_id: service.provider_id,
            provider_name: service.provider_name,
            provider_email: service.provider_email,
            provider_phone: service.provider_phone,
            is_approved: service.is_approved,
            // availability y options no se están trayendo con esta RPC simple, se cargarían en detalle
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
      <div className="bg-primary-500 py-8">
        <SearchBar />
      </div>
      
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {isLoading ? 'Buscando...' : `${filteredServices.length} resultados para "${pageTitle}"`}
          </h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No se encontraron resultados</h2>
            <p className="text-gray-600">
              Intenta ajustar los filtros de búsqueda o ampliar tu área.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
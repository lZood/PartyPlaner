import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Service as AppServiceType } from '../types'; // Usar el tipo Service de tus definiciones
import ServiceCard from '../components/search/ServiceCard';
import SearchBar from '../components/search/SearchBar'; // Para mostrarla en la parte superior
import { categories } from '../data/categories'; // Para obtener el nombre de la categoría
import { Loader2 } from 'lucide-react';

// Inicializa Supabase (si no está ya disponible globalmente o vía contexto)
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

      const locationParam = searchParams.get('location'); // ej: "Ciudad de México", "CP 12345", "cerca de mi"
      const categoryParam = searchParams.get('category');
      const dateParam = searchParams.get('date'); // YYYY-MM-DD

      // Actualizar título de la página dinámicamente
      let titleParts = [];
      if (categoryParam) {
        const categoryDetails = categories.find(c => c.id === categoryParam);
        if (categoryDetails) titleParts.push(categoryDetails.name);
      }
      if (locationParam) titleParts.push(`en ${locationParam}`);
      if (dateParam) {
        try {
            const dateObj = new Date(dateParam + 'T00:00:00'); // Asegurar que se parsea como local
            titleParts.push(`para ${dateObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}`);
        } catch(e) { /* no hacer nada si la fecha es inválida */ }
      }
      setPageTitle(titleParts.length > 0 ? titleParts.join(' ') : 'Resultados de Búsqueda');
      document.title = `${titleParts.length > 0 ? titleParts.join(' ') : 'Resultados'} | CABETG Party Planner`;


      // Aquí llamarías a tu función RPC de Supabase
      // Ejemplo de cómo se vería la llamada (la función RPC necesita ser creada en tu BD)
      // supabase.rpc('search_services_complex', { params })

      try {
        // CONSTRUCCIÓN DE LA CONSULTA (SIN RPC POR AHORA, SERÁ MENOS EFICIENTE Y MÁS COMPLEJA)
        // ESTA PARTE ES LA MÁS COMPLICADA Y DONDE UNA RPC ES IDEAL.
        // Lo siguiente es una aproximación muy simplificada y necesitaría
        // ser mucho más robusta, especialmente la parte de ubicación.

        let query = supabase.from('services').select(`
          *,
          service_coverage_areas(*),
          service_availability(*),
          service_images!left(storage_path, is_main_image)
        `);

        if (categoryParam) {
          query = query.eq('category_id', categoryParam);
        }

        if (dateParam) {
          // Filtrar por disponibilidad en la fecha
          // Esto es complejo sin RPC. Se podría hacer un join o filtrar después.
          // Aquí un intento de filtrar con join implícito si service_availability está bien relacionada:
           query = query.eq('service_availability.date', dateParam)
                       .eq('service_availability.is_available', true)
                       // Para 'booked_capacity < total_capacity', necesitarías un .lt() o .raw
                       // Esta parte se simplifica mucho con una RPC.
        }
        
        // Filtro de ubicación (MUY SIMPLIFICADO - PostGIS y RPC son mejores aquí)
        if (locationParam) {
            // Para 'fixed_location' o 'multiple_areas', podríamos buscar por ciudad/estado si los tienes
            // query = query.or(`specific_address.ilike.%${locationParam}%,service_coverage_areas.city.ilike.%${locationParam}%`);
            // Para 'delivery_area', necesitarías geocodificación y cálculo de distancia.
            // ESTO ES SOLO UN EJEMPLO MUY BÁSICO Y NO FUNCIONAL PARA TODOS LOS CASOS:
            query = query.or(`specific_address.ilike.%${locationParam}%, city.ilike.%${locationParam}%`, { referencedTable: 'service_coverage_areas' });

        }


        const { data, error: queryError } = await query;

        if (queryError) {
          throw queryError;
        }

        // Mapear los resultados para incluir imageUrl
        const processedServices = data?.map(service => {
            let imageUrl = 'https://placehold.co/300x200?text=Sin+Imagen';
            if (service.service_images && service.service_images.length > 0) {
                const mainImage = service.service_images.find((img: any) => img.is_main_image) || service.service_images[0];
                if (mainImage?.storage_path) {
                    imageUrl = supabase.storage.from('service-images').getPublicUrl(mainImage.storage_path).data.publicUrl;
                }
            }
            return {
                ...service,
                // Asegúrate de que los nombres de campo coincidan con tu tipo AppServiceType
                shortDescription: service.short_description,
                categoryId: service.category_id,
                subcategoryId: service.subcategory_id,
                reviewCount: service.review_count,
                imageUrl,
                // gallery: service.service_images?.map((img: any) => supabase.storage.from('service-images').getPublicUrl(img.storage_path).data.publicUrl) || [], // Si necesitas la galería completa aquí
            } as AppServiceType;
        }).filter(service => {
            // Filtro de disponibilidad post-consulta si no se pudo hacer en la query principal de forma eficiente
            if (dateParam) {
                const availabilityRecord = service.availability?.find(avail => avail.date === dateParam);
                return availabilityRecord ? (availabilityRecord.is_available && availabilityRecord.booked_capacity < availabilityRecord.total_capacity) : false; // O true si no hay registro significa disponible por defecto? Decide tu lógica.
            }
            return true;
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
        {/* Puedes reutilizar tu componente SearchBar aquí para permitir al usuario refinar la búsqueda */}
        <SearchBar />
      </div>
      
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {isLoading ? 'Buscando...' : `${filteredServices.length} resultados para "${pageTitle}"`}
          </h1>
          {/* Aquí podrías añadir más filtros (precio, calificación, etc.) */}
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
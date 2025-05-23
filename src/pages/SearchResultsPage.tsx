import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { services } from '../data/services';
import { categories } from '../data/categories';
import ServiceCard from '../components/search/ServiceCard';
import SearchBar from '../components/search/SearchBar';

const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [filteredServices, setFilteredServices] = useState(services);

  useEffect(() => {
    const location = searchParams.get('location');
    const category = searchParams.get('category');
    const date = searchParams.get('date');

    const filtered = services.filter(service => {
      let matches = true;

      if (category) {
        matches = matches && service.categoryId === category;
      }

      if (date) {
        // Check service availability for the selected date
        matches = matches && service.availability?.some(
          a => a.date === date && a.isAvailable && a.bookedCapacity < a.totalCapacity
        );
      }

      // Location filtering would typically involve geographic coordinates
      // For now, we'll just simulate it
      if (location) {
        matches = matches && true; // Placeholder for location filtering
      }

      return matches;
    });

    setFilteredServices(filtered);
    
    // Update page title
    const categoryName = category ? categories.find(c => c.id === category)?.name : '';
    document.title = `${categoryName || 'Búsqueda'} | CABETG Party Planner`;
  }, [searchParams]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-primary-500 py-8">
        <SearchBar />
      </div>
      
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {filteredServices.length} resultados encontrados
          </h1>
        </div>

        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No se encontraron resultados</h2>
            <p className="text-gray-600">
              Intenta ajustar los filtros de búsqueda para ver más opciones.
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
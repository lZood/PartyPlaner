// src/pages/HomePage.tsx
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppServiceType, Category as AppCategoryType } from '../types'; // Assuming Service type is AppServiceType
import { categories as staticCategoriesData } from '../data/categories'; // Static category data for names, icons etc.

import HeroSection from '../components/home/HeroSection';
// import CategorySection from '../components/home/CategorySection'; // We might replace or modify this
import FeaturedServices from '../components/home/FeaturedServices'; // This can stay if it fetches its own featured services
import TestimonialsSection from '../components/home/TestimonialsSection';
import CTASection from '../components/home/CTASection';
import { Loader2, PackageSearch, ArrowRight } from 'lucide-react';
import ServiceCard from '../components/search/ServiceCard'; // To display services

const supabase: SupabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface CategoryWithServices extends AppCategoryType {
  services: AppServiceType[];
}

const HomePage: React.FC = () => {
  const [categoriesWithServices, setCategoriesWithServices] = useState<CategoryWithServices[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    document.title = 'CABETG Party Planner - Tu Evento Perfecto Comienza Aquí';

    const fetchServicesForCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const populatedCategories: CategoryWithServices[] = [];

        for (const staticCategory of staticCategoriesData.slice(0, 4)) { // Fetch for first 4 static categories for example
          const { data: servicesData, error: servicesError } = await supabase
            .from('services')
            .select(`
              *,
              service_images (storage_path, is_main_image)
            `)
            .eq('category_id', staticCategory.id)
            .eq('is_approved', true) // Only show approved services
            .order('created_at', { ascending: false })
            .limit(4); // Fetch up to 4 services per category

          if (servicesError) {
            console.error(`Error fetching services for category ${staticCategory.name}:`, servicesError);
            // Continue to next category or handle error as needed
            populatedCategories.push({
              ...staticCategory,
              services: [], // Add category even if services fetch fails, or skip
            });
            continue;
          }

          const processedServices = servicesData?.map(service => {
            let imageUrl = 'https://placehold.co/300x200?text=Sin+Imagen';
            const mainImageRecord = service.service_images?.find((img: any) => img.is_main_image) || service.service_images?.[0];
            
            if (mainImageRecord?.storage_path) {
              const { data: urlData } = supabase.storage.from('service-images').getPublicUrl(mainImageRecord.storage_path);
              if (urlData?.publicUrl) {
                imageUrl = urlData.publicUrl;
              }
            }

            return {
              id: service.id,
              name: service.name,
              description: service.description,
              shortDescription: service.short_description,
              price: service.price,
              imageUrl: imageUrl,
              gallery: [], // Gallery not typically needed for home page cards, but can be fetched if necessary
              categoryId: service.category_id,
              subcategoryId: service.subcategory_id,
              rating: service.rating || 0,
              reviewCount: service.review_count || 0,
              features: service.features || [],
              options: service.options || [],
              availability: [], // Availability details usually not needed for home page cards
              service_type: service.service_type,
              specific_address: service.specific_address,
              base_latitude: service.base_latitude,
              base_longitude: service.base_longitude,
              delivery_radius_km: service.delivery_radius_km,
              coverage_areas: service.coverage_areas || [],
              provider_id: service.provider_id,
              provider_name: service.provider_name,
              provider_phone: service.provider_phone,
              provider_email: service.provider_email,
              is_approved: service.is_approved,
            } as AppServiceType;
          }) || [];

          populatedCategories.push({
            ...staticCategory,
            services: processedServices,
          });
        }
        setCategoriesWithServices(populatedCategories);
      } catch (error) {
        console.error("Error fetching categories with services:", error);
        // Set to static categories with empty services as a fallback or handle error
        setCategoriesWithServices(staticCategoriesData.map(cat => ({ ...cat, services: [] })));
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchServicesForCategories();
  }, []);

  return (
    <>
      <HeroSection />

      {/* Dynamic Category Sections */}
      <div className="py-12 bg-white sm:py-16">
        <div className="container-custom">
          {isLoadingCategories ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
              <p className="ml-4 text-lg text-gray-600">Cargando categorías y servicios...</p>
            </div>
          ) : categoriesWithServices.length > 0 ? (
            categoriesWithServices.map((category) => (
              category.services.length > 0 && ( // Only render section if category has services
                <section key={category.id} className="mb-12 sm:mb-16 last:mb-0">
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-0">
                      {category.name}
                    </h2>
                    <Link
                      to={`/category/${category.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center group"
                    >
                      Ver todo en {category.name}
                      <ArrowRight size={16} className="ml-1.5 transform transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>
                  {category.services.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                      {category.services.map((service) => (
                        <ServiceCard key={service.id} service={service} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <PackageSearch size={40} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600">No hay servicios disponibles en esta categoría por el momento.</p>
                    </div>
                  )}
                </section>
              )
            ))
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-600 text-lg">No se pudieron cargar las categorías y servicios.</p>
            </div>
          )}
           {/* Link to all categories page */}
           {!isLoadingCategories && categoriesWithServices.length > 0 && (
             <div className="mt-10 text-center">
                <Link
                    to="/categories"
                    className="btn btn-outline border-primary-500 text-primary-600 hover:bg-primary-50 py-2.5 px-8 text-base"
                >
                    Explorar Todas las Categorías
                </Link>
            </div>
           )}
        </div>
      </div>


      {/* You can keep FeaturedServices if it has a different logic, e.g., manually curated or top-rated overall */}
      {/* <FeaturedServices /> */}
      
      <TestimonialsSection />
      <CTASection />
    </>
  );
};

export default HomePage;
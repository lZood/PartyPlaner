import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import Slider from 'react-slick';
import {
  Star,
  Heart as HeartIcon, // Renamed to avoid conflict
  CheckCircle,
  Truck,
  CalendarDays as Calendar,
  Clock,
  MinusCircle,
  PlusCircle,
  Loader2, // Keep as Loader2, will rename if specific instance needed
  MapPin,
  Briefcase,
  Users,
  ShoppingBag,
  ChevronLeft, // Added for calendar
  ChevronRight // Added for calendar
} from 'lucide-react';
import { categories as mockCategories } from '../data/categories';
import { services as mockServicesData } from '../data/services';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import AuthModal from '../components/auth/AuthModal';
import { AppServiceType, Category as AppCategoryType, Subcategory as AppSubcategoryType, ServiceCoverageArea, ServiceAvailability } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js'; // Added SupabaseClient
import { useReservation } from '../contexts/ReservationContext';
import { toast } from 'react-toastify';

const supabase: SupabaseClient = createClient( // Added SupabaseClient type
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface AvailabilityCalendarProps {
  availability: ServiceAvailability[];
  onDateSelect: (date: Date) => void;
  selectedServiceDate: string | null;
  isLoading?: boolean;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ availability, onDateSelect, selectedServiceDate, isLoading }) => {
  const [displayMonth, setDisplayMonth] = useState(new Date().getMonth());
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

  const renderCalendarDays = () => {
    const daysInSelectedMonth = getDaysInMonth(displayYear, displayMonth);
    const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
    const daysArray = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(<div key={`blank-${i}`} className="p-1 border text-center h-10 sm:h-12"></div>);
    }

    for (let day = 1; day <= daysInSelectedMonth; day++) {
      const currentDate = new Date(displayYear, displayMonth, day);
      currentDate.setHours(0, 0, 0, 0);
      const dateString = currentDate.toISOString().split('T')[0];
      
      const dayAvailability = availability.find(a => a.date === dateString);
      let cellClass = "p-1 border text-center text-xs sm:text-sm h-10 sm:h-12 flex items-center justify-center transition-all duration-150 ease-in-out ";
      const isCurrentlySelected = selectedServiceDate === dateString;
      let isClickable = false;

      if (currentDate < today) {
        cellClass += "bg-gray-200 text-gray-400 cursor-not-allowed opacity-70";
      } else if (dayAvailability) {
        if (dayAvailability.isAvailable && dayAvailability.totalCapacity > dayAvailability.bookedCapacity) {
          isClickable = true;
          cellClass += isCurrentlySelected 
            ? "bg-primary-500 text-white font-semibold ring-2 ring-primary-300 shadow-lg transform scale-105" 
            : "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer hover:shadow-md";
        } else {
          cellClass += "bg-red-100 text-red-700 line-through cursor-not-allowed opacity-70";
        }
      } else {
        cellClass += "bg-gray-100 text-gray-500 cursor-not-allowed opacity-70";
      }
      daysArray.push(
        <div
          key={day}
          className={cellClass}
          title={isClickable ? `Seleccionar ${dateString}` : (dayAvailability ? (dayAvailability.isAvailable ? `Lleno (Reservado: ${dayAvailability.bookedCapacity}/${dayAvailability.totalCapacity})` : 'No disponible') : 'No disponible')}
          onClick={() => {
            if (isClickable) {
              onDateSelect(currentDate);
            }
          }}
        >
          {day}
        </div>
      );
    }
    return daysArray;
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="mt-6 p-3 sm:p-4 border border-gray-200 rounded-lg bg-white shadow">
      <h3 className="text-base sm:text-md font-semibold mb-3 text-gray-700">Disponibilidad del Servicio</h3>
      {isLoading && <div className="text-sm text-gray-500 text-center py-2">Cargando disponibilidad...</div>}
      <div className="flex justify-between items-center mb-2">
        <button 
          onClick={() => {
            if (displayMonth === 0) { setDisplayMonth(11); setDisplayYear(displayYear - 1); }
            else { setDisplayMonth(displayMonth - 1); }
          }} 
          disabled={isLoading || (displayYear === today.getFullYear() && displayMonth === today.getMonth())}
          className="text-primary-500 p-1.5 rounded-full hover:bg-primary-50 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-medium text-gray-800 text-sm sm:text-base">{monthNames[displayMonth]} {displayYear}</span>
        <button 
          onClick={() => {
            if (displayMonth === 11) { setDisplayMonth(0); setDisplayYear(displayYear + 1); }
            else { setDisplayMonth(displayMonth + 1); }
          }} 
          disabled={isLoading}
          className="text-primary-500 p-1.5 rounded-full hover:bg-primary-50 disabled:text-gray-300"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-1">
        {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {renderCalendarDays()}
      </div>
      <p className="text-xs text-gray-500 mt-2">Selecciona una fecha disponible para añadir a tu lista.</p>
    </div>
  );
};


const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const { cart, addToCart } = useCart(); // Removed isInCart as we'll check with event date
  const { isAuthenticated, user, addFavorite, removeFavorite, isFavorite } = useAuth(); // Auth context for favorites
  const { selectedDate: globalSelectedDate } = useReservation();
  const navigate = useNavigate(); // For navigation
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  // const [selectedOptions, setSelectedOptions] = useState<string[]>([]); // Not used in current logic, can be added if needed

  const [service, setService] = useState<AppServiceType | null>(null);
  const [category, setCategory] = useState<AppCategoryType | null>(null);
  const [subcategory, setSubcategory] = useState<AppSubcategoryType | null>(null);
  // const [coverageAreas, setCoverageAreas] = useState<ServiceCoverageArea[]>([]); // Can be derived from service.coverage_areas
  const [serviceAvailabilities, setServiceAvailabilities] = useState<ServiceAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedEventDateForService, setSelectedEventDateForService] = useState<string | null>(null);
  const [isFavoritingDetail, setIsFavoritingDetail] = useState(false); // State for favorite button loading

  const isCurrentlyFavoriteDetail = service ? isFavorite(service.id) : false;

  const handleToggleFavoriteDetail = async () => {
    if (!service) return;
    if (!isAuthenticated || !user) {
      setShowAuthModal(true); 
      return;
    }
    setIsFavoritingDetail(true);
    try {
      if (isCurrentlyFavoriteDetail) {
        await removeFavorite(service.id);
        toast.info(`${service.name} eliminado de tus favoritos.`);
      } else {
        await addFavorite(service.id);
        toast.success(`${service.name} añadido a tus favoritos!`);
      }
    } catch (error) {
      // Error handling is done in AuthContext's addFavorite/removeFavorite
    } finally {
      setIsFavoritingDetail(false);
    }
  };


  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!serviceId) {
        setIsLoading(false); setService(null); return;
      }
      setIsLoading(true);
      setSelectedEventDateForService(null);

      try {
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('*, service_coverage_areas(*)') // Fetch coverage areas here
          .eq('id', serviceId)
          .maybeSingle();

        if (serviceError) throw serviceError;
        if (!serviceData) {
          setService(null); setIsLoading(false); return;
        }

        const { data: galleryData } = await supabase
          .from('service_images')
          .select('storage_path, is_main_image')
          .eq('service_id', serviceId)
          .order('position', { ascending: true });

        let mainImageUrl = 'https://placehold.co/600x400?text=No+Imagen';
        const galleryImageUrls: string[] = [];
        if (galleryData && galleryData.length > 0) {
          let mainImageRecord = galleryData.find(img => img.is_main_image) || galleryData[0];
          if (mainImageRecord?.storage_path) {
            const { data: mainUrlData } = supabase.storage.from('service-images').getPublicUrl(mainImageRecord.storage_path);
            if (mainUrlData?.publicUrl) mainImageUrl = mainUrlData.publicUrl;
          }
          galleryData.forEach(img => {
            if (img.storage_path) {
              const { data: urlData } = supabase.storage.from('service-images').getPublicUrl(img.storage_path);
              if (urlData?.publicUrl) galleryImageUrls.push(urlData.publicUrl);
            }
          });
        }
        
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 90); 
        
        const { data: availabilityDataSupabase, error: availabilityError } = await supabase
            .from('service_availability')
            .select('id, service_id, date, total_capacity, booked_capacity, is_available')
            .eq('service_id', serviceId)
            .gte('date', today.toISOString().split('T')[0])
            .lte('date', futureDate.toISOString().split('T')[0])
            .order('date', { ascending: true });

        if (availabilityError) console.error('Error fetching availability:', availabilityError.message);
        
        const mappedAvailabilities: ServiceAvailability[] = (availabilityDataSupabase || []).map((a: any) => ({
            id: a.id,
            serviceId: a.service_id, // Ensure this maps correctly
            date: a.date,
            totalCapacity: a.total_capacity,
            bookedCapacity: a.booked_capacity,
            isAvailable: a.is_available,
        }));
        setServiceAvailabilities(mappedAvailabilities);

        const populatedService: AppServiceType = {
          id: serviceData.id, name: serviceData.name, description: serviceData.description,
          shortDescription: serviceData.short_description, price: serviceData.price,
          imageUrl: mainImageUrl, gallery: galleryImageUrls.length > 0 ? galleryImageUrls : (mainImageUrl.startsWith('http') ? [mainImageUrl] : []),
          categoryId: serviceData.category_id, subcategoryId: serviceData.subcategory_id,
          rating: serviceData.rating, reviewCount: serviceData.review_count,
          features: serviceData.features || [], 
          availability: mappedAvailabilities, // Use the mapped availabilities
          options: serviceData.options || [], service_type: serviceData.service_type,
          specific_address: serviceData.specific_address, base_latitude: serviceData.base_latitude,
          base_longitude: serviceData.base_longitude, delivery_radius_km: serviceData.delivery_radius_km,
          provider_id: serviceData.provider_id, provider_name: serviceData.provider_name,
          provider_email: serviceData.provider_email, provider_phone: serviceData.provider_phone,
          is_approved: serviceData.is_approved, 
          coverage_areas: serviceData.service_coverage_areas || [],
        };
        setService(populatedService);
        // setCoverageAreas(serviceData.service_coverage_areas || []); // This can be accessed via service.coverage_areas

        if (globalSelectedDate && mappedAvailabilities.length > 0) { // Check if mappedAvailabilities has items
            const globalDateStr = globalSelectedDate.toISOString().split('T')[0];
            const isAvailableGlobal = mappedAvailabilities.find(
                (a: ServiceAvailability) => a.date === globalDateStr && a.isAvailable && a.totalCapacity > a.bookedCapacity
            );
            if (isAvailableGlobal) {
                setSelectedEventDateForService(globalDateStr);
            }
        }

        const cat = mockCategories.find((c) => c.id === populatedService.categoryId);
        if (cat) {
          setCategory(cat);
          const subcat = cat.subcategories.find((s) => s.id === populatedService.subcategoryId);
          setSubcategory(subcat || null);
        } else { setCategory(null); setSubcategory(null); }

      } catch (error: any) { console.error('Failed to fetch service details:', error.message); setService(null); }
      finally { setIsLoading(false); }
    };
    fetchServiceDetails();
  }, [serviceId, globalSelectedDate]); // Added supabase to dependencies if it's not stable

  useEffect(() => {
    if (service) { document.title = `${service.name} | CABETG Party Planner`; window.scrollTo(0, 0); }
    else if (!isLoading && service === null) { document.title = 'Servicio no encontrado | CABETG Party Planner'; }
  }, [service, isLoading]);

  const calculateTotalPrice = (): number | null => {
    if (!service || typeof service.price !== 'number') return null;
    let currentPrice = service.price;
    // Logic for selectedOptions can be added here if they affect price
    return currentPrice * quantity;
  };

  const totalPrice = calculateTotalPrice();
  const sliderSettings = { dots: true, infinite: true, speed: 500, slidesToShow: 1, slidesToScroll: 1, arrows: true, adaptiveHeight: true };
  
  // Corrected: Use AppServiceType for mockServicesData if that's its type
  const similarServices = service ? mockServicesData.filter((s: AppServiceType) => s.id !== serviceId && s.categoryId === service?.categoryId && s.subcategoryId === service?.subcategoryId).slice(0, 3) : [];
  // const handleToggleOption = (optionId: string) => setSelectedOptions((prev) => prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]);
  
  const handleDateSelectionInDetail = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedEventDateForService(dateStr);
    toast.info(`Fecha seleccionada: ${date.toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})}`, {position: "bottom-right", autoClose: 2000});
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated || !user) { setShowAuthModal(true); return; }
    if (service) {
      if (!selectedEventDateForService) {
        toast.warn("Por favor, selecciona una fecha de disponibilidad para el servicio desde el calendario.", {position: "bottom-right"});
        return;
      }
      setIsAddingToCart(true);
      try {
          const { data: availabilityCheck, error: checkError } = await supabase
              .from('service_availability')
              .select('total_capacity, booked_capacity, is_available')
              .eq('service_id', service.id)
              .eq('date', selectedEventDateForService)
              .single();

          if (checkError && checkError.code !== 'PGRST116') {
              throw checkError;
          }
          
          if (!availabilityCheck || !availabilityCheck.is_available || (availabilityCheck.booked_capacity + quantity) > availabilityCheck.total_capacity) {
              toast.error(`El servicio ya no está disponible o excede la capacidad para el ${new Date(selectedEventDateForService + 'T00:00:00Z').toLocaleDateString('es-MX', {day:'numeric', month:'short'})}. Por favor, selecciona otra fecha o ajusta la cantidad.`, {position: "bottom-right", autoClose: 4000});
              setIsAddingToCart(false);
              return;
          }
          
          addToCart(service, quantity, selectedEventDateForService); // Pass selectedEventDateForService
          toast.success(`${service.name} añadido a tu lista para el ${new Date(selectedEventDateForService + 'T00:00:00Z').toLocaleDateString('es-MX', {day:'numeric', month:'short'})}!`, {position: "bottom-right"});

      } catch (error: any) {
          toast.error(`Error al verificar disponibilidad: ${error.message}. Intenta de nuevo.`, {position: "bottom-right"});
      } finally {
          setIsAddingToCart(false);
      }
    }
  };
  
  // Check if the specific item (service + date + quantity) is in cart for "Ver en mi lista" button
  const itemInCart = cart.items.find(item => 
    item.service.id === serviceId && 
    item.eventDate === selectedEventDateForService &&
    item.quantity === quantity // Optional: only show "Ver en mi lista" if quantity also matches
  );


  if (isLoading && !service) { 
    return (
      <div className="container-custom py-16 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-500" />
        <p className="mt-4 text-lg text-gray-600">Cargando detalles del servicio...</p>
      </div>
    );
  }
  if (!service) { 
     return (
      <div className="container-custom py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Servicio no encontrado</h2>
        <p className="mb-8 text-gray-600">Lo sentimos, el servicio que buscas no existe o no pudo ser cargado.</p>
        <Link to="/" className="btn btn-primary py-2.5 px-6">Volver al inicio</Link>
      </div>
    );
  }
  
  const categoryName = category ? category.name : (service.categoryId || 'Categoría');
  const subcategoryName = subcategory ? subcategory.name : (service.subcategoryId || 'Subcategoría');

  return (
    <div className="bg-gray-50 py-10 sm:py-12">
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={() => { 
            setShowAuthModal(false); 
            if (service && user && !isCurrentlyFavoriteDetail) { // If modal was for favoriting
                handleToggleFavoriteDetail();
            } else if (service && selectedEventDateForService && user) { // If modal was for adding to cart
                handleAddToCart();
            }
        }} 
        pendingService={service} 
        pendingQuantity={quantity} 
      />
      <div className="container-custom">
        <nav className="mb-6 sm:mb-8 text-xs sm:text-sm text-gray-500">
            <ol className="flex flex-wrap items-center">
              <li className="flex items-center"> <Link to="/" className="hover:text-primary-500">Inicio</Link> <span className="mx-2">/</span> </li>
              {category && <li className="flex items-center"> <Link to={`/category/${category.id}`} className="hover:text-primary-500">{categoryName}</Link> <span className="mx-2">/</span> </li>}
              {subcategory && <li className="flex items-center"> <Link to={`/category/${category?.id}/${subcategory.id}`} className="hover:text-primary-500">{subcategoryName}</Link> <span className="mx-2">/</span> </li>}
              <li className="text-primary-500 font-medium truncate max-w-[200px] sm:max-w-xs">{service.name}</li>
            </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2">
             <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {service.gallery && service.gallery.length > 0 ? (
                <Slider {...sliderSettings}>
                  {service.gallery.map((image, index) => ( <div key={index} className="h-72 sm:h-96"><img src={image} alt={`${service.name} - Imagen ${index + 1}`} className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=Error+Imagen')}/></div> ))}
                </Slider>
              ) : ( <div className="h-72 sm:h-96 flex items-center justify-center bg-gray-100"><img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).src = 'https://placehold.co/800x600?text=Sin+Imagen')}/></div> )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex-1 pr-2">{service.name}</h1>
                    <button 
                        onClick={handleToggleFavoriteDetail}
                        disabled={isFavoritingDetail}
                        className={`p-1.5 rounded-full transition-all duration-200 ease-in-out transform hover:scale-110
                                    ${isFavoritingDetail ? 'cursor-not-allowed' : (isCurrentlyFavoriteDetail ? 'hover:bg-pink-50' : 'hover:bg-gray-100') }
                                    focus:outline-none focus:ring-2 focus:ring-pink-300`}
                        aria-label={isCurrentlyFavoriteDetail ? "Quitar de favoritos" : "Añadir a favoritos"}
                    >
                        <HeartIcon 
                            size={22} 
                            className={`${isCurrentlyFavoriteDetail ? 'text-pink-500 fill-current' : 'text-gray-400 hover:text-pink-500'}`}
                        />
                    </button>
                </div>
                <div className="flex items-center mb-3 sm:mb-4 text-sm">
                    <div className="flex text-yellow-400">{[...Array(5)].map((_, i) => ( <Star key={i} size={16} fill={i < Math.floor(service.rating) ? "currentColor" : "none"} strokeWidth={i < Math.floor(service.rating) ? 0 : 1.5} className={i < Math.floor(service.rating) ? "text-yellow-400" : "text-gray-300"}/> )) }</div>
                    <span className="text-gray-600 ml-1.5">{service.rating.toFixed(1)} ({service.reviewCount} reseñas)</span>
                </div>
                <div className="mb-4 sm:mb-6">
                    <div className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">{service.price ? `$${service.price.toLocaleString('es-MX')}` : <span className="text-primary-500">Solicitar Cotización</span>}</div>
                    <p className="text-xs sm:text-sm text-gray-500">{service.price ? "Precio base por unidad/servicio" : "El precio varía según especificaciones"}</p>
                </div>
                
                {service.price && (
                    <div className="mb-4 sm:mb-6">
                        <div className="flex justify-between items-center mb-1.5">
                            <div className="font-medium text-sm text-gray-700">Cantidad</div>
                            <div className="flex items-center">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-gray-500 hover:text-primary-500 disabled:opacity-50 p-1 rounded-full hover:bg-gray-100" disabled={quantity <= 1 || isAddingToCart}><MinusCircle size={18} /></button>
                                <span className="mx-3 w-8 text-center text-sm font-medium">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="text-gray-500 hover:text-primary-500 p-1 rounded-full hover:bg-gray-100" disabled={isAddingToCart}><PlusCircle size={18} /></button>
                            </div>
                        </div>
                    </div>
                )}
              
              <div className="mb-4 sm:mb-6 border-t border-gray-200 pt-4">
                <h3 className="font-medium mb-2 text-sm text-gray-700">Ubicación y Cobertura</h3>
                {service.provider_name && <p className="text-xs text-gray-600 flex items-center mb-1"><Briefcase size={13} className="mr-1.5 text-gray-400"/> Proveedor: {service.provider_name}</p>}
                {service.service_type === 'fixed_location' && service.specific_address && (
                  <p className="text-xs text-gray-600 flex items-center"><MapPin size={13} className="mr-1.5 text-gray-400"/> {service.specific_address}</p>
                )}
                {service.service_type === 'delivery_area' && (
                  <>
                    {service.specific_address && <p className="text-xs text-gray-600 flex items-center mb-0.5"><MapPin size={13} className="mr-1.5 text-gray-400"/> Base: {service.specific_address}</p>}
                    {service.delivery_radius_km && <p className="text-xs text-gray-600 flex items-center"><Truck size={13} className="mr-1.5 text-gray-400"/> Radio de entrega: {service.delivery_radius_km} km</p>}
                  </>
                )}
                 {service.service_type === 'multiple_areas' && service.coverage_areas && service.coverage_areas.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-600 flex items-center mb-1"><Users size={13} className="mr-1.5 text-gray-400"/> Cubre las siguientes zonas:</p>
                        <ul className="list-disc list-inside pl-4 space-y-0.5">
                            {service.coverage_areas.slice(0, 3).map(area => <li key={area.id || area.area_name} className="text-xs text-gray-500">{area.area_name}{area.city ? `, ${area.city}`: ''}</li>)}
                            {service.coverage_areas.length > 3 && <li className="text-xs text-gray-400">...y más.</li>}
                        </ul>
                    </div>
                )}
              </div>

              <AvailabilityCalendar 
                availability={serviceAvailabilities} 
                onDateSelect={handleDateSelectionInDetail}
                selectedServiceDate={selectedEventDateForService}
                isLoading={isLoading} // Pass isLoading from service detail fetch
              />
              
              <div className="mt-4 mb-5 p-3 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-600 mb-0.5">Fecha seleccionada para este servicio:</h3>
                <p className={`text-base font-medium ${selectedEventDateForService ? 'text-primary-600' : 'text-gray-500 italic'}`}>
                  {selectedEventDateForService 
                    ? new Date(selectedEventDateForService + 'T00:00:00Z').toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                    : "Ninguna. Elige del calendario."}
                </p>
              </div>

               {totalPrice !== null && (<div className="flex justify-between items-center py-3 mb-4 border-t border-b border-gray-200 mt-6"><div className="text-md font-medium">Total Estimado</div><div className="text-lg font-bold">${totalPrice.toLocaleString('es-MX')}</div></div>)}
               
               {itemInCart ? (
                  <Link 
                    to="/cart" 
                    className="btn w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 rounded-lg font-medium flex items-center justify-center text-sm shadow-sm"
                  > <ShoppingBag size={16} className="mr-2"/> Ver en mi lista ({new Date(itemInCart.eventDate + 'T00:00:00Z').toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})}) </Link>
                ) : (
                  <button 
                    onClick={handleAddToCart} 
                    disabled={!selectedEventDateForService || isAddingToCart}
                    className={`btn w-full bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-lg font-semibold mt-2 shadow-md hover:shadow-lg transition-all flex items-center justify-center text-sm ${(!selectedEventDateForService || isAddingToCart) ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {isAddingToCart ? <Loader2 size={18} className="animate-spin mr-2" /> : <ShoppingBag size={16} className="mr-2"/>}
                    {isAddingToCart ? 'Añadiendo...' : (service.price ? 'Añadir a Mi Lista' : 'Solicitar Cotización')}
                    {selectedEventDateForService && !isAddingToCart && ` (${new Date(selectedEventDateForService + 'T00:00:00Z').toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})})`}
                  </button>
                )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-8">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 border-b pb-3 text-gray-800">Descripción del Servicio</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm">{service.description}</p>
                
                {service.features && service.features.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                        <h3 className="text-lg font-semibold mb-3 text-gray-700">Características Incluidas</h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {service.features.map((feature, index) => (
                                <li key={index} className="flex items-center text-sm text-gray-600">
                                    <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <div className="lg:col-span-1">
                {similarServices.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Servicios Similares</h2>
                        <div className="space-y-4">
                            {similarServices.map(simService => (
                                <Link key={simService.id} to={`/service/${simService.id}`} className="group block p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="flex items-start space-x-3">
                                        <img src={simService.imageUrl} alt={simService.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64?text=N/A'; }}/>
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 group-hover:text-primary-600 line-clamp-2">{simService.name}</h4>
                                            <p className="text-xs text-gray-500 line-clamp-1">{simService.shortDescription}</p>
                                            <div className="text-sm font-medium text-primary-500 mt-0.5">{simService.price ? `$${simService.price.toLocaleString('es-MX')}` : 'Cotizar'}</div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
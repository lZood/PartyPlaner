import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import Slider from 'react-slick';
import {
  Star, Heart, CheckCircle, Truck, CalendarDays as Calendar, Clock, MinusCircle, PlusCircle, Loader2, MapPin, Briefcase, Users, ShoppingBag
} from 'lucide-react';
import { categories as mockCategories } from '../data/categories';
import { services as mockServicesData } from '../data/services'; // Para servicios similares
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import AuthModal from '../components/auth/AuthModal';
import { AppServiceType, Category as AppCategoryType, Subcategory as AppSubcategoryType, ServiceCoverageArea, ServiceAvailability } from '../types';
import { createClient } from '@supabase/supabase-js';
import { useReservation } from '../contexts/ReservationContext';
import { toast } from 'react-toastify';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface AvailabilityCalendarProps {
  availability: ServiceAvailability[];
  onDateSelect: (date: Date) => void;
  selectedServiceDate: string | null; // Formato YYYY-MM-DD
  isLoading?: boolean; // Opcional para mostrar estado de carga
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ availability, onDateSelect, selectedServiceDate, isLoading }) => {
  const [displayMonth, setDisplayMonth] = useState(new Date().getMonth());
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparaciones

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

  const renderCalendarDays = () => {
    const daysInSelectedMonth = getDaysInMonth(displayYear, displayMonth);
    const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay(); // Domingo = 0, Lunes = 1...
    const daysArray = [];

    // Espacios en blanco al inicio del mes
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
        // Día futuro sin registro explícito de disponibilidad: podría ser disponible por defecto
        // o no disponible. Para este caso, lo trataremos como no disponible explícitamente
        // a menos que la lógica de negocio diga lo contrario (ej. si no hay registro es que está disponible).
        // Por ahora, si no hay registro, no es seleccionable.
        cellClass += "bg-gray-100 text-gray-500 cursor-not-allowed opacity-70";
      }
      daysArray.push(
        <div
          key={day}
          className={cellClass}
          title={isClickable ? `Seleccionar ${dateString}` : (dayAvailability ? (dayAvailability.isAvailable ? `Lleno (Reservado: ${dayAvailability.bookedCapacity}/${dayAvailability.totalCapacity})` : 'No disponible') : 'No disponible')}
          onClick={() => {
            if (isClickable) { // Solo llama a onDateSelect si es clickeable
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
          <ChevronLeft size={20} /> {/* Asumiendo que importas ChevronLeft */}
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
          <ChevronRight size={20} /> {/* Asumiendo que importas ChevronRight */}
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
  const { cart, addToCart, isInCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { selectedDate: globalSelectedDate } = useReservation();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const [service, setService] = useState<AppServiceType | null>(null);
  const [category, setCategory] = useState<AppCategoryType | null>(null);
  const [subcategory, setSubcategory] = useState<AppSubcategoryType | null>(null);
  const [coverageAreas, setCoverageAreas] = useState<ServiceCoverageArea[]>([]);
  const [serviceAvailabilities, setServiceAvailabilities] = useState<ServiceAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false); // Para el botón de añadir
  const [selectedEventDateForService, setSelectedEventDateForService] = useState<string | null>(null); // Formato YYYY-MM-DD

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!serviceId) {
        setIsLoading(false); setService(null); return;
      }
      setIsLoading(true);
      setSelectedEventDateForService(null); // Resetear fecha al cambiar de servicio

      try {
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('*, service_coverage_areas(*)')
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
            serviceId: a.service_id,
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
          features: serviceData.features || [], availability: mappedAvailabilities,
          options: serviceData.options || [], service_type: serviceData.service_type,
          specific_address: serviceData.specific_address, base_latitude: serviceData.base_latitude,
          base_longitude: serviceData.base_longitude, delivery_radius_km: serviceData.delivery_radius_km,
          provider_id: serviceData.provider_id, provider_name: serviceData.provider_name,
          provider_email: serviceData.provider_email, provider_phone: serviceData.provider_phone,
          is_approved: serviceData.is_approved, coverage_areas: serviceData.service_coverage_areas || [],
        };
        setService(populatedService);
        setCoverageAreas(serviceData.service_coverage_areas || []);

        if (globalSelectedDate && mappedAvailabilities) {
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
  }, [serviceId, globalSelectedDate]);

  useEffect(() => {
    if (service) { document.title = `${service.name} | CABETG Party Planner`; window.scrollTo(0, 0); }
    else if (!isLoading && service === null) { document.title = 'Servicio no encontrado | CABETG Party Planner'; }
  }, [service, isLoading]);

  const calculateTotalPrice = (): number | null => {
    if (!service || typeof service.price !== 'number') return null;
    let currentPrice = service.price;
    // Lógica para opciones adicionales si existen
    // selectedOptions.forEach(optId => { /* ... modificar currentPrice ... */ });
    return currentPrice * quantity;
  };

  const totalPrice = calculateTotalPrice();
  const sliderSettings = { dots: true, infinite: true, speed: 500, slidesToShow: 1, slidesToScroll: 1, arrows: true, adaptiveHeight: true };
  const similarServices = service ? mockServicesData.filter((s: AppServiceType) => s.id !== serviceId && s.categoryId === service?.categoryId && s.subcategoryId === service?.subcategoryId).slice(0, 3) : [];
  const handleToggleOption = (optionId: string) => setSelectedOptions((prev) => prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]);
  
  const handleDateSelectionInDetail = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedEventDateForService(dateStr);
    toast.info(`Fecha seleccionada: ${date.toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})}`, {position: "bottom-right", autoClose: 2000});
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    if (service) {
      if (!selectedEventDateForService) {
        toast.warn("Por favor, selecciona una fecha de disponibilidad para el servicio desde el calendario.", {position: "bottom-right"});
        // Podrías hacer scroll al calendario aquí
        return;
      }
      setIsAddingToCart(true);
      try {
          const { data: availabilityCheck, error: checkError } = await supabase
              .from('service_availability')
              .select('total_capacity, booked_capacity, is_available')
              .eq('service_id', service.id)
              .eq('date', selectedEventDateForService)
              .single(); // Esperamos un solo registro o ninguno

          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = single row not found
              throw checkError;
          }
          
          if (!availabilityCheck || !availabilityCheck.is_available || (availabilityCheck.booked_capacity + quantity) > availabilityCheck.total_capacity) {
              toast.error(`El servicio ya no está disponible o excede la capacidad para el ${new Date(selectedEventDateForService + 'T00:00:00Z').toLocaleDateString('es-MX', {day:'numeric', month:'short'})}. Por favor, selecciona otra fecha o ajusta la cantidad.`, {position: "bottom-right", autoClose: 4000});
              // Opcional: Refrescar la lista de serviceAvailabilities
              // fetchServiceDetails(); // Podrías llamar a la función que carga todo de nuevo
              setIsAddingToCart(false);
              return;
          }
          
          addToCart(service, quantity, selectedEventDateForService);
          toast.success(`${service.name} añadido a tu lista para el ${new Date(selectedEventDateForService + 'T00:00:00Z').toLocaleDateString('es-MX', {day:'numeric', month:'short'})}!`, {position: "bottom-right"});

      } catch (error: any) {
          toast.error(`Error al verificar disponibilidad: ${error.message}. Intenta de nuevo.`, {position: "bottom-right"});
          console.error("Error adding to cart:", error);
      } finally {
          setIsAddingToCart(false);
      }
    }
  };
  
  const itemInCart = cart.items.find(item => item.service.id === serviceId && item.eventDate === selectedEventDateForService && item.quantity === quantity);

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
            if (service && selectedEventDateForService) { 
                handleAddToCart(); // Volver a intentar añadir al carrito después del login
            }
        }} 
        pendingService={service} 
        pendingQuantity={quantity} 
      />
      <div className="container-custom">
        <nav className="mb-6 sm:mb-8 text-xs sm:text-sm">
            {/* Breadcrumbs ... */}
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
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{service.name}</h1>
                    <button className="text-gray-400 hover:text-pink-500 p-1 -mr-1 mt-0.5" aria-label="Añadir a favoritos"><Heart size={22} /></button>
                </div>
                <div className="flex items-center mb-3 sm:mb-4 text-sm">
                    <div className="flex text-yellow-400">{[...Array(5)].map((_, i) => ( <Star key={i} size={16} fill={i < Math.floor(service.rating) ? "currentColor" : "none"} strokeWidth={i < Math.floor(service.rating) ? 0 : 1.5}/> )) }</div>
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
                {/* Opciones Adicionales (si aplica) */}
              
              <div className="mb-4 sm:mb-6 border-t border-gray-200 pt-4">
                <h3 className="font-medium mb-2 text-sm text-gray-700">Ubicación y Cobertura</h3>
                {/* ... (JSX de ubicación como antes, con clases de texto más pequeñas si es necesario) ... */}
              </div>

              <AvailabilityCalendar 
                availability={serviceAvailabilities} 
                onDateSelect={handleDateSelectionInDetail}
                selectedServiceDate={selectedEventDateForService}
                isLoading={isLoading}
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
                  >
                    <ShoppingBag size={16} className="mr-2"/>
                    Ver en mi lista ({new Date(itemInCart.eventDate + 'T00:00:00Z').toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})})
                  </Link>
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

        {/* Description, Features, Reviews, Similar Services */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-8">
            <div className="lg:col-span-2">
                {/* ... (Descripción y Características JSX como antes) ... */}
            </div>
            <div className="lg:col-span-1">
                {/* ... (Servicios Similares JSX como antes) ... */}
            </div>
        </div>
      </div>
    </div>
  );
};

// Temporal: Añadir ChevronLeft y ChevronRight si no están en lucide-react o si quieres usar SVGs simples
const ChevronLeft: React.FC<{size?: number, className?: string}> = ({size=24, className=""}) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="15 18 9 12 15 6"></polyline></svg>);
const ChevronRight: React.FC<{size?: number, className?: string}> = ({size=24, className=""}) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>);


export default ServiceDetailPage;
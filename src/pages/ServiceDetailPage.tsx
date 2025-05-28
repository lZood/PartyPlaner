import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Slider from 'react-slick';
import {
  Star, Heart, CheckCircle, Truck, CalendarDays as Calendar, Clock, MinusCircle, PlusCircle, Loader2, MapPin, Briefcase, Users, ShoppingBag
} from 'lucide-react';
import { categories as mockCategories } from '../data/categories';
import { services as mockServicesData } from '../data/services';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import AuthModal from '../components/auth/AuthModal';
import { AppServiceType, Category as AppCategoryType, Subcategory as AppSubcategoryType, ServiceCoverageArea, ServiceAvailability } from '../types';
import { createClient } from '@supabase/supabase-js';
import { useReservation } from '../contexts/ReservationContext'; // Importar
import { toast } from 'react-toastify';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface AvailabilityCalendarProps {
  availability: ServiceAvailability[];
  onDateSelect: (date: Date) => void; // Para manejar la selección de fecha
  selectedServiceDate: string | null; // Para resaltar la fecha seleccionada
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ availability, onDateSelect, selectedServiceDate }) => {
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
      daysArray.push(<div key={`blank-${i}`} className="p-1 border text-center h-10"></div>);
    }

    for (let day = 1; day <= daysInSelectedMonth; day++) {
      const currentDate = new Date(displayYear, displayMonth, day);
      currentDate.setHours(0, 0, 0, 0);
      const dateString = currentDate.toISOString().split('T')[0];
      const dayAvailability = availability.find(a => a.date === dateString);
      let cellClass = "p-1 border text-center text-sm h-10 flex items-center justify-center ";
      let availabilityText = `${day}`;
      const isCurrentlySelected = selectedServiceDate === dateString;

      if (currentDate < today) {
        cellClass += "bg-gray-200 text-gray-400 cursor-not-allowed";
      } else if (dayAvailability) {
        if (dayAvailability.is_available && dayAvailability.total_capacity > dayAvailability.booked_capacity) {
          cellClass += isCurrentlySelected 
            ? "bg-primary-500 text-white font-semibold ring-2 ring-primary-300" 
            : "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer";
        } else {
          cellClass += "bg-red-100 text-red-700 line-through cursor-not-allowed";
        }
      } else {
        cellClass += "bg-gray-100 text-gray-500 cursor-not-allowed";
      }
      daysArray.push(
        <div
          key={day}
          className={cellClass}
          title={dateString}
          onClick={() => {
            if (currentDate >= today && dayAvailability && dayAvailability.is_available && dayAvailability.total_capacity > dayAvailability.booked_capacity) {
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
    <div className="mt-6 p-4 border rounded-lg bg-white">
      <h3 className="text-md font-semibold mb-3">Disponibilidad del Servicio</h3>
      <div className="flex justify-between items-center mb-2">
        <button onClick={() => {
          if (displayMonth === 0) { setDisplayMonth(11); setDisplayYear(displayYear - 1); }
          else { setDisplayMonth(displayMonth - 1); }
        }} className="text-primary-500 p-1 rounded-full hover:bg-primary-50">&lt;</button>
        <span className="font-medium">{monthNames[displayMonth]} {displayYear}</span>
        <button onClick={() => {
          if (displayMonth === 11) { setDisplayMonth(0); setDisplayYear(displayYear + 1); }
          else { setDisplayMonth(displayMonth + 1); }
        }} className="text-primary-500 p-1 rounded-full hover:bg-primary-50">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
        {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(d => <div key={d} className="font-medium">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
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
  const [serviceAvailabilities, setServiceAvailabilities] = useState<ServiceAvailability[]>([]); // Este es el tipo correcto de Supabase
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventDateForService, setSelectedEventDateForService] = useState<string | null>(null); // Formato YYYY-MM-DD

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!serviceId) {
        setIsLoading(false);
        setService(null);
        return;
      }
      setIsLoading(true);
      try {
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('*, service_coverage_areas(*)') // Incluir áreas de cobertura
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
            if (mainUrlData) mainImageUrl = mainUrlData.publicUrl;
          }
          galleryData.forEach(img => {
            if (img.storage_path) {
              const { data: urlData } = supabase.storage.from('service-images').getPublicUrl(img.storage_path);
              if (urlData) galleryImageUrls.push(urlData.publicUrl);
            }
          });
        }
        
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 90); // Cargar disponibilidad para los próximos 90 días
        
        const { data: availabilityDataSupabase, error: availabilityError } = await supabase
            .from('service_availability')
            .select('*') // Asegúrate que las columnas coincidan con ServiceAvailability
            .eq('service_id', serviceId)
            .gte('date', today.toISOString().split('T')[0])
            .lte('date', futureDate.toISOString().split('T')[0])
            .order('date', { ascending: true });

        if (availabilityError) console.error('Error fetching availability:', availabilityError);
        
        const mappedAvailabilities: ServiceAvailability[] = (availabilityDataSupabase || []).map((a: any) => ({
            id: a.id,
            serviceId: a.service_id, // Asegúrate que el nombre de la columna sea correcto
            date: a.date,
            totalCapacity: a.total_capacity,
            bookedCapacity: a.booked_capacity,
            isAvailable: a.is_available,
            // created_at y updated_at son opcionales
        }));
        setServiceAvailabilities(mappedAvailabilities);


        const populatedService: AppServiceType = {
          id: serviceData.id,
          name: serviceData.name,
          description: serviceData.description,
          shortDescription: serviceData.short_description,
          price: serviceData.price,
          imageUrl: mainImageUrl,
          gallery: galleryImageUrls.length > 0 ? galleryImageUrls : (mainImageUrl.startsWith('http') ? [mainImageUrl] : []),
          categoryId: serviceData.category_id,
          subcategoryId: serviceData.subcategory_id,
          rating: serviceData.rating,
          reviewCount: serviceData.review_count,
          features: serviceData.features || [],
          availability: mappedAvailabilities,
          options: serviceData.options || [],
          service_type: serviceData.service_type,
          specific_address: serviceData.specific_address,
          base_latitude: serviceData.base_latitude,
          base_longitude: serviceData.base_longitude,
          delivery_radius_km: serviceData.delivery_radius_km,
          provider_id: serviceData.provider_id,
          provider_name: serviceData.provider_name,
          provider_email: serviceData.provider_email,
          provider_phone: serviceData.provider_phone,
          is_approved: serviceData.is_approved,
          coverage_areas: serviceData.service_coverage_areas || [],
        };
        setService(populatedService);
        setCoverageAreas(serviceData.service_coverage_areas || [])


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

      } catch (error) { console.error('Failed to fetch service details:', error); setService(null); }
      finally { setIsLoading(false); }
    };
    fetchServiceDetails();
  }, [serviceId, globalSelectedDate]); // Añadir globalSelectedDate a dependencias

  useEffect(() => {
    if (service) { document.title = `${service.name} | CABETG Party Planner`; window.scrollTo(0, 0); }
    else if (!isLoading && service === null) { document.title = 'Servicio no encontrado | CABETG Party Planner'; }
  }, [service, isLoading]);

  const calculateTotalPrice = () => { /* ... como antes ... */ return null };
  const totalPrice = calculateTotalPrice();
  const sliderSettings = { dots: true, infinite: true, speed: 500, slidesToShow: 1, slidesToScroll: 1, arrows: true };
  const similarServices = service ? mockServicesData.filter((s: AppServiceType) => s.id !== serviceId && s.categoryId === service?.categoryId && s.subcategoryId === service?.subcategoryId).slice(0, 3) : [];
  const handleToggleOption = (optionId: string) => setSelectedOptions((prev) => prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]);
  
  const handleDateSelectionInDetail = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedEventDateForService(dateStr);
    toast.info(`Fecha seleccionada para este servicio: ${date.toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})}`, {position: "bottom-right"});
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) { setShowAuthModal(true); return; }
    if (service) {
      if (!selectedEventDateForService) {
        toast.warn("Por favor, selecciona una fecha de disponibilidad para el servicio desde el calendario.", {position: "bottom-right"});
        return;
      }
      addToCart(service, quantity, selectedEventDateForService);
      toast.success(`${service.name} añadido a tu lista para el ${new Date(selectedEventDateForService + 'T00:00:00').toLocaleDateString('es-MX', {day:'numeric', month:'short'})}!`, {position: "bottom-right"});
    }
  };
  
  const itemInCart = cart.items.find(item => item.service.id === serviceId && item.eventDate === selectedEventDateForService);


  if (isLoading) { 
    return (
      <div className="container-custom py-16 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-500" />
        <p className="mt-4 text-lg">Cargando detalles del servicio...</p>
      </div>
    );
  }
  if (!service) { 
     return (
      <div className="container-custom py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Servicio no encontrado</h2>
        <p className="mb-8">Lo sentimos, el servicio que buscas no existe o no pudo ser cargado.</p>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    );
  }
  
  const categoryName = category ? category.name : (service.categoryId || 'Categoría');
  const subcategoryName = subcategory ? subcategory.name : (service.subcategoryId || 'Subcategoría');

  return (
    <div className="bg-gray-50 py-12">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={() => { setShowAuthModal(false); if (service && selectedEventDateForService) { addToCart(service, quantity, selectedEventDateForService); }}} pendingService={service} pendingQuantity={quantity} />
      <div className="container-custom">
        <nav className="mb-8 text-sm">
            <ol className="flex flex-wrap items-center">
                <li className="flex items-center"><Link to="/" className="text-gray-500 hover:text-primary-500">Inicio</Link><span className="mx-2 text-gray-400">/</span></li>
                {category && (<li className="flex items-center"><Link to={`/category/${category.id}`} className="text-gray-500 hover:text-primary-500">{categoryName}</Link><span className="mx-2 text-gray-400">/</span></li>)}
                {(!category && service.categoryId) && (<li className="flex items-center"><span className="text-gray-500">{categoryName}</span><span className="mx-2 text-gray-400">/</span></li>)}
                {subcategory && category && (<li className="flex items-center"><Link to={`/category/${category.id}/${subcategory.id}`} className="text-gray-500 hover:text-primary-500">{subcategoryName}</Link><span className="mx-2 text-gray-400">/</span></li>)}
                {(!subcategory && service.subcategoryId && category) && (<li className="flex items-center"><span className="text-gray-500">{subcategoryName}</span><span className="mx-2 text-gray-400">/</span></li>)}
                <li className="text-primary-500 font-medium">{service.name}</li>
            </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
             <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {service.gallery && service.gallery.length > 0 ? (
                <Slider {...sliderSettings}>
                  {service.gallery.map((image, index) => ( <div key={index} className="h-96"><img src={image} alt={`${service.name} - Imagen ${index + 1}`} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Error+Img')}/></div> ))}
                </Slider>
              ) : ( <div className="h-96 flex items-center justify-center bg-gray-100"><img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Error+Img')}/></div> )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start mb-4"><h1 className="text-2xl font-bold">{service.name}</h1><button className="text-gray-400 hover:text-secondary-500" aria-label="Añadir a favoritos"><Heart size={24} /></button></div>
                <div className="flex items-center mb-4"><div className="flex text-warning-500">{[...Array(5)].map((_, i) => ( <Star key={i} size={18} fill={i < Math.floor(service.rating) ? "currentColor" : "none"} strokeWidth={i < Math.floor(service.rating) ? 0 : 1.5}/> )) }</div><span className="text-gray-600 text-sm ml-2">{service.rating.toFixed(1)} ({service.reviewCount} reseñas)</span></div>
                <div className="mb-6"><div className="text-lg font-bold mb-2">{service.price ? `$${service.price.toLocaleString('es-MX')}` : <span className="text-primary-500">Solicitar Cotización</span>}</div><p className="text-sm text-gray-500">{service.price ? "Precio base por unidad/servicio" : "El precio varía según especificaciones"}</p></div>
                {service.price && (<div className="mb-6"><div className="flex justify-between items-center mb-2"><div className="font-medium">Cantidad</div><div className="flex items-center"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-gray-500 hover:text-primary-500 disabled:opacity-50" disabled={quantity <= 1}><MinusCircle size={20} /></button><span className="mx-4 w-8 text-center">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} className="text-gray-500 hover:text-primary-500"><PlusCircle size={20} /></button></div></div></div>)}
                {service.options && service.options.length > 0 && (<div className="mb-6"><h3 className="font-medium mb-3">Opciones Adicionales</h3><div className="space-y-3">{service.options.map((option) => (<label key={option.id} className="flex items-start p-3 border rounded-lg cursor-pointer hover:border-primary-300 transition-colors"><input type="checkbox" className="mt-1 mr-3" checked={selectedOptions.includes(option.id)} onChange={() => handleToggleOption(option.id)}/><div className="flex-1"><div className="font-medium">{option.name}</div>{option.description && (<div className="text-sm text-gray-600">{option.description}</div>)}</div><div className="font-medium">+${option.priceModifier.toLocaleString('es-MX')}</div></label>))}</div></div>)}
              
              <div className="mb-6 border-t pt-4">
                <h3 className="font-medium mb-3 text-gray-800">Ubicación y Cobertura</h3>
                {service.service_type === 'fixed_location' && service.specific_address && ( <div className="flex items-start text-sm text-gray-600"><MapPin size={16} className="mr-2 mt-0.5 text-primary-500 flex-shrink-0" /><span>Servicio en: {service.specific_address}</span></div> )}
                {service.service_type === 'delivery_area' && ( <div className="text-sm text-gray-600 space-y-1"><div className="flex items-start"><Briefcase size={16} className="mr-2 mt-0.5 text-primary-500 flex-shrink-0" /><span>Servicio a domicilio.</span></div>{service.delivery_radius_km && ( <div className="flex items-start pl-6"><span className='italic'>Cubre {service.delivery_radius_km} km a la redonda.</span></div> )}{service.base_latitude && service.base_longitude && ( <div className="flex items-start pl-6"><span className='text-xs'>(Desde: {service.base_latitude}, {service.base_longitude})</span></div> )}</div> )}
                {service.service_type === 'multiple_areas' && coverageAreas.length > 0 && ( <div className="text-sm text-gray-600"><div className="flex items-start mb-1"><Users size={16} className="mr-2 mt-0.5 text-primary-500 flex-shrink-0" /><span>Cubre las siguientes áreas:</span></div><ul className="list-disc list-inside pl-6 space-y-1">{coverageAreas.map(area => ( <li key={area.id}>{area.area_name}{area.city || area.state ? ` (${[area.city, area.state, area.postal_code].filter(Boolean).join(', ')})` : ''}</li> ))}</ul></div> )}
                {service.service_type === 'multiple_areas' && coverageAreas.length === 0 && ( <div className="flex items-start text-sm text-gray-600"><Users size={16} className="mr-2 mt-0.5 text-primary-500 flex-shrink-0" /><span>Áreas de cobertura no especificadas.</span></div> )}
              </div>

              <AvailabilityCalendar 
                availability={serviceAvailabilities} 
                onDateSelect={handleDateSelectionInDetail}
                selectedServiceDate={selectedEventDateForService}
              />
              
              <div className="mt-4 mb-6 p-3 border rounded-lg bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">Fecha seleccionada para este servicio:</h3>
                <p className="text-lg text-primary-600 font-medium">
                  {selectedEventDateForService 
                    ? new Date(selectedEventDateForService + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : "Ninguna seleccionada. Elige una del calendario."}
                </p>
              </div>


               {totalPrice !== null && (<div className="flex justify-between items-center py-3 mb-4 border-t border-b border-gray-200 mt-6"><div className="text-lg font-medium">Total (Estimado)</div><div className="text-xl font-bold">${totalPrice.toLocaleString('es-MX')}</div></div>)}
               
               {itemInCart ? (
                  <Link 
                    to="/cart" 
                    className="btn w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium flex items-center justify-center"
                  >
                    <ShoppingBag size={18} className="mr-2"/>
                    Ver en mi lista (para {new Date(itemInCart.eventDate + 'T00:00:00').toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})})
                  </Link>
                ) : (
                  <button 
                    onClick={handleAddToCart} 
                    disabled={!selectedEventDateForService}
                    className={`btn w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium mt-6 ${!selectedEventDateForService ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {service.price ? 'Añadir a Mi Lista' : 'Solicitar Cotización'}
                    {selectedEventDateForService && ` para ${new Date(selectedEventDateForService + 'T00:00:00').toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})}`}
                  </button>
                )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">Descripción</h2>
                    <p className="text-gray-700 mb-6 whitespace-pre-line">{service.description}</p>
                    <h3 className="font-bold mb-3">Características</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">{service.features.map((feature, index) => (<li key={index} className="flex items-start"><CheckCircle size={18} className="text-primary-500 mr-2 flex-shrink-0 mt-0.5" /><span>{feature}</span></li>))}</ul>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Reseñas</h2><button className="text-primary-500 font-medium hover:underline">Ver todas</button></div>
                    <div className="space-y-6">{[1, 2].map((_, index) => (<div key={index} className="pb-6 border-b border-gray-200 last:border-0"><div className="flex justify-between mb-2"><div className="flex items-center"><div className="w-10 h-10 rounded-full bg-gray-300 mr-3"></div><div><div className="font-medium">Cliente Satisfecho</div><div className="text-sm text-gray-500">Hace 2 semanas</div></div></div><div className="flex text-warning-500">{[...Array(5)].map((_, i) => (<Star key={i} size={16} fill="currentColor" strokeWidth={0} /> ))}</div></div><p className="text-gray-700">Excelente servicio, totalmente recomendado. Cumplieron con todas las expectativas y el personal fue muy amable.</p></div>))}</div>
                </div>
            </div>
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">Servicios Similares</h2>
                    <div className="space-y-4">
                        {similarServices.length > 0 ? (similarServices.map((similarService) => (<Link key={similarService.id} to={`/service/${similarService.id}`} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors"><img src={similarService.imageUrl} alt={similarService.name} className="w-20 h-16 object-cover rounded mr-3" onError={(e) => (e.currentTarget.src = 'https://placehold.co/300x200?text=Error+Img')}/><div><h3 className="font-medium hover:text-primary-500 transition-colors">{similarService.name}</h3><div className="flex items-center text-sm mb-1"><div className="flex text-warning-500">{[...Array(5)].map((_, i) => (<Star key={i} size={12} fill={i < Math.floor(similarService.rating) ? "currentColor" : "none"} strokeWidth={i < Math.floor(similarService.rating) ? 0 : 1.5}/>))}</div><span className="text-gray-600 ml-1">({similarService.reviewCount})</span></div><div className="font-medium">{similarService.price ? `$${similarService.price.toLocaleString('es-MX')}` : <span className="text-primary-500">Cotizar</span>}</div></div></Link>))) : (<p className="text-gray-600">No hay servicios similares disponibles en este momento.</p>)}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
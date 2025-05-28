import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2, MinusCircle, PlusCircle, CreditCard,
  CalendarDays, Info, Loader2, ShoppingBag, AlertCircle
} from 'lucide-react';
import { useCart, CartItem } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { categories } from '../data/categories';
import AuthModal from '../components/auth/AuthModal';
import { useReservation } from '../contexts/ReservationContext';
import { toast } from 'react-toastify';
import { createClient } from '@supabase/supabase-js';
import { AppServiceType } from '../types'; // Asegúrate de que AppServiceType esté disponible

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Componente MiniDatePicker
interface MiniDatePickerProps {
  selectedDate: string | null; // YYYY-MM-DD
  onDateChange: (date: string) => void; // YYYY-MM-DD
  minDate?: string; // YYYY-MM-DD
}

const MiniDatePicker: React.FC<MiniDatePickerProps> = ({ selectedDate, onDateChange, minDate }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalizar a medianoche
  const todayStr = today.toISOString().split('T')[0];
  const effectiveMinDate = minDate && minDate >= todayStr ? minDate : todayStr;

  return (
    <input
      type="date"
      value={selectedDate || ''}
      onChange={(e) => onDateChange(e.target.value)}
      min={effectiveMinDate}
      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 text-sm shadow-sm"
    />
  );
};

const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartEventDate } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { selectedDate: globalSelectedDate, setSelectedDate: setGlobalSelectedDate } = useReservation();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [cartEventDate, setCartEventDate] = useState<string | null>(null);
  const [unavailableServicesForDate, setUnavailableServicesForDate] = useState<string[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const checkCartAvailability = useCallback(async (date: string | null): Promise<boolean> => {
    if (!date || cart.items.length === 0) {
      setUnavailableServicesForDate([]);
      return true;
    }

    setIsCheckingAvailability(true);
    const serviceItemsForCheck = cart.items.map(item => ({
      service_id: item.service.id,
      quantity: item.quantity,
      name: item.service.name // Para mostrar en mensajes de error
    }));

    try {
      // Alternativa: Usar la RPC 'check_services_availability_for_cart' si la implementaste
      // const { data: availabilityResult, error: rpcError } = await supabase.rpc('check_services_availability_for_cart', {
      //   p_service_items: serviceItemsForCheck.map(item => ({ service_id: item.service_id, quantity: item.quantity })),
      //   p_check_date: date
      // });
      // if (rpcError) throw rpcError;
      // const notAvailableFromRPC = availabilityResult?.filter((res:any) => !res.is_available_for_quantity).map((res:any) => res.service_name) || [];
      // setUnavailableServicesForDate(notAvailableFromRPC);
      // setIsCheckingAvailability(false);
      // return notAvailableFromRPC.length === 0;

      // Implementación con consulta directa a service_availability
      const serviceIdsInCart = serviceItemsForCheck.map(item => item.service_id);
      const { data: availabilities, error } = await supabase
        .from('service_availability')
        .select('service_id, total_capacity, booked_capacity, is_available')
        .in('service_id', serviceIdsInCart)
        .eq('date', date);

      if (error) {
        toast.error("Error al verificar disponibilidad del carrito.");
        console.error("Error fetching availabilities:", error);
        setUnavailableServicesForDate(serviceItemsForCheck.map(item => item.name)); // Asumir todos no disponibles
        setIsCheckingAvailability(false);
        return false;
      }

      const notAvailable: string[] = [];
      serviceItemsForCheck.forEach(item => {
        const availabilityRecord = availabilities?.find(a => a.service_id === item.service_id);
        if (
          !availabilityRecord ||
          !availabilityRecord.is_available ||
          (availabilityRecord.booked_capacity + item.quantity) > availabilityRecord.total_capacity
        ) {
          notAvailable.push(item.name);
        }
      });

      setUnavailableServicesForDate(notAvailable);
      setIsCheckingAvailability(false);
      return notAvailable.length === 0;

    } catch (err) {
      console.error("Excepción al verificar disponibilidad:", err);
      toast.error("Error inesperado al verificar disponibilidad.");
      setUnavailableServicesForDate(serviceItemsForCheck.map(item => item.name));
      setIsCheckingAvailability(false);
      return false;
    }
  }, [cart.items, supabase]); // supabase como dependencia


  useEffect(() => {
    document.title = 'Mi Lista de Cotización | CABETG Party Planner';
    const determinedCartDate = getCartEventDate();

    if (determinedCartDate) {
      setCartEventDate(determinedCartDate);
      if (!globalSelectedDate || globalSelectedDate.toISOString().split('T')[0] !== determinedCartDate) {
        setGlobalSelectedDate(new Date(determinedCartDate + "T00:00:00Z")); // Usar T00:00:00Z para consistencia UTC
      }
      checkCartAvailability(determinedCartDate);
    } else if (globalSelectedDate) {
      const globalDateStr = globalSelectedDate.toISOString().split('T')[0];
      setCartEventDate(globalDateStr);
      checkCartAvailability(globalDateStr);
    } else {
      setCartEventDate(null);
      setUnavailableServicesForDate([]);
    }
  }, [getCartEventDate, globalSelectedDate, setGlobalSelectedDate, checkCartAvailability]);


  const handleCartEventDateChange = async (date: string) => { // date es YYYY-MM-DD
    setCartEventDate(date);
    setGlobalSelectedDate(new Date(date + "T00:00:00Z")); // Actualiza contexto global, usar Z para UTC
    const isAvailable = await checkCartAvailability(date);
    if (isAvailable) {
      toast.info(`Fecha del evento actualizada a: ${new Date(date + "T00:00:00Z").toLocaleDateString('es-MX', { month: 'long', day: 'numeric' })}`, {position: "bottom-right"});
    }
  };

  const calculateSubtotal = () => {
    return cart.items.reduce((total, item) => {
      if (item.service.price) {
        return total + (item.service.price * item.quantity);
      }
      return total;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const iva = subtotal * 0.16;
  const grandTotal = subtotal + iva;
  
  const handleProceedToPayment = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!cartEventDate) {
      toast.error("Por favor, selecciona una fecha para tu evento antes de proceder.");
      return;
    }
    if (unavailableServicesForDate.length > 0) {
        toast.error(`Algunos servicios no están disponibles para la fecha seleccionada: ${unavailableServicesForDate.join(', ')}. Por favor, cambia la fecha o elimina estos servicios de tu lista.`, {autoClose: 5000});
        return;
    }
    if (isCheckingAvailability) {
        toast.warn("Aún se está verificando la disponibilidad, por favor espera.");
        return;
    }
    navigate('/checkout', { state: { eventDate: cartEventDate } });
  };

  return (
    <div className="bg-white py-12 min-h-screen">
      <div className="container-custom">
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            if (cartEventDate && unavailableServicesForDate.length === 0 && !isCheckingAvailability) {
                navigate('/payment', { state: { eventDate: cartEventDate } });
            } else if (!cartEventDate) {
                toast.error("Por favor, selecciona una fecha para tu evento.");
            } else if (unavailableServicesForDate.length > 0) {
                toast.error(`Conflicto de disponibilidad. Verifica los servicios marcados.`);
            }
          }}
        />

        <h1 className="text-3xl font-bold mb-8 text-gray-800">Mi Lista de Cotización</h1>

        {cart.items.length === 0 ? (
           <div className="bg-white rounded-xl shadow-xl p-8 md:p-12 text-center">
            <ShoppingBag size={56} className="mx-auto text-gray-400 mb-6" />
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Tu Lista está Vacía</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              No has añadido ningún servicio. ¡Explora nuestras categorías y encuentra todo lo que necesitas para tu evento perfecto!
            </p>
            <Link
              to="/"
              className="btn bg-primary-500 hover:bg-primary-600 text-white py-3 px-8 rounded-lg font-medium text-base shadow-md hover:shadow-lg transition-all"
            >
              Explorar Servicios
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="bg-white rounded-xl shadow-xl p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 pb-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-3 sm:mb-0">Servicios en tu Lista</h2>
                    <div className="w-full sm:max-w-xs">
                        <label htmlFor="cartEventDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha del Evento:
                        </label>
                        <MiniDatePicker 
                            selectedDate={cartEventDate}
                            onDateChange={handleCartEventDateChange}
                        />
                    </div>
                </div>
                
                {isCheckingAvailability && (
                    <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-700 rounded-md shadow-sm">
                        <div className="flex items-center">
                            <Loader2 size={18} className="animate-spin mr-2.5"/>
                            <p className="text-sm font-medium">Verificando disponibilidad para la fecha seleccionada...</p>
                        </div>
                    </div>
                )}

                {unavailableServicesForDate.length > 0 && !isCheckingAvailability && (
                    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-md shadow-sm">
                        <div className="flex items-start">
                            <AlertCircle size={20} className="mr-2.5 flex-shrink-0 mt-0.5"/>
                            <div>
                                <p className="text-sm font-semibold">Conflicto de Disponibilidad</p>
                                <p className="text-xs mt-1">
                                    Los siguientes servicios no están disponibles para la fecha seleccionada ({cartEventDate ? new Date(cartEventDate+"T00:00:00Z").toLocaleDateString('es-MX', {day: 'numeric', month: 'short'}) : ''}):
                                </p>
                                <ul className="list-disc list-inside text-xs pl-4 mt-1">
                                    {unavailableServicesForDate.map(serviceName => <li key={serviceName}>{serviceName}</li>)}
                                </ul>
                                <p className="text-xs mt-1.5">Por favor, elige otra fecha o elimina estos servicios de tu lista.</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="divide-y divide-gray-200">
                  {cart.items.map((item: CartItem) => {
                    const category = categories.find(cat => cat.id === item.service.categoryId);
                    const subcategory = category?.subcategories.find(subcat => subcat.id === item.service.subcategoryId);
                    const isServiceUnavailable = unavailableServicesForDate.includes(item.service.name);
                    
                    return (
                      <div key={item.service.id} className={`py-6 first:pt-0 last:pb-0 ${isServiceUnavailable ? 'opacity-60 bg-red-50 p-3 -m-3 rounded-md' : ''}`}>
                        <div className="flex flex-col sm:flex-row">
                          <Link
                            to={`/service/${item.service.id}`}
                            className="sm:w-32 sm:h-24 rounded-md overflow-hidden mb-4 sm:mb-0 sm:mr-6 flex-shrink-0 border border-gray-200"
                          >
                            <img src={item.service.imageUrl} alt={item.service.name} className="w-full h-full object-cover"/>
                          </Link>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <div>
                                <Link to={`/service/${item.service.id}`} className="text-lg font-semibold text-gray-800 hover:text-primary-600 transition-colors">{item.service.name}</Link>
                                <div className="text-xs text-gray-500 mb-1">
                                  {category?.name} / {subcategory?.name}
                                </div>
                                {item.eventDate && cartEventDate && item.eventDate !== cartEventDate && (
                                    <p className="text-xs text-orange-600 bg-orange-50 p-1 rounded inline-block my-1">
                                        Nota: Fecha específica ({new Date(item.eventDate + "T00:00:00Z").toLocaleDateString('es-MX', {day:'numeric', month:'short'})}).
                                    </p>
                                )}
                                {isServiceUnavailable && <p className="text-xs text-red-600 font-semibold">No disponible en esta fecha</p>}
                              </div>
                              <div className="font-semibold text-gray-700 mb-2 sm:mb-0 text-left sm:text-right mt-1 sm:mt-0">
                                {item.service.price ? `$${(item.service.price * item.quantity).toLocaleString('es-MX')}` : <span className="text-primary-500">Cotizar</span>}
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center">
                                <button onClick={() => updateQuantity(item.service.id, Math.max(1, item.quantity - 1))} className="text-gray-500 hover:text-primary-500 disabled:opacity-50 p-1" disabled={item.quantity <= 1}><MinusCircle size={18} /></button>
                                <span className="mx-3 w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.service.id, item.quantity + 1)} className="text-gray-500 hover:text-primary-500 p-1"><PlusCircle size={18} /></button>
                              </div>
                              <button onClick={() => removeFromCart(item.service.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {cart.items.length > 0 && (
                    <div className="flex justify-end items-center pt-6 border-t border-gray-200 mt-6">
                    <button onClick={clearCart} className="text-sm text-gray-500 hover:text-red-600 flex items-center transition-colors p-2 rounded-md hover:bg-red-50">
                        <Trash2 size={16} className="mr-1.5" />
                        <span>Vaciar lista</span>
                    </button>
                    </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-white rounded-xl shadow-xl p-6 sticky top-28">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-3">Resumen del Pedido</h2>
                 {cartEventDate && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-xs font-medium text-blue-700">
                            Fecha del Evento Seleccionada:
                        </p>
                        <p className="text-sm font-semibold text-blue-800">
                            {(() => {
                              if (!cartEventDate) return '';
                              const [year, month, day] = cartEventDate.split('-').map(Number);
                              const localDate = new Date(year, month - 1, day);
                              return localDate.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                            })()}
                        </p>
                    </div>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Subtotal:</span> <span className="font-medium">${subtotal.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                  <div className="flex justify-between text-gray-600"><span>IVA (16%):</span> <span className="font-medium">${iva.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                  <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t border-gray-200 mt-2"><span>Total:</span> <span>${grandTotal.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})} MXN</span></div>
                </div>
                <button
                  onClick={handleProceedToPayment}
                  disabled={!cartEventDate || cart.items.length === 0 || unavailableServicesForDate.length > 0 || isCheckingAvailability}
                  className={`w-full bg-primary-500 text-white py-3 rounded-lg font-semibold mt-6 flex items-center justify-center transition-all duration-150 ease-in-out shadow-md hover:shadow-lg
                    ${(!cartEventDate || cart.items.length === 0 || unavailableServicesForDate.length > 0 || isCheckingAvailability) 
                      ? 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400' 
                      : 'hover:bg-primary-600 focus:ring-4 focus:ring-primary-300'
                    }`}
                >
                  {isCheckingAvailability ? <Loader2 size={20} className="animate-spin mr-2"/> : <CreditCard size={20} className="mr-2" />}
                  {isCheckingAvailability ? 'Verificando...' : 'Proceder al Pago'}
                </button>
                <p className="text-xs text-gray-500 mt-4 text-center">
                    Al confirmar, aceptas nuestros <Link to="/terms" className="underline hover:text-primary-500">Términos</Link>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
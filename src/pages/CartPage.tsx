// En src/pages/CartPage.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, MinusCircle, PlusCircle, CreditCard, CalendarDays, Info } from 'lucide-react'; // Añadir CalendarDays, Info
import { useCart, CartItem } from '../contexts/CartContext'; // Importar CartItem
import { useAuth } from '../contexts/AuthContext';
import { categories } from '../data/categories';
import AuthModal from '../components/auth/AuthModal';
import { useReservation } from '../contexts/ReservationContext'; // Para la fecha global/default
import { toast } from 'react-toastify'; // Para notificaciones

// Simple Date Picker (puedes moverlo a components/ui si lo reusas)
interface MiniDatePickerProps {
  selectedDate: string | null; // YYYY-MM-DD
  onDateChange: (date: string) => void; // YYYY-MM-DD
  minDate?: string; // YYYY-MM-DD
}

const MiniDatePicker: React.FC<MiniDatePickerProps> = ({ selectedDate, onDateChange, minDate }) => {
  const today = new Date().toISOString().split('T')[0];
  const effectiveMinDate = minDate || today;

  return (
    <input
      type="date"
      value={selectedDate || ''}
      onChange={(e) => onDateChange(e.target.value)}
      min={effectiveMinDate}
      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
    />
  );
};


const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartEventDate, updateItemEventDate } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { selectedDate: globalSelectedDate, setSelectedDate: setGlobalSelectedDate } = useReservation(); // Para la fecha global

  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Estado para la fecha del evento de todo el carrito
  const [cartEventDate, setCartEventDate] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Mi Lista de Cotización | CABETG Party Planner';
    // Intentar obtener una fecha consistente del carrito al cargar
    const determinedCartDate = getCartEventDate();
    if (determinedCartDate) {
      setCartEventDate(determinedCartDate);
      // Sincronizar con el contexto global si no estaba ya ahí o es diferente
      if (!globalSelectedDate || globalSelectedDate.toISOString().split('T')[0] !== determinedCartDate) {
        setGlobalSelectedDate(new Date(determinedCartDate + "T00:00:00"));
      }
    } else if (globalSelectedDate) {
      setCartEventDate(globalSelectedDate.toISOString().split('T')[0]);
    }
  }, [cart.items, getCartEventDate, globalSelectedDate, setGlobalSelectedDate]);

  const handleCartEventDateChange = (date: string) => { // date es YYYY-MM-DD
    setCartEventDate(date);
    setGlobalSelectedDate(new Date(date + "T00:00:00")); // Actualiza contexto global
    // Opcional: actualizar todos los items del carrito a esta nueva fecha si no tienen una específica
    // cart.items.forEach(item => {
    //   if (!item.eventDate) { // O si quieres forzar todas a la misma
    //     updateItemEventDate(item.service.id, date);
    //   }
    // });
    toast.info(`Fecha del evento actualizada a: ${new Date(date + "T00:00:00").toLocaleDateString('es-MX', { month: 'long', day: 'numeric' })}`);
  };


  const calculateTotal = () => { /* ... como antes ... */ return 0};
  const calculateSubtotal = () => { /* ... como antes ... */ return 0};
  const calculateIVA = () => { /* ... como antes ... */ return 0};
  const calculateGrandTotal = () => { /* ... como antes ... */ return 0};
  
  const handleProceedToPayment = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (!cartEventDate) {
      toast.error("Por favor, selecciona una fecha para tu evento antes de proceder.");
      return;
    }
    // Pasar la fecha del evento a la página de pago
    navigate('/payment', { state: { eventDate: cartEventDate } });
  };

  // ... (resto de la lógica y JSX)

  return (
    <div className="bg-gray-50 py-12">
      <div className="container-custom">
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            if (cartEventDate) { // Solo proceder si hay fecha
                navigate('/payment', { state: { eventDate: cartEventDate } });
            } else {
                toast.error("Por favor, selecciona una fecha para tu evento.");
            }
          }}
        />

        <h1 className="text-3xl font-bold mb-8">Mi Lista de Cotización</h1>

        {cart.items.length === 0 ? (
          // ... (JSX para carrito vacío como antes) ...
           <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Tu Lista está Vacía</h2>
            <p className="text-gray-600 mb-6">
              No has añadido ningún servicio. Explora y encuentra lo que necesitas.
            </p>
            <Link
              to="/"
              className="btn bg-primary-500 hover:bg-primary-600 text-white py-3 px-8 rounded-lg font-medium"
            >
              Explorar Servicios
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 pb-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">Servicios en tu Lista</h2>
                    <div className="w-full sm:w-auto">
                        <label htmlFor="cartEventDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha del Evento:
                        </label>
                        <MiniDatePicker 
                            selectedDate={cartEventDate}
                            onDateChange={handleCartEventDateChange}
                        />
                    </div>
                </div>
                
                {!cartEventDate && (
                    <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded">
                        <div className="flex items-center">
                            <Info size={20} className="mr-2"/>
                            <p className="text-sm">Por favor, selecciona una fecha para el evento.</p>
                        </div>
                    </div>
                )}
                
                <div className="divide-y divide-gray-200">
                  {cart.items.map((item: CartItem) => { // Especificar tipo CartItem
                    const category = categories.find(cat => cat.id === item.service.categoryId);
                    const subcategory = category?.subcategories.find(subcat => subcat.id === item.service.subcategoryId);
                    
                    return (
                      <div key={item.service.id} className="py-6 first:pt-0 last:pb-0">
                        <div className="flex flex-col sm:flex-row">
                          <Link
                            to={`/service/${item.service.id}`}
                            className="sm:w-32 sm:h-24 rounded overflow-hidden mb-4 sm:mb-0 sm:mr-6 flex-shrink-0"
                          >
                            <img src={item.service.imageUrl} alt={item.service.name} className="w-full h-full object-cover"/>
                          </Link>
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <div>
                                <Link to={`/service/${item.service.id}`} className="text-lg font-medium hover:text-primary-500 transition-colors">{item.service.name}</Link>
                                <div className="text-sm text-gray-500 mb-1">
                                  {category?.name} / {subcategory?.name}
                                </div>
                                {item.eventDate && cartEventDate && item.eventDate !== cartEventDate && (
                                    <p className="text-xs text-orange-600 bg-orange-50 p-1 rounded inline-block">
                                        Nota: Fecha individualizada ({new Date(item.eventDate + "T00:00:00").toLocaleDateString('es-MX', {day:'numeric', month:'short'})}).
                                        El pago procederá con la fecha general del evento.
                                    </p>
                                )}
                              </div>
                              <div className="font-semibold mb-2 sm:mb-0 text-right">
                                {item.service.price ? `$${(item.service.price * item.quantity).toLocaleString('es-MX')}` : <span className="text-primary-500">Cotizar</span>}
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center">
                                <button onClick={() => updateQuantity(item.service.id, Math.max(1, item.quantity - 1))} className="text-gray-500 hover:text-primary-500 disabled:opacity-50" disabled={item.quantity <= 1}><MinusCircle size={18} /></button>
                                <span className="mx-3 w-8 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.service.id, item.quantity + 1)} className="text-gray-500 hover:text-primary-500"><PlusCircle size={18} /></button>
                              </div>
                              <button onClick={() => removeFromCart(item.service.id)} className="text-gray-400 hover:text-error-500 transition-colors"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
                  <button onClick={clearCart} className="text-gray-500 hover:text-error-500 flex items-center"><Trash2 size={16} className="mr-1" /><span>Vaciar lista</span></button>
                </div>
              </div>
            </div>

            {/* Purchase Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-28"> {/* Hice el resumen sticky */}
                <h2 className="text-xl font-bold mb-4 border-b pb-2">Resumen</h2>
                 {cartEventDate && (
                    <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <p className="text-sm font-semibold text-blue-700">
                            Fecha del Evento: {new Date(cartEventDate + "T00:00:00").toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                )}
                {/* ... (resto del resumen como antes, usando calculateSubtotal, etc.) ... */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Subtotal:</span> <span>${calculateSubtotal().toLocaleString('es-MX')}</span></div>
                  <div className="flex justify-between text-sm"><span>IVA (16%):</span> <span>${calculateIVA().toLocaleString('es-MX')}</span></div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2"><span>Total:</span> <h1>${calculateGrandTotal().toLocaleString('es-MX')} MXN</h1></div>
                </div>
                <button
                  onClick={handleProceedToPayment}
                  disabled={!cartEventDate || cart.items.length === 0} // Deshabilitar si no hay fecha o items
                  className={`w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium mt-6 flex items-center justify-center transition-colors ${(!cartEventDate || cart.items.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <CreditCard size={20} className="mr-2" />
                  Proceder al Pago
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
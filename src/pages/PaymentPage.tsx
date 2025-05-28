import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // Importa Link
import { createClient } from '@supabase/supabase-js';
import { CreditCard, Calendar as CalendarIcon, Lock, Loader2, AlertCircle, ShoppingBag } from 'lucide-react'; // Renombrado Calendar a CalendarIcon
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { AppUser, Reservation } from '../types'; // Asegúrate que Reservation esté definida en tus tipos.

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Definición básica de Reservation si no la tienes en types/index.ts
// interface Reservation {
//   id?: string; // Opcional, se genera en la DB
//   user_id: string;
//   service_id: string;
//   event_date: string; // Formato YYYY-MM-DD
//   quantity: number;
//   status: string; // 'pending', 'confirmed', 'cancelled', etc.
//   total_price: number;
//   customer_name: string;
//   customer_email: string;
//   customer_phone: string;
//   event_location: string;
//   comments?: string;
//   // created_at y updated_at se manejan por la DB
// }


const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const locationHook = useLocation(); // Renombrado para evitar conflicto con la variable eventLocation
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Extraer datos pasados a través del estado de la navegación (ej. desde ServiceDetailPage o CartPage)
  const passedState = locationHook.state as {
    serviceId?: string;
    eventDate?: string; // Debe ser YYYY-MM-DD
    quantity?: number;
    // Otros campos necesarios como customer_name, etc., si no se toman del perfil de usuario
  } || {};


  const [paymentFormData, setPaymentFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const [customerDetails, setCustomerDetails] = useState({
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    event_location: '',
    comments: '',
  });
  
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      setCustomerDetails(prev => ({
        ...prev,
        customer_name: user.name || prev.customer_name,
        customer_email: user.email || prev.customer_email,
        customer_phone: user.phone || prev.customer_phone,
      }));
    }
  }, [user]);

  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
    } else if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2,4);
      }
       formattedValue = formattedValue.slice(0,5);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    setPaymentFormData({ ...paymentFormData, [name]: formattedValue });
  };
  
  const handleCustomerDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerDetails(prev => ({ ...prev, [name]: value }));
  };

  // Determinar los ítems a reservar y el precio total
  // Esto es crucial y dependerá de tu flujo: ¿se paga por todo el carrito o un solo servicio?
  // Este ejemplo asume que se paga por todos los ítems en el carrito.
  const itemsToReserve = cart.items;
  const subtotal = itemsToReserve.reduce((sum, item) => sum + (item.service.price || 0) * item.quantity, 0);
  const iva = subtotal * 0.16;
  const totalAmount = subtotal + iva;

  // Determinar la fecha del evento. Es crucial.
  // Si todos los ítems del carrito son para la misma fecha, es simple.
  // Si no, necesitarás una lógica más compleja o permitir solo reservas para una fecha a la vez.
  // Aquí se asume que passedState.eventDate tiene la fecha correcta o hay una lógica para obtenerla.
  const eventDateForReservation = passedState.eventDate; // Asegúrate que esté en formato YYYY-MM-DD


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast.error("Debes iniciar sesión para realizar una reservación.");
      navigate('/'); // Redirige o muestra modal de login
      return;
    }

    if (itemsToReserve.length === 0) {
      toast.warn("Tu carrito está vacío. Agrega servicios para continuar.");
      navigate('/');
      return;
    }
    
    if (!eventDateForReservation) {
        toast.error("La fecha del evento no está especificada. Por favor, selecciónala.");
        // Podrías redirigir a una página para seleccionar fecha o mostrar un modal.
        return;
    }
    
    if (!customerDetails.event_location.trim()) {
        toast.error("Por favor, especifica la dirección del evento.");
        return;
    }


    setIsProcessing(true);

    // Aquí iría la lógica de procesamiento de pago real (ej. Stripe, PayPal)
    // Simularemos un pago exitoso
    await new Promise(resolve => setTimeout(resolve, 2000)); 

    try {
      const reservationsToInsert: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>[] = itemsToReserve.map(item => ({
        user_id: user.id,
        service_id: item.service.id,
        event_date: eventDateForReservation, // Asegúrate que esto sea YYYY-MM-DD
        quantity: item.quantity,
        status: 'confirmed', // O 'pending_payment' si el pago es asíncrono
        total_price: (item.service.price || 0) * item.quantity, // Precio del ítem individual
        customer_name: customerDetails.customer_name,
        customer_email: customerDetails.customer_email,
        customer_phone: customerDetails.customer_phone,
        event_location: customerDetails.event_location,
        comments: customerDetails.comments || undefined,
      }));

      const { data, error } = await supabase.from('reservations').insert(reservationsToInsert).select();

      if (error) {
        console.error("Error al guardar reservación:", error);
        toast.error(`Error al procesar la reservación: ${error.message}`);
        setIsProcessing(false);
        return;
      }

      toast.success("¡Reservación realizada con éxito!");
      clearCart(); // Limpia el carrito después de una reservación exitosa
      navigate('/payment/success', { state: { reservationDetails: data } });

    } catch (error: any) {
      console.error("Error en el proceso de pago/reservación:", error);
      toast.error(`Ocurrió un error inesperado: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isAuthenticated) {
     // Podrías mostrar un mensaje o redirigir si no está autenticado, aunque el submit ya lo maneja.
  }

  if (itemsToReserve.length === 0 && !isProcessing) {
    return (
        <div className="container-custom max-w-md mx-auto text-center py-20">
            <ShoppingBag size={64} className="mx-auto text-gray-400 mb-6" />
            <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
            <p className="text-gray-600 mb-8">No tienes servicios seleccionados para pagar.</p>
            <Link to="/" className="btn btn-primary">Explorar servicios</Link>
        </div>
    )
  }


  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center md:text-left">Proceso de Pago</h1>

        {!eventDateForReservation && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            No se ha especificado una fecha para el evento. Por favor, asegúrate de seleccionarla antes de proceder.
                            {/* Podrías agregar un Link para ir a seleccionar la fecha */}
                        </p>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Payment Form & Customer Details */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Detalles del Cliente y Evento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo*</label>
                    <input type="text" name="customer_name" id="customer_name" value={customerDetails.customer_name} onChange={handleCustomerDetailsChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"/>
                  </div>
                  <div>
                    <label htmlFor="customer_email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico*</label>
                    <input type="email" name="customer_email" id="customer_email" value={customerDetails.customer_email} onChange={handleCustomerDetailsChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"/>
                  </div>
                  <div>
                    <label htmlFor="customer_phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono*</label>
                    <input type="tel" name="customer_phone" id="customer_phone" value={customerDetails.customer_phone} onChange={handleCustomerDetailsChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"/>
                  </div>
                   <div>
                    <label htmlFor="event_date_display" className="block text-sm font-medium text-gray-700 mb-1">Fecha del Evento</label>
                    <input 
                        type="text" 
                        name="event_date_display" 
                        id="event_date_display" 
                        value={eventDateForReservation ? new Date(eventDateForReservation + 'T00:00:00').toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No especificada'} 
                        readOnly 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>
                 <div className="mt-4">
                    <label htmlFor="event_location" className="block text-sm font-medium text-gray-700 mb-1">Dirección del Evento*</label>
                    <input type="text" name="event_location" id="event_location" value={customerDetails.event_location} onChange={handleCustomerDetailsChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="Calle, Número, Colonia, Ciudad"/>
                  </div>
                <div className="mt-4">
                  <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">Comentarios Adicionales</label>
                  <textarea name="comments" id="comments" value={customerDetails.comments} onChange={handleCustomerDetailsChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="Instrucciones especiales, preferencias, etc."></textarea>
                </div>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Información de Pago (Simulado)</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Tarjeta</label>
                  <div className="relative">
                    <input type="text" name="cardNumber" required value={paymentFormData.cardNumber} onChange={handlePaymentFormChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="0000 0000 0000 0000"/>
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre en la Tarjeta</label>
                  <input type="text" name="cardName" required value={paymentFormData.cardName} onChange={handlePaymentFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="NOMBRE COMPLETO"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Expiración</label>
                    <div className="relative">
                      <input type="text" name="expiryDate" required value={paymentFormData.expiryDate} onChange={handlePaymentFormChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="MM/YY"/>
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /> {/* Renombrado */}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <div className="relative">
                      <input type="text" name="cvv" required value={paymentFormData.cvv} onChange={handlePaymentFormChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300" placeholder="123"/>
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>
                </div>
              </section>

              <button
                type="submit"
                disabled={isProcessing || !eventDateForReservation || itemsToReserve.length === 0}
                className={`w-full bg-primary-500 text-white py-3 rounded-lg font-medium transition-colors ${
                  (isProcessing || !eventDateForReservation || itemsToReserve.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-600'
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Procesando Reservación...
                  </div>
                ) : (
                  `Pagar y Reservar $${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-28"> {/* Added sticky top-28 for better UX on scroll */}
              <h2 className="text-xl font-bold mb-6 border-b pb-2">Resumen de la Reservación</h2>
              {itemsToReserve.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4"> {/* Scroll for many items */}
                {itemsToReserve.map((item) => (
                  <div key={item.service.id} className="flex justify-between items-start py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium text-sm leading-tight">{item.service.name}</p>
                      <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                       {item.service.price && <p className="text-xs text-gray-500">Precio unitario: ${item.service.price.toLocaleString('es-MX')}</p>}
                    </div>
                    <span className="font-medium text-sm whitespace-nowrap pl-2">
                       {item.service.price ? `$${(item.service.price * item.quantity).toLocaleString('es-MX')}` : 'A cotizar'}
                    </span>
                  </div>
                ))}
              </div>
              ) : (
                 <p className="text-sm text-gray-500 mb-4">No hay servicios en tu carrito.</p>
              )}
              
              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>IVA (16%)</span>
                  <span>${iva.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                  <span>Total a Pagar</span>
                  <span>${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN</span>
                </div>
              </div>
               <p className="text-xs text-gray-500 mt-4">
                Al confirmar, aceptas nuestros <Link to="/terms" className="underline hover:text-primary-500">Términos y Condiciones</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
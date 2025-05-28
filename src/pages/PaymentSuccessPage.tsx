import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Importar useLocation
import confetti from 'canvas-confetti';
import { CheckCircle, ShoppingCart, Home } from 'lucide-react'; // Iconos para los botones

const PaymentSuccessPage: React.FC = () => {
  const location = useLocation(); // Para obtener datos pasados, como la fecha del evento
  const { eventDate } = (location.state as { eventDate?: string }) || {};

  useEffect(() => {
    document.title = '¡Pago Exitoso! | CABETG Party Planner';
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    // const randomInRange = (min: number, max: number) => { // No se usa actualmente
    //   return Math.random() * (max - min) + min;
    // };

    const confettiInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(confettiInterval);
        return;
      }

      const particleCount = 50; // Aumentar un poco para mejor efecto
      const spread = 70;
      const startVelocity = 30;
      const ticks = 200;
      const zIndex = 1000;
      const colors = ['#FF99C8', '#FCF6BD', '#D0F4DE', '#A9DEF9', '#E4C1F9', '#FFDAB9', '#B5EAD7'];


      // Confeti desde la izquierda
      confetti({
        particleCount,
        angle: 60,
        spread,
        origin: { x: 0, y: 0.7 },
        colors: colors,
        startVelocity,
        ticks,
        zIndex,
      });
      // Confeti desde la derecha
      confetti({
        particleCount,
        angle: 120,
        spread,
        origin: { x: 1, y: 0.7 },
        colors: colors,
        startVelocity,
        ticks,
        zIndex,
      });
    }, 250); // Intervalo un poco más espaciado

    return () => clearInterval(confettiInterval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 text-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 transform transition-all hover:scale-105 duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-200">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            ¡Reservación Exitosa!
          </h2>
          
          <p className="text-base md:text-lg text-gray-600 mb-3">
            Tu reservación ha sido procesada correctamente.
          </p>
          {eventDate && (
            <p className="text-sm text-gray-500 mb-6">
              Fecha del evento: {new Date(eventDate + 'T00:00:00Z').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          )}
          <p className="text-sm text-gray-600 mb-8">
            Hemos enviado un correo electrónico con los detalles. Puedes revisar el estado en "Mis Compras".
          </p>

          <div className="space-y-4">
            <Link
              to="/"
              className="flex items-center justify-center w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg text-base"
            >
              <Home size={20} className="mr-2" />
              Volver al Inicio
            </Link>
            
            <Link
              to="/profile"
              state={{ activeTab: 'myPurchases' }} // <--- AQUÍ PASAMOS EL ESTADO
              className="flex items-center justify-center w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors shadow-sm hover:shadow-md text-base"
            >
              <ShoppingCart size={20} className="mr-2" />
              Ver Mis Compras
            </Link>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-8">
            Gracias por confiar en CABETG Party Planner.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
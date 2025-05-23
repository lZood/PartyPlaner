import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle } from 'lucide-react';

const PaymentSuccessPage: React.FC = () => {
  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const confettiInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(confettiInterval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF99C8', '#FCF6BD', '#D0F4DE', '#A9DEF9', '#E4C1F9']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FF99C8', '#FCF6BD', '#D0F4DE', '#A9DEF9', '#E4C1F9']
      });
    }, 50);

    return () => clearInterval(confettiInterval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-primary-500" size={32} />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Pago Exitoso!
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            Tu pago ha sido procesado correctamente. Hemos enviado un correo electrónico con los detalles de tu compra.
          </p>

          <div className="space-y-4">
            <Link
              to="/"
              className="block w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Volver al Inicio
            </Link>
            
            <Link
              to="/profile"
              className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Ver Mis Servicios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
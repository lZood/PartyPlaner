import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const CTASection: React.FC = () => {
  const benefits = [
    'Todos los servicios en un solo lugar',
    'Proveedores verificados y de calidad',
    'Cotizaciones rápidas y sin complicaciones',
    'Asistencia personalizada en cada paso',
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-primary-600 to-accent-600 text-white">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              ¿Listo para Crear un Evento Inolvidable?
            </h2>
            <p className="text-lg mb-8 text-white text-opacity-90">
              Empieza a planear ahora y descubre lo fácil que es organizar el evento de tus sueños con nuestra plataforma intuitiva y nuestros proveedores de calidad.
            </p>
            
            <ul className="space-y-3 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="mr-3 text-white" size={20} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/category/music" 
                className="btn bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-full text-lg font-medium"
              >
                Explorar Servicios
              </Link>
              <Link 
                to="/contact" 
                className="btn bg-transparent hover:bg-white hover:bg-opacity-20 text-white px-8 py-3 rounded-full text-lg font-medium border-2 border-white"
              >
                Contactar Asesor
              </Link>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg" 
                alt="Celebración de evento" 
                className="rounded-lg shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg max-w-xs">
                <div className="flex items-center mb-2">
                  <div className="flex text-warning-500">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-800 font-medium ml-2">5.0</span>
                </div>
                <p className="text-gray-800 font-medium">
                  "¡Mejor de lo que esperaba! Gracias CABETG por hacer de mi boda un evento perfecto."
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Ana G. - Ciudad de México
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
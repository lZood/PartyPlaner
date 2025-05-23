import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Página No Encontrada | CABETG Party Planner';
  }, []);

  return (
    <div className="container-custom py-16 text-center">
      <h1 className="text-6xl md:text-8xl font-bold text-primary-500 mb-6">404</h1>
      <h2 className="text-2xl md:text-3xl font-bold mb-4">Página No Encontrada</h2>
      <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <Link
        to="/"
        className="btn bg-primary-500 hover:bg-primary-600 text-white py-3 px-8 rounded-full text-lg font-medium"
      >
        Volver al Inicio
      </Link>
    </div>
  );
};

export default NotFoundPage;
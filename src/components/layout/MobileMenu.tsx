import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Palette, CarFront as ChairFront, Coffee, Candy, Package, X } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto md:hidden">
      <div className="container-custom py-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold">Menú</h2>
          <button onClick={onClose} className="text-gray-700 hover:text-primary-500">
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Categorías</h3>
            <ul className="space-y-4">
              <li>
                <Link 
                  to="/category/music" 
                  className="flex items-center space-x-3 text-gray-700 hover:text-primary-500"
                  onClick={handleLinkClick}
                >
                  <Music size={20} />
                  <span>Música y Entretenimiento</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/decoration" 
                  className="flex items-center space-x-3 text-gray-700 hover:text-primary-500"
                  onClick={handleLinkClick}
                >
                  <Palette size={20} />
                  <span>Decoración</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/furniture" 
                  className="flex items-center space-x-3 text-gray-700 hover:text-primary-500"
                  onClick={handleLinkClick}
                >
                  <ChairFront size={20} />
                  <span>Mobiliario y Alquileres</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/food" 
                  className="flex items-center space-x-3 text-gray-700 hover:text-primary-500"
                  onClick={handleLinkClick}
                >
                  <Coffee size={20} />
                  <span>Comida y Bebida</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/candy" 
                  className="flex items-center space-x-3 text-gray-700 hover:text-primary-500"
                  onClick={handleLinkClick}
                >
                  <Candy size={20} />
                  <span>Dulces y Piñatas</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/disposables" 
                  className="flex items-center space-x-3 text-gray-700 hover:text-primary-500"
                  onClick={handleLinkClick}
                >
                  <Package size={20} />
                  <span>Artículos Desechables</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Enlaces</h3>
            <ul className="space-y-4">
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-700 hover:text-primary-500"
                  onClick={handleLinkClick}
                >
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-700 hover:text-primary-500"
                  onClick={handleLinkClick}
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link 
                  to="/faq" 
                  className="text-gray-700 hover:text-primary-500"
                  onClick={handleLinkClick}
                >
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link 
                  to="/blog" 
                  className="text-gray-700 hover:text-primary-500"
                  onClick={handleLinkClick}
                >
                  Blog de Ideas
                </Link>
              </li>
            </ul>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <Link 
              to="/account" 
              className="block py-2 font-medium text-gray-700 hover:text-primary-500"
              onClick={handleLinkClick}
            >
              Mi Cuenta
            </Link>
            <Link 
              to="/cart" 
              className="block py-2 font-medium text-gray-700 hover:text-primary-500"
              onClick={handleLinkClick}
            >
              Mi Lista de Cotización
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
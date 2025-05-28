import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import UserMenu from './UserMenu';
import Logo from '../ui/Logo';

interface HeaderProps {
  isScrolled: boolean;
  toggleMobileMenu: () => void;
  mobileMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ isScrolled, toggleMobileMenu, mobileMenuOpen }) => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { cart } = useCart();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Handle search logic
      console.log('Searching for:', searchQuery);
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setSearchExpanded(false);
    }
  };

  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded);
  };

  // En Header.tsx
return (
  <header className="bg-white shadow-md sticky top-0 z-40">
    <div className="container-custom flex items-center justify-between h-16 md:h-20"> {/* Ajusta altura si es necesario */}
      <div className="flex items-center">
        {/* Logo */}
        <Logo />
      </div>

      {/* Contenedor de categorías centrado (visible en pantallas medianas y grandes) */}
      <div className="flex-grow flex justify-center items-center hidden md:flex"> {/* flex-grow para que ocupe espacio, justify-center para centrar */}
        <nav className="flex space-x-1 lg:space-x-2"> {/* Ajusta space-x según necesites */}
          {categories.slice(0, 5).map((category) => ( // Muestra, por ejemplo, las primeras 5
            <Link
              key={category.id}
              to={`/categories/${category.id}`} // O la ruta correcta a tu página de categoría
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-150 ease-in-out"
            >
              {/* Podrías añadir un ícono si lo tienes en tu data/categories.ts */}
              {/* category.icon && <category.icon size={16} className="mr-1.5 inline" /> */}
              {category.name}
            </Link>
          ))}
          {/* Opcional: Enlace para "Ver todas" si tienes muchas categorías */}
          {categories.length > 5 && (
            <Link
              to="/categories" // Página que lista todas las categorías
              className="px-3 py-2 rounded-md text-sm font-medium text-primary-500 hover:bg-primary-100 transition-colors duration-150 ease-in-out"
            >
              Ver todas...
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center">
        {/* UserMenu, MobileMenu trigger, etc. */}
        <UserMenu />
        <div className="md:hidden">
          {/* <MobileMenu /> Asegúrate que este botón/componente esté aquí */}
        </div>
      </div>
    </div>
  </header>
);

export default Header;
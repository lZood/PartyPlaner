import React, { useState } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom'; // Added NavLink
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import UserMenu from './UserMenu';
import Logo from '../ui/Logo';
// categories import is not used in this new navigation structure directly in the main bar
// import { categories } from '../../data/categories'; 

interface HeaderProps {
  isScrolled: boolean;
  toggleMobileMenu: () => void;
  mobileMenuOpen: boolean;
}

const navLinks = [
  { to: '/categories', text: 'Servicios' },
  { to: '/about', text: 'Sobre Nosotros' },
  { to: '/contact', text: 'Contacto' },
  { to: '/blog', text: 'Blog' },
];

const Header: React.FC<HeaderProps> = ({ isScrolled, toggleMobileMenu, mobileMenuOpen }) => {
  // const [searchExpanded, setSearchExpanded] = useState(false); // Search is not in the header for now
  // const [searchQuery, setSearchQuery] = useState(''); // Search is not in the header for now
  // const navigate = useNavigate(); // Not directly used if search is removed from header
  const { cart } = useCart(); 
  
  // const handleSearch = (e: React.FormEvent) => { // Search logic removed for now
  //   e.preventDefault();
  //   if (searchQuery.trim()) {
  //     navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  //     setSearchQuery('');
  //     setSearchExpanded(false);
  //   }
  // };

  // const toggleSearch = () => { // Search logic removed for now
  //   setSearchExpanded(!searchExpanded);
  // };

  return (
    <header className={`bg-white shadow-md sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="container-custom flex items-center justify-between h-16">
        <div className="flex items-center">
          {/* Logo wrapped in Link */}
          <Link to="/" aria-label="CABETG Party Planner Home">
            <Logo />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-grow justify-center items-center space-x-3 lg:space-x-5">
          {navLinks.map((link) => (
            <NavLink
              key={link.text}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out
                ${link.text === 'Servicios' ? 
                  (isActive ? 'text-pink-600 font-bold' : 'text-pink-500 hover:text-pink-700 font-semibold') :
                  (isActive ? 'text-primary-600 font-semibold' : 'text-gray-700 hover:text-primary-600')
                }`
              }
            >
              {link.text}
            </NavLink>
          ))}
        </nav>

        {/* Right side icons */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Cart Icon */}
          <Link to="/cart" className="relative text-gray-700 hover:text-primary-500" aria-label="Ver carrito de compras">
            <ShoppingBag size={24} />
            {cart.totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-secondary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.totalItems}
              </span>
            )}
          </Link>

          {/* User Menu */}
          <UserMenu />

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-gray-700 hover:text-primary-500"
            aria-label={mobileMenuOpen ? "Cerrar menú móvil" : "Abrir menú móvil"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {/* Mobile Menu itself is likely rendered in MainLayout.tsx based on mobileMenuOpen state */}
    </header>
  );
};

export default Header;
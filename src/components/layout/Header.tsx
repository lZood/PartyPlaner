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

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <Logo />
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/categories" className="font-medium text-gray-700 hover:text-primary-500">
              Categorías
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* User Account */}
            <UserMenu />

            {/* Cart */}
            <Link to="/cart" className="relative text-gray-700 hover:text-primary-500" aria-label="Shopping Cart">
              <ShoppingBag size={24} />
              {cart?.items?.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cart?.items?.length}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-gray-700 hover:text-primary-500 focus:outline-none"
              aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
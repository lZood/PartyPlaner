import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import UserMenu from './UserMenu';
import Logo from '../ui/Logo';
import { categories } from '../../data/categories';

interface HeaderProps {
  isScrolled: boolean;
  toggleMobileMenu: () => void;
  mobileMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ isScrolled, toggleMobileMenu, mobileMenuOpen }) => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { cart } = useCart(); // Get cart information
  
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
    <header className={`bg-white shadow-md sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
      <div className="container-custom flex items-center justify-between h-16">
        <div className="flex items-center">
          {/* Logo wrapped in Link */}
          <Link to="/" aria-label="CABETG Party Planner Home">
            <Logo />
          </Link>
        </div>

        {/* Desktop Navigation - Categories */}
        <nav className="hidden md:flex flex-grow justify-center items-center space-x-1 lg:space-x-2">
          {categories.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.id}`}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              {category.name}
            </Link>
          ))}
          {categories.length > 5 && (
            <Link
              to="/categories"
              className="px-3 py-2 rounded-md text-sm font-medium text-primary-500 hover:bg-primary-100 transition-colors"
            >
              Ver todas...
            </Link>
          )}
        </nav>

        {/* Right side icons */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Search Icon (optional, if you want a dedicated search icon before expanding search bar) */}
          {/* For now, SearchBar is part of HeroSection, but you might want a small search icon here later */}
          {/* <button onClick={toggleSearch} className="text-gray-700 hover:text-primary-500">
            <Search size={22} />
          </button> */}

          {/* Cart Icon */}
          <Link to="/cart" className="relative text-gray-700 hover:text-primary-500">
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
            aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {/* Consider if searchExpanded logic is still needed here, or if SearchBar component is primary search */}
      {/* {searchExpanded && (
        <div className="container-custom pb-3 md:hidden">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar servicios..."
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button type="submit" className="bg-primary-500 text-white p-2 rounded-md hover:bg-primary-600">
              <Search size={20} />
            </button>
          </form>
        </div>
      )} */}
    </header>
  );
};

export default Header;
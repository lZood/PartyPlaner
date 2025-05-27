import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { Service } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import AuthModal from '../auth/AuthModal';
import { categories } from '../../data/categories';

interface ServiceCardProps {
  service: Service;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart, isInCart } = useCart();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    addToCart(service);
  };
  const category = categories.find(cat => cat.id === service.categoryId);
  const subcategory = category?.subcategories.find(sub => sub.id === service.subcategoryId);

  return (
    <div className="card group">
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          addToCart(service);
        }}
        pendingService={service}
        pendingQuantity={1}
      />

      <div className="relative overflow-hidden">
        <Link to={`/service/${service.id}`}>
          <img 
            src={service.imageUrl} 
            alt={service.name} 
            className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        
        <button 
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white bg-opacity-80 flex items-center justify-center hover:bg-opacity-100 transition-colors"
          aria-label="Añadir a favoritos"
        >
          <Heart size={18} className="text-gray-600 hover:text-secondary-500" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="text-sm text-primary-500 font-medium mb-2">
          {category?.name} / {subcategory?.name}
        </div>
        
        <Link to={`/service/${service.id}`}>
          <h3 className="font-semibold text-xl mb-2 group-hover:text-primary-500 transition-colors">
            {service.name}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-3">
          {service.shortDescription}
        </p>
        
        <div className="flex items-center mb-4">
          <div className="flex text-warning-500">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={16} 
                fill={i < Math.floor(service.rating) ? "currentColor" : "none"}
                strokeWidth={i < Math.floor(service.rating) ? 0 : 1.5}
              />
            ))}
          </div>
          <span className="text-gray-600 text-sm ml-2">
            ({service.reviewCount})
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="font-semibold">
            {service.price ? (
              `$${service.price.toLocaleString('es-MX')}`
            ) : (
              <span className="text-primary-500">Cotizar</span>
            )}
          </div>
          
          {isInCart(service.id) ? (
            <Link 
              to="/cart" 
              className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded text-sm"
            >
              Ver cotización
            </Link>
          ) : (
            <button 
              onClick={handleAddToCart}
              className="btn bg-primary-500 hover:bg-primary-600 text-white py-1 px-3 rounded text-sm"
            >
              Añadir
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
// src/components/search/ServiceCard.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { Service as AppServiceType } from '../../types'; // Changed alias to AppServiceType
import { useAuth } from '../../contexts/AuthContext';
// import { useCart } from '../../contexts/CartContext'; // Not used in this component for favorites
import AuthModal from '../auth/AuthModal';
import { categories } from '../../data/categories';
import { toast } from 'react-toastify';

interface ServiceCardProps {
  service: AppServiceType;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const { isAuthenticated, user, addFavorite, removeFavorite, isFavorite } = useAuth();
  // const { addToCart, isInCart } = useCart(); // Keep if you still have "Add to cart" here
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false); // For loading state

  const isCurrentlyFavorite = isFavorite(service.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation if heart is on top of link
    e.stopPropagation();

    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }
    setIsFavoriting(true);
    try {
      if (isCurrentlyFavorite) {
        await removeFavorite(service.id);
        toast.info(`${service.name} eliminado de tus favoritos.`);
      } else {
        await addFavorite(service.id);
        toast.success(`${service.name} añadido a tus favoritos!`);
      }
    } catch (error) {
      // Error already handled by addFavorite/removeFavorite, toast shown there
    } finally {
      setIsFavoriting(false);
    }
  };
  const category = categories.find(cat => cat.id === service.categoryId);
  const subcategory = category?.subcategories.find(sub => sub.id === service.subcategoryId);

  return (
    <div className="card group flex flex-col h-full"> {/* Added flex flex-col h-full */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // If login was successful, try to favorite again
          if (user && !isCurrentlyFavorite) { // Check again if it's not already favorited
             handleToggleFavorite(new MouseEvent('click') as unknown as React.MouseEvent); // Re-trigger after login
          }
        }}
      />

      <div className="relative overflow-hidden">
        <Link to={`/service/${service.id}`}>
          <img 
            src={service.imageUrl} 
            alt={service.name} 
            className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x200?text=Error+Img'; }}
          />
        </Link>
        
        <button 
          onClick={handleToggleFavorite}
          disabled={isFavoriting}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white bg-opacity-80 flex items-center justify-center
                      hover:bg-opacity-100 transition-all duration-200 ease-in-out transform hover:scale-110
                      focus:outline-none focus:ring-2 focus:ring-pink-300
                      ${isFavoriting ? 'cursor-not-allowed' : ''}`}
          aria-label={isCurrentlyFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <Heart 
            size={20} 
            className={`${isCurrentlyFavorite ? 'text-pink-500 fill-current' : 'text-gray-600 hover:text-pink-500'}`} 
          />
        </button>
      </div>
      
      <div className="p-4 flex flex-col flex-grow"> {/* Added flex flex-col flex-grow */}
        {/* Removed category/subcategory from here to match ServiceListPage more closely */}
        {/* <div className="text-xs text-primary-500 font-medium mb-1 uppercase tracking-wider">
          {category?.name} {subcategory ? `/ ${subcategory.name}` : ''}
        </div> */}
        
        <Link to={`/service/${service.id}`}>
          <h3 className="font-semibold text-lg mb-1.5 group-hover:text-primary-600 transition-colors line-clamp-2">
            {service.name}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-grow"> {/* Added flex-grow */}
          {service.shortDescription}
        </p>
        
        <div className="flex items-center mb-3 mt-auto"> {/* Added mt-auto to push rating/price to bottom */}
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={16} 
                fill={i < Math.floor(service.rating) ? "currentColor" : "none"}
                strokeWidth={i < Math.floor(service.rating) ? 0 : 1.5}
                className={i < Math.floor(service.rating) ? "text-yellow-400" : "text-gray-300"}
              />
            ))}
          </div>
          <span className="text-gray-500 text-xs ml-1.5">
            ({service.reviewCount} reseñas)
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="font-bold text-lg">
            {service.price ? (
              `$${service.price.toLocaleString('es-MX')}`
            ) : (
              <span className="text-sm text-primary-600 font-semibold">Cotizar</span>
            )}
          </div>
          
          {/* Keep add to cart if needed, or remove if this card is just for display/favorites */}
          {/* {isInCart(service.id) ? (
            <Link 
              to="/cart" 
              className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 py-1.5 px-3 rounded-md text-xs font-medium"
            >
              En Lista
            </Link>
          ) : (
            <button 
              onClick={handleAddToCart} // Ensure handleAddToCart is defined if this is active
              className="btn bg-primary-500 hover:bg-primary-600 text-white py-1.5 px-3 rounded-md text-xs font-medium"
            >
              Añadir
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, MapPin } from 'lucide-react'; // Added MapPin
import { Service as AppServiceType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../auth/AuthModal';
// import { categories } from '../../data/categories'; // Not used for displaying location
import { toast } from 'react-toastify';

interface ServiceCardProps {
  service: AppServiceType;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const { isAuthenticated, user, addFavorite, removeFavorite, isFavorite } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);

  const isCurrentlyFavorite = isFavorite(service.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
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
      // Error handling is in AuthContext
    } finally {
      setIsFavoriting(false);
    }
  };

  // Determine location text
  let locationText = "Ubicación no especificada";
  if (service.service_type === 'fixed_location' && service.specific_address) {
    // Extract city or a relevant part of the address. 
    // This is a simple example; you might need a more robust address parser.
    const addressParts = service.specific_address.split(',');
    locationText = addressParts.length > 2 ? addressParts[addressParts.length - 2].trim() : service.specific_address.substring(0, 25) + (service.specific_address.length > 25 ? '...' : '');
  } else if (service.service_type === 'delivery_area') {
    locationText = `Servicio a domicilio`;
    if (service.delivery_radius_km) {
        locationText += ` (${service.delivery_radius_km}km radio)`;
    } else if (service.specific_address) {
        // Optionally, show base city for delivery if radius isn't prominent
        const addressParts = service.specific_address.split(',');
        const city = addressParts.length > 2 ? addressParts[addressParts.length - 2].trim() : null;
        if (city) locationText += ` desde ${city}`;
    }
  } else if (service.service_type === 'multiple_areas') {
    locationText = "Múltiples áreas";
    if (service.coverage_areas && service.coverage_areas.length > 0) {
      locationText = service.coverage_areas[0].area_name; // Show first area name as an example
      if (service.coverage_areas.length > 1) {
        locationText += ` y más`;
      }
    }
  }


  return (
    <div className="card group flex flex-col h-full bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          if (user && !isCurrentlyFavorite) {
            handleToggleFavorite(new MouseEvent('click') as unknown as React.MouseEvent);
          }
        }}
      />

      <div className="relative overflow-hidden rounded-t-lg">
        <Link to={`/service/${service.id}`}>
          <img 
            src={service.imageUrl} 
            alt={service.name} 
            className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x200?text=Error+Img'; }}
          />
        </Link>
        
        {/* Location Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
          <div className="flex items-center text-white text-xs">
            <MapPin size={14} className="mr-1.5 flex-shrink-0" />
            <span className="truncate" title={
                service.service_type === 'fixed_location' && service.specific_address ? service.specific_address :
                service.service_type === 'delivery_area' && service.specific_address ? `Servicio a domicilio desde: ${service.specific_address}` :
                locationText
            }>
              {locationText}
            </span>
          </div>
        </div>

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
      
      <div className="p-4 flex flex-col flex-grow">
        <Link to={`/service/${service.id}`}>
          <h3 className="font-semibold text-lg mb-1.5 group-hover:text-primary-600 transition-colors line-clamp-2">
            {service.name}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-grow">
          {service.shortDescription}
        </p>
        
        <div className="flex items-center mb-3 mt-auto">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={16} 
                fill={i < Math.floor(service.rating ?? 0) ? "currentColor" : "none"} // Added ?? 0 for service.rating
                strokeWidth={i < Math.floor(service.rating ?? 0) ? 0 : 1.5}
                className={i < Math.floor(service.rating ?? 0) ? "text-yellow-400" : "text-gray-300"}
              />
            ))}
          </div>
          <span className="text-gray-500 text-xs ml-1.5">
            ({service.reviewCount ?? 0} reseñas) {/* Added ?? 0 for service.reviewCount */}
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
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
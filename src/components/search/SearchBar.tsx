import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, MapPin, Package, Loader2 } from 'lucide-react';
import { categories } from '../../data/categories';
import { useReservation } from '../../contexts/ReservationContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LocationPicker from './LocationPicker';
import DatePickerModal from './DatePickerModal';
import CategoryPicker from './CategoryPicker';
import { geocodeAddressNominatim, GeocodingResult } from '../../pages/geocoding'; // Corrected path
import { toast } from 'react-toastify';

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const SearchBar: React.FC = () => {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  
  const { selectedDate: contextSelectedDate, setSelectedDate: setContextSelectedDate } = useReservation();
  const [localSelectedDate, setLocalSelectedDate] = useState<Date | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();

  const locationRef = useRef<HTMLButtonElement>(null);
  const dateRef = useRef<HTMLButtonElement>(null);
  const categoryRef = useRef<HTMLButtonElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const closeAllPickers = () => {
    setShowLocationPicker(false);
    setShowDatePicker(false);
    setShowCategoryPicker(false);
    setActiveButton(null);
  };

  useClickOutside(searchBarRef, closeAllPickers);

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsedDate = new Date(dateParam + 'T00:00:00'); // Ensure correct parsing for local timezone
      if (!isNaN(parsedDate.getTime())) {
        setLocalSelectedDate(parsedDate);
      }
    } else {
      setLocalSelectedDate(contextSelectedDate);
    }
  }, [searchParams, contextSelectedDate]);

  const handleSearch = async () => {
    setIsSearching(true);
    closeAllPickers();

    const newSearchParams = new URLSearchParams();
    let userLat: number | null = null;
    let userLng: number | null = null;

    if (location) {
      newSearchParams.set('location_text', location);
      toast.info(`Buscando coordenadas para: ${location}`, { autoClose: 1500, position: "bottom-right" });
      try {
        const geocodeResult = await geocodeAddressNominatim(location);
        if (geocodeResult) {
          userLat = geocodeResult.latitude;
          userLng = geocodeResult.longitude;
          newSearchParams.set('lat', userLat.toString());
          newSearchParams.set('lon', userLng.toString());
          toast.success(`Ubicación encontrada: ${geocodeResult.displayName.substring(0,30)}...`, { autoClose: 2000, position: "bottom-right" });
        } else {
          toast.warn(`No se encontraron coordenadas exactas para "${location}". Se realizará una búsqueda por texto.`, { autoClose: 3000, position: "bottom-right" });
        }
      } catch (error) {
        toast.error('Error durante la geocodificación.', { autoClose: 3000, position: "bottom-right" });
        console.error("Geocoding error:", error);
      }
    }

    if (selectedCategory) newSearchParams.set('category', selectedCategory);
    if (localSelectedDate) newSearchParams.set('date', localSelectedDate.toISOString().split('T')[0]);
    
    if (localSelectedDate !== contextSelectedDate) {
        setContextSelectedDate(localSelectedDate);
    }

    setIsSearching(false);
    navigate(`/search?${newSearchParams.toString()}`);
  };
  
  const dateButtonText = localSelectedDate 
    ? localSelectedDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Agregar fechas';

  return (
    <div ref={searchBarRef} className="relative container-custom max-w-4xl mx-auto">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-full shadow-lg flex items-center p-2 flex-wrap md:flex-nowrap">
        <button
          ref={locationRef}
          onClick={() => {
            closeAllPickers();
            setShowLocationPicker(true);
            setActiveButton('location');
          }}
          className={`flex-1 flex flex-col px-6 py-2 text-left hover:bg-gray-50 rounded-full transition-colors relative min-w-[150px] ${
            activeButton === 'location' ? 'bg-gray-100' : ''
          }`}
        >
          <span className="text-xs font-medium text-gray-800">Destino</span>
          <span className="text-sm text-gray-600 truncate">
            {location || 'Buscar destinos'}
          </span>
        </button>

        <button
          ref={dateRef}
          onClick={() => {
            closeAllPickers();
            setShowDatePicker(true);
            setActiveButton('date');
          }}
          className={`flex-1 flex flex-col px-6 py-2 text-left hover:bg-gray-50 rounded-full transition-colors border-l border-r border-gray-200 relative min-w-[150px] ${
            activeButton === 'date' ? 'bg-gray-100' : ''
          }`}
        >
          <span className="text-xs font-medium text-gray-800">Fecha</span>
          <span className="text-sm text-gray-600">
            {dateButtonText}
          </span>
        </button>

        <button
          ref={categoryRef}
          onClick={() => {
            closeAllPickers();
            setShowCategoryPicker(true);
            setActiveButton('category');
          }}
          className={`flex-1 flex flex-col px-6 py-2 text-left hover:bg-gray-50 rounded-full transition-colors relative min-w-[150px] ${
            activeButton === 'category' ? 'bg-gray-100' : ''
          }`}
        >
          <span className="text-xs font-medium text-gray-800">Tipo de servicio</span>
          <span className="text-sm text-gray-600 truncate">
            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Agrega un servicio'}
          </span>
        </button>

        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="ml-2 bg-primary-500 text-white p-3 md:p-4 rounded-full hover:bg-primary-600 transition-colors disabled:opacity-70"
        >
          {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
        </button>
      </div>

      {showLocationPicker && (
        <div 
          className="absolute z-50 w-full sm:w-[300px] mt-2"
          style={{
            top: '100%',
            left: locationRef.current?.offsetLeft ?? 0,
          }}
        >
          <LocationPicker
            onSelect={(value) => {
              setLocation(value);
              // Optionally close picker or move to next step
              // setShowLocationPicker(false);
              // setActiveButton(null);
            }}
            onClose={() => {
              setShowLocationPicker(false);
              setActiveButton(null);
            }}
          />
        </div>
      )}

      {showDatePicker && (
        <div 
          className="absolute z-50 mt-2"
          style={{
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: '300px',
          }}
        >
          <DatePickerModal
            selectedDate={localSelectedDate}
            onSelect={(date) => {
              setLocalSelectedDate(date);
            }}
            onClose={() => {
              setShowDatePicker(false);
              setActiveButton(null);
            }}
             onApply={(date) => {
                setLocalSelectedDate(date);
                setContextSelectedDate(date); 
                setShowDatePicker(false);
                setActiveButton(null);
            }}
          />
        </div>
      )}

      {showCategoryPicker && (
        <div 
          className="absolute z-50 w-full sm:w-[300px] mt-2"
          style={{
            top: '100%',
            left: categoryRef.current?.offsetLeft ?? 0,
          }}
        >
          <CategoryPicker
            selectedCategory={selectedCategory}
            onSelect={(category) => {
              setSelectedCategory(category);
            }}
            onClose={() => {
              setShowCategoryPicker(false);
              setActiveButton(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SearchBar;
import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Package } from 'lucide-react';
import { categories } from '../../data/categories';
import { useReservation } from '../../contexts/ReservationContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LocationPicker from './LocationPicker';
import DatePickerModal from './DatePickerModal';
import CategoryPicker from './CategoryPicker'; 

const useClickOutside = (ref: React.RefObject<HTMLDivElement>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
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
  const { selectedDate, setSelectedDate } = useReservation();
  const navigate = useNavigate();

  const locationRef = React.useRef<HTMLButtonElement>(null);
  const dateRef = React.useRef<HTMLButtonElement>(null);
  const categoryRef = React.useRef<HTMLButtonElement>(null);
  const searchBarRef = React.useRef<HTMLDivElement>(null);

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
      setSelectedDate(new Date(dateParam));
    }
  }, [searchParams]);

  const handleSearch = () => {
    if (!location && !selectedCategory && !selectedDate) return;
    
    const searchParams = new URLSearchParams();
    if (location) searchParams.set('location', location);
    if (selectedCategory) searchParams.set('category', selectedCategory);
    if (selectedDate) searchParams.set('date', selectedDate.toISOString().split('T')[0]);
    
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <div ref={searchBarRef} className="relative container-custom max-w-4xl mx-auto">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-full shadow-lg flex items-center p-2">
        {/* Location */}
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
          <span className="text-sm text-gray-600">
            {location || 'Buscar destinos'}
          </span>
          <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 text-primary-500" size={18} />
        </button>

        {/* Date */}
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
            {selectedDate ? selectedDate.toLocaleDateString() : 'Agregar fechas'}
          </span>
          <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 text-primary-500" size={18} />
        </button>

        {/* Category */}
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
          <span className="text-sm text-gray-600">
            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Agrega un servicio'}
          </span>
          <Package className="absolute left-0 top-1/2 -translate-y-1/2 text-primary-500" size={18} />
        </button>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="ml-2 bg-primary-500 text-white p-4 rounded-full hover:bg-primary-600 transition-colors"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Pickers */}
      {showLocationPicker && (
        <div 
          className="absolute z-50 w-[300px]"
          style={{
            top: '100%',
            left: locationRef.current?.offsetLeft,
            marginTop: '0.5rem'
          }}
        >
          <LocationPicker
            onSelect={(value) => {
              setLocation(value);
              setShowLocationPicker(false);
              setActiveButton(null);
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
          className="absolute z-50"
          style={{
            top: '100%',
            left: '17%',
            transform: 'translateX(17%)',
            marginTop: '0.5rem'
          }}
        >
          <DatePickerModal
            selectedDate={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setShowDatePicker(false);
              setActiveButton(null);
            }}
            onClose={() => {
              setShowDatePicker(false);
              setActiveButton(null);
            }}
          />
        </div>
      )}

      {showCategoryPicker && (
        <div 
          className="absolute z-50 w-[300px]"
          style={{
            top: '100%',
            left: categoryRef.current?.offsetLeft,
            marginTop: '0.5rem'
          }}
        >
          <CategoryPicker
            selectedCategory={selectedCategory}
            onSelect={(category) => {
              setSelectedCategory(category);
              setShowCategoryPicker(false);
              setActiveButton(null);
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
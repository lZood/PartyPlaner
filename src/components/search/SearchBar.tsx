import React, { useState, useEffect, useRef } from 'react'; // Agregado useRef
import { Search, Calendar, MapPin, Package } from 'lucide-react';
import { categories } from '../../data/categories';
import { useReservation } from '../../contexts/ReservationContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LocationPicker from './LocationPicker';
import DatePickerModal from './DatePickerModal';
import CategoryPicker from './CategoryPicker';

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => { // Cambiado HTMLDivElement a HTMLElement
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => { // Añadido TouchEvent
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener); // Añadido para touch
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener); // Añadido para touch
    };
  }, [ref, handler]);
};

const SearchBar: React.FC = () => {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams(); // setSearchParams para actualizar URL
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
  
  // Usamos el contexto de reserva para la fecha, pero también un estado local si es necesario para la UI del SearchBar
  const { selectedDate: contextSelectedDate, setSelectedDate: setContextSelectedDate } = useReservation();
  const [localSelectedDate, setLocalSelectedDate] = useState<Date | null>(null);


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

  // Sincronizar el estado local de la fecha con el contexto y los parámetros de búsqueda
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      // Validar que la fecha sea correcta antes de asignarla
      if (!isNaN(parsedDate.getTime())) {
        setLocalSelectedDate(parsedDate);
        // Opcionalmente, también podrías actualizar el contexto aquí si SearchBar es la fuente principal
        // setContextSelectedDate(parsedDate); 
      }
    } else {
      setLocalSelectedDate(contextSelectedDate); // Sincronizar desde el contexto si no hay parámetro
    }
  }, [searchParams, contextSelectedDate]);


  const handleSearch = () => {
    // No es necesario verificar si todos están vacíos aquí, la página de resultados puede manejar eso.
    const newSearchParams = new URLSearchParams();
    if (location) newSearchParams.set('location', location);
    if (selectedCategory) newSearchParams.set('category', selectedCategory);
    if (localSelectedDate) newSearchParams.set('date', localSelectedDate.toISOString().split('T')[0]);
    
    // Actualizar el contexto de reserva si la fecha ha cambiado localmente
    if (localSelectedDate !== contextSelectedDate) {
        setContextSelectedDate(localSelectedDate);
    }

    navigate(`/search?${newSearchParams.toString()}`);
    closeAllPickers();
  };
  
  // Actualizar el título del botón de fecha cuando localSelectedDate cambia
  const dateButtonText = localSelectedDate 
    ? localSelectedDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Agregar fechas';


  return (
    <div ref={searchBarRef} className="relative container-custom max-w-4xl mx-auto">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-full shadow-lg flex items-center p-2 flex-wrap md:flex-nowrap">
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
          <span className="text-sm text-gray-600 truncate"> {/* Añadido truncate */}
            {location || 'Buscar destinos'}
          </span>
          {/* Icono de MapPin, puedes decidir si lo necesitas aquí o dentro del LocationPicker */}
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
            {dateButtonText} {/* Usar texto de botón de fecha actualizado */}
          </span>
          {/* Icono de Calendar */}
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
          <span className="text-sm text-gray-600 truncate"> {/* Añadido truncate */}
            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Agrega un servicio'}
          </span>
          {/* Icono de Package */}
        </button>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="ml-2 bg-primary-500 text-white p-3 md:p-4 rounded-full hover:bg-primary-600 transition-colors" // Ajustado padding para móvil
        >
          <Search size={20} />
        </button>
      </div>

      {/* Pickers */}
      {showLocationPicker && (
        <div 
          className="absolute z-50 w-full sm:w-[300px] mt-2" // Ajustado ancho para móvil
          style={{
            top: '100%',
            left: locationRef.current?.offsetLeft ?? 0, // Default a 0 si es null
          }}
        >
          <LocationPicker
            onSelect={(value) => {
              setLocation(value);
              // setShowLocationPicker(false); // No cerrar automáticamente, el usuario podría querer refinar
              // setActiveButton(null);
            }}
            onClose={() => { // onClose se puede llamar desde el propio LocationPicker si tiene un botón de cerrar
              setShowLocationPicker(false);
              setActiveButton(null);
            }}
          />
        </div>
      )}

      {showDatePicker && (
        <div 
          className="absolute z-50 mt-2" // Quitado posicionamiento izquierdo fijo
          style={{
            top: '100%',
            // Centrar el DatePicker o posicionarlo mejor
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: '300px', // Asegurar un ancho mínimo
          }}
        >
          <DatePickerModal
            selectedDate={localSelectedDate}
            onSelect={(date) => {
              setLocalSelectedDate(date); // Actualizar estado local
              // No cerrar automáticamente, podría tener un botón de "Aplicar"
            }}
            onClose={() => {
              setShowDatePicker(false);
              setActiveButton(null);
            }}
            // Podrías pasar un onApply para cerrar y actualizar contexto
            onApply={(date) => {
                setLocalSelectedDate(date);
                setContextSelectedDate(date); // Actualizar contexto al aplicar
                setShowDatePicker(false);
                setActiveButton(null);
            }}
          />
        </div>
      )}

      {showCategoryPicker && (
        <div 
          className="absolute z-50 w-full sm:w-[300px] mt-2" // Ajustado ancho para móvil
          style={{
            top: '100%',
            left: categoryRef.current?.offsetLeft ?? 0,  // Default a 0 si es null
          }}
        >
          <CategoryPicker
            selectedCategory={selectedCategory}
            onSelect={(category) => {
              setSelectedCategory(category);
              // setShowCategoryPicker(false); // No cerrar automáticamente
              // setActiveButton(null);
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
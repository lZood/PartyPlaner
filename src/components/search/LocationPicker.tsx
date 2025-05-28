import React from 'react';
import { MapPin } from 'lucide-react';

interface LocationPickerProps {
  onSelect: (location: string) => void;
  onClose: () => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onSelect, onClose }) => {
  const popularLocations = [
    { id: 'guasave', name: 'Guasave', state: 'Sinaloa' },
        { id: 'guadalajara', name: 'Guadalajara', state: 'Jalisco' },
    { id: 'cdmx', name: 'Ciudad de México', state: 'CDMX' },
    { id: 'monterrey', name: 'Monterrey', state: 'Nuevo León' },
    { id: 'cancun', name: 'Cancún', state: 'Quintana Roo' },
  ];

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg p-3 z-50 max-w-sm">
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-800">Por la zona</h3>
        <p className="text-xs text-gray-500">Descubre qué hay a tu alrededor</p>
      </div>

      <div className="space-y-2">
        {popularLocations.map((location) => (
          <button
            key={location.id}
            onClick={() => onSelect(location.name)}
            className="w-full flex items-center p-2 hover:bg-gray-50 rounded transition-colors"
          >
            <MapPin className="text-gray-400 mr-2" size={16} />
            <div className="text-left">
              <div className="text-sm font-medium text-gray-700">{location.name}</div>
              <div className="text-xs text-gray-500">{location.state}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LocationPicker;
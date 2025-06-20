import React from 'react';
import { categories } from '../../data/categories';
import { Music, Palette, CarFront as ChairFront, Coffee, Candy, Package, Camera, Utensils, Package2 as Massage2, Dumbbell, Paintbrush, Scissors, Space as Spa, UtensilsCrossed, Mail as Nail } from 'lucide-react'; // Mantén tus imports de iconos

interface CategoryPickerProps {
  selectedCategory: string | null;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selectedCategory,
  onSelect,
  // onClose, // onClose no se usa en este fragmento, pero mantenlo si se usa en otra parte
}) => {
  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'music':
        return <Music size={16} />;
      case 'decoration':
        return <Palette size={16} />;
      case 'furniture':
        // El alias CarFront as ChairFront es de tu código original.
        // Si el ícono correcto es CarFront o ChairFront, asegúrate que el import sea el correcto.
        // Aquí uso ChairFront como en tu import.
        return <ChairFront size={16} />;
      case 'food':
        return <Coffee size={16} />;
      case 'candy': // Corregido desde 'snacks' si 'candy' es el id correcto de categories.ts
        return <Candy size={16} />;
      case 'fotografia':
        return <Camera size={16} />;
      case 'chefs':
        return <Utensils size={16} />;
      case 'comidas':
        return <UtensilsCrossed size={16} />;
      case 'masaje':
        return <Massage2 size={16} />;
      case 'entrenamiento':
        return <Dumbbell size={16} />;
      case 'maquillaje':
        return <Paintbrush size={16} />;
      case 'peluqueria':
        return <Scissors size={16} />;
      case 'spa':
        return <Spa size={16} />;
      case 'disposables':
        return <Package size={16} />;
      default:
        // Es bueno tener un ícono por defecto
        return <Package size={16} />; // O cualquier otro ícono genérico
    }
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg p-4 z-50 max-w-md">
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-800">Tipo de servicio</h3>
        <p className="text-xs text-gray-500">¿Qué servicio estás buscando?</p>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            // Se elimina la primera definición de className
            // La siguiente es la única definición de className
            className={`
              flex items-center px-4 py-2 rounded-full border
              ${selectedCategory === category.id 
                ? 'bg-primary-50 text-primary-600 border-primary-200' 
                : 'bg-gray-50 text-gray-700 border-gray-200'
              } hover:border-primary-300 transition-colors
            `}
          >
            <span className="mr-2">{getCategoryIcon(category.id)}</span>
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryPicker;
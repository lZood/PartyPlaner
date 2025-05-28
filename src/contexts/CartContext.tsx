import React, { createContext, useContext, useState, useEffect } from 'react';
import { Service } from '../types';
import { useReservation } from './ReservationContext'; // Importar para fecha por defecto

export interface CartItem { // Exportar para que pueda ser usado en otros lados si es necesario
  service: Service;
  quantity: number;
  eventDate?: string; // Fecha específica para este ítem YYYY-MM-DD
}

interface CartContextType {
  cart: {
    items: CartItem[];
    totalItems: number;
    // Podríamos añadir una fecha global para el carrito aquí si todos los items deben compartirla
    // cartEventDate?: string | null; 
  };
  addToCart: (service: Service, quantity?: number, eventDate?: string) => void; // Añadir eventDate
  removeFromCart: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  updateItemEventDate: (serviceId: string, eventDate: string) => void;
  getCartEventDate: () => string | null; // Para obtener una fecha consistente del carrito
  clearCart: () => void;
  isInCart: (serviceId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedDate: globalSelectedDate } = useReservation(); // Obtener fecha global
  const [cart, setCart] = useState<{ items: CartItem[]; totalItems: number }>({
    items: [],
    totalItems: 0,
  });

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (service: Service, quantity = 1, eventDate?: string) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.items.findIndex(
        (item) => item.service.id === service.id
      );

      let newItems;
      // Usar la fecha proporcionada, o la global del contexto, o dejarla undefined si ninguna está disponible.
      // Convertir Date a string YYYY-MM-DD si es necesario.
      let dateForService: string | undefined = eventDate;
      if (!dateForService && globalSelectedDate) {
        try {
            dateForService = globalSelectedDate.toISOString().split('T')[0];
        } catch (e) { console.error("Error formatting globalSelectedDate", e)}
      }


      if (existingItemIndex >= 0) {
        newItems = [...prevCart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity,
          // Si ya existe, decidir si se actualiza la fecha o se mantiene la existente
          // Por ahora, la mantendremos para evitar sobrescribir una fecha específica del ítem.
          // eventDate: dateForService || newItems[existingItemIndex].eventDate 
        };
      } else {
        newItems = [...prevCart.items, { service, quantity, eventDate: dateForService }];
      }

      const totalItems = newItems.reduce((total, item) => total + item.quantity, 0);

      return {
        items: newItems,
        totalItems,
      };
    });
  };

  const removeFromCart = (serviceId: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter((item) => item.service.id !== serviceId);
      const totalItems = newItems.reduce((total, item) => total + item.quantity, 0);
      return { items: newItems, totalItems };
    });
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(serviceId);
      return;
    }
    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) =>
        item.service.id === serviceId ? { ...item, quantity } : item
      );
      const totalItems = newItems.reduce((total, item) => total + item.quantity, 0);
      return { items: newItems, totalItems };
    });
  };
  
  const updateItemEventDate = (serviceId: string, eventDate: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) =>
        item.service.id === serviceId ? { ...item, eventDate } : item
      );
      return { ...prevCart, items: newItems };
    });
  };

  // Función para obtener una fecha consistente del carrito.
  // Si todos los ítems tienen la misma fecha (y está definida), la devuelve.
  // Si hay fechas mixtas o ninguna, devuelve null. O podría devolver la primera.
  const getCartEventDate = (): string | null => {
    if (cart.items.length === 0) return null;
    const firstDate = cart.items[0].eventDate;
    if (cart.items.every(item => item.eventDate === firstDate && firstDate !== undefined)) {
      return firstDate;
    }
    // Si hay fechas mixtas o algunas indefinidas, podría devolver la global o null
    if (globalSelectedDate) {
        try {
            return globalSelectedDate.toISOString().split('T')[0];
        } catch (e) { return null; }
    }
    return null; // O manejar de otra forma (ej. forzar selección)
  };


  const clearCart = () => {
    setCart({ items: [], totalItems: 0 });
  };

  const isInCart = (serviceId: string) => {
    return cart.items.some((item) => item.service.id === serviceId);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemEventDate,
        getCartEventDate,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
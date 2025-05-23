import React, { createContext, useContext, useState, useEffect } from 'react';
import { Service } from '../types';

interface CartItem {
  service: Service;
  quantity: number;
}

interface CartContextType {
  cart: {
    items: CartItem[];
    totalItems: number;
  };
  addToCart: (service: Service, quantity?: number) => void;
  removeFromCart: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
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
  const [cart, setCart] = useState<{ items: CartItem[]; totalItems: number }>({
    items: [],
    totalItems: 0,
  });

  // Load cart from localStorage on mount
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

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (service: Service, quantity = 1) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.items.findIndex(
        (item) => item.service.id === service.id
      );

      let newItems;

      if (existingItemIndex >= 0) {
        // If item already exists, update its quantity
        newItems = [...prevCart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity,
        };
      } else {
        // If item doesn't exist, add it to the cart
        newItems = [...prevCart.items, { service, quantity }];
      }

      // Calculate total items
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

      return {
        items: newItems,
        totalItems,
      };
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

      return {
        items: newItems,
        totalItems,
      };
    });
  };

  const clearCart = () => {
    setCart({
      items: [],
      totalItems: 0,
    });
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
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
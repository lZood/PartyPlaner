import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, MinusCircle, PlusCircle, CreditCard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { categories } from '../data/categories';
import { useNavigate } from 'react-router-dom';

const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  // Calculate total
  const calculateTotal = () => {
    return cart.items.reduce((total, item) => {
      if (item.service.price) {
        const itemTotal = item.service.price * item.quantity;
        return total + itemTotal;
      }
      return total;
    }, 0);
  };

  const calculateSubtotal = () => {
    return calculateTotal();
  };

  const calculateIVA = () => {
    return calculateSubtotal() * 0.16;
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateIVA();
  };
  
  const handleProceedToPayment = () => navigate('/payment');

  useEffect(() => {
    document.title = 'Carrito de Compra | CABETG Party Planner';
  }, []);

  return (
    <div className="bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-3xl font-bold mb-8">Mi Carrito</h1>

        {cart.items.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Tu Carrito está Vacío</h2>
            <p className="text-gray-600 mb-6">
              No has añadido ningún servicio a tu carrito. Explora nuestras categorías para encontrar los servicios perfectos para tu evento.
            </p>
            <Link
              to="/"
              className="btn bg-primary-500 hover:bg-primary-600 text-white py-3 px-8 rounded-lg font-medium"
            >
              Explorar Servicios
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Servicios Seleccionados</h2>
                
                <div className="divide-y divide-gray-200">
                  {cart.items.map((item) => {
                    const category = categories.find(
                      (cat) => cat.id === item.service.categoryId
                    );
                    
                    const subcategory = category?.subcategories.find(
                      (subcat) => subcat.id === item.service.subcategoryId
                    );
                    
                    return (
                      <div key={item.service.id} className="py-6 first:pt-0 last:pb-0">
                        <div className="flex flex-col sm:flex-row">
                          <Link
                            to={`/service/${item.service.id}`}
                            className="sm:w-32 sm:h-24 rounded overflow-hidden mb-4 sm:mb-0 sm:mr-6 flex-shrink-0"
                          >
                            <img
                              src={item.service.imageUrl}
                              alt={item.service.name}
                              className="w-full h-full object-cover"
                            />
                          </Link>
                          
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:justify-between">
                              <div>
                                <Link
                                  to={`/service/${item.service.id}`}
                                  className="text-lg font-medium hover:text-primary-500 transition-colors"
                                >
                                  {item.service.name}
                                </Link>
                                <div className="text-sm text-gray-500 mb-2">
                                  {category?.name} / {subcategory?.name}
                                </div>
                              </div>
                              <div className="font-semibold mb-2 sm:mb-0 text-right">
                                {item.service.price ? (
                                  `$${(
                                    item.service.price * item.quantity
                                  ).toLocaleString('es-MX')}`
                                ) : (
                                  <span className="text-primary-500">Cotizar</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center">
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.service.id,
                                      Math.max(1, item.quantity - 1)
                                    )
                                  }
                                  className="text-gray-500 hover:text-primary-500 disabled:opacity-50"
                                  disabled={item.quantity <= 1}
                                >
                                  <MinusCircle size={18} />
                                </button>
                                <span className="mx-3 w-8 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateQuantity(
                                      item.service.id,
                                      item.quantity + 1
                                    )
                                  }
                                  className="text-gray-500 hover:text-primary-500"
                                >
                                  <PlusCircle size={18} />
                                </button>
                              </div>
                              
                              <button
                                onClick={() => removeFromCart(item.service.id)}
                                className="text-gray-400 hover:text-error-500 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={clearCart}
                    className="text-gray-500 hover:text-error-500 flex items-center"
                  >
                    <Trash2 size={16} className="mr-1" />
                    <span>Vaciar lista</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Purchase Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-6">Resumen de Compra</h2>
                <div className="space-y-4">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${calculateSubtotal().toLocaleString('es-MX')}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">IVA (16%)</span>
                    <span className="font-medium">${calculateIVA().toLocaleString('es-MX')}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-lg font-bold">${calculateGrandTotal().toLocaleString('es-MX')}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleProceedToPayment}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium mt-6 flex items-center justify-center"
                  >
                    <CreditCard size={20} className="mr-2" />
                    Proceder al Pago
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
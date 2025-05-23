import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, MinusCircle, PlusCircle, CheckCircle, CreditCard } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { categories } from '../data/categories';
import AuthModal from '../components/auth/AuthModal';

const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    eventLocation: '',
    comments: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Calculate total
  const calculateTotal = () => {
    return cart.items.reduce((total, item) => {
      if (item.service.price) {
        return total + item.service.price * item.quantity;
      }
      return total;
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!isAuthenticated) {
      setShowAuthModal(true);
      setIsSubmitting(false);
      return;
    }

    // Proceed with payment simulation
    simulatePayment();
  };

  const simulatePayment = () => {
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      clearCart();
    }, 2000);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    simulatePayment();
  };

  useEffect(() => {
    document.title = 'Carrito de Compra | CABETG Party Planner';
  }, []);

  return (
    <div className="bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-3xl font-bold mb-8">Carrito de Compra</h1>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />

        {isSubmitted ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-primary-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4">¡Solicitud Enviada con Éxito!</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Hemos recibido tu solicitud de cotización. Uno de nuestros asesores se pondrá en contacto contigo en las próximas 24 horas.
            </p>
            <Link
              to="/"
              className="btn bg-primary-500 hover:bg-primary-600 text-white py-3 px-8 rounded-lg font-medium"
            >
              Volver al Inicio
            </Link>
          </div>
        ) : cart.items.length === 0 ? (
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
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
                
                <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={clearCart}
                    className="text-gray-500 hover:text-error-500 flex items-center"
                  >
                    <Trash2 size={16} className="mr-1" />
                    <span>Vaciar lista</span>
                  </button>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">
                      Total estimado (servicios con precio fijo)
                    </div>
                    <div className="text-xl font-bold">
                      ${calculateTotal().toLocaleString('es-MX')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      *Algunos servicios requieren cotización personalizada
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Solicitar Cotización</h2>
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label 
                        htmlFor="name" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="email" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Correo electrónico *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="phone" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="eventDate" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Fecha del evento *
                      </label>
                      <input
                        type="date"
                        id="eventDate"
                        name="eventDate"
                        required
                        value={formData.eventDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="eventLocation" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Ubicación del evento *
                      </label>
                      <input
                        type="text"
                        id="eventLocation"
                        name="eventLocation"
                        required
                        value={formData.eventLocation}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="comments" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Comentarios o solicitudes especiales
                      </label>
                      <textarea
                        id="comments"
                        name="comments"
                        rows={3}
                        value={formData.comments}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full bg-primary-500 flex items-center justify-center ${
                        isSubmitting ? 'opacity-70' : 'hover:bg-primary-600'
                      } text-white py-3 rounded-lg font-medium transition-colors`}
                    >
                      {isSubmitting ? (
                        'Procesando...'
                      ) : (
                        <>
                          <CreditCard size={20} className="mr-2" />
                          Contratar Ahora
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
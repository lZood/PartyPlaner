import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../auth/AuthModal';

interface UserMenuProps {
  className?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  // Estado local para la carga del logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true); // Iniciar estado de carga del logout
    try {
      await logout();
      setIsOpen(false); // Cerrar el menú después del logout
      navigate('/'); // Redirigir al home
    } catch (error) {
      console.error('Error logging out:', error);
      // Aquí podrías mostrar una notificación de error al usuario
    } finally {
      setIsLoggingOut(false); // Finalizar estado de carga, independientemente del resultado
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => (isAuthenticated ? setIsOpen(!isOpen) : setShowAuthModal(true))}
        className="text-gray-700 hover:text-primary-500 focus:outline-none"
        aria-label="User menu"
      >
        <User size={24} />
      </button>

      {/* Solo renderizar el menú desplegable si isOpen es true, el usuario está autenticado Y existe el objeto user */}
      {isOpen && isAuthenticated && user && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900 truncate" title={user.name}>
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate" title={user.email}>
              {user.email}
            </p>
          </div>

          <Link
            to="/profile"
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => setIsOpen(false)} // Cerrar menú al navegar
          >
            <Settings size={16} className="mr-3 text-gray-500" />
            Mi Perfil
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            disabled={isLoggingOut} // Usar el estado local isLoggingOut
          >
            {isLoggingOut ? (
              <Loader2 size={16} className="mr-3 animate-spin text-gray-500" />
            ) : (
              <LogOut size={16} className="mr-3 text-gray-500" />
            )}
            {isLoggingOut ? 'Cerrando Sesión...' : 'Cerrar Sesión'}
          </button>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default UserMenu;
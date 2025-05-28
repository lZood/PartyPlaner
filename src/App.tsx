import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import MainLayout from './layouts/MainLayout';
import ScrollToTop from './components/utils/ScrollToTop'; 

// Pages
import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryPage from './pages/CategoryPage';
import ServiceListPage from './pages/ServiceListPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import CartPage from './pages/CartPage';
import AboutPage from './pages/AboutPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import SearchResultsPage from './pages/SearchResultsPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';
import BlogPage from './pages/BlogPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ReservationProvider } from './contexts/ReservationContext';

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop /> {/* <--- AÑADE EL COMPONENTE AQUÍ */}
      <AuthProvider>
        <ReservationProvider> {/* Asegúrate que este Provider esté correctamente implementado */}
          <CartProvider>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
            <Suspense fallback={<div className="flex justify-center items-center min-h-screen text-xl">Cargando página...</div>}>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="category/:categoryId" element={<CategoryPage />} />
                  <Route path="category/:categoryId/:subcategoryId" element={<CategoryPage />} /> {/* Para subcategorías */}
                  <Route path="service/:serviceId" element={<ServiceDetailPage />} />
                  <Route path="search" element={<SearchResultsPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<PaymentPage />} />
                  <Route path="payment-success" element={<PaymentSuccessPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="about" element={<AboutPage />} /> {/* Asumiendo ruta */}
                  <Route path="contact" element={<ContactPage />} /> {/* Asumiendo ruta */}
                  <Route path="blog" element={<BlogPage />} /> {/* Asumiendo ruta */}
                  <Route path="faq" element={<FaqPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </CartProvider>
        </ReservationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ReservationProvider } from './contexts/ReservationContext'; // Asegúrate que esta importación sea correcta
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import MainLayout from './layouts/MainLayout';
import ScrollToTop from './components/utils/ScrollToTop'; // <--- IMPORTA EL COMPONENTE

// ... (tus imports de páginas lazy)
const HomePage = lazy(() => import('./pages/HomePage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AboutPage = lazy(() => import('./pages/AboutPage')); // Asumiendo que la tienes
const ContactPage = lazy(() => import('./pages/ContactPage')); // Asumiendo que la tienes
const BlogPage = lazy(() => import('./pages/BlogPage')); // Asumiendo que la tienes
const FaqPage = lazy(() => import('./pages/FaqPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));


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
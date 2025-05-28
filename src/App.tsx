// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ReservationProvider } from './contexts/ReservationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import MainLayout from './layouts/MainLayout';
import ScrollToTop from './components/utils/ScrollToTop'; // <--- RUTA CORREGIDA

const HomePage = lazy(() => import('./pages/HomePage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));


const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <ReservationProvider>
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
                  <Route path="category/:categoryId/:subcategoryId" element={<CategoryPage />} />
                  <Route path="service/:serviceId" element={<ServiceDetailPage />} />
                  <Route path="search" element={<SearchResultsPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<PaymentPage />} />
                  <Route path="payment-success" element={<PaymentSuccessPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="blog" element={<BlogPage />} />
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
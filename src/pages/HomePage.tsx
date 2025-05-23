import React, { useEffect } from 'react';
import HeroSection from '../components/home/HeroSection';
import CategoryShowcase from '../components/home/CategoryShowcase';
import TestimonialsSection from '../components/home/TestimonialsSection';
import CTASection from '../components/home/CTASection';

const HomePage: React.FC = () => {
  useEffect(() => {
    document.title = 'CABETG Party Planner | Planea tu evento perfecto';
  }, []);
  
  return (
    <div>
      <HeroSection />
      <CategoryShowcase />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};

export default HomePage;
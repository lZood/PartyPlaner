import React from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import SearchBar from '../search/SearchBar';

const HeroSection: React.FC = () => {
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: false,
    fade: true,
  };

  const slides = [
    {
      image: 'https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg',
    },
    {
      image: 'https://images.pexels.com/photos/5876516/pexels-photo-5876516.jpeg',
    },
    {
      image: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
    },
  ];

  return (
    <section className="relative min-h-[70vh] flex flex-col">
      {/* Hero Text - Above Search Bar */}
      <div className="absolute top-1/3 left-0 right-0 z-20 text-center text-white">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 slide-up text-white">
          Crea Eventos Inolvidables
        </h1>
        <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto slide-up">
          Todo lo que necesitas para planear la fiesta perfecta.
        </p>
      </div>

      {/* Search Bar Container */}
      <div className="absolute top-1/2 left-0 right-0 z-20">
        <SearchBar />
      </div>

      <div className="absolute inset-0 z-0">
        <Slider {...sliderSettings} className="h-full">
          {slides.map((slide, index) => (
            <div key={index} className="relative h-[70vh] min-h-[500px]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default HeroSection;
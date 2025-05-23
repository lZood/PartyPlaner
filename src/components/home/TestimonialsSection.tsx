import React from 'react';
import Slider from 'react-slick';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Mariana López',
    role: 'Boda en CDMX',
    content: 'Contratar los servicios a través de CABETG fue la mejor decisión para nuestra boda. Encontramos todo lo que necesitábamos en un solo lugar y el proceso de cotización fue rápido y sencillo. ¡Muchas gracias por hacer de nuestro día tan especial!',
    image: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg',
  },
  {
    id: 2,
    name: 'Carlos Mendoza',
    role: 'Fiesta Corporativa',
    content: 'Como organizador de eventos corporativos, puedo decir que CABETG ha revolucionado la forma en que planifico. La plataforma es intuitiva y los proveedores son de primera categoría. Definitivamente seguiré utilizando sus servicios para futuros eventos.',
    image: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
  },
  {
    id: 3,
    name: 'Sofía Ramírez',
    role: 'Cumpleaños Infantil',
    content: 'Organizar el cumpleaños de mi hija fue súper fácil con CABETG. Desde la decoración con globos hasta la mesa de dulces, todo llegó a tiempo y exactamente como lo esperaba. ¡Mi hija y sus amigos quedaron encantados!',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
  },
  {
    id: 4,
    name: 'Roberto Valencia',
    role: 'Aniversario',
    content: 'Sorprendí a mi esposa en nuestro aniversario con una cena especial y un grupo musical, todo contratado a través de CABETG. El servicio fue impecable y la experiencia superó nuestras expectativas. Sin duda, lo recomendaría.',
    image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
  },
];

const TestimonialsSection: React.FC = () => {
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 6000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <section className="section bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Historias de éxito de personas que hicieron realidad el evento de sus sueños.
          </p>
        </div>

        <Slider {...sliderSettings} className="testimonial-slider">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="px-4">
              <div className="bg-white rounded-xl shadow-md p-6 md:p-8 h-full">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{testimonial.name}</h3>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="relative">
                  <Quote className="absolute top-0 left-0 text-primary-200 w-8 h-8 transform -translate-x-2 -translate-y-2 opacity-50" />
                  <p className="text-gray-700 relative z-10 pl-3">
                    {testimonial.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default TestimonialsSection;
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FaqPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Preguntas Frecuentes | CABETG Party Planner';
  }, []);

  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      category: 'Sobre la Plataforma',
      questions: [
        {
          question: '¿Cómo funciona CABETG Party Planner?',
          answer:
            'CABETG Party Planner es una plataforma que conecta a organizadores de eventos con proveedores de servicios. Puedes explorar diferentes categorías, comparar opciones, agregar servicios a tu lista de cotización y solicitar presupuestos personalizados, todo en un solo lugar.',
        },
        {
          question: '¿Es gratuito utilizar CABETG Party Planner?',
          answer:
            'Sí, el uso de nuestra plataforma es completamente gratuito para los usuarios que buscan servicios. No cobramos comisiones ni tarifas adicionales por solicitar cotizaciones o contactar proveedores.',
        },
        {
          question: '¿Necesito crear una cuenta para utilizar la plataforma?',
          answer:
            'No es necesario para explorar los servicios disponibles, pero te recomendamos crear una cuenta para guardar tus cotizaciones, recibir respuestas de los proveedores y tener un seguimiento de tus eventos.',
        },
      ],
    },
    {
      category: 'Servicios y Proveedores',
      questions: [
        {
          question: '¿Cómo seleccionan a los proveedores?',
          answer:
            'Todos los proveedores en nuestra plataforma pasan por un proceso de verificación para asegurar que cumplen con nuestros estándares de calidad. Evaluamos su experiencia, profesionalismo y revisamos las opiniones de clientes anteriores.',
        },
        {
          question:
            '¿Puedo ver opiniones y calificaciones de otros usuarios sobre los proveedores?',
          answer:
            'Sí, cada proveedor cuenta con un perfil donde puedes ver las calificaciones y reseñas dejadas por usuarios que han contratado sus servicios anteriormente. Esto te ayudará a tomar decisiones informadas.',
        },
        {
          question:
            '¿Qué sucede si tengo un problema con un proveedor contratado a través de la plataforma?',
          answer:
            'Contamos con un equipo de soporte dedicado a resolver cualquier inconveniente que pueda surgir. Si tienes algún problema, puedes contactarnos directamente y trabajaremos en una solución satisfactoria.',
        },
      ],
    },
    {
      category: 'Cotizaciones y Pagos',
      questions: [
        {
          question: '¿Cómo funciona el proceso de cotización?',
          answer:
            'Agrega los servicios que te interesen a tu lista de cotización, completa un breve formulario con los detalles de tu evento y envía la solicitud. Los proveedores recibirán tu información y te enviarán una cotización personalizada en un plazo máximo de 48 horas.',
        },
        {
          question: '¿CABETG Party Planner procesa los pagos?',
          answer:
            'No, los pagos se realizan directamente con el proveedor. Nosotros facilitamos la comunicación y el proceso de cotización, pero los términos de pago son acordados entre tú y el proveedor seleccionado.',
        },
        {
          question: '¿Puedo negociar el precio con los proveedores?',
          answer:
            'Absolutamente. Las cotizaciones iniciales son solo el punto de partida, y puedes negociar directamente con el proveedor para ajustar los servicios y precios según tus necesidades y presupuesto.',
        },
      ],
    },
    {
      category: 'Eventos y Planificación',
      questions: [
        {
          question: '¿Con cuánta anticipación debo planificar mi evento?',
          answer:
            'Recomendamos comenzar la planificación con al menos 3 meses de anticipación para eventos medianos y grandes, y 1 mes para eventos pequeños. Algunos servicios populares, como locaciones y fotógrafos, suelen reservarse con mucha anticipación, especialmente en temporadas altas.',
        },
        {
          question: '¿Ofrecen servicios de planificación completa de eventos?',
          answer:
            'Sí, contamos con proveedores especializados en planificación integral de eventos que pueden encargarse de todos los aspectos, desde el concepto inicial hasta la ejecución el día del evento.',
        },
        {
          question: '¿Puedo planificar cualquier tipo de evento en la plataforma?',
          answer:
            'Sí, nuestra plataforma está diseñada para facilitar la planificación de todo tipo de eventos: bodas, cumpleaños, eventos corporativos, fiestas infantiles, graduaciones, aniversarios, y cualquier otra celebración que estés organizando.',
        },
      ],
    },
  ];

  return (
    <div>
      <div className="relative h-[40vh] min-h-[300px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(https://images.pexels.com/photos/7034646/pexels-photo-7034646.jpeg)` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        <div className="relative container-custom h-full flex flex-col justify-center text-white z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Preguntas Frecuentes</h1>
          <p className="text-lg md:text-xl max-w-2xl">
            Encuentra respuestas a las dudas más comunes sobre nuestros servicios
          </p>
        </div>
      </div>

      <section className="section">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <div className="flex gap-4 overflow-x-auto pb-4 md:flex-wrap md:justify-center">
                {faqs.map((category, index) => (
                  <a
                    key={index}
                    href={`#category-${index}`}
                    className="px-4 py-2 bg-gray-100 hover:bg-primary-100 text-gray-700 rounded-full whitespace-nowrap"
                  >
                    {category.category}
                  </a>
                ))}
              </div>
            </div>

            {faqs.map((category, categoryIndex) => (
              <div key={categoryIndex} id={`category-${categoryIndex}`} className="mb-12">
                <h2 className="text-2xl font-bold mb-6">{category.category}</h2>
                <div className="space-y-4">
                  {category.questions.map((faq, faqIndex) => {
                    const index = categoryIndex * 10 + faqIndex;
                    return (
                      <div
                        key={faqIndex}
                        className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200"
                      >
                        <button
                          className="flex justify-between items-center w-full p-4 text-left bg-white hover:bg-gray-50"
                          onClick={() => toggleFaq(index)}
                        >
                          <span className="font-medium text-lg">{faq.question}</span>
                          {activeIndex === index ? (
                            <ChevronUp className="text-primary-500" />
                          ) : (
                            <ChevronDown className="text-gray-400" />
                          )}
                        </button>
                        <div
                          className={`transition-all duration-300 ease-in-out overflow-hidden ${
                            activeIndex === index
                              ? 'max-h-96 opacity-100'
                              : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="p-4 pt-0 text-gray-600 bg-white">
                            {faq.answer}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="bg-primary-50 rounded-xl p-6 text-center mt-12">
              <h3 className="text-xl font-bold mb-4">¿No encontraste la respuesta que buscabas?</h3>
              <p className="text-gray-600 mb-6">
                Estamos aquí para ayudarte. Contáctanos directamente y responderemos a todas tus preguntas.
              </p>
              <Link
                to="/contact"
                className="btn bg-primary-500 hover:bg-primary-600 text-white py-2 px-6 rounded-lg inline-flex items-center"
              >
                Contáctanos
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FaqPage;
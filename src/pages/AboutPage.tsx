import React, { useEffect } from 'react';

const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Sobre Nosotros | CABETG Party Planner';
  }, []);

  return (
    <div>
      <div className="relative h-[40vh] min-h-[300px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(https://images.pexels.com/photos/2608512/pexels-photo-2608512.jpeg)` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        <div className="relative container-custom h-full flex flex-col justify-center text-white z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white" >Sobre Nosotros</h1>
          <p className="text-lg md:text-xl max-w-2xl">
            Conoce a las mentes creativas detrás de CABETG Party Planner
          </p>
        </div>
      </div>

      <section className="section">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">Nuestra Historia</h2>
            <p className="text-lg text-gray-700 mb-6">
              CABETG Party Planner nació en 2023 con una misión clara: transformar la manera en que las personas planean sus eventos. Después de enfrentar personalmente los desafíos de organizar celebraciones, nuestros fundadores decidieron crear una plataforma integral que reuniera todos los servicios de eventos en un solo lugar.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              Lo que comenzó como una idea entre amigos se ha convertido en una plataforma innovadora que conecta a organizadores de eventos con los mejores proveedores de servicios, simplificando el proceso de planificación y ayudando a materializar eventos inolvidables.
            </p>
            <p className="text-lg text-gray-700">
              Hoy en día, CABETG Party Planner se enorgullece de haber contribuido al éxito de cientos de eventos, desde íntimas reuniones familiares hasta elaboradas celebraciones corporativas. Nuestro compromiso con la excelencia, la transparencia y la atención personalizada nos distingue en el mercado.
            </p>
          </div>

          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-10 text-center">Nuestros Valores</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Excelencia</h3>
                <p className="text-gray-600">
                  Nos comprometemos a ofrecer servicios y experiencias de la más alta calidad. Trabajamos solo con proveedores verificados que comparten nuestros estándares.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Personalización</h3>
                <p className="text-gray-600">
                  Entendemos que cada evento es único. Nuestro enfoque se centra en personalizar cada experiencia según las necesidades específicas de nuestros clientes.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Eficiencia</h3>
                <p className="text-gray-600">
                  Valoramos el tiempo de nuestros clientes. Nuestra plataforma está diseñada para simplificar el proceso de planificación, ahorrando tiempo y esfuerzo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-gray-50">
        <div className="container-custom">
          <h2 className="text-3xl font-bold mb-10 text-center">Nuestro Equipo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Carlos Aguirre',
                role: 'CEO y Fundador',
                image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
              },
              {
                name: 'Ana Beltrán',
                role: 'Directora de Operaciones',
                image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
              },
              {
                name: 'Eduardo Torres',
                role: 'Director de Tecnología',
                image: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
              },
              {
                name: 'Gabriela Guzmán',
                role: 'Directora de Marketing',
                image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
              },
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="mb-4">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-40 h-40 object-cover rounded-full mx-auto"
                  />
                </div>
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, ArrowRight } from 'lucide-react';

const BlogPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Blog de Ideas | CABETG Party Planner';
  }, []);

  const blogPosts = [
    {
      id: 1,
      title: '10 Tendencias en Decoración para Bodas en 2025',
      excerpt:
        'Descubre las últimas tendencias en decoración para bodas que están causando sensación este año. Desde estilos minimalistas hasta opulentos arreglos florales suspendidos.',
      imageUrl: 'https://images.pexels.com/photos/169198/pexels-photo-169198.jpeg',
      author: 'Mariana Flores',
      date: '15 de abril de 2025',
      readTime: '5 min',
      category: 'Bodas',
    },
    {
      id: 2,
      title: 'Cómo Organizar un Baby Shower Inolvidable',
      excerpt:
        'Guía completa para planificar un baby shower perfecto. Tips para la decoración, juegos divertidos, recuerdos originales y menú que encantará a todos los invitados.',
      imageUrl: 'https://images.pexels.com/photos/6583553/pexels-photo-6583553.jpeg',
      author: 'Laura Méndez',
      date: '3 de abril de 2025',
      readTime: '7 min',
      category: 'Baby Showers',
    },
    {
      id: 3,
      title: 'Ideas Originales para Fiestas Infantiles Temáticas',
      excerpt:
        'Sorprende a los más pequeños con estas ideas creativas para fiestas temáticas. Desde superhéroes hasta aventuras submarinas, opciones para todas las edades e intereses.',
      imageUrl: 'https://images.pexels.com/photos/796605/pexels-photo-796605.jpeg',
      author: 'Carlos Ruiz',
      date: '28 de marzo de 2025',
      readTime: '6 min',
      category: 'Fiestas Infantiles',
    },
    {
      id: 4,
      title: 'Los Mejores DJs para tu Evento en Ciudad de México',
      excerpt:
        'Una selección de los DJs más talentosos para animar tu próximo evento. Conoce sus estilos, experiencia y cómo elegir al profesional perfecto según el tipo de celebración.',
      imageUrl: 'https://images.pexels.com/photos/1540319/pexels-photo-1540319.jpeg',
      author: 'Daniel Torres',
      date: '20 de marzo de 2025',
      readTime: '4 min',
      category: 'Música',
    },
    {
      id: 5,
      title: 'Guía de Catering: Menús Innovadores para Eventos Corporativos',
      excerpt:
        'Impresiona a tus clientes y colaboradores con opciones gastronómicas vanguardistas. Desde estaciones interactivas hasta menús plant-based que marcarán tendencia.',
      imageUrl: 'https://images.pexels.com/photos/5779784/pexels-photo-5779784.jpeg',
      author: 'Andrea Guzmán',
      date: '15 de marzo de 2025',
      readTime: '8 min',
      category: 'Gastronomía',
    },
    {
      id: 6,
      title: 'Cómo Crear una Mesa de Dulces que Impresione a tus Invitados',
      excerpt:
        'El arte de diseñar una mesa de dulces inolvidable. Consejos sobre selección de golosinas, presentación, decoración temática y complementos que harán brillar tu evento.',
      imageUrl: 'https://images.pexels.com/photos/3030449/pexels-photo-3030449.jpeg',
      author: 'Sofía Ramírez',
      date: '8 de marzo de 2025',
      readTime: '5 min',
      category: 'Decoración',
    },
  ];

  const categories = [
    'Todas',
    'Bodas',
    'Fiestas Infantiles',
    'Eventos Corporativos',
    'Gastronomía',
    'Decoración',
    'Música',
    'Baby Showers',
  ];

  return (
    <div>
      <div className="relative h-[40vh] min-h-[300px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(https://images.pexels.com/photos/6133306/pexels-photo-6133306.jpeg)` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        <div className="relative container-custom h-full flex flex-col justify-center text-white z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog de Ideas</h1>
          <p className="text-lg md:text-xl max-w-2xl">
            Inspiración y consejos para crear eventos excepcionales
          </p>
        </div>
      </div>

      <section className="section">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-3/4">
              {/* Featured Post */}
              <div className="mb-12">
                <div className="group relative overflow-hidden rounded-xl shadow-md">
                  <Link to="#">
                    <img
                      src="https://images.pexels.com/photos/50675/banquet-wedding-society-deco-50675.jpeg"
                      alt="Artículo destacado"
                      className="w-full h-[400px] object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <div className="mb-2">
                        <span className="inline-block px-3 py-1 bg-primary-500 text-white text-sm font-medium rounded-full">
                          Destacado
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Cómo Planificar el Evento Perfecto: Guía Paso a Paso
                      </h2>
                      <p className="text-white text-opacity-90 mb-4 md:w-3/4">
                        Una guía completa con todos los aspectos a considerar para organizar un evento exitoso, desde la selección del lugar hasta los últimos detalles.
                      </p>
                      <div className="flex items-center text-white">
                        <div className="flex items-center mr-4">
                          <User size={16} className="mr-1" />
                          <span className="text-sm">Ana Martínez</span>
                        </div>
                        <div className="flex items-center">
                          <Clock size={16} className="mr-1" />
                          <span className="text-sm">10 min de lectura</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-8 overflow-x-auto">
                <div className="flex space-x-2 pb-2">
                  {categories.map((category, index) => (
                    <button
                      key={index}
                      className={`px-4 py-2 rounded-full whitespace-nowrap ${
                        index === 0
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blog Posts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {blogPosts.map((post) => (
                  <article key={post.id} className="card group overflow-hidden">
                    <Link to="#" className="block">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="inline-block px-3 py-1 bg-white bg-opacity-90 text-primary-500 text-xs font-medium rounded-full">
                            {post.category}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="p-6">
                      <Link to="#">
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary-500 transition-colors">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock size={14} className="mr-1" />
                          <span>{post.readTime}</span>
                        </div>
                        <Link
                          to="#"
                          className="text-primary-500 font-medium flex items-center hover:text-primary-600"
                        >
                          <span>Leer más</span>
                          <ArrowRight size={16} className="ml-1" />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-12 flex justify-center">
                <nav className="inline-flex rounded-md shadow">
                  <a
                    href="#"
                    className="py-2 px-4 text-sm font-medium text-gray-500 bg-white rounded-l-md border border-gray-300 hover:bg-gray-50"
                  >
                    Anterior
                  </a>
                  <a
                    href="#"
                    className="py-2 px-4 text-sm font-medium text-primary-600 bg-primary-50 border-t border-b border-gray-300"
                  >
                    1
                  </a>
                  <a
                    href="#"
                    className="py-2 px-4 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50"
                  >
                    2
                  </a>
                  <a
                    href="#"
                    className="py-2 px-4 text-sm font-medium text-gray-500 bg-white border-t border-b border-gray-300 hover:bg-gray-50"
                  >
                    3
                  </a>
                  <a
                    href="#"
                    className="py-2 px-4 text-sm font-medium text-gray-500 bg-white rounded-r-md border border-gray-300 hover:bg-gray-50"
                  >
                    Siguiente
                  </a>
                </nav>
              </div>
            </div>

            <div className="lg:w-1/4">
              {/* Search */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h3 className="font-bold text-lg mb-4">Buscar</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar artículos..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                  />
                  <button className="absolute right-3 top-2.5 text-gray-400 hover:text-primary-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h3 className="font-bold text-lg mb-4">Categorías</h3>
                <ul className="space-y-2">
                  {categories.slice(1).map((category, index) => (
                    <li key={index}>
                      <Link
                        to="#"
                        className="flex justify-between items-center text-gray-700 hover:text-primary-500"
                      >
                        <span>{category}</span>
                        <span className="text-gray-400 text-sm">(12)</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Popular Posts */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h3 className="font-bold text-lg mb-4">Artículos Populares</h3>
                <div className="space-y-4">
                  {blogPosts.slice(0, 3).map((post) => (
                    <div key={post.id} className="flex items-start">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-16 h-16 object-cover rounded mr-3"
                      />
                      <div>
                        <Link
                          to="#"
                          className="font-medium line-clamp-2 hover:text-primary-500"
                        >
                          {post.title}
                        </Link>
                        <div className="text-gray-500 text-xs mt-1">
                          {post.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Newsletter */}
              <div className="bg-primary-50 rounded-xl shadow-md p-6">
                <h3 className="font-bold text-lg mb-2">Suscríbete a Nuestro Boletín</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Recibe las últimas ideas y consejos para tus eventos directamente en tu bandeja de entrada.
                </p>
                <form>
                  <input
                    type="email"
                    placeholder="Tu correo electrónico"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 mb-3"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-md font-medium transition-colors"
                  >
                    Suscribirme
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;
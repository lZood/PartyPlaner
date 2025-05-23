import { Service } from '../types';

// Mock data for services
export const services: Service[] = [
  // Music - DJs
  {
    id: 'dj-001',
    name: 'DJ Electro Party',
    shortDescription: 'DJ profesional especializado en música electrónica y lo mejor del pop actual.',
    description: 'Contamos con amplia experiencia animando todo tipo de eventos. Nuestro equipo incluye DJ profesional, iluminación básica, sistema de sonido de alta calidad y 5 horas de servicio. Personaliza tu playlist con anticipación y deja que nosotros nos encarguemos de mantener la pista llena toda la noche.',
    price: 8500,
    imageUrl: 'https://images.pexels.com/photos/1540319/pexels-photo-1540319.jpeg',
    gallery: [
      'https://images.pexels.com/photos/2608516/pexels-photo-2608516.jpeg',
      'https://images.pexels.com/photos/1540319/pexels-photo-1540319.jpeg',
      'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg',
      'https://images.pexels.com/photos/2034851/pexels-photo-2034851.jpeg'
    ],
    categoryId: 'music',
    subcategoryId: 'djs',
    rating: 4.8,
    reviewCount: 42,
    features: [
      'DJ profesional con más de 10 años de experiencia',
      'Equipo de sonido de alta calidad incluido',
      'Iluminación básica incluida',
      'Servicio de 5 horas',
      'Música de todos los géneros',
      'Posibilidad de solicitar canciones específicas'
    ],
    options: [
      {
        id: 'extra-hour',
        name: 'Hora adicional',
        priceModifier: 1500
      },
      {
        id: 'premium-lights',
        name: 'Paquete de iluminación premium',
        description: 'Incluye luces robóticas, estrobos y máquina de humo',
        priceModifier: 2000
      },
      {
        id: 'karaoke',
        name: 'Servicio de karaoke',
        description: 'Incluye 2 micrófonos y pantalla con letras',
        priceModifier: 1800
      }
    ]
  },
  {
    id: 'dj-002',
    name: 'Mix Master Events',
    shortDescription: 'Servicio completo de DJ con equipo premium para eventos exclusivos.',
    description: 'Somos especialistas en crear la atmósfera perfecta para tu evento. Nuestro servicio premium incluye DJ con experiencia internacional, sistema de sonido profesional, iluminación avanzada con programación personalizada, y coordinación con el evento. Ideal para bodas, eventos corporativos y fiestas de alto nivel.',
    price: 15000,
    imageUrl: 'https://images.pexels.com/photos/2147029/pexels-photo-2147029.jpeg',
    gallery: [
      'https://images.pexels.com/photos/2147029/pexels-photo-2147029.jpeg',
      'https://images.pexels.com/photos/9123520/pexels-photo-9123520.jpeg',
      'https://images.pexels.com/photos/2742497/pexels-photo-2742497.jpeg',
      'https://images.pexels.com/photos/4612712/pexels-photo-4612712.jpeg'
    ],
    categoryId: 'music',
    subcategoryId: 'djs',
    rating: 4.9,
    reviewCount: 65,
    features: [
      'DJ con experiencia internacional',
      'Sistema de sonido profesional de última generación',
      'Iluminación arquitectónica y efectos especiales',
      'Servicio de 6 horas',
      'Reunión previa para planificar la música',
      'Coordinación con el personal del evento'
    ],
    options: [
      {
        id: 'extra-hour-premium',
        name: 'Hora adicional',
        priceModifier: 2500
      },
      {
        id: 'led-dance-floor',
        name: 'Pista de baile LED',
        description: 'Pista iluminada programable de 6x6 metros',
        priceModifier: 8000
      },
      {
        id: 'visual-projection',
        name: 'Proyección visual personalizada',
        description: 'Incluye pantalla, proyector y contenido personalizado',
        priceModifier: 3500
      }
    ]
  },
  
  // Decoration - Balloons
  {
    id: 'balloon-001',
    name: 'Arco de Globos Festivo',
    shortDescription: 'Espectacular arco de globos personalizable para la entrada de tu evento.',
    description: 'Deslumbra a tus invitados desde que llegan con nuestro impresionante arco de globos. Personalizable en colores y tamaño, este arco es perfecto para marcar la entrada de tu evento o crear un punto focal para fotos. Incluye instalación y desmontaje por nuestro equipo profesional.',
    price: 3500,
    imageUrl: 'https://images.pexels.com/photos/3419692/pexels-photo-3419692.jpeg',
    gallery: [
      'https://images.pexels.com/photos/3419692/pexels-photo-3419692.jpeg',
      'https://images.pexels.com/photos/7061962/pexels-photo-7061962.jpeg',
      'https://images.pexels.com/photos/5879289/pexels-photo-5879289.jpeg',
      'https://images.pexels.com/photos/4548766/pexels-photo-4548766.jpeg'
    ],
    categoryId: 'decoration',
    subcategoryId: 'balloons',
    rating: 4.7,
    reviewCount: 38,
    features: [
      'Arco de aproximadamente 3 metros de ancho',
      'Personalización de colores según tu evento',
      'Globos de látex biodegradable de alta calidad',
      'Instalación y desmontaje incluidos',
      'Duración garantizada de hasta 12 horas',
      'Posibilidad de agregar elementos decorativos adicionales'
    ],
    options: [
      {
        id: 'extra-width',
        name: 'Metro adicional de ancho',
        priceModifier: 800
      },
      {
        id: 'foil-balloons',
        name: 'Adición de globos metálicos temáticos',
        description: 'Incluye 6 globos metálicos temáticos distribuidos en el arco',
        priceModifier: 600
      },
      {
        id: 'led-lights',
        name: 'Luces LED para globos',
        description: 'Iluminación interior en globos seleccionados',
        priceModifier: 500
      }
    ]
  },
  
  // Food - Catering
  {
    id: 'catering-001',
    name: 'Banquete Gourmet Premium',
    shortDescription: 'Servicio de catering gourmet completo con opciones internacionales.',
    description: 'Ofrecemos una experiencia gastronómica excepcional para tu evento especial. Nuestro servicio de banquete gourmet incluye entradas seleccionadas, plato principal con opciones a elegir, guarniciones gourmet, mesa de postres, y bebidas no alcohólicas ilimitadas. El servicio incluye personal de cocina, meseros profesionales, vajilla completa, cristalería y montaje de mesas.',
    price: null, // Request quote
    imageUrl: 'https://images.pexels.com/photos/5637639/pexels-photo-5637639.jpeg',
    gallery: [
      'https://images.pexels.com/photos/5637639/pexels-photo-5637639.jpeg',
      'https://images.pexels.com/photos/5779784/pexels-photo-5779784.jpeg',
      'https://images.pexels.com/photos/6248840/pexels-photo-6248840.jpeg',
      'https://images.pexels.com/photos/5659773/pexels-photo-5659773.jpeg'
    ],
    categoryId: 'food',
    subcategoryId: 'catering',
    rating: 4.9,
    reviewCount: 72,
    features: [
      'Menú personalizado según tus preferencias',
      'Chef ejecutivo y equipo de cocina profesional',
      'Meseros profesionales (1 por cada 15 invitados)',
      'Vajilla, cristalería y cubertería premium',
      'Montaje completo de mesas',
      'Opciones para dietas especiales disponibles',
      'Degustación previa del menú para eventos grandes'
    ],
    options: [
      {
        id: 'cocktail-hour',
        name: 'Hora de cócteles',
        description: 'Servicio de canapés y 2 opciones de cócteles durante 1 hora',
        priceModifier: 0 // Price on quote
      },
      {
        id: 'open-bar',
        name: 'Barra libre',
        description: 'Servicio de bebidas alcohólicas premium por 5 horas',
        priceModifier: 0 // Price on quote
      },
      {
        id: 'midnight-snack',
        name: 'Snack de medianoche',
        description: 'Estación de snacks para después de la cena',
        priceModifier: 0 // Price on quote
      }
    ]
  },
  
  // Candy - Candy Tables
  {
    id: 'candy-001',
    name: 'Mesa de Dulces Fantasía',
    shortDescription: 'Espectacular mesa de dulces personalizada con más de 15 variedades.',
    description: 'Sorprende a tus invitados con nuestra mesa de dulces premium, decorada según la temática de tu evento. Incluye más de 15 variedades de dulces gourmet, postres miniatura, chocolates artesanales y golosinas tradicionales. Presentada en recipientes decorativos y con elementos temáticos que complementan tu celebración. El servicio incluye montaje, decoración de la mesa y desmontaje.',
    price: 6800,
    imageUrl: 'https://images.pexels.com/photos/6483581/pexels-photo-6483581.jpeg',
    gallery: [
      'https://images.pexels.com/photos/6483581/pexels-photo-6483581.jpeg',
      'https://images.pexels.com/photos/3431973/pexels-photo-3431973.jpeg',
      'https://images.pexels.com/photos/4066162/pexels-photo-4066162.jpeg',
      'https://images.pexels.com/photos/3030449/pexels-photo-3030449.jpeg'
    ],
    categoryId: 'candy',
    subcategoryId: 'candytables',
    rating: 4.8,
    reviewCount: 53,
    features: [
      'Más de 15 variedades de dulces premium',
      'Decoración temática personalizada',
      'Recipientes y elementos decorativos incluidos',
      'Etiquetas personalizadas para cada tipo de dulce',
      'Servicio para 50-100 invitados',
      'Montaje y desmontaje incluidos',
      'Bolsitas para que los invitados se lleven dulces'
    ],
    options: [
      {
        id: 'chocolate-fountain',
        name: 'Fuente de chocolate',
        description: 'Con frutas y dulces para sumergir',
        priceModifier: 2500
      },
      {
        id: 'cotton-candy',
        name: 'Estación de algodón de azúcar',
        description: 'Incluye personal para servir algodón fresco',
        priceModifier: 1800
      },
      {
        id: 'custom-cookies',
        name: 'Galletas personalizadas temáticas',
        description: '50 galletas decoradas según el tema del evento',
        priceModifier: 1200
      }
    ]
  }
];
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
    id: 'mariachi-001',
    name: 'Mariachi Imperial',
    shortDescription: 'Auténtico mariachi tradicional con más de 12 elementos en escena.',
    description: 'Grupo de mariachi profesional con más de 15 años de experiencia. Contamos con un amplio repertorio de música tradicional mexicana y contemporánea. El grupo incluye violines, trompetas, guitarrón, vihuela, guitarra y voces principales.',
    price: 12000,
    imageUrl: 'https://images.pexels.com/photos/3444183/pexels-photo-3444183.jpeg',
    gallery: [
      'https://images.pexels.com/photos/3444183/pexels-photo-3444183.jpeg',
      'https://images.pexels.com/photos/2166459/pexels-photo-2166459.jpeg',
      'https://images.pexels.com/photos/2834917/pexels-photo-2834917.jpeg'
    ],
    categoryId: 'music',
    subcategoryId: 'mariachi',
    rating: 4.9,
    reviewCount: 87,
    features: [
      '12 músicos profesionales',
      'Vestuario tradicional de gala',
      'Amplificación incluida',
      '2 horas de servicio',
      'Serenata sorpresa disponible',
      'Repertorio personalizable'
    ],
    options: [
      {
        id: 'extra-hour-mariachi',
        name: 'Hora adicional',
        priceModifier: 5000
      },
      {
        id: 'female-voice',
        name: 'Voz femenina principal',
        description: 'Cantante principal femenina para un toque especial',
        priceModifier: 2500
      }
    ]
  },
  {
    id: 'band-001',
    name: 'Versátil Show Band',
    shortDescription: 'Grupo versátil con amplio repertorio de géneros musicales.',
    description: 'Banda profesional que interpreta diversos géneros musicales, desde pop y rock hasta cumbia y salsa. Incluye vocalista principal, coristas, batería, bajo, guitarra, teclados y metales.',
    price: 25000,
    imageUrl: 'https://images.pexels.com/photos/2909367/pexels-photo-2909367.jpeg',
    gallery: [
      'https://images.pexels.com/photos/2909367/pexels-photo-2909367.jpeg',
      'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg',
      'https://images.pexels.com/photos/2747446/pexels-photo-2747446.jpeg'
    ],
    categoryId: 'music',
    subcategoryId: 'bands',
    rating: 4.8,
    reviewCount: 54,
    features: [
      '8 músicos profesionales',
      'Equipo de sonido profesional incluido',
      'Iluminación básica incluida',
      '4 horas de servicio',
      'Repertorio de más de 200 canciones',
      'Coordinador de evento incluido'
    ],
    options: [
      {
        id: 'extra-hour-band',
        name: 'Hora adicional',
        priceModifier: 6000
      },
      {
        id: 'premium-lights-band',
        name: 'Paquete de iluminación premium',
        description: 'Sistema completo de iluminación profesional',
        priceModifier: 4000
      }
    ]
  },
  {
    id: 'kids-001',
    name: 'Animación Mágica Infantil',
    shortDescription: 'Show completo de magia, música y juegos para fiestas infantiles.',
    description: 'Espectáculo interactivo diseñado especialmente para niños, que incluye show de magia, música, juegos, globoflexia y pintura facial. Perfecto para fiestas infantiles y eventos familiares.',
    price: 4500,
    imageUrl: 'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg',
    gallery: [
      'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg',
      'https://images.pexels.com/photos/2449095/pexels-photo-2449095.jpeg',
      'https://images.pexels.com/photos/2399097/pexels-photo-2399097.jpeg'
    ],
    categoryId: 'music',
    subcategoryId: 'kids',
    rating: 4.9,
    reviewCount: 126,
    features: [
      'Show de magia interactivo',
      'Música y bailes infantiles',
      'Globoflexia para todos los niños',
      'Pintura facial incluida',
      '2 horas de servicio',
      'Material y equipo incluido'
    ],
    options: [
      {
        id: 'extra-hour-kids',
        name: 'Hora adicional',
        priceModifier: 1800
      },
      {
        id: 'bubble-machine',
        name: 'Máquina de burbujas',
        description: 'Máquina profesional de burbujas gigantes',
        priceModifier: 800
      }
    ]
  },
  
  // Decoration
  {
    id: 'decor-001',
    name: 'Decoración Floral Elegante',
    shortDescription: 'Diseños florales exclusivos para eventos elegantes y bodas.',
    description: 'Servicio completo de decoración floral que incluye centros de mesa, arcos, bouquets y arreglos decorativos. Trabajamos con flores frescas de temporada y diseños personalizados según tu evento.',
    price: 15000,
    imageUrl: 'https://images.pexels.com/photos/931176/pexels-photo-931176.jpeg',
    gallery: [
      'https://images.pexels.com/photos/931176/pexels-photo-931176.jpeg',
      'https://images.pexels.com/photos/931158/pexels-photo-931158.jpeg',
      'https://images.pexels.com/photos/1128782/pexels-photo-1128782.jpeg'
    ],
    categoryId: 'decoration',
    subcategoryId: 'flowers',
    rating: 4.8,
    reviewCount: 92,
    features: [
      'Flores frescas de temporada',
      'Diseño personalizado',
      'Montaje y desmontaje incluido',
      'Asesoría de diseño',
      'Prueba de diseño incluida',
      'Flores de respaldo incluidas'
    ],
    options: [
      {
        id: 'premium-flowers',
        name: 'Flores premium',
        description: 'Inclusión de orquídeas y flores exóticas',
        priceModifier: 5000
      },
      {
        id: 'lighting',
        name: 'Iluminación decorativa',
        description: 'Sistema de iluminación para realzar los arreglos',
        priceModifier: 3000
      }
    ]
  },
  {
    id: 'decor-002',
    name: 'Decoración Temática Completa',
    shortDescription: 'Ambientación integral temática para eventos especiales.',
    description: 'Transformamos cualquier espacio según la temática de tu elección. Incluye decoración de paredes, techos, mesas, sillas y áreas especiales. Perfecto para fiestas temáticas, eventos corporativos y celebraciones especiales.',
    price: 18000,
    imageUrl: 'https://images.pexels.com/photos/4792711/pexels-photo-4792711.jpeg',
    gallery: [
      'https://images.pexels.com/photos/4792711/pexels-photo-4792711.jpeg',
      'https://images.pexels.com/photos/4792707/pexels-photo-4792707.jpeg',
      'https://images.pexels.com/photos/4792709/pexels-photo-4792709.jpeg'
    ],
    categoryId: 'decoration',
    subcategoryId: 'themed',
    rating: 4.7,
    reviewCount: 63,
    features: [
      'Diseño personalizado completo',
      'Mobiliario temático incluido',
      'Iluminación ambiental',
      'Elementos decorativos personalizados',
      'Montaje y desmontaje incluido',
      'Coordinador de decoración presente'
    ],
    options: [
      {
        id: 'photo-booth',
        name: 'Área de fotos temática',
        description: 'Espacio especial para fotos con props',
        priceModifier: 4000
      },
      {
        id: 'custom-signage',
        name: 'Señalización personalizada',
        description: 'Letreros y señalización temática personalizada',
        priceModifier: 2500
      }
    ]
  },
  {
    id: 'decor-003',
    name: 'Iluminación y Efectos Especiales',
    shortDescription: 'Diseño de iluminación arquitectónica y efectos especiales.',
    description: 'Creamos ambientes únicos mediante iluminación profesional y efectos especiales. Incluye iluminación arquitectónica, mapping, efectos de humo y más para crear una atmósfera impactante.',
    price: 22000,
    imageUrl: 'https://images.pexels.com/photos/2034851/pexels-photo-2034851.jpeg',
    gallery: [
      'https://images.pexels.com/photos/2034851/pexels-photo-2034851.jpeg',
      'https://images.pexels.com/photos/2417726/pexels-photo-2417726.jpeg',
      'https://images.pexels.com/photos/2078071/pexels-photo-2078071.jpeg'
    ],
    categoryId: 'decoration',
    subcategoryId: 'themed',
    rating: 4.9,
    reviewCount: 45,
    features: [
      'Diseño de iluminación personalizado',
      'Equipo profesional DMX',
      'Técnico especializado incluido',
      'Efectos especiales programados',
      'Backup de equipos',
      'Prueba previa al evento'
    ],
    options: [
      {
        id: 'mapping',
        name: 'Video mapping',
        description: 'Proyección arquitectónica personalizada',
        priceModifier: 8000
      },
      {
        id: 'laser-show',
        name: 'Show de láser',
        description: 'Sistema de láser programado',
        priceModifier: 6000
      }
    ]
  },
  {
    id: 'decor-004',
    name: 'Decoración con Globos Premium',
    shortDescription: 'Diseños espectaculares con globos para eventos especiales.',
    description: 'Creaciones artísticas con globos de alta calidad. Incluye arcos, columnas, centros de mesa y decoraciones personalizadas. Ideal para cualquier tipo de celebración.',
    price: 8500,
    imageUrl: 'https://images.pexels.com/photos/3419692/pexels-photo-3419692.jpeg',
    gallery: [
      'https://images.pexels.com/photos/3419692/pexels-photo-3419692.jpeg',
      'https://images.pexels.com/photos/7061962/pexels-photo-7061962.jpeg',
      'https://images.pexels.com/photos/5879289/pexels-photo-5879289.jpeg'
    ],
    categoryId: 'decoration',
    subcategoryId: 'balloons',
    rating: 4.8,
    reviewCount: 78,
    features: [
      'Globos de alta calidad',
      'Diseños personalizados',
      'Montaje y desmontaje incluido',
      'Garantía de duración 24h',
      'Variedad de colores y texturas',
      'Elementos decorativos complementarios'
    ],
    options: [
      {
        id: 'organic-arch',
        name: 'Arco orgánico',
        description: 'Diseño moderno con globos de diferentes tamaños',
        priceModifier: 3500
      },
      {
        id: 'balloon-drop',
        name: 'Lluvia de globos',
        description: 'Sistema de caída de globos programado',
        priceModifier: 2500
      }
    ]
  },
  
  // Food & Beverage
  {
    id: 'food-001',
    name: 'Estación de Coctelería Premium',
    shortDescription: 'Servicio de coctelería profesional con bartenders expertos.',
    description: 'Barra de coctelería premium con bartenders profesionales, que incluye cócteles clásicos y de autor, presentación espectacular y servicio personalizado. Perfecto para eventos elegantes y celebraciones especiales.',
    price: 12000,
    imageUrl: 'https://images.pexels.com/photos/5947019/pexels-photo-5947019.jpeg',
    gallery: [
      'https://images.pexels.com/photos/5947019/pexels-photo-5947019.jpeg',
      'https://images.pexels.com/photos/2531186/pexels-photo-2531186.jpeg',
      'https://images.pexels.com/photos/2795026/pexels-photo-2795026.jpeg'
    ],
    categoryId: 'food',
    subcategoryId: 'drinks',
    rating: 4.9,
    reviewCount: 67,
    features: [
      'Bartenders profesionales',
      'Cócteles premium',
      'Cristalería incluida',
      'Hielo y guarniciones',
      'Menú personalizado',
      'Servicio por 4 horas'
    ],
    options: [
      {
        id: 'molecular',
        name: 'Coctelería molecular',
        description: 'Cócteles especiales con técnicas moleculares',
        priceModifier: 4000
      },
      {
        id: 'flair',
        name: 'Show de Flair',
        description: 'Demostración de flair bartending',
        priceModifier: 3000
      }
    ]
  },
  {
    id: 'food-002',
    name: 'Catering Gourmet Internacional',
    shortDescription: 'Menú internacional de alta cocina para eventos exclusivos.',
    description: 'Servicio de catering gourmet que fusiona sabores internacionales con técnicas modernas de cocina. Incluye entrada, plato fuerte, postre y estaciones de aperitivos. Personal de servicio profesional incluido.',
    price: 45000,
    imageUrl: 'https://images.pexels.com/photos/5779784/pexels-photo-5779784.jpeg',
    gallery: [
      'https://images.pexels.com/photos/5779784/pexels-photo-5779784.jpeg',
      'https://images.pexels.com/photos/6248840/pexels-photo-6248840.jpeg',
      'https://images.pexels.com/photos/5659773/pexels-photo-5659773.jpeg'
    ],
    categoryId: 'food',
    subcategoryId: 'catering',
    rating: 4.8,
    reviewCount: 89,
    features: [
      'Chef ejecutivo',
      'Menú personalizado',
      'Personal de servicio',
      'Mobiliario y menaje',
      'Estaciones gourmet',
      'Opciones vegetarianas'
    ],
    options: [
      {
        id: 'wine-pairing',
        name: 'Maridaje de vinos',
        description: 'Selección de vinos premium para cada plato',
        priceModifier: 12000
      },
      {
        id: 'cheese-station',
        name: 'Estación de quesos',
        description: 'Selección internacional de quesos',
        priceModifier: 8000
      }
    ]
  },
  {
    id: 'food-003',
    name: 'Food Trucks Gourmet',
    shortDescription: 'Experiencia gastronómica casual y divertida con food trucks.',
    description: 'Servicio de food trucks con diferentes opciones gastronómicas: tacos gourmet, hamburguesas artesanales, pizza al horno de leña y más. Perfecto para eventos al aire libre y celebraciones informales.',
    price: 20000,
    imageUrl: 'https://images.pexels.com/photos/1893567/pexels-photo-1893567.jpeg',
    gallery: [
      'https://images.pexels.com/photos/1893567/pexels-photo-1893567.jpeg',
      'https://images.pexels.com/photos/2608510/pexels-photo-2608510.jpeg',
      'https://images.pexels.com/photos/2608511/pexels-photo-2608511.jpeg'
    ],
    categoryId: 'food',
    subcategoryId: 'fastfood',
    rating: 4.7,
    reviewCount: 56,
    features: [
      '3 food trucks diferentes',
      'Menú personalizable',
      'Personal de servicio',
      'Mobiliario exterior',
      'Servicio por 4 horas',
      'Iluminación incluida'
    ],
    options: [
      {
        id: 'dessert-truck',
        name: 'Food truck de postres',
        description: 'Helados artesanales y postres',
        priceModifier: 8000
      },
      {
        id: 'drinks-truck',
        name: 'Food truck de bebidas',
        description: 'Bebidas especiales y café',
        priceModifier: 6000
      }
    ]
  },
  {
    id: 'food-004',
    name: 'Estación de Postres Artesanales',
    shortDescription: 'Mesa dulce con postres gourmet hechos a mano.',
    description: 'Deliciosa selección de postres artesanales que incluye macarons, mini pasteles, chocolates, galletas decoradas y más. Presentación elegante y personalizada según la temática del evento.',
    price: 9500,
    imageUrl: 'https://images.pexels.com/photos/1291712/pexels-photo-1291712.jpeg',
    gallery: [
      'https://images.pexels.com/photos/1291712/pexels-photo-1291712.jpeg',
      'https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg',
      'https://images.pexels.com/photos/3081657/pexels-photo-3081657.jpeg'
    ],
    categoryId: 'food',
    subcategoryId: 'desserts',
    rating: 4.9,
    reviewCount: 94,
    features: [
      'Postres artesanales',
      'Presentación personalizada',
      'Variedad de opciones',
      'Mobiliario y decoración',
      'Personal de servicio',
      'Empaques para llevar'
    ],
    options: [
      {
        id: 'chocolate-fountain',
        name: 'Fuente de chocolate',
        description: 'Con frutas y complementos',
        priceModifier: 3500
      },
      {
        id: 'ice-cream-bar',
        name: 'Barra de helados',
        description: 'Helados artesanales con toppings',
        priceModifier: 4000
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
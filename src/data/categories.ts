import { Category } from '../types';

// Mock data for categories
export const categories: Category[] = [
  {
    id: 'music',
    name: 'Música y Entretenimiento',
    description: 'Todo lo que necesitas para mantener a tus invitados entretenidos y bailando toda la noche.',
    imageUrl: 'https://images.pexels.com/photos/2909367/pexels-photo-2909367.jpeg',
    icon: 'music',
    subcategories: [
      {
        id: 'bands',
        name: 'Bandas Musicales',
        description: 'Bandas en vivo para todo tipo de eventos y géneros musicales.',
        imageUrl: 'https://images.pexels.com/photos/2909367/pexels-photo-2909367.jpeg',
        categoryId: 'music'
      },
      {
        id: 'djs',
        name: 'DJs',
        description: 'Los mejores DJs para mantener la pista de baile llena toda la noche.',
        imageUrl: 'https://images.pexels.com/photos/2608516/pexels-photo-2608516.jpeg',
        categoryId: 'music'
      },
      {
        id: 'mariachi',
        name: 'Mariachis',
        description: 'Grupos de mariachi para darle el toque tradicional mexicano a tu celebración.',
        imageUrl: 'https://images.pexels.com/photos/3444183/pexels-photo-3444183.jpeg',
        categoryId: 'music'
      },
      {
        id: 'kids',
        name: 'Grupos Infantiles y Payasos',
        description: 'Entretenimiento especializado para los más pequeños de la fiesta.',
        imageUrl: 'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg',
        categoryId: 'music'
      },
      {
        id: 'performers',
        name: 'Animadores y Shows en Vivo',
        description: 'Presentaciones especiales para momentos únicos en tu evento.',
        imageUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
        categoryId: 'music'
      },
      {
        id: 'equipment',
        name: 'Equipos de Sonido e Iluminación',
        description: 'Todo el equipamiento técnico para que tu evento brille.',
        imageUrl: 'https://images.pexels.com/photos/1540319/pexels-photo-1540319.jpeg',
        categoryId: 'music'
      }
    ]
  },
  {
    id: 'venues',
    name: 'Salones de Eventos',
    description: 'Los mejores espacios para realizar tu evento, desde salones elegantes hasta jardines al aire libre.',
    imageUrl: 'https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg',
    icon: 'building',
    subcategories: [
      {
        id: 'indoor',
        name: 'Salones Interiores',
        description: 'Espacios cerrados y climatizados para eventos formales e informales.',
        imageUrl: 'https://images.pexels.com/photos/169190/pexels-photo-169190.jpeg',
        categoryId: 'venues'
      },
      {
        id: 'outdoor',
        name: 'Jardines y Terrazas',
        description: 'Hermosos espacios al aire libre para eventos memorables.',
        imageUrl: 'https://images.pexels.com/photos/265920/pexels-photo-265920.jpeg',
        categoryId: 'venues'
      },
      {
        id: 'specialized',
        name: 'Espacios Especializados',
        description: 'Lugares únicos y temáticos para eventos específicos.',
        imageUrl: 'https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg',
        categoryId: 'venues'
      }
    ]
  },
  {
    id: 'decoration',
    name: 'Decoración',
    description: 'Transforma cualquier espacio con decoraciones temáticas y elementos visuales impactantes.',
    imageUrl: 'https://images.pexels.com/photos/4792707/pexels-photo-4792707.jpeg',
    icon: 'palette',
    subcategories: [
      {
        id: 'themed',
        name: 'Decoración Temática',
        description: 'Decoración completa según el tema de tu elección.',
        imageUrl: 'https://images.pexels.com/photos/4792711/pexels-photo-4792711.jpeg',
        categoryId: 'decoration'
      },
      {
        id: 'centerpieces',
        name: 'Centros de Mesa',
        description: 'Espectaculares centros de mesa que darán vida a tu celebración.',
        imageUrl: 'https://images.pexels.com/photos/1128782/pexels-photo-1128782.jpeg',
        categoryId: 'decoration'
      },
      {
        id: 'flowers',
        name: 'Arreglos Florales',
        description: 'Arreglos florales elegantes para cualquier ocasión.',
        imageUrl: 'https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg',
        categoryId: 'decoration'
      },
      {
        id: 'balloons',
        name: 'Decoración con Globos',
        description: 'Arcos, columnas y arreglos con globos para eventos festivos.',
        imageUrl: 'https://images.pexels.com/photos/3419692/pexels-photo-3419692.jpeg',
        categoryId: 'decoration'
      },
      {
        id: 'letters',
        name: 'Letras Gigantes y Neón',
        description: 'Letras luminosas y personalizadas para crear momentos instagrameables.',
        imageUrl: 'https://images.pexels.com/photos/1340925/pexels-photo-1340925.jpeg',
        categoryId: 'decoration'
      },
      {
        id: 'photobooths',
        name: 'Fondos para Fotos',
        description: 'Photobooths y fondos temáticos para capturar los mejores momentos.',
        imageUrl: 'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg',
        categoryId: 'decoration'
      }
    ]
  },
  {
    id: 'furniture',
    name: 'Mobiliario y Alquileres',
    description: 'Todo el equipamiento necesario para que tu evento cuente con la infraestructura adecuada.',
    imageUrl: 'https://images.pexels.com/photos/3356448/pexels-photo-3356448.jpeg',
    icon: 'chairFront',
    subcategories: [
      {
        id: 'tables',
        name: 'Alquiler de Mesas y Sillas',
        description: 'Mobiliario esencial para acomodar a todos tus invitados.',
        imageUrl: 'https://images.pexels.com/photos/3356448/pexels-photo-3356448.jpeg',
        categoryId: 'furniture'
      },
      {
        id: 'tents',
        name: 'Carpas, Toldos y Templetes',
        description: 'Estructuras para eventos al aire libre o espacios grandes.',
        imageUrl: 'https://images.pexels.com/photos/1779484/pexels-photo-1779484.jpeg',
        categoryId: 'furniture'
      },
      {
        id: 'linens',
        name: 'Mantelería y Cubremanteles',
        description: 'Textiles de calidad para vestir tus mesas con elegancia.',
        imageUrl: 'https://images.pexels.com/photos/6479553/pexels-photo-6479553.jpeg',
        categoryId: 'furniture'
      },
      {
        id: 'tableware',
        name: 'Vajilla y Cristalería',
        description: 'Elementos para servir con estilo en tu evento.',
        imageUrl: 'https://images.pexels.com/photos/1995010/pexels-photo-1995010.jpeg',
        categoryId: 'furniture'
      },
      {
        id: 'inflatables',
        name: 'Inflables, Brincolines y Juegos',
        description: 'Diversión garantizada para eventos infantiles y familiares.',
        imageUrl: 'https://images.pexels.com/photos/3660562/pexels-photo-3660562.jpeg',
        categoryId: 'furniture'
      }
    ]
  },
  {
    id: 'food',
    name: 'Comida y Bebida',
    description: 'Deliciosas opciones gastronómicas para satisfacer todos los gustos en tu celebración.',
    imageUrl: 'https://images.pexels.com/photos/5637639/pexels-photo-5637639.jpeg',
    icon: 'coffee',
    subcategories: [
      {
        id: 'catering',
        name: 'Catering y Banquetes',
        description: 'Servicio completo de alimentos para eventos formales e informales.',
        imageUrl: 'https://images.pexels.com/photos/5637639/pexels-photo-5637639.jpeg',
        categoryId: 'food'
      },
      {
        id: 'fastfood',
        name: 'Comida Rápida',
        description: 'Opciones informales que encantan a todos los invitados.',
        imageUrl: 'https://images.pexels.com/photos/1893567/pexels-photo-1893567.jpeg',
        categoryId: 'food'
      },
      {
        id: 'desserts',
        name: 'Postres y Repostería',
        description: 'Deliciosos postres artesanales para endulzar tu evento.',
        imageUrl: 'https://images.pexels.com/photos/1291712/pexels-photo-1291712.jpeg',
        categoryId: 'food'
      },
      {
        id: 'drinks',
        name: 'Coctelería y Barras de Bebidas',
        description: 'Servicio profesional de bebidas para todos los gustos.',
        imageUrl: 'https://images.pexels.com/photos/5947019/pexels-photo-5947019.jpeg',
        categoryId: 'food'
      },
      {
        id: 'fountains',
        name: 'Fuentes de Chocolate y Chamoy',
        description: 'Espectaculares fuentes para una experiencia única.',
        imageUrl: 'https://images.pexels.com/photos/18976809/pexels-photo-18976809/free-photo-of-fondue-de-chocolate.jpeg',
        categoryId: 'food'
      }
    ]
  },
  {
    id: 'snacks',
    name: 'Snacks y Postres',
    description: 'Deliciosas opciones de bocadillos, dulces y postres para tu evento.',
    imageUrl: 'https://images.pexels.com/photos/6483581/pexels-photo-6483581.jpeg',
    icon: 'candy',
    subcategories: [
      {
        id: 'sweettables',
        name: 'Mesas de Postres',
        description: 'Espectaculares mesas temáticas con variedad de postres y dulces.',
        imageUrl: 'https://images.pexels.com/photos/6483581/pexels-photo-6483581.jpeg',
        categoryId: 'snacks'
      },
      {
        id: 'pinatas',
        name: 'Piñatas Tradicionales y Temáticas',
        description: 'Piñatas artesanales para seguir la tradición con estilo.',
        imageUrl: 'https://images.pexels.com/photos/2072150/pexels-photo-2072150.jpeg',
        categoryId: 'snacks'
      },
      {
        id: 'snackstation',
        name: 'Estaciones de Snacks',
        description: 'Variedad de botanas y aperitivos para todos los gustos.',
        imageUrl: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg',
        categoryId: 'snacks'
      },
      {
        id: 'desserts',
        name: 'Postres Especiales',
        description: 'Deliciosos postres artesanales y gourmet.',
        imageUrl: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg',
        categoryId: 'snacks'
      }
    ]
  },
  {
    id: 'disposables',
    name: 'Artículos Desechables',
    description: 'Productos prácticos y decorativos para facilitar la atención de tus invitados.',
    imageUrl: 'https://images.pexels.com/photos/4877839/pexels-photo-4877839.jpeg',
    icon: 'package',
    subcategories: [
      {
        id: 'tableware',
        name: 'Platos, Vasos y Cubiertos',
        description: 'Artículos desechables de calidad para servir con estilo.',
        imageUrl: 'https://images.pexels.com/photos/5461307/pexels-photo-5461307.jpeg',
        categoryId: 'disposables'
      },
      {
        id: 'napkins',
        name: 'Servilletas y Manteles',
        description: 'Elementos textiles desechables para mesas impecables.',
        imageUrl: 'https://images.pexels.com/photos/4877839/pexels-photo-4877839.jpeg',
        categoryId: 'disposables'
      },
      {
        id: 'themed',
        name: 'Decoración Descartable Temática',
        description: 'Elementos decorativos desechables para ambientar tu fiesta.',
        imageUrl: 'https://images.pexels.com/photos/1037995/pexels-photo-1037995.jpeg',
        categoryId: 'disposables'
      },
      {
        id: 'kits',
        name: 'Kits de Fiesta',
        description: 'Conjuntos completos de artículos desechables según temática.',
        imageUrl: 'https://images.pexels.com/photos/6299688/pexels-photo-6299688.jpeg',
        categoryId: 'disposables'
      }
    ]
  }
];
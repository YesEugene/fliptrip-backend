/**
 * Paris City Data
 * Данные по Парижу
 * Изменяйте ТОЛЬКО данные, не трогайте структуру!
 */

module.exports = {
  name: "Paris",
  country: "France",
  coordinates: {
    lat: 48.8566,
    lng: 2.3522
  },
  
  // Реальные места Парижа
  places: {
    cafes: [
      {
        name: "Café de Flore",
        address: "172 Boulevard Saint-Germain, Paris",
        rating: 4.2,
        price_level: 3,
        category: "cafe",
        lat: 48.8542,
        lng: 2.3319,
        photos: [
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Les Deux Magots",
        address: "6 Place Saint-Germain des Prés, Paris",
        rating: 4.1,
        price_level: 3,
        category: "cafe",
        lat: 48.8542,
        lng: 2.3319,
        photos: [
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Café de la Paix",
        address: "5 Place de l'Opéra, Paris",
        rating: 4.3,
        price_level: 4,
        category: "cafe",
        lat: 48.8720,
        lng: 2.3319,
        photos: [
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    restaurants: [
      {
        name: "L'As du Fallafel",
        address: "34 Rue des Rosiers, Paris",
        rating: 4.4,
        price_level: 2,
        category: "restaurant",
        lat: 48.8575,
        lng: 2.3589,
        photos: [
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Le Comptoir du Relais",
        address: "9 Carrefour de l'Odéon, Paris",
        rating: 4.5,
        price_level: 3,
        category: "restaurant",
        lat: 48.8542,
        lng: 2.3319,
        photos: [
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "L'Ami Jean",
        address: "27 Rue Malar, Paris",
        rating: 4.6,
        price_level: 4,
        category: "restaurant",
        lat: 48.8606,
        lng: 2.3376,
        photos: [
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    attractions: [
      {
        name: "Eiffel Tower",
        address: "Champ de Mars, 5 Avenue Anatole France, Paris",
        rating: 4.7,
        price_level: 2,
        category: "attraction",
        lat: 48.8584,
        lng: 2.2945,
        photos: [
          "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Louvre Museum",
        address: "Rue de Rivoli, Paris",
        rating: 4.6,
        price_level: 2,
        category: "attraction",
        lat: 48.8606,
        lng: 2.3376,
        photos: [
          "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Notre-Dame Cathedral",
        address: "6 Parvis Notre-Dame - Pl. Jean-Paul II, Paris",
        rating: 4.5,
        price_level: 0,
        category: "attraction",
        lat: 48.8530,
        lng: 2.3499,
        photos: [
          "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    museums: [
      {
        name: "Musée d'Orsay",
        address: "1 Rue de la Légion d'Honneur, Paris",
        rating: 4.4,
        price_level: 2,
        category: "museum",
        lat: 48.8600,
        lng: 2.3266,
        photos: [
          "https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Centre Pompidou",
        address: "Place Georges-Pompidou, Paris",
        rating: 4.3,
        price_level: 2,
        category: "museum",
        lat: 48.8606,
        lng: 2.3522,
        photos: [
          "https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Musée Rodin",
        address: "77 Rue de Varenne, Paris",
        rating: 4.2,
        price_level: 2,
        category: "museum",
        lat: 48.8550,
        lng: 2.3158,
        photos: [
          "https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    parks: [
      {
        name: "Jardin du Luxembourg",
        address: "Rue de Médicis - Rue de Vaugirard, Paris",
        rating: 4.5,
        price_level: 0,
        category: "park",
        lat: 48.8462,
        lng: 2.3372,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Parc des Buttes-Chaumont",
        address: "1 Rue Botzaris, Paris",
        rating: 4.3,
        price_level: 0,
        category: "park",
        lat: 48.8800,
        lng: 2.3833,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Jardin des Tuileries",
        address: "Place de la Concorde, Paris",
        rating: 4.4,
        price_level: 0,
        category: "park",
        lat: 48.8634,
        lng: 2.3275,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    bars: [
      {
        name: "Le Comptoir Général",
        address: "84 Quai de Jemmapes, Paris",
        rating: 4.2,
        price_level: 2,
        category: "bar",
        lat: 48.8700,
        lng: 2.3667,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Le Perchoir",
        address: "14 Rue Crespin du Gast, Paris",
        rating: 4.3,
        price_level: 3,
        category: "bar",
        lat: 48.8700,
        lng: 2.3667,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Le Syndicat",
        address: "51 Rue du Faubourg Saint-Denis, Paris",
        rating: 4.4,
        price_level: 3,
        category: "bar",
        lat: 48.8700,
        lng: 2.3667,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      }
    ]
  }
};

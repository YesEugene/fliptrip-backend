/**
 * Venice City Data
 * Данные по Венеции
 * Изменяйте ТОЛЬКО данные, не трогайте структуру!
 */

module.exports = {
  name: "Venice",
  country: "Italy",
  coordinates: {
    lat: 45.4408,
    lng: 12.3155
  },
  
  // Реальные места Венеции
  places: {
    cafes: [
      {
        name: "Caffè Florian",
        address: "Piazza San Marco, Venice",
        rating: 4.2,
        price_level: 3,
        category: "cafe",
        lat: 45.4342,
        lng: 12.3388,
        photos: [
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Caffè Quadri",
        address: "Piazza San Marco, Venice",
        rating: 4.1,
        price_level: 3,
        category: "cafe",
        lat: 45.4342,
        lng: 12.3388,
        photos: [
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Torrefazione Marchi",
        address: "Calle del Caffè, Venice",
        rating: 4.3,
        price_level: 2,
        category: "cafe",
        lat: 45.4408,
        lng: 12.3155,
        photos: [
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    restaurants: [
      {
        name: "Osteria alle Testiere",
        address: "Calle del Mondo Novo, Venice",
        rating: 4.5,
        price_level: 3,
        category: "restaurant",
        lat: 45.4408,
        lng: 12.3155,
        photos: [
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Trattoria da Fiore",
        address: "Calle del Scaleter, Venice",
        rating: 4.4,
        price_level: 3,
        category: "restaurant",
        lat: 45.4408,
        lng: 12.3155,
        photos: [
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Ristorante Quadri",
        address: "Piazza San Marco, Venice",
        rating: 4.6,
        price_level: 4,
        category: "restaurant",
        lat: 45.4342,
        lng: 12.3388,
        photos: [
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    attractions: [
      {
        name: "St. Mark's Basilica",
        address: "Piazza San Marco, Venice",
        rating: 4.7,
        price_level: 0,
        category: "attraction",
        lat: 45.4342,
        lng: 12.3388,
        photos: [
          "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Rialto Bridge",
        address: "Rialto Bridge, Venice",
        rating: 4.5,
        price_level: 0,
        category: "attraction",
        lat: 45.4380,
        lng: 12.3358,
        photos: [
          "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Grand Canal",
        address: "Grand Canal, Venice",
        rating: 4.8,
        price_level: 0,
        category: "attraction",
        lat: 45.4408,
        lng: 12.3155,
        photos: [
          "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    museums: [
      {
        name: "Doge's Palace",
        address: "Piazza San Marco, Venice",
        rating: 4.6,
        price_level: 2,
        category: "museum",
        lat: 45.4342,
        lng: 12.3388,
        photos: [
          "https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Gallerie dell'Accademia",
        address: "Campo della Carità, Venice",
        rating: 4.4,
        price_level: 2,
        category: "museum",
        lat: 45.4308,
        lng: 12.3288,
        photos: [
          "https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Peggy Guggenheim Collection",
        address: "Palazzo Venier dei Leoni, Venice",
        rating: 4.3,
        price_level: 2,
        category: "museum",
        lat: 45.4308,
        lng: 12.3288,
        photos: [
          "https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    parks: [
      {
        name: "Giardini della Biennale",
        address: "Castello, Venice",
        rating: 4.3,
        price_level: 0,
        category: "park",
        lat: 45.4308,
        lng: 12.3594,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Parco delle Rimembranze",
        address: "Castello, Venice",
        rating: 4.1,
        price_level: 0,
        category: "park",
        lat: 45.4308,
        lng: 12.3594,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Giardini Papadopoli",
        address: "Santa Croce, Venice",
        rating: 4.2,
        price_level: 0,
        category: "park",
        lat: 45.4408,
        lng: 12.3155,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    bars: [
      {
        name: "Harry's Bar",
        address: "Calle Vallaresso, Venice",
        rating: 4.3,
        price_level: 4,
        category: "bar",
        lat: 45.4342,
        lng: 12.3388,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Caffè Centrale",
        address: "Calle Larga San Marco, Venice",
        rating: 4.1,
        price_level: 2,
        category: "bar",
        lat: 45.4342,
        lng: 12.3388,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Bacaro Jazz",
        address: "Calle del Mondo Novo, Venice",
        rating: 4.2,
        price_level: 2,
        category: "bar",
        lat: 45.4408,
        lng: 12.3155,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      }
    ]
  }
};

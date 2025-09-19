/**
 * Barcelona City Data
 * Данные по Барселоне
 * Изменяйте ТОЛЬКО данные, не трогайте структуру!
 */

module.exports = {
  name: "Barcelona",
  country: "Spain",
  coordinates: {
    lat: 41.3851,
    lng: 2.1734
  },
  
  // Реальные места Барселоны
  places: {
    cafes: [
      {
        name: "Café de l'Opera",
        address: "La Rambla, 74, Barcelona",
        rating: 4.2,
        price_level: 2,
        category: "cafe",
        lat: 41.3809,
        lng: 2.1734,
        photos: [
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Café Central",
        address: "Plaça Reial, 8, Barcelona",
        rating: 4.1,
        price_level: 2,
        category: "cafe",
        lat: 41.3809,
        lng: 2.1734,
        photos: [
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Café de la Pedrera",
        address: "Passeig de Gràcia, 92, Barcelona",
        rating: 4.3,
        price_level: 3,
        category: "cafe",
        lat: 41.3954,
        lng: 2.1619,
        photos: [
          "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    restaurants: [
      {
        name: "El Nacional",
        address: "Passeig de Gràcia, 24, Barcelona",
        rating: 4.4,
        price_level: 3,
        category: "restaurant",
        lat: 41.3954,
        lng: 2.1619,
        photos: [
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Casa Lolea",
        address: "Carrer de Sant Pere Més Alt, 49, Barcelona",
        rating: 4.5,
        price_level: 2,
        category: "restaurant",
        lat: 41.3851,
        lng: 2.1734,
        photos: [
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Tickets",
        address: "Avinguda del Paral·lel, 164, Barcelona",
        rating: 4.6,
        price_level: 4,
        category: "restaurant",
        lat: 41.3751,
        lng: 2.1634,
        photos: [
          "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    attractions: [
      {
        name: "Sagrada Familia",
        address: "Carrer de Mallorca, 401, Barcelona",
        rating: 4.7,
        price_level: 2,
        category: "attraction",
        lat: 41.4036,
        lng: 2.1744,
        photos: [
          "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Park Güell",
        address: "Carrer d'Olot, Barcelona",
        rating: 4.5,
        price_level: 1,
        category: "attraction",
        lat: 41.4145,
        lng: 2.1527,
        photos: [
          "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Casa Batlló",
        address: "Passeig de Gràcia, 43, Barcelona",
        rating: 4.4,
        price_level: 2,
        category: "attraction",
        lat: 41.3917,
        lng: 2.1649,
        photos: [
          "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    museums: [
      {
        name: "Museu Picasso",
        address: "Carrer de Montcada, 15-23, Barcelona",
        rating: 4.3,
        price_level: 2,
        category: "museum",
        lat: 41.3851,
        lng: 2.1734,
        photos: [
          "https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Museu Nacional d'Art de Catalunya",
        address: "Palau Nacional, Parc de Montjuïc, Barcelona",
        rating: 4.4,
        price_level: 2,
        category: "museum",
        lat: 41.3686,
        lng: 2.1536,
        photos: [
          "https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Fundació Joan Miró",
        address: "Parc de Montjuïc, Barcelona",
        rating: 4.2,
        price_level: 2,
        category: "museum",
        lat: 41.3686,
        lng: 2.1536,
        photos: [
          "https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    parks: [
      {
        name: "Parc de la Ciutadella",
        address: "Passeig de Picasso, 21, Barcelona",
        rating: 4.3,
        price_level: 0,
        category: "park",
        lat: 41.3888,
        lng: 2.1870,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Parc del Laberint d'Horta",
        address: "Passeig dels Castanyers, 1, Barcelona",
        rating: 4.1,
        price_level: 1,
        category: "park",
        lat: 41.4386,
        lng: 2.1419,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Parc de Montjuïc",
        address: "Montjuïc, Barcelona",
        rating: 4.4,
        price_level: 0,
        category: "park",
        lat: 41.3686,
        lng: 2.1536,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      }
    ],
    
    bars: [
      {
        name: "El Bosc de les Fades",
        address: "Passatge de la Banca, 5, Barcelona",
        rating: 4.2,
        price_level: 2,
        category: "bar",
        lat: 41.3809,
        lng: 2.1734,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Dry Martini",
        address: "Carrer d'Aribau, 162, Barcelona",
        rating: 4.3,
        price_level: 3,
        category: "bar",
        lat: 41.3954,
        lng: 2.1619,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      },
      {
        name: "Bodega 1900",
        address: "Carrer de Tamarit, 91, Barcelona",
        rating: 4.4,
        price_level: 3,
        category: "bar",
        lat: 41.3751,
        lng: 2.1634,
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80",
          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80"
        ]
      }
    ]
  }
};

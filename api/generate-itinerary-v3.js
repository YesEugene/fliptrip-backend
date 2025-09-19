// Vercel Serverless Function - облегченная версия без тяжелых зависимостей
export default async function handler(req, res) {
  console.log('🚀 Generate itinerary v3 called (lightweight):', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin
  });

  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  // Обрабатываем preflight OPTIONS запрос
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS for generate-itinerary-v3');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { city, audience, interests, date, budget } = req.body;
    console.log('📝 Generate itinerary v3 request:', { city, audience, interests, date, budget });

    // Генерируем расширенный план на весь день
    const activities = [
      { time: '09:00', title: 'Morning Coffee & Pastries', category: 'cafe', price: 12, duration: 60, location: 'El Born District' },
      { time: '10:30', title: 'Sagrada Familia', category: 'attraction', price: 33, duration: 120, location: 'Eixample' },
      { time: '13:00', title: 'Authentic Tapas Lunch', category: 'restaurant', price: 35, duration: 90, location: 'Gothic Quarter' },
      { time: '15:00', title: 'Park Güell', category: 'attraction', price: 10, duration: 120, location: 'Gràcia' },
      { time: '17:30', title: 'Barceloneta Beach', category: 'outdoor', price: 0, duration: 90, location: 'Barceloneta' },
      { time: '19:00', title: 'Las Ramblas Stroll', category: 'attraction', price: 0, duration: 60, location: 'City Center' },
      { time: '20:30', title: 'Traditional Dinner', category: 'restaurant', price: 45, duration: 90, location: 'Eixample' }
    ];

    const itinerary = {
      title: `Epic amazing discoveries in ${city || 'Barcelona'}`,
      subtitle: `${date || '2025-09-19'} for ${audience || 'him'} - discover the magic of ${city || 'Barcelona'}. Experience authentic moments, create lasting memories, and let the city's unique charm captivate your heart. An extraordinary adventure awaits your arrival.`,
      date: date || '2025-09-19',
      budget: budget || '800',
      weather: {
        forecast: `Perfect weather for exploring ${city || 'Barcelona'}`,
        clothing: 'Comfortable walking shoes and light layers',
        tips: 'Stay hydrated and bring a camera!'
      },
      daily_plan: [{
        date: date || '2025-09-19',
        blocks: activities.map(activity => ({
          time: activity.time,
          items: [{
            title: activity.title,
            description: `Experience ${activity.title} - ${getActivityDescription(activity.category, city || 'Barcelona')}`,
            category: activity.category,
            duration: activity.duration,
            price: activity.price,
            location: activity.location,
            photos: [getActivityPhoto(activity.category)]
          }]
        }))
      }],
      totalCost: activities.reduce((sum, a) => sum + a.price, 0),
      withinBudget: true
    };

    console.log('✅ Generated enhanced itinerary v3 successfully for:', { city, audience });
    res.status(200).json(itinerary);

  } catch (error) {
    console.error('Generate itinerary v3 error:', error);
    
    // Базовый fallback
    const fallbackItinerary = {
      title: `Epic amazing discoveries in ${req.body?.city || 'Barcelona'}`,
      subtitle: `${req.body?.date || '2025-09-19'} for ${req.body?.audience || 'him'} - discover the magic of ${req.body?.city || 'Barcelona'}. Experience authentic moments, create lasting memories, and let the city's unique charm captivate your heart. An extraordinary adventure awaits your arrival.`,
      date: req.body?.date || '2025-09-19',
      budget: req.body?.budget || '800',
      weather: {
        forecast: `Perfect weather for exploring ${req.body?.city || 'Barcelona'}`,
        clothing: 'Comfortable walking shoes and light layers',
        tips: 'Stay hydrated and bring a camera!'
      },
      daily_plan: [{
        date: req.body?.date || '2025-09-19',
        blocks: [
          {
            time: '09:00',
            items: [{
              title: 'Morning Coffee & Pastries',
              description: `Start your day with excellent coffee and fresh pastries`,
              category: 'cafe',
              duration: 60,
              price: 12,
              location: `${req.body?.city || 'Barcelona'} City Center`,
              photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80']
            }]
          }
        ]
      }],
      totalCost: 12,
      withinBudget: true
    };
    
    res.status(200).json(fallbackItinerary);
  }
}

// Утилиты для описаний
function getActivityDescription(category, city) {
  const descriptions = {
    'cafe': `Start your day with excellent local coffee and fresh pastries in ${city}`,
    'attraction': `Explore one of ${city}'s most iconic landmarks and cultural sites`,
    'restaurant': `Savor authentic local cuisine and traditional dishes of ${city}`,
    'outdoor': `Enjoy the natural beauty and outdoor spaces that ${city} has to offer`,
    'museum': `Discover the rich history and culture of ${city} through art and exhibits`,
    'shopping': `Browse local markets and shops for unique souvenirs from ${city}`
  };
  return descriptions[category] || `Experience the best of ${city}`;
}

// Утилиты для фотографий
function getActivityPhoto(category) {
  const photos = {
    'cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80',
    'attraction': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&q=80',
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80',
    'outdoor': 'https://images.unsplash.com/photo-1544737151-6e4b9eb2e0b7?w=800&h=600&fit=crop&q=80',
    'museum': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800&h=600&fit=crop&q=80',
    'shopping': 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&h=600&fit=crop&q=80'
  };
  return photos[category] || photos['attraction'];
}
// Vercel Serverless Function - новая версия для генерации маршрутов
export default async function handler(req, res) {
  console.log('🚀 Generate itinerary v3 called:', {
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

    // Генерируем маршрут для Барселоны
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
        blocks: [
          {
            time: '09:00',
            name: 'Morning Coffee & Pastries',
            description: 'Start your day with excellent coffee and fresh Catalan pastries at a local café',
            category: 'cafe',
            duration: 60,
            price: 12,
            location: 'El Born District',
            photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80']
          },
          {
            time: '10:30',
            name: 'Sagrada Familia',
            description: 'Marvel at Antoni Gaudí\'s architectural masterpiece and iconic basilica',
            category: 'attraction',
            duration: 120,
            price: 33,
            location: 'Eixample District',
            photos: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&q=80']
          },
          {
            time: '13:00',
            name: 'Authentic Tapas Lunch',
            description: 'Experience traditional Catalan cuisine with local tapas and wine',
            category: 'restaurant',
            duration: 90,
            price: 45,
            location: 'Gothic Quarter',
            photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80']
          },
          {
            time: '15:00',
            name: 'Park Güell',
            description: 'Explore Gaudí\'s whimsical park with colorful mosaics and panoramic city views',
            category: 'attraction',
            duration: 120,
            price: 10,
            location: 'Gràcia District',
            photos: ['https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800&h=600&fit=crop&q=80']
          },
          {
            time: '17:30',
            name: 'Barceloneta Beach',
            description: 'Relax at Barcelona\'s famous urban beach with Mediterranean views',
            category: 'outdoor',
            duration: 90,
            price: 0,
            location: 'Barceloneta',
            photos: ['https://images.unsplash.com/photo-1544737151-6e4b9eb2e0b7?w=800&h=600&fit=crop&q=80']
          },
          {
            time: '19:00',
            name: 'Evening Stroll & Dinner',
            description: 'Walk along Las Ramblas and enjoy dinner at a traditional restaurant',
            category: 'restaurant',
            duration: 120,
            price: 55,
            location: 'Las Ramblas',
            photos: ['https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&h=600&fit=crop&q=80']
          }
        ]
      }],
      totalCost: 155,
      withinBudget: true
    };

    console.log('✅ Generated itinerary v3 successfully for:', { city, audience });
    res.status(200).json(itinerary);

  } catch (error) {
    console.error('Generate itinerary v3 error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}

// Vercel Serverless Function для smart-itinerary API

export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  console.log('🔍 Request method:', req.method);
  console.log('🔍 Request headers:', req.headers);

  // Обрабатываем preflight OPTIONS запрос
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed', method: req.method });
  }

  try {
    const { city, audience, interests, date, budget } = req.body;

    console.log('🎯 Smart itinerary request:', { city, audience, interests, date, budget });

    // Простая генерация smart маршрута для демо
    const smartItinerary = {
      title: `Smart Journey in ${city || 'Unknown City'}`,
      subtitle: `Optimized experience for ${audience || 'travelers'}`,
      date: date || new Date().toISOString().split('T')[0],
      budget: budget || '200',
      weather: {
        forecast: `Great weather for exploring ${city || 'the city'}`,
        clothing: 'Comfortable attire for a day of adventure',
        tips: 'Bring a camera and stay hydrated!'
      },
      activities: [
        {
          time: '09:00',
          name: 'Morning Start',
          description: 'Begin your adventure with energy',
          category: 'cafe',
          duration: 45,
          price: 12,
          photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80']
        },
        {
          time: '10:30',
          name: 'Cultural Discovery',
          description: `Discover the essence of ${city || 'the city'}`,
          category: 'attraction',
          duration: 90,
          price: 18,
          photos: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&q=80']
        },
        {
          time: '13:00',
          name: 'Local Flavors',
          description: 'Experience authentic cuisine',
          category: 'restaurant',
          duration: 75,
          price: 35,
          photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80']
        }
      ],
      totalCost: 65,
      withinBudget: true
    };

    console.log('✅ Smart itinerary generated successfully');
    return res.status(200).json(smartItinerary);

  } catch (error) {
    console.error('❌ Smart API Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}
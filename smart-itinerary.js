// Vercel Serverless Function для smart-itinerary API

module.exports = async (req, res) => {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Обрабатываем preflight OPTIONS запрос
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { city, audience, interests, date, budget } = req.body;

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

    console.log('✅ Smart itinerary generated for:', { city, audience, interests });
    res.status(200).json(smartItinerary);

  } catch (error) {
    console.error('Smart API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
};

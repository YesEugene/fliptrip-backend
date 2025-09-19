// Vercel Serverless Function для creative-itinerary API

export default async function handler(req, res) {
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

    // Простая генерация креативного маршрута для демо
    const creativeItinerary = {
      title: `Creative adventure in ${city || 'Unknown City'}`,
      subtitle: `An inspiring journey for ${audience || 'travelers'}`,
      date: date || new Date().toISOString().split('T')[0],
      budget: budget || '200',
      weather: {
        forecast: `Perfect weather for exploring ${city || 'the city'}`,
        clothing: 'Dress comfortably for a day of discovery',
        tips: 'Bring a camera to capture the moments!'
      },
      activities: [
        {
          time: '08:30',
          name: 'Sunrise Spot',
          description: 'Begin with breathtaking views',
          category: 'viewpoint',
          duration: 45,
          price: 0,
          photos: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80']
        },
        {
          time: '10:00',
          name: 'Cultural Experience',
          description: 'Immerse in local culture',
          category: 'museum',
          duration: 90,
          price: 20,
          photos: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80']
        },
        {
          time: '13:30',
          name: 'Authentic Dining',
          description: 'Savor traditional flavors',
          category: 'restaurant',
          duration: 75,
          price: 35,
          photos: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80']
        }
      ],
      totalCost: 55,
      withinBudget: true
    };

    console.log('✅ Creative itinerary generated for:', { city, audience, interests });
    res.status(200).json(creativeItinerary);

  } catch (error) {
    console.error('Creative API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
};
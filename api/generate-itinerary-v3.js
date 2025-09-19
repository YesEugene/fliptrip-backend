// Простейшая рабочая версия generate-itinerary-v3
export default async function handler(req, res) {
  console.log('🚀 Generate itinerary v3 - simple version');

  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { city = 'Barcelona', audience = 'him', date = '2025-09-19', budget = '800' } = req.body || {};

    // 7 активностей на полный день
    const itinerary = {
      title: `Epic amazing discoveries in ${city}`,
      subtitle: `${date} for ${audience} - discover the magic of ${city}. Experience authentic moments, create lasting memories, and let the city's unique charm captivate your heart. An extraordinary adventure awaits your arrival.`,
      date: date,
      budget: budget,
      weather: {
        forecast: `Perfect weather for exploring ${city}`,
        clothing: 'Comfortable walking shoes and light layers',
        tips: 'Stay hydrated and bring a camera!'
      },
      daily_plan: [{
        date: date,
        blocks: [
          {
            time: '09:00',
            items: [{
              title: 'Morning Coffee & Pastries',
              description: 'Start your day with excellent coffee and fresh Catalan pastries',
              category: 'cafe',
              duration: 60,
              price: 12,
              location: 'El Born District',
              photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80']
            }]
          },
          {
            time: '10:30',
            items: [{
              title: 'Sagrada Familia',
              description: 'Marvel at Antoni Gaudí\'s architectural masterpiece',
              category: 'attraction',
              duration: 120,
              price: 33,
              location: 'Eixample',
              photos: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&q=80']
            }]
          },
          {
            time: '13:00',
            items: [{
              title: 'Authentic Tapas Lunch',
              description: 'Experience traditional Catalan cuisine with local tapas',
              category: 'restaurant',
              duration: 90,
              price: 35,
              location: 'Gothic Quarter',
              photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80']
            }]
          },
          {
            time: '15:00',
            items: [{
              title: 'Park Güell',
              description: 'Explore Gaudí\'s whimsical park with colorful mosaics',
              category: 'attraction',
              duration: 120,
              price: 10,
              location: 'Gràcia',
              photos: ['https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800&h=600&fit=crop&q=80']
            }]
          },
          {
            time: '17:30',
            items: [{
              title: 'Barceloneta Beach',
              description: 'Relax at Barcelona\'s famous urban beach',
              category: 'outdoor',
              duration: 90,
              price: 0,
              location: 'Barceloneta',
              photos: ['https://images.unsplash.com/photo-1544737151-6e4b9eb2e0b7?w=800&h=600&fit=crop&q=80']
            }]
          },
          {
            time: '19:00',
            items: [{
              title: 'Las Ramblas Stroll',
              description: 'Walk along Barcelona\'s most famous street',
              category: 'attraction',
              duration: 60,
              price: 0,
              location: 'City Center',
              photos: ['https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&h=600&fit=crop&q=80']
            }]
          },
          {
            time: '20:30',
            items: [{
              title: 'Traditional Dinner',
              description: 'End your day with authentic Catalan dinner',
              category: 'restaurant',
              duration: 90,
              price: 45,
              location: 'Eixample',
              photos: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&q=80']
            }]
          }
        ]
      }],
      totalCost: 135,
      withinBudget: true
    };

    console.log('✅ Generated simple v3 itinerary');
    res.status(200).json(itinerary);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
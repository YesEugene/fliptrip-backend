// Vercel Serverless Function для real-places-itinerary API
import OpenAI from 'openai';
import { Client } from '@googlemaps/google-maps-services-js';

// Инициализация OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Инициализация Google Maps
const googleMapsClient = new Client({});

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

    // Простая генерация маршрута для демо
    const mockItinerary = {
      title: `Exploring ${city || 'Unknown City'}`,
      subtitle: `A perfect day for ${audience || 'travelers'} in ${city || 'the city'}`,
      date: date || new Date().toISOString().split('T')[0],
      budget: budget || '200',
      weather: {
        forecast: `Pleasant weather expected in ${city || 'the city'}`,
        clothing: 'Comfortable walking shoes and weather-appropriate clothing',
        tips: 'Stay hydrated and enjoy your adventure!'
      },
      activities: [
        {
          time: '09:00',
          name: 'Morning Coffee',
          description: 'Start your day with excellent coffee',
          category: 'cafe',
          duration: 60,
          price: 15,
          photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80']
        },
        {
          time: '11:00', 
          name: 'Main Attraction',
          description: `Explore the best of ${city || 'the city'}`,
          category: 'attraction',
          duration: 120,
          price: 25,
          photos: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&q=80']
        },
        {
          time: '14:00',
          name: 'Local Restaurant',
          description: 'Taste authentic local cuisine',
          category: 'restaurant', 
          duration: 90,
          price: 45,
          photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80']
        }
      ],
      totalCost: 85,
      withinBudget: true
    };

    console.log('✅ Mock itinerary generated for:', { city, audience, interests });
    res.status(200).json(mockItinerary);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
};
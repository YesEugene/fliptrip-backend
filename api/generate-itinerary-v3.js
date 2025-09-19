// Vercel Serverless Function - полноценная система генерации маршрутов
import OpenAI from 'openai';
import { Client } from '@googlemaps/google-maps-services-js';

// Инициализация OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key-for-development'
});

// Инициализация Google Maps
const googleMapsClient = new Client({});

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

    // Проверяем наличие API ключей
    const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock-key-for-development';
    const hasGoogleMaps = !!process.env.GOOGLE_MAPS_KEY;
    
    console.log('🔑 API Keys status:', { hasOpenAI, hasGoogleMaps });

    // Генерируем маршрут с реальными API или fallback
    let itinerary;
    
    if (hasOpenAI && hasGoogleMaps) {
      console.log('🌟 Using full AI system with real places');
      itinerary = await generateSmartItinerary(city, audience, interests, date, budget);
    } else {
      console.log('🔄 Using enhanced fallback system');
      itinerary = await generateEnhancedFallback(city, audience, interests, date, budget);
    }

    console.log('✅ Generated itinerary v3 successfully for:', { city, audience });
    res.status(200).json(itinerary);

  } catch (error) {
    console.error('Generate itinerary v3 error:', error);
    
    // Последний fallback
    const fallbackItinerary = generateBasicFallback(req.body);
    res.status(200).json(fallbackItinerary);
  }
}

// Полноценная система с OpenAI и Google Places
async function generateSmartItinerary(city, audience, interests, date, budget) {
  try {
    // 1. Получаем реальные места из Google Places
    const places = await getPlacesForItinerary(city, interests);
    console.log(`📍 Found ${places.length} real places`);

    // 2. Генерируем план через OpenAI
    const prompt = generateSmartPrompt(city, audience, interests, date, budget, places);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0].message.content;
    const aiItinerary = JSON.parse(responseContent);
    
    // 3. Обогащаем данными из Google Places
    const enrichedItinerary = enrichWithRealPlaces(aiItinerary, places);
    
    return enrichedItinerary;
  } catch (error) {
    console.error('Smart itinerary generation failed:', error);
    return generateEnhancedFallback(city, audience, interests, date, budget);
  }
}

// Получение мест из Google Places API
async function getPlacesForItinerary(city, interests) {
  const categories = ['restaurant', 'tourist_attraction', 'museum', 'park', 'shopping_mall', 'cafe'];
  const allPlaces = [];

  for (const category of categories) {
    try {
      const places = await searchGooglePlaces(city, category, interests);
      allPlaces.push(...places.slice(0, 3)); // Топ 3 места каждой категории
    } catch (error) {
      console.error(`Failed to get ${category} places:`, error);
    }
  }

  return allPlaces;
}

// Поиск мест в Google Places
async function searchGooglePlaces(city, category, interests) {
  if (!process.env.GOOGLE_MAPS_KEY) {
    return getMockPlaces(city, category);
  }

  try {
    const query = `${category} in ${city}`;
    
    const response = await googleMapsClient.textSearch({
      params: {
        query: query,
        key: process.env.GOOGLE_MAPS_KEY,
        type: getPlaceType(category),
        language: 'en'
      }
    });

    return formatPlacesResponse(response.data.results);
  } catch (error) {
    console.error('Google Places API error:', error);
    return getMockPlaces(city, category);
  }
}

// Форматирование ответа Google Places
function formatPlacesResponse(results) {
  return results.slice(0, 5).map(place => ({
    name: place.name,
    address: place.formatted_address,
    rating: place.rating || 4.0,
    priceLevel: place.price_level || 2,
    photo: place.photos?.[0] ? 
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_MAPS_KEY}` :
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&q=80',
    category: getPlaceCategory(place.types),
    placeId: place.place_id
  }));
}

// Промпт для OpenAI
function generateSmartPrompt(city, audience, interests, date, budget, places) {
  return `Create a detailed day itinerary for ${city} on ${date} for ${audience} with interests: ${interests.join(', ')} and budget: €${budget}.

Available real places: ${JSON.stringify(places, null, 2)}

Create a JSON response with this EXACT structure:
{
  "title": "Epic amazing discoveries in ${city}",
  "subtitle": "${date} for ${audience} - discover the magic of ${city}. Experience authentic moments, create lasting memories, and let the city's unique charm captivate your heart. An extraordinary adventure awaits your arrival.",
  "date": "${date}",
  "budget": "${budget}",
  "weather": {
    "forecast": "Perfect weather for exploring ${city}",
    "clothing": "Comfortable walking shoes and light layers",
    "tips": "Stay hydrated and bring a camera!"
  },
  "daily_plan": [{
    "date": "${date}",
    "blocks": [
      {
        "time": "09:00",
        "items": [{
          "title": "Place name from real places",
          "description": "Detailed description",
          "category": "cafe/restaurant/attraction",
          "duration": 60,
          "price": 15,
          "location": "Address",
          "photos": ["photo_url"]
        }]
      }
    ]
  }],
  "totalCost": 150,
  "withinBudget": true
}

Create 8-9 activities from 9:00 to 21:30. Use ONLY real places provided. Include realistic prices based on price_level.`;
}

// Обогащение данными из реальных мест
function enrichWithRealPlaces(itinerary, places) {
  // Добавляем реальные фотографии и данные
  itinerary.daily_plan[0].blocks.forEach(block => {
    block.items.forEach(item => {
      const matchingPlace = places.find(p => 
        p.name.toLowerCase().includes(item.title.toLowerCase()) ||
        item.title.toLowerCase().includes(p.name.toLowerCase())
      );
      
      if (matchingPlace) {
        item.photos = [matchingPlace.photo];
        item.location = matchingPlace.address;
        item.rating = matchingPlace.rating;
      }
    });
  });
  
  return itinerary;
}

// Улучшенный fallback с разнообразием
async function generateEnhancedFallback(city, audience, interests, date, budget) {
  const activities = [
    { time: '09:00', title: 'Morning Coffee & Pastries', category: 'cafe', price: 12, duration: 60 },
    { time: '10:30', title: 'Historic City Walking Tour', category: 'attraction', price: 20, duration: 120 },
    { time: '13:00', title: 'Traditional Local Lunch', category: 'restaurant', price: 35, duration: 90 },
    { time: '15:00', title: 'Art Museum Visit', category: 'museum', price: 15, duration: 120 },
    { time: '17:30', title: 'City Park Stroll', category: 'park', price: 0, duration: 60 },
    { time: '19:00', title: 'Shopping & Souvenirs', category: 'shopping', price: 25, duration: 90 },
    { time: '20:30', title: 'Evening Dinner', category: 'restaurant', price: 45, duration: 90 }
  ];

  return {
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
      blocks: activities.map(activity => ({
        time: activity.time,
        items: [{
          title: activity.title,
          description: `Experience ${activity.title.toLowerCase()} in ${city}`,
          category: activity.category,
          duration: activity.duration,
          price: activity.price,
          location: `${city} City Center`,
          photos: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&q=80']
        }]
      }))
    }],
    totalCost: activities.reduce((sum, a) => sum + a.price, 0),
    withinBudget: true
  };
}

// Базовый fallback
function generateBasicFallback({ city = 'Barcelona', audience = 'him', date = '2025-09-19', budget = '800' }) {
  return {
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
            description: `Start your day with excellent coffee and fresh pastries in ${city}`,
            category: 'cafe',
            duration: 60,
            price: 12,
            location: `${city} City Center`,
            photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80']
          }]
        }
      ]
    }],
    totalCost: 12,
    withinBudget: true
  };
}

// Утилиты
function getPlaceType(category) {
  const typeMap = {
    'restaurant': 'restaurant',
    'tourist_attraction': 'tourist_attraction',
    'museum': 'museum',
    'park': 'park',
    'shopping_mall': 'shopping_mall',
    'cafe': 'cafe'
  };
  return typeMap[category] || 'establishment';
}

function getPlaceCategory(types) {
  if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
  if (types.includes('tourist_attraction')) return 'attraction';
  if (types.includes('museum')) return 'museum';
  if (types.includes('park')) return 'park';
  if (types.includes('shopping_mall')) return 'shopping';
  if (types.includes('cafe')) return 'cafe';
  return 'attraction';
}

function getMockPlaces(city, category) {
  return [
    {
      name: `Best ${category} in ${city}`,
      address: `${city} City Center`,
      rating: 4.5,
      priceLevel: 2,
      photo: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&q=80',
      category: category,
      placeId: 'mock-place-id'
    }
  ];
}
// Vercel Serverless Function - REAL-TIME AI система как на локальном диске
import OpenAI from 'openai';
import { Client } from '@googlemaps/google-maps-services-js';

// Инициализация OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key-for-development'
});

// Инициализация Google Places
const googleMapsClient = new Client({});

export default async function handler(req, res) {
  // CORS заголовки - разрешаем все домены для стабильности
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  console.log('🔍 Request method:', req.method);

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
    console.log('🎯 REAL-TIME AI itinerary request:', { city, audience, interests, date, budget });

    // Проверяем API ключи
    const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock-key-for-development';
    const hasGoogleMaps = !!process.env.GOOGLE_MAPS_KEY;
    
    console.log('🔑 API Keys status:', { 
      hasOpenAI, 
      hasGoogleMaps,
      openaiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
      googleKeyLength: process.env.GOOGLE_MAPS_KEY ? process.env.GOOGLE_MAPS_KEY.length : 0
    });

    let itinerary;

    if (hasOpenAI && hasGoogleMaps) {
      console.log('🚀 Using REAL-TIME AI system with OpenAI + Google Places');
      itinerary = await generateRealTimeItinerary(city, audience, interests, date, budget);
    } else {
      console.log('🔄 Using enhanced fallback (no API keys available)');
      itinerary = generateConceptualItinerary(city, audience, interests, date, budget);
    }
    
    console.log('✅ Itinerary generated successfully');
    return res.status(200).json(itinerary);

  } catch (error) {
    console.error('❌ Smart API Error:', error);
    
    // Последний fallback
    const fallback = generateBasicFallback(req.body);
    return res.status(200).json(fallback);
  }
}

// REAL-TIME AI система с OpenAI + Google Places
async function generateRealTimeItinerary(city, audience, interests, date, budget) {
  console.log('🎨 REAL-TIME: Generating unique itinerary for:', { city, audience, interests });
  
  try {
    // ШАГ 1: OpenAI создает концептуальный план
    const conceptPrompt = `Create a conceptual day plan for ${city}.

CONTEXT:
- City: ${city}
- Audience: ${audience}
- Interests: ${interests.join(', ')}
- Budget: ${budget}€
- Date: ${date}

Create 7-8 time slots from 09:00 to 20:30.
Consider city-specific activities and local culture.
Match activities to interests and audience.

RESPONSE FORMAT (JSON only):
{
  "concept": "Brief description of the day's theme",
  "timeSlots": [
    {
      "time": "09:00",
      "activity": "Local breakfast experience",
      "category": "cafe",
      "keywords": ["breakfast", "local", "traditional"]
    }
  ]
}

Make it creative and locally relevant for ${city}.`;

    console.log('🤖 Calling OpenAI for conceptual plan...');
    const conceptCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: conceptPrompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const conceptualPlan = JSON.parse(conceptCompletion.choices[0].message.content);
    console.log('✅ OpenAI concept created:', conceptualPlan.concept);

    // ШАГ 2: Google Places ищет реальные места
    console.log('🔍 Searching real places with Google Places API...');
    const realPlaces = await findRealPlaces(city, conceptualPlan.timeSlots);
    console.log(`✅ Found ${realPlaces.length} real places`);

    // ШАГ 3: Создаем финальный маршрут
    const activities = conceptualPlan.timeSlots.map((slot, index) => {
      const place = realPlaces[index] || createFallbackPlace(slot, city);
      return {
        time: slot.time,
        name: place.name,
        description: `${slot.activity} - ${place.name}`,
        category: slot.category,
        duration: getCategoryDuration(slot.category),
        price: getCategoryPrice(slot.category, place.priceLevel),
        location: place.address || `${city} City Center`,
        photos: place.photos || ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&q=80']
      };
    });

    const totalCost = activities.reduce((sum, a) => sum + a.price, 0);
    const budgetNum = parseInt(budget) || 800;

    return {
      title: `Epic amazing discoveries in ${city}`,
      subtitle: `${date} for ${audience} - discover the magic of ${city}. Experience authentic moments, create lasting memories, and let the city's unique charm captivate your heart. An extraordinary adventure awaits your arrival.`,
      date: date,
      budget: budget,
      conceptual_plan: {
        concept: conceptualPlan.concept,
        architecture: "real_places_with_concept",
        hasConceptualPlan: true
      },
      weather: {
        forecast: `Perfect weather for exploring ${city} - 26°C with clear skies`,
        clothing: 'Comfortable walking shoes and light layers',
        tips: 'Stay hydrated and bring a camera!'
      },
      activities: activities,
      budget_info: {
        totalCost: totalCost,
        totalBudget: budgetNum,
        isWithinBudget: totalCost <= budgetNum,
        breakdown: activities.map(a => ({ name: a.name, price: a.price }))
      },
      totalCost: totalCost,
      withinBudget: totalCost <= budgetNum
    };

  } catch (error) {
    console.error('❌ Real-time AI generation failed:', error);
    return generateConceptualItinerary(city, audience, interests, date, budget);
  }
}

// Поиск реальных мест через Google Places
async function findRealPlaces(city, timeSlots) {
  const places = [];
  
  for (const slot of timeSlots) {
    try {
      const searchQuery = `${slot.keywords.join(' ')} ${slot.category} in ${city}`;
      console.log(`🔍 Google Places search: ${searchQuery}`);
      
      const response = await googleMapsClient.textSearch({
        params: {
          query: searchQuery,
          key: process.env.GOOGLE_MAPS_KEY,
          language: 'en'
        }
      });

      if (response.data.results.length > 0) {
        const place = response.data.results[0];
        places.push({
          name: place.name,
          address: place.formatted_address,
          rating: place.rating || 4.0,
          priceLevel: place.price_level || 2,
          photos: place.photos ? [`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${process.env.GOOGLE_MAPS_KEY}`] : null
        });
        console.log(`✅ Found: ${place.name}`);
      } else {
        places.push(createFallbackPlace(slot, city));
        console.log(`⚠️ No places found for ${slot.activity}, using fallback`);
      }
    } catch (error) {
      console.error(`❌ Google Places error for ${slot.activity}:`, error);
      places.push(createFallbackPlace(slot, city));
    }
  }
  
  return places;
}

function createFallbackPlace(timeSlot, city) {
  return {
    name: timeSlot.activity,
    address: `${city} City Center`,
    rating: 4.2,
    priceLevel: 2,
    photos: null
  };
}

function getCategoryDuration(category) {
  const durations = { 'cafe': 60, 'restaurant': 90, 'attraction': 120, 'outdoor': 90 };
  return durations[category] || 90;
}

function getCategoryPrice(category, priceLevel = 2) {
  const prices = {
    'cafe': { 0: 0, 1: 8, 2: 15, 3: 25, 4: 35 },
    'restaurant': { 0: 0, 1: 15, 2: 35, 3: 55, 4: 85 },
    'attraction': { 0: 0, 1: 8, 2: 15, 3: 30, 4: 50 },
    'outdoor': { 0: 0, 1: 5, 2: 10, 3: 20, 4: 35 }
  };
  return prices[category]?.[priceLevel] || 20;
}

// Генерация концептуального маршрута - воссоздаем локальную версию
function generateConceptualItinerary(city = 'Barcelona', audience = 'him', interests = ['adventure'], date = '2025-09-19', budget = '800') {
  console.log('🎨 Generating conceptual itinerary for:', { city, audience, interests });
  
  // Концептуальные активности для Барселоны - как на локальном диске
  const barcelonaActivities = [
    {
      time: '09:00',
      name: 'Breakfast at Quimet & Quimet',
      description: 'Start your day with authentic Catalan breakfast and excellent coffee at this legendary tapas bar known for its creative montaditos',
      category: 'cafe',
      duration: 60,
      price: 15,
      location: 'Poble Sec',
      photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80']
    },
    {
      time: '10:30',
      name: 'Camp Nou Experience',
      description: 'Explore FC Barcelona\'s iconic stadium and museum - a pilgrimage site for football enthusiasts worldwide',
      category: 'attraction',
      duration: 120,
      price: 28,
      location: 'Les Corts',
      photos: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=600&fit=crop&q=80']
    },
    {
      time: '13:00',
      name: 'Lunch at Cerveceria Catalana',
      description: 'Experience the best tapas in Barcelona at this authentic local favorite where locals queue for exceptional seafood and traditional dishes',
      category: 'restaurant',
      duration: 90,
      price: 35,
      location: 'Eixample',
      photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80']
    },
    {
      time: '15:00',
      name: 'Sagrada Familia',
      description: 'Marvel at Antoni Gaudí\'s architectural masterpiece and learn about its fascinating 140-year construction history',
      category: 'attraction',
      duration: 120,
      price: 33,
      location: 'Eixample',
      photos: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop&q=80']
    },
    {
      time: '17:30',
      name: 'Park Güell',
      description: 'Explore Gaudí\'s whimsical park with stunning panoramic city views, colorful mosaics, and unique architectural elements',
      category: 'attraction',
      duration: 120,
      price: 10,
      location: 'Gràcia',
      photos: ['https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800&h=600&fit=crop&q=80']
    },
    {
      time: '19:30',
      name: 'Sunset at Bunkers del Carmel',
      description: 'Watch the magical sunset over Barcelona from this hidden local viewpoint - a secret spot away from tourist crowds',
      category: 'outdoor',
      duration: 60,
      price: 0,
      location: 'El Carmel',
      photos: ['https://images.unsplash.com/photo-1544737151-6e4b9eb2e0b7?w=800&h=600&fit=crop&q=80']
    },
    {
      time: '20:30',
      name: 'Dinner at Cal Pep',
      description: 'End your day with exceptional seafood and traditional Catalan cuisine at this intimate counter-style restaurant',
      category: 'restaurant',
      duration: 90,
      price: 65,
      location: 'Born',
      photos: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&q=80']
    }
  ];

  const totalCost = barcelonaActivities.reduce((sum, activity) => sum + activity.price, 0);
  const budgetNum = parseInt(budget) || 800;

  return {
    title: `Epic amazing discoveries in ${city}`,
    subtitle: `${date} for ${audience} - discover the magic of ${city}. Experience authentic moments, create lasting memories, and let the city's unique charm captivate your heart. An extraordinary adventure awaits your arrival.`,
    date: date,
    budget: budget,
    conceptual_plan: {
      concept: `A day of cultural immersion, architectural wonders, and culinary delights in ${city}`,
      architecture: "real_places_with_concept",
      hasConceptualPlan: true
    },
    weather: {
      forecast: `Perfect weather for exploring ${city} - 26°C with clear skies`,
      clothing: 'Comfortable walking shoes and light layers',
      tips: 'Stay hydrated and bring a camera!'
    },
    activities: barcelonaActivities,
    budget_info: {
      totalCost: totalCost,
      totalBudget: budgetNum,
      isWithinBudget: totalCost <= budgetNum,
      breakdown: barcelonaActivities.map(a => ({ name: a.name, price: a.price }))
    },
    totalCost: totalCost,
    withinBudget: totalCost <= budgetNum
  };
}

// Базовый fallback
function generateBasicFallback({ city = 'Barcelona', audience = 'him', date = '2025-09-19', budget = '800' }) {
  return {
    title: `Smart Journey in ${city}`,
    subtitle: `Optimized experience for ${audience}`,
    date: date,
    budget: budget,
    activities: [
      {
        time: '09:00',
        name: 'Morning Start',
        description: 'Begin your adventure with energy',
        category: 'cafe',
        duration: 45,
        price: 12,
        photos: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80']
      }
    ],
    totalCost: 12,
    withinBudget: true
  };
}// FORCE REDEPLOY: Backend restored to working commit 117d0b7

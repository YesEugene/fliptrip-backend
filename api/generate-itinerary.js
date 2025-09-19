const OpenAI = require('openai');

export const config = { runtime: 'nodejs' };

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://fliptrip-web.vercel.app",
  "https://surprize-web.vercel.app"
];

function setCors(res, origin) {
  // Allow all origins for now to fix CORS issues
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export default async function handler(req, res) {
  setCors(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { city, audience, interests, date, budgetFrom, budgetTo, budget } = req.body;
    console.log('Received data:', { city, audience, interests, date, budgetFrom, budgetTo, budget });
    
    // Always use mock data for now
    console.log('Using mock data for itinerary generation');
    const mockData = generateMockItinerary(city, audience, interests, date);
    console.log('Generated mock data with', mockData.daily_plan[0].blocks.length, 'blocks');
    res.json(mockData);
  } catch (error) {
    console.error('Error generating itinerary:', error);
    // Return mock data instead of error for development
    res.json(generateMockItinerary(city, audience, interests, date));
  }
}

function generateMockItinerary(city, audience, interests, date) {
  return {
    city,
    date,
    meta: {
      creative_title: `Your Perfect Day in ${city}`,
      creative_subtitle: 'A personalized itinerary crafted just for you',
      weather: { t_min: 15, t_max: 25, precip_prob: 20 },
      clothing_advice: 'Comfortable walking shoes and layers'
    },
    daily_plan: [{
      blocks: [
        {
          time: '08:00',
          items: [{
            title: 'Morning Coffee & Breakfast',
            why: 'Start your day with local flavors and energy',
            address: 'Central Market, Main Square',
            approx_cost: '8-12€',
            tips: 'Try local pastries and coffee',
            duration: '45 minutes',
            transportation: 'Walk from hotel'
          }]
        },
        {
          time: '09:00',
          items: [{
            title: 'Historic City Center Walking Tour',
            why: 'Get oriented and learn about the city\'s history',
            address: 'Old Town Square',
            approx_cost: '15-20€',
            tips: 'Wear comfortable shoes, bring camera',
            duration: '2 hours',
            transportation: '10 min walk from breakfast'
          }]
        },
        {
          time: '11:30',
          items: [{
            title: 'Local Museum Visit',
            why: 'Dive deeper into the city\'s culture and art',
            address: 'City Art Museum, Museum Street 1',
            approx_cost: '12-15€',
            tips: 'Check for student discounts, audio guide recommended',
            duration: '1.5 hours',
            transportation: '5 min walk from old town'
          }]
        },
        {
          time: '13:00',
          items: [{
            title: 'Traditional Lunch',
            why: 'Experience authentic local cuisine',
            address: 'Local Restaurant, Food Street 15',
            approx_cost: '25-35€',
            tips: 'Try the house specialty, book ahead for popular places',
            duration: '1 hour',
            transportation: '8 min walk from museum'
          }]
        },
        {
          time: '14:30',
          items: [{
            title: 'Afternoon Stroll & Shopping',
            why: 'Relax and pick up souvenirs',
            address: 'Shopping District, Market Street',
            approx_cost: '20-50€',
            tips: 'Bargain at local markets, check opening hours',
            duration: '1.5 hours',
            transportation: '5 min walk from restaurant'
          }]
        },
        {
          time: '16:00',
          items: [{
            title: 'Scenic Viewpoint',
            why: 'Capture the best city views and photos',
            address: 'City Hill Lookout Point',
            approx_cost: 'Free',
            tips: 'Best light in late afternoon, bring water',
            duration: '45 minutes',
            transportation: '15 min walk uphill'
          }]
        },
        {
          time: '17:00',
          items: [{
            title: 'Local Park & Relaxation',
            why: 'Unwind and enjoy the local atmosphere',
            address: 'Central Park, Green Street',
            approx_cost: 'Free',
            tips: 'Perfect for people watching, bring a book',
            duration: '1 hour',
            transportation: '10 min walk from viewpoint'
          }]
        },
        {
          time: '18:30',
          items: [{
            title: 'Evening Drinks & Tapas',
            why: 'Experience the local nightlife and social scene',
            address: 'Rooftop Bar, High Street 8',
            approx_cost: '20-30€',
            tips: 'Book table for sunset views, try local wines',
            duration: '1.5 hours',
            transportation: '12 min walk from park'
          }]
        },
        {
          time: '20:30',
          items: [{
            title: 'Dinner at Local Favorite',
            why: 'End the day with a memorable dining experience',
            address: 'Traditional Restaurant, Old Quarter 12',
            approx_cost: '40-60€',
            tips: 'Reservation recommended, try the chef\'s special',
            duration: '2 hours',
            transportation: '8 min walk from bar'
          }]
        },
        {
          time: '22:30',
          items: [{
            title: 'Evening Stroll & Night Views',
            why: 'See the city lights and end on a romantic note',
            address: 'Riverside Promenade',
            approx_cost: 'Free',
            tips: 'Perfect for couples, bring a light jacket',
            duration: '30 minutes',
            transportation: '5 min walk from restaurant'
          }]
        }
      ]
    }]
  };
}
}
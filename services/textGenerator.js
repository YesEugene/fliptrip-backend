/**
 * Centralized Text Generator
 * Единый файл для генерации всех текстов в приложении
 * Содержит логику, промпты, API вызовы и fallback данные
 * 
 * ИЗМЕНЯЙТЕ ТОЛЬКО ЭТОТ ФАЙЛ для настройки генерации текстов!
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_KEY_HERE'
});

/**
 * ПРОВЕРКА API КЛЮЧА
 * Система всегда должна использовать реальные API
 */
const isApiKeyValid = () => {
  return process.env.OPENAI_API_KEY && 
         process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_KEY_HERE' &&
         process.env.OPENAI_API_KEY.length > 20;
};

/**
 * ПРОМПТЫ ДЛЯ ГЕНЕРАЦИИ ТЕКСТОВ
 * Все промпты собраны в одном месте для удобного редактирования
 */
const PROMPTS = {
  // КОНЦЕПТУАЛЬНЫЙ ПЛАН ДНЯ - НОВАЯ ЛОГИКА
  CONCEPTUAL_PLAN: `You are a creative travel planner. Based on the input data (city, date, interests, audience, budget), create a full-day itinerary that runs from 9:00 AM to around 9:30 PM.

CONTEXT:
- City: {city}
- Audience: {audience}
- Interests: {interests}
- Budget: {budget}€
- Date: {date}
- Season: {season}

Step 1. Build a Creative Concept of the Day
• Take into account the city and what it has to offer.
• Consider the audience (for him, for her, for a couple, for a child) and adapt the tone of the day accordingly.
• Use the chosen interests to design a unique and memorable plan, with a balance between activities and meals across time slots (breakfast, lunch, dinner, snacks, activities, nightlife).
• Respect the budget: the total cost of all locations must fit within the user's budget, with a maximum deviation of ±30%. If the budget is small, include free or affordable activities; if large, suggest exclusive experiences.
• Enrich the interests with associative ideas (e.g. "sports" → running, cycling, gyms, outdoor activities, sports cafés).

Step 2. Formulate a Task for Google Places

Once the creative concept of the day is ready, OpenAI must translate each time slot into a structured request for Google Places API.
The request is not descriptive text but a JSON-like query with clear parameters:
• Type of place (type=cafe, type=restaurant, type=bar, type=tourist_attraction, etc.),
• Keywords to reflect the concept (keyword=viewpoint, keyword=cycling, keyword=rooftop),
• Location (city coordinates),
• Radius for the search around the user's path,
• Filters for quality (minrating, user_ratings_total),
• Price range (minprice, maxprice) that ensures the total day cost stays within the user's budget ±30%,
• Openness (opennow=true) to match the actual time slot.

Example:
Creative concept: "At 9 AM the day should start with coffee at a scenic viewpoint in Paris."

RESPONSE FORMAT (JSON only, no markdown):
{
  "concept": "Brief description of the day's creative theme/concept",
  "timeSlots": [
    {
      "time": "09:00",
      "activity": "Morning coffee at scenic viewpoint",
      "category": "cafe",
      "description": "Start with energizing coffee overlooking the city",
      "keywords": ["coffee", "viewpoint", "morning", "scenic", "local"],
      "energyLevel": "medium",
      "priority": "essential",
      "budgetTier": "budget",
      "googlePlacesQuery": {
        "type": "cafe",
        "keywords": ["coffee", "viewpoint", "morning"],
        "minrating": 4.0,
        "priceLevel": 2,
        "opennow": true
      }
    }
  ]
}

Make it creative, locally relevant, and perfectly suited for {audience} interested in {interests}.`,

  // Заголовок маршрута - НОВАЯ ЛОГИКА
  TITLE: `Write a short and inspiring title in English for the day's itinerary.
It must include the city name and reflect the chosen interests.
Always follow the creative concept of the day. Maximum one sentence.

City: {city}
Interests: {interests}
Audience: {audience}
Creative concept: {concept}

Example Output:
Paris in Motion: A Day Built for Him

Create the title:`,

Examples:
- Romantic Venice
- Adventures in Barcelona 
- Cultural Paris

Create the title:`,

  // Подзаголовок маршрута - НОВАЯ ЛОГИКА
  SUBTITLE: `Write a long and inspiring subtitle in English for the day's itinerary.
* Mention the date,
* Reflect the city,
* Include the chosen interests and selected locations,
* Describe the rhythm of the day from morning to night,
* Always follow the creative concept of the day. A tone of voice should make the reader want to experience this day immediately.
Length: 3–4 sentences.

City: {city}
Date: {date}
Interests: {interests}
Audience: {audience}
Creative concept: {concept}

Example Output:
On September 10th, Paris is yours to discover — from sunrise runs along the Seine to local markets alive with flavor, from bold art and rooftop skies to the pulse of its legendary nightlife. Every step is planned, every hour alive with energy, and the city carries you through a day made to be unforgettable.

Create the subtitle:`,

  // Погода - НОВАЯ ЛОГИКА
  WEATHER: `Write 2 short sentences in English about the weather in the chosen city and date.
Give a specific suggestion on what to wear to stay comfortable all day.
Keep the tone light, friendly, and aligned with the overall concept of the day.

City: {city}
Date: {date}
Interests: {interests}
Creative concept: {concept}

Example Output:
The September sun will be warm but gentle over Paris, with a cool breeze by the river. Light layers and comfortable shoes will keep you ready for every moment.

Response format in JSON:
{
  "forecast": "Weather description in 2 sentences",
  "clothing": "Specific clothing advice",
  "tips": "Friendly comfort tip"
}

Examples:
- "Sunny day, 22°C, light sea breeze. Perfect weather for city walks."
- "Light jacket and comfortable shoes - you're ready for adventures!"
- "Don't forget sunglasses and sunscreen - the sun in this city is especially bright."

Create the weather description:`,

  // Описание локации - РАСШИРЕННАЯ ВЕРСИЯ
  LOCATION_DESCRIPTION: `Write 4–5 inspiring and detailed sentences in English about each chosen location.
Create a rich, immersive description that captures the essence, atmosphere, history, and unique character of the place.
Describe what makes this location special, what visitors will experience, feel, see, hear, and discover.
Include sensory details, emotional impact, and cultural significance.
Connect the description to the user's interests and the creative concept of the day.
Make it so vivid that the reader can almost be there.

Location: {locationName}
Address: {address}
Category: {category}
User interests: {interests}
Audience: {audience}
Creative concept: {concept}

Example Output:
Your afternoon unfolds at Marché des Enfants Rouges, Paris's oldest covered market, where centuries of culinary tradition come alive in a symphony of colors, aromas, and flavors. The moment you step inside, the bustling energy envelops you — vendors calling out their daily specials, the sizzle of fresh ingredients hitting hot pans, and the cheerful chatter of locals sharing their favorite discoveries. Here, food transcends mere sustenance to become a celebration of cultures from around the world, each stall telling its own story through authentic recipes passed down through generations. The market's historic iron and glass architecture creates a cathedral-like space where natural light filters through, illuminating displays of vibrant produce, artisanal cheeses, and exotic spices that awaken all your senses. This is where Paris reveals one of its most authentic faces — a place where the city's multicultural soul shines brightest, and every bite connects you to the passionate artisans who pour their hearts into their craft.

Create the description:`,

  // Советы по локации - РАСШИРЕННАЯ ВЕРСИЯ
  LOCATION_TIPS: `Write 3–4 detailed, friendly, and practical tips in English for visiting each location.
Include specific advice about timing, what to order/see/do, insider secrets, and how to make the most of the experience.
Make the tips personal, caring, and inspiring — like advice from a knowledgeable local friend.
Include practical details that enhance the visit and connect to the user's interests.
Follow the creative concept of the day and make the user feel expertly guided.

Location: {locationName}
Category: {category}
Interests: {interests}
Audience: {audience}
Creative concept: {concept}

Example Output:
Arrive a little early to find the perfect spot and watch the market come alive with the morning energy — this is when vendors are most passionate about their offerings and happy to share stories. Don't miss trying the Moroccan tagine from the corner stall; the owner, Hassan, has been perfecting his grandmother's recipe for over twenty years and loves explaining the spices to curious visitors. Take your time to wander through each section — the cheese corner offers free tastings if you smile and show genuine interest, and the wine merchant often pairs recommendations with whatever you're planning to eat. Most importantly, bring cash and a sense of adventure; some of the best discoveries here aren't on any menu but emerge from friendly conversations with the artisans who pour their hearts into every creation.

Create the tips:`
};

/**
 * ФУНКЦИЯ ОЧИСТКИ ТЕКСТА
 * Удаляет кавычки из начала и конца текста
 */
function cleanText(text) {
  if (!text) return text;
  return text.replace(/^["']|["']$/g, '').trim();
}

/**
 * ЛОКАЛЬНАЯ ГЕНЕРАЦИЯ ЗАГОЛОВКОВ (следует промптам из PROMPTS)
 */
function generateLocalTitle(city, interests, audience) {
  // Следуем правилам промпта: короткий, вдохновляющий, город + интересы, правильная капитализация
  const interestMap = {
    'swimming': 'Aquatic adventures',
    'zoo': 'Wildlife discoveries', 
    'playground': 'Family fun',
    'adventure': 'Adventures',
    'culture': 'Cultural treasures',
    'food': 'Culinary journey',
    'romantic': 'Romantic escapes',
    'art': 'Artistic discoveries',
    'music': 'Musical journey',
    'nature': 'Nature exploration',
    'history': 'Historical wonders',
    'shopping': 'Shopping adventures',
    'nightlife': 'Night discoveries',
    'relaxation': 'Peaceful retreat',
    'wellness': 'Wellness journey',
    'architecture': 'Architectural marvels',
    'photography': 'Photo adventures',
    'local': 'Local discoveries',
    'sports': 'Active adventures',
    'outdoor': 'Outdoor exploration',
    'indoor': 'Indoor discoveries',
    // Исключаем служебные интересы
    'budget': null,
    'luxury': null,
    'family': null
  };
  
  // Находим первый РЕАЛЬНЫЙ интерес (не служебный)
  let mainInterest = 'exploration';
  if (interests && interests.length > 0) {
    for (const interest of interests) {
      if (interestMap[interest] !== null && interestMap[interest] !== undefined) {
        mainInterest = interest;
        break;
      }
    }
  }
  
  const interestText = interestMap[mainInterest] || 'Amazing discoveries';
  
  // Учитываем аудиторию для более точного заголовка
  const audiencePrefix = {
    'kids': 'Family',
    'couples': 'Romantic',
    'him': 'Epic',
    'her': 'Beautiful'
  };
  
  const prefix = audiencePrefix[audience] || '';
  return prefix ? `${prefix} ${interestText.toLowerCase()} in ${city}` : `${interestText} in ${city}`;
}

function generateLocalSubtitle(city, interests, audience, date) {
  // Следуем правилам промпта: дата + аудитория + интересы + поэтично (3-5 предложений)
  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
  
  const audienceMap = {
    'him': 'for him',
    'her': 'for her', 
    'couples': 'for couples',
    'kids': 'for children'
  };
  
  const audienceText = audienceMap[audience] || 'for you';
  const mainInterest = interests?.[0] || 'exploration';
  
  // Создаем вдохновляющий подзаголовок в стиле трейлера к фильму (3-5 предложений)
  const subtitleTemplates = {
    'swimming': `${formattedDate} ${audienceText} - dive into aquatic adventures in the heart of ${city}. Splash through crystal waters, discover hidden pools, and let the rhythm of the waves guide your perfect day. An unforgettable journey of water and wonder awaits.`,
    'zoo': `${formattedDate} ${audienceText} - embark on a wildlife adventure in ${city}. Meet amazing creatures, discover nature's secrets, and create magical memories with every step. A day where wonder meets wild in the most beautiful way.`,
    'romantic': `${formattedDate} ${audienceText} - fall in love with ${city} all over again. Stroll through enchanting streets, share intimate moments, and let the city's magic weave around you. Romance, passion, and unforgettable memories await.`,
    'culture': `${formattedDate} ${audienceText} - immerse yourself in the cultural heart of ${city}. Discover artistic treasures, explore historic wonders, and let creativity inspire your soul. A journey through time and culture unfolds.`,
    'adventure': `${formattedDate} ${audienceText} - unleash your adventurous spirit in ${city}. Conquer new heights, explore hidden paths, and embrace the thrill of discovery. An epic day of excitement and exploration begins.`,
    'food': `${formattedDate} ${audienceText} - embark on a culinary journey through ${city}. Taste authentic flavors, discover hidden gems, and let local cuisine tell the story of this amazing place. A feast for all your senses awaits.`,
    'art': `${formattedDate} ${audienceText} - immerse yourself in the artistic soul of ${city}. Explore creative spaces, discover inspiring works, and let art awaken your imagination. A day where creativity meets passion unfolds.`,
    'music': `${formattedDate} ${audienceText} - let the rhythm of ${city} guide your steps. Discover musical venues, feel the beat of local culture, and create a soundtrack to your perfect day. Music, passion, and unforgettable moments await.`,
    'nature': `${formattedDate} ${audienceText} - reconnect with nature in the heart of ${city}. Breathe fresh air, discover green oases, and let natural beauty restore your soul. A peaceful escape into nature's embrace awaits.`,
    'history': `${formattedDate} ${audienceText} - journey through the historical layers of ${city}. Walk in the footsteps of legends, uncover ancient secrets, and let the past come alive before your eyes. History, mystery, and wonder await.`,
    'shopping': `${formattedDate} ${audienceText} - discover the shopping treasures of ${city}. Hunt for unique finds, explore local markets, and bring home pieces of this amazing place. A day of discovery and retail therapy begins.`,
    'wellness': `${formattedDate} ${audienceText} - nurture your body and soul in ${city}. Find inner peace, rejuvenate your spirit, and let wellness practices restore your energy. A journey of self-care and renewal awaits.`,
    'architecture': `${formattedDate} ${audienceText} - marvel at the architectural wonders of ${city}. Admire stunning designs, explore iconic buildings, and let architectural beauty inspire your imagination. A visual feast of design and history unfolds.`
  };
  
  return subtitleTemplates[mainInterest] || `${formattedDate} ${audienceText} - discover the magic of ${city}. Experience authentic moments, create lasting memories, and let the city's unique charm captivate your heart. An extraordinary adventure awaits your arrival.`;
}

function generateLocalLocationDescription(locationName, address, category, interests, audience) {
  // Следуем правилам промпта: 2-3 предложения, атмосфера через призму интересов
  const templates = {
    'pool': 'Crystal clear waters await your arrival at this aquatic paradise. The perfect place to splash, play, and create unforgettable water memories.',
    'cafe': 'This cozy corner breathes warmth and local charm. The perfect spot to pause, savor authentic flavors, and watch the city come alive.',
    'restaurant': 'Authentic flavors and welcoming atmosphere define this culinary gem. Every dish tells a story of local traditions and passionate cooking.',
    'museum': 'History and culture come alive within these inspiring walls. Each exhibit opens a window to fascinating stories and timeless discoveries.',
    'park': 'Nature and tranquility create the perfect escape from city life. Fresh air, beautiful views, and peaceful moments await your discovery.',
    'attraction': 'This iconic destination captures the true spirit of the city. A place where memories are made and stories begin to unfold.',
    'zoo': 'Amazing creatures and natural wonders create magical moments for visitors. Every corner reveals new discoveries and brings smiles to faces.',
    'playground': 'Laughter and joy fill this special place designed for fun. The perfect spot where imagination runs wild and friendships are born.',
    'bar': 'Evening atmosphere and crafted drinks create the perfect social setting. A place where conversations flow and the night comes alive.'
  };
  
  return templates[category] || `This remarkable place offers unique experiences that capture the essence of local culture. The perfect addition to your journey through the city.`;
}

function generateLocalLocationTips(locationName, category, interests, audience) {
  // Следуем правилам промпта: 1-2 коротких совета, дружеский тон
  const tips = {
    'pool': 'Arrive early for the best experience - morning hours are especially peaceful and refreshing.',
    'cafe': 'Try the local specialty - it will tell you more about the city than any guidebook.',
    'restaurant': 'Ask for the chef\'s recommendation - locals always know the hidden gems on the menu.',
    'museum': 'Take your time to truly absorb the atmosphere - this place has many stories to tell.',
    'park': 'Bring a camera - the natural beauty here creates perfect moments worth capturing.',
    'attraction': 'Visit during golden hour for the most magical experience and stunning photos.',
    'zoo': 'Check the feeding times - watching animals during meals creates the most memorable moments.',
    'playground': 'Let spontaneity guide you - the best adventures happen when you follow your curiosity.',
    'bar': 'Come at sunset - the atmosphere becomes truly special as the city lights begin to twinkle.'
  };
  
  return tips[category] || 'Take a moment to truly experience this place - it holds special magic for those who pause to notice.';
}

function generateLocalWeather(city, interests, date) {
  // Следуем правилам промпта: 2 предложения о погоде + советы по одежде
  const weatherTemplates = {
    'Moscow': {
      forecast: 'Sunny day with pleasant temperatures around 22°C. Light breeze makes it perfect for outdoor activities.',
      clothing: 'Light jacket and comfortable walking shoes recommended.',
      tips: 'Perfect weather for exploring the city - don\'t forget sunglasses!'
    },
    'Paris': {
      forecast: 'Mild and partly cloudy with temperatures around 18°C. Occasional light breeze from the Seine.',
      clothing: 'Light layers and comfortable shoes for walking on cobblestones.',
      tips: 'Great weather for café terraces and riverside strolls!'
    },
    'Barcelona': {
      forecast: 'Warm and sunny with temperatures reaching 26°C. Mediterranean breeze keeps it comfortable.',
      clothing: 'Light summer clothes and sun protection recommended.',
      tips: 'Perfect beach weather - bring sunscreen and stay hydrated!'
    },
    'Rome': {
      forecast: 'Warm and sunny with temperatures around 24°C. Clear skies perfect for sightseeing.',
      clothing: 'Comfortable walking shoes and light clothing with sun hat.',
      tips: 'Ideal weather for exploring ancient ruins and outdoor dining!'
    },
    'London': {
      forecast: 'Mild with occasional clouds and temperatures around 16°C. Typical pleasant London weather.',
      clothing: 'Light jacket and umbrella just in case - layers are your friend.',
      tips: 'Perfect weather for pub visits and park walks!'
    }
  };
  
  const defaultWeather = {
    forecast: `Pleasant weather with comfortable temperatures. Perfect conditions for exploring ${city}.`,
    clothing: 'Comfortable walking shoes and light layers recommended.',
    tips: 'Great weather for outdoor activities and city exploration!'
  };
  
  return weatherTemplates[city] || defaultWeather;
}

/**
 * FALLBACK ДАННЫЕ
 * Используются когда API недоступен
 */
const FALLBACK_DATA = {
  titles: {
    'local': 'Local',
    'adventure': 'Adventure', 
    'cultural': 'Cultural',
    'romantic': 'Romantic',
    'seasonal': 'Seasonal',
    'festivals': 'Festival',
    'music': 'Music'
  },
  
  subtitles: {
    'her': 'September 19th for her - a day where luxury meets local traditions, warm rituals for the body and architectural inspiration. Everything is already collected in a single route so you can simply go step by step and enjoy.',
    'him': 'September 19th for him - an adventure through the heart of the city, where every corner reveals new discoveries and local secrets.',
    'couple': 'September 19th for couples - a romantic journey through the city, where love meets culture and every moment becomes a memory.',
    'couples': 'September 19th for couples - a romantic journey through the city, where love meets culture and every moment becomes a memory.',
    'kids': 'September 19th for kids - a fun-filled day of adventure and discovery, where learning meets play in the most exciting way.'
  },
  
  weather: {
    forecast: "Sunny day with pleasant temperatures. Perfect weather for exploring the city.",
    clothing: "Light clothing and comfortable walking shoes recommended",
    tips: "Don't forget your camera - {city} looks amazing in this weather!"
  },
  
  locationDescriptions: {
    cafe: "Your day begins in the legendary {locationName}. This is not just a cafe, but a cultural symbol of the city: where morning light dances on ancient walls, creating an atmosphere that makes your heart beat faster. Every corner tells its own story, and locals are happy to share the secrets of this special place.",
    restaurant: "Wonderful {locationName} offers more than just authentic cuisine - it's a journey through the city's soul. The hospitable atmosphere transforms every meal into an event, where flavors tell stories and each dish becomes a memory. The creative energy and inspiration reign here, making you want to return again and again.",
    park: "Beautiful {locationName} is the perfect sanctuary where nature meets city life in the most magical way. This is not just a place for walks and relaxation, but a living canvas where every season paints its own masterpiece. The atmosphere here breathes tranquility and invites you to slow down and truly feel the rhythm of the city.",
    attraction: "Iconic {locationName} is more than just a landmark - it's the beating heart of the city's story. Every stone, every detail whispers tales of the past while creating unforgettable impressions for the future. The atmosphere here is electric with history and possibility, making you feel part of something truly extraordinary.",
    museum: "Fascinating {locationName} opens not just the world of art and culture, but a window into the human soul. This is where every exhibit tells its own story, where creativity meets inspiration, and where you can lose yourself in the beauty of human expression. The atmosphere here is charged with wonder and discovery.",
    bar: "Atmospheric {locationName} offers more than great drinks - it's the perfect finale to your day's adventure. The fun atmosphere here is infectious, where laughter flows as freely as the drinks, and every moment becomes a celebration. This is where memories are made and stories are born under the warm glow of evening lights."
  },
  
  locationTips: {
    cafe: "Come a little earlier to enjoy the atmosphere without rush. Take your time to savor the morning light and let the city's rhythm wash over you.",
    restaurant: "Reserve your table in advance, especially for evening - this place deserves to be savored slowly. Let each dish tell its story without hurry.",
    park: "Bring comfortable shoes and a light heart - this place is perfect for beautiful photos and even more beautiful memories. Let nature guide your steps.",
    attraction: "Check the opening hours and consider arriving when the light is most magical - this place deserves to be seen in its full glory. Take a moment to feel the history.",
    museum: "Allow yourself enough time to truly absorb each exhibition - this is not a race, but a journey through human creativity. Let the art speak to your soul.",
    bar: "Try the local drinks and let the evening atmosphere work its magic. This is where the day's adventures become tomorrow's stories - savor every moment."
  }
};

/**
 * ОСНОВНЫЕ ФУНКЦИИ ГЕНЕРАЦИИ
 */

/**
 * Генерирует заголовок маршрута
 */
async function generateTitle(city, interests, audience, concept) {
  console.log('🤖 Генерируем заголовок для:', { city, interests, audience, concept });
  console.log('🔑 API ключ доступен:', isApiKeyValid());

  // ВСЕГДА используем OpenAI API (fallback убран по требованию)
  if (!isApiKeyValid()) {
    throw new Error('OpenAI API key is required and must be active');
  }

  try {
    const prompt = PROMPTS.TITLE
      .replace('{city}', city || 'Unknown City')
      .replace('{interests}', Array.isArray(interests) ? interests.join(', ') : (interests || 'exploration'))
      .replace('{audience}', audience || 'traveler')
      .replace('{concept}', concept || 'exploration');

    console.log('📝 Отправляем промпт в OpenAI:', prompt.substring(0, 100) + '...');

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.8
    });

    const result = cleanText(response.choices[0].message.content);
    console.log('✅ OpenAI заголовок получен:', result);
    return result;
  } catch (error) {
    console.error('❌ Критическая ошибка OpenAI:', error.message);
    throw new Error(`Failed to generate title via OpenAI: ${error.message}`);
  }
}

/**
 * Генерирует подзаголовок маршрута
 */
async function generateSubtitle(city, interests, audience, date, concept) {
  console.log('🤖 Генерируем подзаголовок для:', { city, interests, audience, date, concept });
  console.log('🔑 API ключ доступен:', isApiKeyValid());

  // ВСЕГДА используем OpenAI API (fallback убран по требованию)
  if (!isApiKeyValid()) {
    throw new Error('OpenAI API key is required and must be active');
  }

  try {
    const prompt = PROMPTS.SUBTITLE
      .replace('{city}', city || 'Unknown City')
      .replace('{interests}', Array.isArray(interests) ? interests.join(', ') : (interests || 'exploration'))
      .replace('{audience}', Array.isArray(audience) ? audience.join(', ') : (audience || 'traveler'))
      .replace('{date}', date || 'today')
      .replace('{concept}', concept || 'exploration');

    console.log('📝 Отправляем промпт подзаголовка в OpenAI:', prompt.substring(0, 100) + '...');

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.8
    });

    const result = cleanText(response.choices[0].message.content);
    console.log('✅ OpenAI подзаголовок получен:', result);
    return result;
  } catch (error) {
    console.error('❌ Критическая ошибка OpenAI подзаголовка:', error.message);
    throw new Error(`Failed to generate subtitle via OpenAI: ${error.message}`);
  }
}

/**
 * Генерирует информацию о погоде
 */
async function generateWeather(city, interests, date, concept) {
  console.log('🤖 Генерируем погоду для:', { city, interests, date, concept });

  // Если API ключ недоступен, используем локальную генерацию
  // ВСЕГДА используем OpenAI API (fallback убран по требованию)
  if (!isApiKeyValid()) {
    throw new Error('OpenAI API key is required and must be active');
  }

  try {
    const prompt = PROMPTS.WEATHER
      .replace('{city}', city || 'Unknown City')
      .replace('{interests}', Array.isArray(interests) ? interests.join(', ') : (interests || 'exploration'))
      .replace('{date}', date || 'today')
      .replace('{concept}', concept || 'exploration');

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.7
    });

    const content = cleanText(response.choices[0].message.content);
    
    try {
      const result = JSON.parse(content);
      console.log('✅ OpenAI погода получена (JSON):', result);
      return result;
    } catch (parseError) {
      console.log('Weather response not in JSON format, parsing as text');
      return {
        forecast: content,
        clothing: "Comfortable clothing recommended",
        tips: "Perfect weather for exploring!"
      };
    }
  } catch (error) {
    console.error('❌ Критическая ошибка OpenAI погоды:', error.message);
    throw new Error(`Failed to generate weather via OpenAI: ${error.message}`);
  }
}

/**
 * Генерирует описание локации
 */
async function generateLocationDescription(locationName, address, category, interests, audience, concept) {
  console.log('🤖 Генерируем описание локации для:', { locationName, category, interests, audience, concept });

  // ВСЕГДА используем OpenAI API (fallback убран по требованию)
  if (!isApiKeyValid()) {
    throw new Error('OpenAI API key is required and must be active');
  }

  try {
    const prompt = PROMPTS.LOCATION_DESCRIPTION
      .replace('{locationName}', locationName)
      .replace('{address}', address)
      .replace('{category}', category)
      .replace('{interests}', Array.isArray(interests) ? interests.join(', ') : interests)
      .replace('{audience}', audience)
      .replace('{concept}', concept || 'exploration');

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.8
    });

    const result = cleanText(response.choices[0].message.content);
    console.log('✅ OpenAI описание получено:', result.substring(0, 50) + '...');
    return result;
  } catch (error) {
    console.error('❌ Критическая ошибка OpenAI описания:', error.message);
    throw new Error(`Failed to generate location description via OpenAI: ${error.message}`);
  }
}

/**
 * Генерирует советы по локации
 */
async function generateLocationTips(locationName, category, interests, audience, concept) {
  console.log('🤖 Генерируем советы для локации:', { locationName, category, interests, audience, concept });

  // ВСЕГДА используем OpenAI API (fallback убран по требованию)
  if (!isApiKeyValid()) {
    throw new Error('OpenAI API key is required and must be active');
  }

  try {
    const prompt = PROMPTS.LOCATION_TIPS
      .replace('{locationName}', locationName)
      .replace('{category}', category)
      .replace('{interests}', Array.isArray(interests) ? interests.join(', ') : interests)
      .replace('{audience}', audience)
      .replace('{concept}', concept || 'exploration');

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 250,
      temperature: 0.8
    });

    const result = cleanText(response.choices[0].message.content);
    console.log('✅ OpenAI советы получены:', result.substring(0, 50) + '...');
    return result;
  } catch (error) {
    console.error('❌ Критическая ошибка OpenAI советов:', error.message);
    throw new Error(`Failed to generate location tips via OpenAI: ${error.message}`);
  }
}

/**
 * ГЕНЕРАЦИЯ КОНЦЕПТУАЛЬНОГО ПЛАНА
 */
async function generateConceptualPlan(city, audience, interests, budget, date) {
  if (!isApiKeyValid()) {
    console.log('⚠️ OpenAI API key not available, using fallback conceptual plan');
    throw new Error('OpenAI API key required for conceptual planning');
  }

  try {
    console.log('🎨 Генерируем концептуальный план для:', { city, audience, interests, budget, date });
    console.log('🔑 API ключ доступен:', isApiKeyValid());

    // Определяем сезон
    const month = new Date(date).getMonth() + 1;
    let season = 'spring';
    if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'autumn';
    else if (month >= 12 || month <= 2) season = 'winter';

    const prompt = PROMPTS.CONCEPTUAL_PLAN
      .replace(/{city}/g, city)
      .replace(/{audience}/g, audience)
      .replace(/{interests}/g, Array.isArray(interests) ? interests.join(', ') : interests)
      .replace(/{budget}/g, budget)
      .replace(/{date}/g, date)
      .replace(/{season}/g, season);

    console.log('📝 Отправляем промпт концептуального плана в OpenAI...');

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.7
    });

    const result = response.choices[0].message.content.trim();
    
    // Очищаем от markdown если есть
    const cleanResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    console.log('✅ OpenAI концептуальный план получен');
    return cleanResult;
    
  } catch (error) {
    console.error('❌ Критическая ошибка OpenAI концептуального плана:', error.message);
    throw new Error(`Failed to generate conceptual plan via OpenAI: ${error.message}`);
  }
}

/**
 * УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ДЛЯ ГЕНЕРАЦИИ ТЕКСТА
 */
async function generateText(prompt, type = 'general') {
  if (!isApiKeyValid()) {
    throw new Error('OpenAI API key required');
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: type === 'conceptual_plan' ? 1500 : 200,
      temperature: 0.7
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`❌ OpenAI error (${type}):`, error.message);
    throw error;
  }
}

/**
 * FALLBACK ФУНКЦИИ
 */

function getFallbackTitle(city, interests, audience) {
  const interest = FALLBACK_DATA.titles[interests?.[0]] || interests?.[0] || 'exploration';
  return `${interest} ${city}`;
}

function getFallbackSubtitle(city, interests, audience, date) {
  const audienceText = FALLBACK_DATA.subtitles[audience] || audience;
  return audienceText;
}

function getFallbackWeather(city) {
  return {
    forecast: FALLBACK_DATA.weather.forecast,
    clothing: FALLBACK_DATA.weather.clothing,
    tips: FALLBACK_DATA.weather.tips.replace('{city}', city)
  };
}

function getFallbackLocationDescription(locationName, category) {
  const template = FALLBACK_DATA.locationDescriptions[category] || FALLBACK_DATA.locationDescriptions.cafe;
  return template.replace('{locationName}', locationName);
}

function getFallbackLocationTips(category) {
  return FALLBACK_DATA.locationTips[category] || "Enjoy visiting this wonderful place!";
}

/**
 * ЭКСПОРТ ФУНКЦИЙ
 */
module.exports = {
  generateTitle,
  generateSubtitle,
  generateWeather,
  generateLocationDescription,
  generateLocationTips,
  generateConceptualPlan,
  generateText,
  
  // Для отладки
  isApiKeyValid,
  FALLBACK_DATA
};

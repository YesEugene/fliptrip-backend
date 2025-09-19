const OpenAI = require('openai');
const PlacesService = require('./placesService');

class ItineraryGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'mock-key-for-development'
    });
    this.placesService = new PlacesService();
  }

  // English prompts for titles and subtitles
  generatePreviewPrompt(city, audience, interests, date, budget) {
    return `Create a bright emotional title for a day plan. Include the city and general vibe based on user interests. The tone should depend on the audience filter ("for him", "for her", "for couples", "for kids") and interests. Example, if person chose interest "cycling": "Any day is beautiful if it's a day in Moscow and on a bicycle".

CITY: ${city}
AUDIENCE: ${audience}
INTERESTS: ${interests.join(', ')}
DATE: ${date}
BUDGET: ${budget}€

The title should be bright, emotional, reflect the city and vibe based on interests.

Then create an emotional subtitle to the day plan that will complement the title. The subtitle should be bright and emotional description of the planned day based on the filter parameters. The subtitle should consist of two sentences and consider the selected date of the planned city walk, interests, and a call to action. In total, the subtitle should be small, lyrical and inspiring for a long and memorable walk through the selected city. Example: "On September 10th you will spend a day where Moscow's traditional luxury, warm body rituals and architectural inspiration combine. Everything is already gathered in a single route so you can simply go step by step and get pleasure."

Output the result in JSON format:
{
  "title": "Your title here",
  "subtitle": "Your emotional subtitle here"
}`;
  }

  // English prompt for generating full day plan
  generateItineraryPrompt(city, audience, interests, date, budget, places, previewData) {
    return `Create a detailed day plan for ${city}.

AUDIENCE: ${audience}
INTERESTS: ${interests.join(', ')}
DATE: ${date}
BUDGET: ${budget}€

AVAILABLE PLACES:
${places.map(place => `- ${place.name} (${place.address}) - Rating: ${place.rating}/5, Price: ${place.price_level}/4`).join('\n')}

IMPORTANT: Use exactly the same title and subtitle as in preview:
- Title: "${previewData.title}"
- Subtitle: "${previewData.subtitle}"

Create a realistic detailed plan with 8-10 time blocks from 08:00 to 22:30.

For each block use these prompts:

1. Start time (block title):
Create a short emotional caption for the start of a block with location: time + bright step name. Example: "09:00 — Immersion in Traditions", "10:30 — New Breath".

2. Location description:
Write a location description in 2-3 paragraphs. Explain what this place is, what makes it unique, what the person will feel. Mention atmosphere, interior details, emotions. Example: "Your day will begin in legendary Moscow baths. This is not just a spa, but a cultural symbol of the city: mosaics, arches, the 'fountain' hall and steam that removes everything unnecessary."

3. Tip:
Give a short tip for visiting this location. Format should be friendly and caring. Example: "Tips: come a bit earlier to enjoy the atmosphere without rush. Bring a light towel."

4. Weather block:
Describe the weather forecast for the selected date in the selected city and give simple clothing advice. Use light and caring tone. Example: "Light coolness in the morning, soft warmth in the afternoon. Take a light jacket for walks."

Consider:
- Logical route optimization (minimize travel time)
- Meal times and restaurant recommendations
- Weather-appropriate activities
- Local customs and opening hours
- Specific interests and audience
- Budget constraints

Output the result in JSON format with this exact structure:
{
  "city": "${city}",
  "date": "${date}",
  "meta": {
    "creative_title": "${previewData.title}",
    "creative_subtitle": "${previewData.subtitle}",
    "weather": {
      "t_min": 15,
      "t_max": 25,
      "precip_prob": 20,
      "description": "Weather description and clothing recommendations"
    },
    "clothing_advice": "Clothing recommendations"
  },
  "daily_plan": [{
    "blocks": [
      {
        "time": "08:00",
        "items": [{
          "title": "Activity name",
          "why": "Why this activity is perfect for this person",
          "address": "Exact address",
          "approx_cost": "8-12€",
          "tips": "Practical tips and insider knowledge",
          "duration": "45 minutes"
        }]
      }
    ]
  }]
}`;
  }

  async generatePreview(city, audience, interests, date, budget) {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key-for-development') {
      return this.getMockPreview(city, audience, interests);
    }

    try {
      const prompt = this.generatePreviewPrompt(city, audience, interests, date, budget);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 200,
      });

      const responseContent = completion.choices[0].message.content;
      return JSON.parse(responseContent);
    } catch (error) {
      console.error('Error generating preview:', error);
      return this.getMockPreview(city, audience, interests);
    }
  }

  async generateItinerary(city, audience, interests, date, budget, previewData = null) {
    try {
      // Получаем реальные места из Google Places
      const places = await this.getPlacesForItinerary(city, interests);
      
      // Если нет данных превью, генерируем их
      if (!previewData) {
        previewData = await this.generatePreview(city, audience, interests, date, budget);
      }
      
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key-for-development') {
        return this.getMockItinerary(city, audience, interests, date, places, previewData);
      }

      const prompt = this.generateItineraryPrompt(city, audience, interests, date, budget, places, previewData);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const responseContent = completion.choices[0].message.content;
      return JSON.parse(responseContent);
    } catch (error) {
      console.error('Error generating itinerary:', error);
      return this.getMockItinerary(city, audience, interests, date, [], previewData);
    }
  }

  async getPlacesForItinerary(city, interests) {
    const categories = ['restaurant', 'cafe', 'museum', 'park', 'attraction', 'bar', 'shopping'];
    const allPlaces = [];

    for (const category of categories) {
      const places = await this.placesService.searchPlaces(city, category, interests);
      allPlaces.push(...places);
    }

    // Убираем дубликаты и возвращаем топ-15 мест
    const uniquePlaces = allPlaces.filter((place, index, self) => 
      index === self.findIndex(p => p.name === place.name)
    );

    return uniquePlaces.slice(0, 15);
  }

  getMockPreview(city, audience, interests) {
    const titles = {
      'Paris': {
        'him': 'Day of Parisian Gentleman',
        'her': 'Romantic Dreams in Paris',
        'couples': 'Love in the City of Light',
        'kids': 'Magical Adventure in Paris'
      },
      'Barcelona': {
        'him': 'Living Soul of Barcelona',
        'her': 'Catalan Charm and Culture',
        'couples': 'Passion in Barcelona',
        'kids': 'Family Adventure in Barcelona'
      },
      'Moscow': {
        'him': 'Day of Care and Beauty in Moscow',
        'her': 'Elegant Moscow Experience',
        'couples': 'Romantic Journey Through Moscow',
        'kids': 'Fun Moscow Discovery'
      }
    };

    const title = titles[city]?.[audience] || `Perfect Day in ${city}`;
    
    // Create dynamic subtitle based on date and interests
    const date = new Date();
    const dayName = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    
    let subtitle;
    if (interests.includes('Romantic')) {
      subtitle = `On ${dayName} you will spend a day where romance meets adventure in every corner of ${city}. Everything is carefully arranged in a single route so you can simply walk step by step and feel the magic.`;
    } else if (interests.includes('Thrill Seeker')) {
      subtitle = `On ${dayName} you will experience ${city} like never before, with exciting adventures and thrilling discoveries at every turn. Every moment is crafted to give you an unforgettable adrenaline rush.`;
    } else {
      subtitle = `On ${dayName} you will discover the heart of ${city} through a personalized journey that combines culture, adventure and local charm. Every step is designed to create lasting memories.`;
    }

    return { title, subtitle };
  }

  getMockItinerary(city, audience, interests, date, places, previewData = null) {
    // Если нет данных превью, генерируем их
    if (!previewData) {
      previewData = this.getMockPreview(city, audience, interests);
    }
    
    return {
      city,
      date,
      meta: {
        creative_title: previewData.title,
        creative_subtitle: previewData.subtitle,
        weather: { 
          t_min: 15, 
          t_max: 25, 
          precip_prob: 20,
          description: 'Light coolness in the morning, soft warmth in the afternoon. Take a light jacket for walks.'
        },
        clothing_advice: 'Comfortable walking shoes and layered clothing'
      },
      daily_plan: [{
        blocks: [
          {
            time: '08:00 — Immersion in Traditions',
            items: [{
              title: places.find(p => p.category === 'cafe')?.name || 'Morning Coffee and Breakfast',
              why: 'Your day will begin in a cozy local cafe serving traditional morning dishes. This is the perfect place to feel the rhythm of the city and recharge for the whole day.',
              address: places.find(p => p.category === 'cafe')?.address || 'No specific address available',
              approx_cost: '8-12€',
              tips: 'Tips: try local pastries and coffee. Come a bit earlier to enjoy the atmosphere without rush.',
              duration: '45 minutes',
              photo: places.find(p => p.category === 'cafe')?.photo || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop'
            }]
          },
          {
            time: '09:00 — New Breath',
            items: [{
              title: places.find(p => p.category === 'attraction')?.name || 'Walking Tour of Historic Center',
              why: 'Head out for a walk through the heart of the city, where every street tells its own story. This is not just a tour, but an immersion into the atmosphere of a place where past meets present.',
              address: places.find(p => p.category === 'attraction')?.address || 'No specific address available',
              approx_cost: '15-20€',
              tips: 'Tips: wear comfortable shoes, bring a camera. Stop at every interesting building — amazing details are hidden there.',
              duration: '2 hours',
              photo: places.find(p => p.category === 'attraction')?.photo || 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800&h=600&fit=crop'
            }]
          },
          {
            time: '11:30 — Cultural Discovery',
            items: [{
              title: places.find(p => p.category === 'museum')?.name || 'Local Museum Visit',
              why: 'Dive deeper into the city\'s culture and art. This museum offers a unique perspective on local history and contemporary expression.',
              address: places.find(p => p.category === 'museum')?.address || 'No specific address available',
              approx_cost: '12-15€',
              tips: 'Tips: check for student discounts, audio guide recommended. Don\'t miss the special exhibitions.',
              duration: '1.5 hours',
              photo: places.find(p => p.category === 'museum')?.photo || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'
            }]
          },
          {
            time: '13:00 — Culinary Journey',
            items: [{
              title: places.find(p => p.category === 'restaurant')?.name || 'Traditional Lunch',
              why: 'Experience authentic local cuisine in a place where traditional recipes meet modern presentation. This restaurant is known for its fresh ingredients and passionate chefs.',
              address: places.find(p => p.category === 'restaurant')?.address || places.find(p => p.category === 'cafe')?.address || 'No specific address available',
              approx_cost: '25-35€',
              tips: 'Tips: try the house specialty, book ahead for popular places. Ask about daily specials.',
              duration: '1 hour',
              photo: places.find(p => p.category === 'restaurant')?.photo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'
            }]
          },
          {
            time: '14:30 — Local Exploration',
            items: [{
              title: places.find(p => p.category === 'shopping')?.name || 'Afternoon Stroll & Shopping',
              why: 'Relax and pick up souvenirs while exploring the local shopping scene. This area offers a perfect mix of traditional crafts and modern boutiques.',
              address: places.find(p => p.category === 'shopping')?.address || places.find(p => p.name.includes('Shopping'))?.address || 'No specific address available',
              approx_cost: '20-50€',
              tips: 'Tips: bargain at local markets, check opening hours. Look for unique handmade items.',
              duration: '1.5 hours',
              photo: places.find(p => p.category === 'shopping')?.photo || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'
            }]
          },
          {
            time: '16:00 — Scenic Views',
            items: [{
              title: places.find(p => p.category === 'park')?.name || 'Scenic Viewpoint',
              why: 'Capture the best city views and photos from this elevated location. The panoramic views here are simply breathtaking and perfect for memorable photos.',
              address: places.find(p => p.category === 'park')?.address || 'No specific address available',
              approx_cost: 'Free',
              tips: 'Tips: best light in late afternoon, bring water. Perfect spot for sunset photos.',
              duration: '45 minutes',
              photo: places.find(p => p.category === 'park')?.photo || 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800&h=600&fit=crop'
            }]
          },
          {
            time: '17:00 — Relaxation Time',
            items: [{
              title: places.find(p => p.category === 'park')?.name || 'Local Park & Relaxation',
              why: 'Unwind and enjoy the local atmosphere in this beautiful park. It\'s a perfect place to rest, people-watch, and soak in the city\'s energy.',
              address: places.find(p => p.category === 'park')?.address || 'No specific address available',
              approx_cost: 'Free',
              tips: 'Tips: perfect for people watching, bring a book. Great spot to rest your feet.',
              duration: '1 hour',
              photo: places.find(p => p.category === 'park')?.photo || 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800&h=600&fit=crop'
            }]
          },
          {
            time: '18:30 — Evening Social',
            items: [{
              title: places.find(p => p.category === 'bar')?.name || 'Evening Drinks & Tapas',
              why: 'Experience the local nightlife and social scene in this trendy bar. It\'s the perfect place to unwind with locals and enjoy the city\'s vibrant evening atmosphere.',
              address: places.find(p => p.category === 'bar')?.address || 'No specific address available',
              approx_cost: '20-30€',
              tips: 'Tips: book table for sunset views, try local wines. Great for meeting locals.',
              duration: '1.5 hours',
              photo: places.find(p => p.category === 'bar')?.photo || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop'
            }]
          },
          {
            time: '20:30 — Memorable Dinner',
            items: [{
              title: places.find(p => p.category === 'restaurant')?.name || 'Dinner at Local Favorite',
              why: 'End the day with a memorable dining experience in this beloved local restaurant. Known for its warm atmosphere and exceptional cuisine, it\'s the perfect way to conclude your day.',
              address: places.find(p => p.category === 'restaurant')?.address || 'No specific address available',
              approx_cost: '40-60€',
              tips: 'Tips: reservation recommended, try the chef\'s special. Perfect for romantic dinners.',
              duration: '2 hours',
              photo: places.find(p => p.category === 'restaurant')?.photo || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'
            }]
          },
          {
            time: '22:30 — Evening Stroll',
            items: [{
              title: places.find(p => p.category === 'attraction')?.name || 'Evening Stroll & Night Views',
              why: 'See the city lights and end on a romantic note with a leisurely walk. This peaceful promenade offers beautiful night views and a perfect way to wind down.',
              address: places.find(p => p.category === 'attraction')?.address || 'No specific address available',
              approx_cost: 'Free',
              tips: 'Tips: perfect for couples, bring a light jacket. Great for reflection and conversation.',
              duration: '30 minutes',
              photo: places.find(p => p.category === 'attraction')?.photo || 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800&h=600&fit=crop'
            }]
          }
        ]
      }]
    };
  }
}

module.exports = ItineraryGenerator;

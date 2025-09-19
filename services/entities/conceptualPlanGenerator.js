const { generateText } = require('../textGenerator');

/**
 * Генератор концептуальных планов дня через OpenAI
 * Создает умный план на основе города, интересов и аудитории
 */
class ConceptualPlanGenerator {
  constructor() {
    this.cityKnowledge = {
      'Paris': {
        specialties: ['romantic Seine walks', 'art galleries', 'café culture', 'historic architecture'],
        seasonal: {
          'spring': ['outdoor markets', 'park picnics'],
          'summer': ['rooftop bars', 'outdoor dining'],
          'autumn': ['cozy cafés', 'indoor museums'],
          'winter': ['Christmas markets', 'warm bistros']
        }
      },
      'Barcelona': {
        specialties: ['Gaudí architecture', 'tapas culture', 'beach activities', 'modernist design'],
        seasonal: {
          'spring': ['beach walks', 'outdoor terraces'],
          'summer': ['beach clubs', 'late night dining'],
          'autumn': ['cultural tours', 'wine bars'],
          'winter': ['indoor markets', 'thermal baths']
        }
      },
      'Lisbon': {
        specialties: ['tram rides', 'fado music', 'pastéis de nata', 'ocean views', 'historic districts'],
        seasonal: {
          'spring': ['coastal walks', 'outdoor festivals'],
          'summer': ['beach trips', 'rooftop dining'],
          'autumn': ['cultural experiences', 'wine tasting'],
          'winter': ['cozy tavernas', 'indoor attractions']
        }
      },
      'Rome': {
        specialties: ['ancient history', 'Italian cuisine', 'Vatican art', 'piazza culture'],
        seasonal: {
          'spring': ['outdoor dining', 'walking tours'],
          'summer': ['early morning visits', 'gelato stops'],
          'autumn': ['harvest experiences', 'wine bars'],
          'winter': ['indoor museums', 'warm trattorias']
        }
      },
      'London': {
        specialties: ['pub culture', 'royal history', 'theater scene', 'markets'],
        seasonal: {
          'spring': ['park visits', 'outdoor markets'],
          'summer': ['Thames walks', 'pub gardens'],
          'autumn': ['cozy pubs', 'indoor attractions'],
          'winter': ['Christmas markets', 'warm cafés']
        }
      },
      'Moscow': {
        specialties: ['Red Square', 'ballet culture', 'vodka tasting', 'Orthodox architecture'],
        seasonal: {
          'spring': ['park walks', 'outdoor cafés'],
          'summer': ['river cruises', 'outdoor dining'],
          'autumn': ['cultural venues', 'warm restaurants'],
          'winter': ['indoor attractions', 'traditional banya']
        }
      }
    };
  }

  /**
   * Генерирует концептуальный план дня
   */
  async generateConceptualPlan(filterParams) {
    try {
      console.log('🎨 Generating conceptual plan via OpenAI...');
      
      const prompt = this.buildConceptualPrompt(filterParams);
      const response = await generateText(prompt, 'conceptual_plan');
      
      // Парсим JSON ответ от OpenAI
      const conceptualPlan = JSON.parse(response);
      
      console.log('✅ Conceptual plan generated:', {
        concept: conceptualPlan.concept,
        slotsCount: conceptualPlan.timeSlots?.length
      });
      
      return conceptualPlan;
      
    } catch (error) {
      console.error('❌ Conceptual plan generation failed:', error.message);
      
      // Fallback к базовому плану
      return this.generateFallbackPlan(filterParams);
    }
  }

  /**
   * Строит промпт для генерации концептуального плана
   */
  buildConceptualPrompt(filterParams) {
    const cityInfo = this.cityKnowledge[filterParams.city] || {};
    const season = this.getSeason(filterParams.date);
    const seasonalActivities = cityInfo.seasonal?.[season] || [];
    
    return `Create a conceptual day plan for ${filterParams.city}.

CONTEXT:
- City: ${filterParams.city}
- Audience: ${filterParams.audience}
- Interests: ${filterParams.interests.join(', ')}
- Budget: ${filterParams.budget}€
- Date: ${filterParams.date} (${season})
- Season activities: ${seasonalActivities.join(', ')}
- City specialties: ${cityInfo.specialties?.join(', ') || 'local culture'}

REQUIREMENTS:
1. Create 8-9 time slots from 09:00 to 21:00
2. Consider city-specific activities and local culture
3. Match activities to interests and audience
4. Ensure logical flow and energy levels throughout the day
5. Include meal times at appropriate hours
6. Consider budget constraints
7. Add seasonal relevance

RESPONSE FORMAT (JSON only):
{
  "concept": "Brief description of the day's theme/concept",
  "timeSlots": [
    {
      "time": "09:00",
      "activity": "Energizing breakfast with local specialties",
      "category": "cafe",
      "description": "Start with traditional local breakfast to fuel the day",
      "keywords": ["breakfast", "local", "energy", "traditional"],
      "energyLevel": "medium",
      "priority": "essential"
    },
    {
      "time": "10:30",
      "activity": "Cultural morning discovery",
      "category": "attraction",
      "description": "Explore the city's main cultural attraction",
      "keywords": ["culture", "history", "iconic", "morning"],
      "energyLevel": "high",
      "priority": "high"
    }
  ]
}

Make it creative, locally relevant, and perfectly suited for ${filterParams.audience} interested in ${filterParams.interests.join(' and ')}.`;
  }

  /**
   * Определяет сезон по дате
   */
  getSeason(dateString) {
    const month = new Date(dateString).getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  /**
   * Fallback план если OpenAI не работает
   */
  generateFallbackPlan(filterParams) {
    console.log('🔄 Using fallback conceptual plan');
    
    const baseSlots = [
      {
        time: "09:00",
        activity: `Morning coffee in ${filterParams.city}`,
        category: "cafe",
        description: "Start the day with local coffee culture",
        keywords: ["coffee", "morning", "local", "energy"],
        energyLevel: "medium",
        priority: "essential"
      },
      {
        time: "10:30",
        activity: `Discover ${filterParams.interests[0]} attractions`,
        category: "attraction",
        description: `Explore ${filterParams.city}'s ${filterParams.interests[0]} scene`,
        keywords: [filterParams.interests[0], "culture", "discovery"],
        energyLevel: "high",
        priority: "high"
      },
      {
        time: "12:00",
        activity: "Cultural exploration",
        category: "attraction",
        description: "Dive deeper into local culture",
        keywords: ["culture", "local", "authentic"],
        energyLevel: "medium",
        priority: "medium"
      },
      {
        time: "13:30",
        activity: "Traditional lunch",
        category: "restaurant",
        description: "Experience authentic local cuisine",
        keywords: ["lunch", "traditional", "cuisine", "local"],
        energyLevel: "low",
        priority: "essential"
      },
      {
        time: "15:00",
        activity: `Afternoon ${filterParams.interests[0]} experience`,
        category: "attraction",
        description: "Continue exploring your interests",
        keywords: [filterParams.interests[0], "afternoon", "experience"],
        energyLevel: "medium",
        priority: "high"
      },
      {
        time: "16:30",
        activity: "Scenic discovery",
        category: "attraction",
        description: "Find the best views and photo spots",
        keywords: ["scenic", "views", "photography", "memorable"],
        energyLevel: "medium",
        priority: "medium"
      },
      {
        time: "18:00",
        activity: "Relaxing coffee break",
        category: "cafe",
        description: "Recharge with afternoon refreshments",
        keywords: ["coffee", "relax", "recharge", "afternoon"],
        energyLevel: "low",
        priority: "medium"
      },
      {
        time: "19:30",
        activity: "Dinner experience",
        category: "restaurant",
        description: "End the day with memorable dining",
        keywords: ["dinner", "memorable", "cuisine", "evening"],
        energyLevel: "medium",
        priority: "essential"
      }
    ];

    return {
      concept: `A perfect day in ${filterParams.city} combining ${filterParams.interests.join(' and ')} for ${filterParams.audience}`,
      timeSlots: baseSlots
    };
  }
}

module.exports = ConceptualPlanGenerator;

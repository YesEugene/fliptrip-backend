/**
 * Itinerary Builder Entity
 * Собирает все данные в итоговый маршрут
 * НЕ ТРОГАТЬ если работает корректно!
 */

const TitleGenerator = require('./titleGenerator');
const LocationsDatabase = require('./locationsDatabase');
const BudgetCalculator = require('./budgetCalculator');
const ItineraryRules = require('../rules/itineraryRules');
const { generateWeather, generateLocationDescription, generateLocationTips } = require('../textGenerator');

class ItineraryBuilder {
  constructor() {
    this.titleGenerator = new TitleGenerator();
    this.locationsDatabase = new LocationsDatabase();
    this.budgetCalculator = new BudgetCalculator();
    this.itineraryRules = new ItineraryRules();
  }

  /**
   * Получает рекомендации от файла с правилами
   * @param {Object} filterParams - Параметры фильтра
   * @returns {Array} - Рекомендации по составлению маршрута
   */
  getItineraryRecommendations(filterParams) {
    console.log('📋 Получаем рекомендации от файла с правилами...');
    const recommendations = this.itineraryRules.getItineraryRecommendations(filterParams);
    console.log('✅ Получены рекомендации:', recommendations.length);
    return recommendations;
  }

  /**
   * Создает временные слоты на основе интересов и аудитории
   * УНИВЕРСАЛЬНАЯ ФУНКЦИЯ для ЛЮБЫХ комбинаций фильтров
   */
  createTimeSlotsForInterests(interests, audience) {
    console.log('⏰ Создаем слоты для ЛЮБОЙ комбинации:', { interests, audience });

    // Базовые слоты (еда всегда обязательна для всех)
    const baseSlots = [
      { time: "08:00", category: "cafe", title: this.getTitleForAudience("Morning Start", audience) },
      { time: "13:00", category: "restaurant", title: this.getTitleForAudience("Lunch Break", audience) },
      { time: "20:00", category: "restaurant", title: this.getTitleForAudience("Dinner", audience) }
    ];

    // Создаем активности на основе ВСЕХ интересов
    const activitySlots = [];
    
    interests.forEach(interest => {
      const slots = this.getSlotsForInterest(interest, audience);
      activitySlots.push(...slots);
    });

    // Если нет интересов или не нашли подходящие слоты
    if (activitySlots.length === 0) {
      activitySlots.push(...this.getDefaultSlotsForAudience(audience));
    }

    // Объединяем и сортируем по времени
    const allSlots = [...baseSlots, ...activitySlots];
    const uniqueSlots = this.removeDuplicateTimeSlots(allSlots);
    
    return uniqueSlots.sort((a, b) => a.time.localeCompare(b.time));
  }

  /**
   * Получает слоты для конкретного интереса
   */
  getSlotsForInterest(interest, audience) {
    const interestSlots = {
      // Основные интересы
      'adventure': [
        { time: "09:30", category: "outdoor_activity", title: "Adventure Morning" },
        { time: "14:30", category: "sports", title: "Active Afternoon" },
        { time: "16:30", category: "adventure_park", title: "Extreme Fun" }
      ],
      'culture': [
        { time: "09:30", category: "museum", title: "Cultural Morning" },
        { time: "11:00", category: "gallery", title: "Art Experience" },
        { time: "16:00", category: "cultural_center", title: "Cultural Venue" }
      ],
      'food': [
        { time: "09:30", category: "food_market", title: "Local Market" },
        { time: "11:00", category: "cafe", title: "Coffee Culture" },
        { time: "16:00", category: "local_cuisine", title: "Local Specialties" }
      ],
      'nature': [
        { time: "09:30", category: "park", title: "Nature Morning" },
        { time: "14:30", category: "garden", title: "Garden Walk" },
        { time: "17:00", category: "nature_reserve", title: "Nature Experience" }
      ],
      'art': [
        { time: "09:30", category: "gallery", title: "Art Morning" },
        { time: "11:00", category: "art_center", title: "Creative Space" },
        { time: "16:00", category: "museum", title: "Art Museum" }
      ],
      'music': [
        { time: "09:30", category: "music_store", title: "Music Shopping" },
        { time: "16:00", category: "concert_hall", title: "Music Venue" },
        { time: "21:30", category: "jazz_club", title: "Evening Music" }
      ],
      'romantic': [
        { time: "09:30", category: "park", title: "Romantic Walk" },
        { time: "11:00", category: "cafe", title: "Cozy Coffee" },
        { time: "16:00", category: "scenic_view", title: "Beautiful Views" },
        { time: "21:30", category: "rooftop_bar", title: "Romantic Drinks" }
      ],
      'history': [
        { time: "09:30", category: "historical_site", title: "Historical Morning" },
        { time: "11:00", category: "museum", title: "History Museum" },
        { time: "16:00", category: "monument", title: "Historical Monument" }
      ],
      'shopping': [
        { time: "09:30", category: "local_market", title: "Morning Market" },
        { time: "14:30", category: "shopping_center", title: "Shopping Time" },
        { time: "16:30", category: "boutique", title: "Unique Finds" }
      ],
      'nightlife': [
        { time: "16:00", category: "bar", title: "Pre-dinner Drinks" },
        { time: "21:30", category: "club", title: "Night Entertainment" },
        { time: "23:00", category: "cocktail_bar", title: "Late Night" }
      ],
      'relaxation': [
        { time: "09:30", category: "spa", title: "Morning Spa" },
        { time: "14:30", category: "wellness_center", title: "Wellness Time" },
        { time: "17:00", category: "yoga_studio", title: "Relaxation" }
      ],
      'wellness': [
        { time: "09:30", category: "wellness_center", title: "Wellness Morning" },
        { time: "14:30", category: "spa", title: "Spa Treatment" },
        { time: "17:00", category: "fitness_center", title: "Fitness Session" }
      ],
      'architecture': [
        { time: "09:30", category: "cathedral", title: "Architectural Morning" },
        { time: "11:00", category: "historical_building", title: "Historic Architecture" },
        { time: "16:00", category: "landmark", title: "Iconic Buildings" }
      ],
      'photography': [
        { time: "09:30", category: "scenic_view", title: "Photo Morning" },
        { time: "14:30", category: "landmark", title: "Iconic Shots" },
        { time: "17:00", category: "street_art", title: "Urban Photography" }
      ],
      'local': [
        { time: "09:30", category: "local_market", title: "Local Experience" },
        { time: "11:00", category: "traditional_restaurant", title: "Local Cuisine" },
        { time: "16:00", category: "cultural_center", title: "Local Culture" }
      ],
      'sports': [
        { time: "09:30", category: "sports_center", title: "Sports Morning" },
        { time: "14:30", category: "stadium", title: "Sports Venue" },
        { time: "17:00", category: "fitness_center", title: "Active Time" }
      ],
      'outdoor': [
        { time: "09:30", category: "park", title: "Outdoor Morning" },
        { time: "14:30", category: "hiking", title: "Nature Hike" },
        { time: "17:00", category: "outdoor_activity", title: "Outdoor Fun" }
      ],
      'indoor': [
        { time: "09:30", category: "museum", title: "Indoor Morning" },
        { time: "14:30", category: "gallery", title: "Art Gallery" },
        { time: "17:00", category: "shopping_center", title: "Indoor Shopping" }
      ],

      // ДЕТСКИЕ интересы (полный набор)
      'swimming': [
        { time: "09:30", category: "pool", title: "Swimming Time" },
        { time: "14:30", category: "water_park", title: "Water Fun" },
        { time: "16:30", category: "aquatic_center", title: "More Swimming" }
      ],
      'zoo': [
        { time: "09:30", category: "zoo", title: "Zoo Visit" },
        { time: "14:30", category: "aquarium", title: "Aquarium Tour" },
        { time: "16:30", category: "animal_park", title: "Animal Fun" }
      ],
      'playground': [
        { time: "09:30", category: "playground", title: "Playground Fun" },
        { time: "14:30", category: "park", title: "Park Play" },
        { time: "16:30", category: "family_entertainment", title: "Family Fun" }
      ],
      'amusement': [
        { time: "09:30", category: "amusement_park", title: "Amusement Park" },
        { time: "14:30", category: "theme_park", title: "Theme Park Fun" },
        { time: "16:30", category: "entertainment", title: "Entertainment" }
      ],
      'science': [
        { time: "09:30", category: "science_center", title: "Science Fun" },
        { time: "14:30", category: "planetarium", title: "Space Adventure" },
        { time: "16:30", category: "interactive_museum", title: "Hands-on Learning" }
      ],
      'educational': [
        { time: "09:30", category: "museum", title: "Learning Time" },
        { time: "14:30", category: "science_center", title: "Educational Fun" },
        { time: "16:30", category: "library", title: "Discovery Time" }
      ]
    };

    return interestSlots[interest] || [];
  }

  /**
   * Получает заголовок с учетом аудитории
   */
  getTitleForAudience(baseTitle, audience) {
    const audienceTitles = {
      'kids': {
        'Morning Start': 'Family Breakfast',
        'Lunch Break': 'Lunch Time',
        'Dinner': 'Family Dinner'
      },
      'couples': {
        'Morning Start': 'Romantic Breakfast',
        'Lunch Break': 'Intimate Lunch',
        'Dinner': 'Romantic Dinner'
      },
      'her': {
        'Morning Start': 'Morning Coffee',
        'Lunch Break': 'Elegant Lunch',
        'Dinner': 'Fine Dining'
      },
      'him': {
        'Morning Start': 'Energizing Breakfast',
        'Lunch Break': 'Hearty Lunch',
        'Dinner': 'Great Dinner'
      }
    };

    return audienceTitles[audience]?.[baseTitle] || baseTitle;
  }

  /**
   * Получает дефолтные слоты для аудитории
   */
  getDefaultSlotsForAudience(audience) {
    if (audience === 'kids') {
      return [
        { time: "09:30", category: "playground", title: "Morning Play" },
        { time: "11:00", category: "museum", title: "Kids Museum" },
        { time: "14:30", category: "park", title: "Outdoor Fun" },
        { time: "16:00", category: "amusement", title: "Entertainment" }
      ];
    }

    if (audience === 'couples') {
      return [
        { time: "09:30", category: "park", title: "Romantic Walk" },
        { time: "11:00", category: "cafe", title: "Cozy Coffee" },
        { time: "14:30", category: "museum", title: "Cultural Experience" },
        { time: "16:00", category: "scenic_view", title: "Beautiful Views" },
        { time: "21:30", category: "bar", title: "Romantic Drinks" }
      ];
    }

    // Дефолт для him/her
    return [
      { time: "09:30", category: "attraction", title: "Morning Activity" },
      { time: "11:00", category: "museum", title: "Cultural Experience" },
      { time: "14:30", category: "park", title: "Afternoon Exploration" },
      { time: "16:00", category: "attraction", title: "Sightseeing" },
      { time: "18:00", category: "park", title: "Evening Walk" }
    ];
  }

  /**
   * Удаляет дублирующиеся временные слоты
   */
  removeDuplicateTimeSlots(slots) {
    const uniqueSlots = [];
    const usedTimes = new Set();

    slots.forEach(slot => {
      if (!usedTimes.has(slot.time)) {
        uniqueSlots.push(slot);
        usedTimes.add(slot.time);
      }
    });

    return uniqueSlots;
  }

  /**
   * Получает альтернативные категории для замены
   * @param {string} category - Исходная категория
   * @returns {Array} - Массив альтернативных категорий
   */
  getAlternativeCategories(category) {
    const alternatives = {
      'cafe': ['restaurant', 'attraction'],
      'restaurant': ['cafe', 'attraction'],
      'museum': ['attraction', 'park', 'cafe'],
      'park': ['attraction', 'museum', 'cafe'],
      'attraction': ['museum', 'park', 'cafe'],
      'bar': ['restaurant', 'cafe', 'attraction'],
      // Детские категории
      'pool': ['water_park', 'aquatic_center', 'park'],
      'playground': ['park', 'family_entertainment', 'amusement'],
      'zoo': ['aquarium', 'park', 'museum'],
      'amusement': ['playground', 'park', 'entertainment']
    };
    
    return alternatives[category] || ['attraction', 'cafe', 'park'];
  }

  /**
   * Строит полный маршрут
   * @param {Object} filterParams - Параметры фильтра
   * @returns {Object} - Полный маршрут
   */
  async buildItinerary(filterParams) {
    try {
      console.log('🏗️ Building itinerary with new architecture...');
      
      // 1. Получаем рекомендации от файла с правилами
      const recommendations = this.getItineraryRecommendations(filterParams);
      
      // 2. Генерируем заголовки
      const titles = await this.titleGenerator.generateTitles(filterParams);
      console.log('✅ Titles generated:', titles.title);
      
      // 3. Получаем локации
      const locations = await this.locationsDatabase.getLocationsForFilter(filterParams);
      console.log('✅ Locations found:', locations.length);
      
      // 4. Рассчитываем бюджет
      const budgetInfo = this.budgetCalculator.calculateRouteCost(locations, filterParams.budget);
      console.log('✅ Budget calculated:', budgetInfo.totalCost, '/', budgetInfo.totalBudget);
      
      // 5. Генерируем погоду
      const weather = await this.generateWeather(filterParams);
      console.log('✅ Weather generated');
      
      // 6. Собираем маршрут с учетом рекомендаций
      const itinerary = await this.assembleItinerary(filterParams, titles, locations, budgetInfo, weather, recommendations);
      console.log('✅ Itinerary assembled');
      
      return itinerary;
    } catch (error) {
      console.error('Error building itinerary:', error);
      return this.getFallbackItinerary(filterParams);
    }
  }

  /**
   * Генерирует информацию о погоде
   */
  async generateWeather(filterParams) {
    try {
      return await generateWeather(filterParams.city, filterParams.interests, filterParams.date);
    } catch (error) {
      console.error('Error generating weather:', error);
      return {
        forecast: "Sunny, 22°C",
        clothing: "Light clothing recommended",
        tips: "Perfect weather for exploring!"
      };
    }
  }

  /**
   * Собирает итоговый маршрут
   */
  async assembleItinerary(filterParams, titles, locations, budgetInfo, weather, recommendations = []) {
    const dailyPlan = await this.createDailyPlan(locations, filterParams, recommendations);
    
    return {
      meta: {
        city: filterParams.city,
        date: filterParams.date,
        audience: filterParams.audience,
        interests: filterParams.interests,
        budget: filterParams.budget,
        generated_at: new Date().toISOString(),
        architecture: 'modular',
        recommendations: recommendations
      },
      title: titles.title,
      subtitle: titles.subtitle,
      weather: weather,
      budget: budgetInfo,
      daily_plan: dailyPlan
    };
  }

  /**
   * Создает план дня
   */
  async createDailyPlan(locations, filterParams, recommendations = []) {
    // Применяем рекомендации от файла с правилами
    console.log('📋 Применяем рекомендации от файла с правилами...');
    recommendations.forEach(rec => {
      console.log(`- ${rec.type}: ${rec.rule}`);
    });

    // Получаем правила уникальности
    const uniquenessRules = this.itineraryRules.getUniquenessRules();
    console.log('🔒 Применяем правила уникальности:', uniquenessRules.description);

    // Применяем бюджетную оптимизацию ПЕРЕД созданием плана
    const optimizedLocations = this.budgetCalculator.optimizeForBudget(locations, filterParams.budget);
    console.log(`💰 Бюджетная оптимизация: ${locations.length} → ${optimizedLocations.length} локаций`);
    
    const budgetCheck = this.budgetCalculator.calculateRouteCost(optimizedLocations, filterParams.budget);
    console.log(`💰 Финальный бюджет: ${budgetCheck.totalCost}€ из ${budgetCheck.totalBudget}€ (${budgetCheck.isWithinBudget ? '✅' : '❌'})`);

    // Создаем динамические временные слоты на основе интересов и аудитории
    const timeSlots = this.createTimeSlotsForInterests(filterParams.interests, filterParams.audience);
    console.log('⏰ Созданы временные слоты:', timeSlots.map(s => `${s.time} - ${s.title}`));

    // Массив для отслеживания уже использованных локаций
    const usedLocations = new Set();

    const dailyPlan = await Promise.all(timeSlots.map(async slot => {
      // Фильтруем ОПТИМИЗИРОВАННЫЕ локации по категории и исключаем уже использованные
      const suitablePlaces = optimizedLocations.filter(place => 
        place.category === slot.category && !usedLocations.has(place.name)
      );

      if (suitablePlaces.length === 0) {
        // Если нет доступных локаций в этой категории, пробуем альтернативные категории
        const alternativeCategories = this.getAlternativeCategories(slot.category);
        let alternativePlaces = [];
        
        for (const altCategory of alternativeCategories) {
          alternativePlaces = optimizedLocations.filter(place => 
            place.category === altCategory && !usedLocations.has(place.name)
          );
          if (alternativePlaces.length > 0) break;
        }

        if (alternativePlaces.length === 0) {
          return {
            time: slot.time,
            title: slot.title,
            items: [{
              title: "Free Time",
              why: "Enjoy some free time to explore on your own and discover the city's hidden gems at your own pace.",
              address: "Various locations",
              approx_cost: "0€",
              tips: "Perfect opportunity to discover hidden gems and create your own adventure in this beautiful city.",
              duration: "1 hour",
              photos: []
            }]
          };
        }
        
        // Используем альтернативную категорию
        const selectedPlace = alternativePlaces[0];
        usedLocations.add(selectedPlace.name);
        console.log(`🔄 Использована альтернативная категория ${selectedPlace.category} для слота ${slot.time}`);
        
        // Генерируем описание и советы с помощью AI
        const description = await generateLocationDescription(
          selectedPlace.name, 
          selectedPlace.address, 
          selectedPlace.category, 
          filterParams.interests, 
          filterParams.audience
        );
        
        const tips = await generateLocationTips(
          selectedPlace.name, 
          selectedPlace.category, 
          filterParams.interests, 
          filterParams.audience
        );

        return {
          time: slot.time,
          title: slot.title,
          items: [{
            title: selectedPlace.name,
            why: description,
            address: selectedPlace.address,
            lat: selectedPlace.lat,
            lng: selectedPlace.lng,
            approx_cost: `${this.budgetCalculator.getPlaceCost(selectedPlace)}€`,
            tips: tips,
            duration: selectedPlace.category === 'restaurant' ? '1.5 hours' : '1 hour',
            photos: selectedPlace.photos || []
          }]
        };
      }

      const selectedPlace = suitablePlaces[0];
      usedLocations.add(selectedPlace.name);
      console.log(`✅ Выбрана уникальная локация: ${selectedPlace.name} (${selectedPlace.category})`);
      
      // Генерируем описание и советы с помощью AI
      const description = await generateLocationDescription(
        selectedPlace.name, 
        selectedPlace.address, 
        slot.category, 
        filterParams.interests, 
        filterParams.audience
      );
      
      const tips = await generateLocationTips(
        selectedPlace.name, 
        slot.category, 
        filterParams.interests, 
        filterParams.audience
      );
      
      return {
        time: slot.time,
        title: slot.title,
        items: [{
          title: selectedPlace.name,
          why: description,
          address: selectedPlace.address,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
          approx_cost: `${this.budgetCalculator.getPlaceCost(selectedPlace)}€`,
          tips: tips,
          duration: this.getDuration(slot.category),
          photos: this.formatPhotos(selectedPlace.photos || this.getFallbackPhotos(selectedPlace.name, slot.category))
        }]
      };
    }));

    return [{
      blocks: dailyPlan
    }];
  }

  /**
   * Генерирует описание места
   */
  generateDescription(place, category) {
    const descriptions = {
      cafe: `A charming ${place.name} offering freshly brewed coffee and a cozy atmosphere perfect for starting your day.`,
      restaurant: `An excellent ${place.name} known for its delicious cuisine and welcoming atmosphere.`,
      park: `A beautiful ${place.name} perfect for relaxation and enjoying the natural beauty of the area.`,
      attraction: `A must-visit ${place.name} that showcases the cultural and historical significance of the region.`,
      museum: `An fascinating ${place.name} featuring impressive collections and exhibitions.`,
      bar: `A lively ${place.name} offering great drinks and a vibrant atmosphere for evening entertainment.`
    };

    return descriptions[category] || `A wonderful ${place.name} worth visiting.`;
  }

  /**
   * Генерирует советы
   */
  generateTips(place, category) {
    const tips = {
      cafe: "Arrive early to enjoy the morning atmosphere and avoid crowds.",
      restaurant: "Consider making a reservation, especially during peak hours.",
      park: "Bring comfortable walking shoes and a camera for beautiful photos.",
      attraction: "Check opening hours and consider guided tours for better experience.",
      museum: "Allow plenty of time to explore all the exhibits thoroughly.",
      bar: "Try the local specialties and enjoy the evening ambiance."
    };

    return tips[category] || "Enjoy your visit and take your time exploring.";
  }

  /**
   * Получает продолжительность
   */
  getDuration(category) {
    const durations = {
      cafe: "1 hour",
      restaurant: "1.5 hours",
      park: "1 hour",
      attraction: "1.5 hours",
      museum: "2 hours",
      bar: "1 hour"
    };

    return durations[category] || "1 hour";
  }

  /**
   * Форматирует фотографии для PhotoGallery
   */
  formatPhotos(photos) {
    if (!photos || !Array.isArray(photos)) {
      return [];
    }
    
    return photos.map(photo => {
      if (typeof photo === 'string') {
        return {
          url: photo,
          thumbnail: photo.replace('w=800&h=600', 'w=200&h=150'),
          source: 'unsplash'
        };
      } else if (photo.url) {
        return {
          url: photo.url,
          thumbnail: photo.thumbnail || photo.url.replace('w=800&h=600', 'w=200&h=150'),
          source: photo.source || 'unsplash'
        };
      }
      return photo;
    });
  }

  /**
   * Получает fallback фотографии для локации
   */
  getFallbackPhotos(locationName, category) {
    const photoUrls = {
      cafe: [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80'
      ],
      restaurant: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80'
      ],
      park: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80'
      ],
      attraction: [
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'
      ],
      museum: [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'
      ],
      bar: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80'
      ]
    };

    return photoUrls[category] || [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80'
    ];
  }

  /**
   * Fallback маршрут
   */
  getFallbackItinerary(filterParams) {
    throw new Error(`Failed to generate itinerary for ${filterParams.city}. Please ensure all APIs are properly configured.`);
  }
}

module.exports = ItineraryBuilder;

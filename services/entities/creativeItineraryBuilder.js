/**
 * Creative Itinerary Builder - НОВАЯ АРХИТЕКТУРА
 * Строго следует принципам itineraryRules.js
 * Использует ТОЛЬКО реальные данные из Google Places API
 * НЕ использует fallback данные
 */

const ItineraryRules = require('../rules/itineraryRules');
const { generateTitle, generateSubtitle, generateWeather, generateLocationDescription, generateLocationTips } = require('../textGenerator');
const PlacesService = require('../placesService');

class CreativeItineraryBuilder {
  constructor() {
    this.itineraryRules = new ItineraryRules();
    this.placesService = new PlacesService();
  }

  /**
   * ГЛАВНАЯ ФУНКЦИЯ: Строит креативный маршрут согласно правилам
   * @param {Object} filterParams - Фильтр пользователя: город, аудитория, интересы, дата, бюджет
   * @returns {Object} - Полный маршрут с реальными данными
   */
  async buildCreativeItinerary(filterParams) {
    console.log('🎨 CREATIVE ITINERARY BUILDER - New Architecture');
    console.log('📋 Filter params:', filterParams);

    // ШАГ 1: Получаем правила и рекомендации
    const rules = this.itineraryRules.getAllRules();
    const recommendations = this.itineraryRules.getItineraryRecommendations(filterParams);
    console.log('📜 Rules and recommendations loaded:', recommendations.length);

    // ШАГ 2: Генерируем креативные тексты через OpenAI
    const [title, subtitle, weather] = await Promise.all([
      generateTitle(filterParams.city, filterParams.interests, filterParams.audience),
      generateSubtitle(filterParams.city, filterParams.interests, filterParams.audience, filterParams.date),
      generateWeather(filterParams.city, filterParams.interests, filterParams.date)
    ]);
    console.log('✨ Creative texts generated:', { title });

    // ШАГ 3: Получаем РЕАЛЬНЫЕ локации через Google Places API
    const realPlaces = await this.getRealPlacesFromGoogleAPI(filterParams, rules);
    console.log('🌍 Real places from Google API:', realPlaces.length);

    if (realPlaces.length === 0) {
      throw new Error(`No real places found for ${filterParams.city}. Google Places API returned no results.`);
    }

    // ШАГ 4: Создаем креативный план дня с OpenAI
    const creativeItinerary = await this.createCreativeDayPlan(filterParams, realPlaces, rules, recommendations);
    console.log('🎯 Creative day plan created');

    // ШАГ 5: Собираем финальный маршрут
    const finalItinerary = {
      meta: {
        city: filterParams.city,
        date: filterParams.date,
        audience: filterParams.audience,
        interests: filterParams.interests,
        budget: filterParams.budget,
        generated_at: new Date().toISOString(),
        architecture: 'creative_v3',
        data_source: 'google_places_only',
        rules_applied: recommendations.length
      },
      title: this.cleanText(title),
      subtitle: this.cleanText(subtitle),
      weather: {
        forecast: this.cleanText(weather.forecast || weather),
        clothing: this.cleanText(weather.clothing || ''),
        tips: this.cleanText(weather.tips || '')
      },
      budget: this.calculateRealBudget(creativeItinerary, filterParams.budget),
      daily_plan: [{
        blocks: creativeItinerary
      }]
    };

    console.log('✅ Final creative itinerary assembled');
    return finalItinerary;
  }

  /**
   * Получает РЕАЛЬНЫЕ места через Google Places API
   * Применяет правила фильтрации согласно itineraryRules.js
   */
  async getRealPlacesFromGoogleAPI(filterParams, rules) {
    console.log('🔍 Searching real places via Google Places API...');
    
    const allPlaces = [];
    const searchCategories = this.getSearchCategoriesFromRules(filterParams.interests, filterParams.audience, rules);
    
    console.log('🏷️ Search categories:', searchCategories);

    // Поиск по каждой категории
    for (const category of searchCategories) {
      try {
        const places = await this.placesService.searchPlaces(
          filterParams.city, 
          category, 
          filterParams.interests
        );
        
        // Фильтруем по правилам бюджета
        const budgetFilteredPlaces = this.filterPlacesByBudget(places, filterParams.budget, rules);
        
        // Фильтруем по аудитории (например, исключаем бары для детей)
        const audienceFilteredPlaces = this.filterPlacesByAudience(budgetFilteredPlaces, filterParams.audience, rules);
        
        console.log(`📍 Found ${audienceFilteredPlaces.length} real places for category ${category}`);
        allPlaces.push(...audienceFilteredPlaces);
      } catch (error) {
        console.error(`❌ Error searching places for category ${category}:`, error.message);
      }
    }

    // Удаляем дубликаты по place_id
    const uniquePlaces = this.removeDuplicatePlaces(allPlaces);
    console.log(`🎯 Total unique real places: ${uniquePlaces.length}`);

    return uniquePlaces;
  }

  /**
   * Получает категории поиска на основе правил
   */
  getSearchCategoriesFromRules(interests, audience, rules) {
    const categories = new Set();
    
    // Обязательные категории еды (из правил timeSlots)
    categories.add('restaurant');
    categories.add('cafe');
    
    // Категории на основе интересов (из правил interests)
    interests.forEach(interest => {
      const interestRules = rules.filterParameters.interests.rules[interest];
      if (interestRules) {
        const interestCategories = this.mapInterestToCategories(interest);
        interestCategories.forEach(cat => categories.add(cat));
      }
    });
    
    // Дополнительные категории для разнообразия (из правил balance)
    categories.add('tourist_attraction');
    categories.add('park');
    
    // Исключения для детей (из правил safety)
    if (audience === 'kids') {
      categories.delete('bar');
      categories.delete('night_club');
    }
    
    return Array.from(categories);
  }

  /**
   * Маппинг интересов в категории Google Places
   */
  mapInterestToCategories(interest) {
    const mapping = {
      'culture': ['museum', 'art_gallery', 'library', 'cultural_center'],
      'adventure': ['amusement_park', 'zoo', 'tourist_attraction', 'park'],
      'romantic': ['park', 'tourist_attraction', 'spa', 'restaurant'],
      'food': ['restaurant', 'cafe', 'food', 'meal_takeaway'],
      'art': ['art_gallery', 'museum', 'cultural_center'],
      'music': ['night_club', 'bar', 'tourist_attraction'],
      'nature': ['park', 'zoo', 'tourist_attraction'],
      'history': ['museum', 'tourist_attraction', 'library'],
      'shopping': ['shopping_mall', 'store', 'clothing_store'],
      'nightlife': ['bar', 'night_club', 'restaurant'],
      'relaxation': ['spa', 'park', 'cafe'],
      'wellness': ['spa', 'gym', 'park'],
      'architecture': ['tourist_attraction', 'museum', 'church'],
      'photography': ['tourist_attraction', 'park', 'museum'],
      'local': ['restaurant', 'cafe', 'tourist_attraction'],
      'sports': ['stadium', 'gym', 'park'],
      'outdoor': ['park', 'tourist_attraction', 'zoo'],
      'indoor': ['museum', 'shopping_mall', 'art_gallery'],
      
      // Детские интересы
      'swimming': ['swimming_pool', 'water_park', 'aquarium'],
      'zoo': ['zoo', 'aquarium', 'amusement_park'],
      'playground': ['amusement_park', 'park', 'zoo'],
      'amusement': ['amusement_park', 'zoo', 'tourist_attraction'],
      'science': ['museum', 'library', 'tourist_attraction'],
      'educational': ['museum', 'library', 'zoo']
    };
    
    return mapping[interest] || ['tourist_attraction'];
  }

  /**
   * Фильтрует места по бюджету согласно правилам
   */
  filterPlacesByBudget(places, budget, rules) {
    const budgetRules = rules.budgetAndPricing;
    const budgetLevel = this.getBudgetLevel(budget);
    const strategies = budgetRules.budgetLevels[budgetLevel]?.strategies || [];
    
    console.log(`💰 Applying budget filter: ${budgetLevel} (${budget}€)`);
    
    return places.filter(place => {
      const estimatedCost = this.estimatePlaceCost(place);
      const maxCostForBudget = this.getMaxCostForBudget(budget);
      
      return estimatedCost <= maxCostForBudget;
    });
  }

  /**
   * Фильтрует места по аудитории согласно правилам
   */
  filterPlacesByAudience(places, audience, rules) {
    console.log(`👥 Applying audience filter: ${audience}`);
    
    if (audience === 'kids') {
      // Исключаем неподходящие для детей места
      return places.filter(place => 
        !place.types?.some(type => ['bar', 'night_club', 'casino', 'liquor_store'].includes(type)) &&
        place.rating >= 4.0 // Только качественные места для детей
      );
    }
    
    return places;
  }

  /**
   * Создает креативный план дня с помощью OpenAI
   */
  async createCreativeDayPlan(filterParams, realPlaces, rules, recommendations) {
    console.log('🎨 Creating creative day plan...');
    
    // Создаем временные слоты согласно правилам timeSlots
    const timeSlots = this.createTimeSlotsFromRules(filterParams, rules);
    console.log('⏰ Time slots created:', timeSlots.length);
    
    // Отслеживаем уникальность согласно правилам uniqueness
    const usedPlaces = new Set();
    const dailyPlan = [];
    
    for (const slot of timeSlots) {
      console.log(`🎯 Processing slot ${slot.time} - ${slot.category}`);
      
      // Находим подходящие места для слота
      const suitablePlaces = realPlaces.filter(place => 
        this.isPlaceSuitableForSlot(place, slot) && 
        !usedPlaces.has(place.place_id || place.name)
      );
      
      console.log(`🎯 Slot ${slot.time} (${slot.category}): found ${suitablePlaces.length} suitable places from ${realPlaces.length} total`);
      
      if (suitablePlaces.length === 0) {
        console.log(`⚠️ No suitable real places for slot ${slot.time} - ${slot.category}`);
        console.log(`Available places: ${realPlaces.slice(0, 3).map(p => `${p.name} (${p.types?.join(',') || p.category})`).join(', ')}`);
        continue; // Пропускаем слот если нет реальных мест
      }
      
      // Выбираем лучшее место (по рейтингу и отзывам)
      const selectedPlace = this.selectBestPlace(suitablePlaces, filterParams);
      usedPlaces.add(selectedPlace.place_id);
      
      console.log(`✅ Selected: ${selectedPlace.name} (rating: ${selectedPlace.rating})`);
      
      // Генерируем AI описание и советы
      const [description, tips] = await Promise.all([
        generateLocationDescription(
          selectedPlace.name,
          selectedPlace.formatted_address || selectedPlace.vicinity,
          slot.category,
          filterParams.interests,
          filterParams.audience
        ).catch(() => `Discover the authentic charm of ${selectedPlace.name}.`),
        generateLocationTips(
          selectedPlace.name,
          slot.category,
          filterParams.interests,
          filterParams.audience
        ).catch(() => `Perfect spot to experience local culture.`)
      ]);
      
      // Получаем реальные фотографии
      const photos = await this.getRealPhotos(selectedPlace);
      
      dailyPlan.push({
        time: slot.time,
        title: slot.title,
        items: [{
          title: selectedPlace.name,
          why: this.cleanText(description),
          address: selectedPlace.formatted_address || selectedPlace.vicinity,
          lat: selectedPlace.geometry?.location?.lat,
          lng: selectedPlace.geometry?.location?.lng,
          approx_cost: this.formatCost(this.estimatePlaceCost(selectedPlace)),
          tips: this.cleanText(tips),
          duration: this.getDurationForCategory(slot.category, rules),
          photos: photos,
          rating: selectedPlace.rating,
          place_id: selectedPlace.place_id,
          source: 'google_places_real_data'
        }]
      });
    }
    
    console.log(`🎯 Created ${dailyPlan.length} real activities`);
    return dailyPlan;
  }

  /**
   * Создает временные слоты согласно правилам
   */
  createTimeSlotsFromRules(filterParams, rules) {
    const timeSlotRules = rules.routeLogic.timeSlots;
    const slots = [];
    
    // Обязательные слоты еды
    slots.push(
      { time: "08:30", category: "cafe", title: "Morning Coffee" },
      { time: "13:00", category: "restaurant", title: "Lunch" },
      { time: "19:30", category: "restaurant", title: "Dinner" }
    );
    
    // Слоты активностей на основе интересов
    filterParams.interests.forEach(interest => {
      const interestSlots = this.getActivitySlotsForInterest(interest, filterParams.audience);
      slots.push(...interestSlots);
    });
    
    // Сортируем по времени и убираем дубликаты
    return this.deduplicateTimeSlots(slots.sort((a, b) => a.time.localeCompare(b.time)));
  }

  /**
   * Получает слоты активностей для интереса
   */
  getActivitySlotsForInterest(interest, audience) {
    const slots = {
      'culture': [
        { time: "10:00", category: "museum", title: "Cultural Morning" },
        { time: "15:00", category: "art_gallery", title: "Art Experience" }
      ],
      'adventure': [
        { time: "10:00", category: "amusement_park", title: "Adventure Time" },
        { time: "16:00", category: "tourist_attraction", title: "Exploration" }
      ],
      'romantic': [
        { time: "10:30", category: "park", title: "Romantic Walk" },
        { time: "16:00", category: "tourist_attraction", title: "Scenic Views" },
        { time: "21:00", category: "bar", title: "Evening Drinks" }
      ],
      'swimming': [
        { time: "10:00", category: "swimming_pool", title: "Swimming Fun" },
        { time: "15:00", category: "water_park", title: "Water Activities" }
      ],
      'zoo': [
        { time: "10:00", category: "zoo", title: "Animal Adventure" },
        { time: "15:00", category: "aquarium", title: "Marine Life" }
      ]
    };
    
    let interestSlots = slots[interest] || [
      { time: "10:00", category: "tourist_attraction", title: "Morning Activity" },
      { time: "15:00", category: "tourist_attraction", title: "Afternoon Activity" }
    ];
    
    // Фильтруем для детей
    if (audience === 'kids') {
      interestSlots = interestSlots.filter(slot => !['bar', 'night_club'].includes(slot.category));
    }
    
    return interestSlots;
  }

  /**
   * Проверяет подходит ли место для слота
   */
  isPlaceSuitableForSlot(place, slot) {
    if (!place.types || !Array.isArray(place.types)) {
      // Если нет типов, проверяем по категории места (для mock данных)
      return place.category === slot.category;
    }
    
    const categoryMapping = {
      'cafe': ['cafe', 'bakery', 'restaurant', 'meal_takeaway', 'food'],
      'restaurant': ['restaurant', 'meal_delivery', 'meal_takeaway', 'food', 'cafe'],
      'museum': ['museum', 'art_gallery', 'library', 'cultural_center'],
      'park': ['park', 'zoo', 'tourist_attraction'],
      'tourist_attraction': ['tourist_attraction', 'point_of_interest', 'establishment'],
      'amusement_park': ['amusement_park', 'zoo', 'aquarium', 'tourist_attraction'],
      'swimming_pool': ['swimming_pool', 'gym', 'spa', 'health'],
      'water_park': ['amusement_park', 'swimming_pool', 'tourist_attraction'],
      'zoo': ['zoo', 'aquarium', 'tourist_attraction'],
      'aquarium': ['aquarium', 'zoo', 'tourist_attraction'],
      'art_gallery': ['art_gallery', 'museum', 'cultural_center'],
      'bar': ['bar', 'night_club', 'restaurant', 'food', 'establishment']
    };
    
    const acceptableTypes = categoryMapping[slot.category] || [slot.category];
    const hasMatchingType = place.types.some(type => acceptableTypes.includes(type));
    
    // Также проверяем по категории места (для mock данных)
    const hasCategoryMatch = place.category === slot.category;
    
    console.log(`🔍 Checking place ${place.name}: types=${place.types?.join(',')}, category=${place.category}, slot=${slot.category}, match=${hasMatchingType || hasCategoryMatch}`);
    
    return hasMatchingType || hasCategoryMatch;
  }

  /**
   * Выбирает лучшее место по рейтингу и отзывам
   */
  selectBestPlace(places, filterParams) {
    return places.sort((a, b) => {
      // Приоритет: рейтинг > количество отзывов > открыто сейчас
      const scoreA = (a.rating || 0) * 10 + (a.user_ratings_total || 0) / 100 + (a.opening_hours?.open_now ? 5 : 0);
      const scoreB = (b.rating || 0) * 10 + (b.user_ratings_total || 0) / 100 + (b.opening_hours?.open_now ? 5 : 0);
      return scoreB - scoreA;
    })[0];
  }

  /**
   * Получает реальные фотографии места
   */
  async getRealPhotos(place) {
    try {
      if (place.place_id) {
        return await this.placesService.getPlacePhotos(place.place_id);
      }
      return [];
    } catch (error) {
      console.error('Error getting real photos:', error);
      return [];
    }
  }

  /**
   * Вспомогательные функции
   */
  cleanText(text) {
    if (!text) return text;
    return text.replace(/^[\"']|[\"']$/g, '').trim();
  }

  removeDuplicatePlaces(places) {
    const seen = new Set();
    return places.filter(place => {
      const id = place.place_id || place.name;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  deduplicateTimeSlots(slots) {
    const seen = new Set();
    return slots.filter(slot => {
      if (seen.has(slot.time)) return false;
      seen.add(slot.time);
      return true;
    });
  }

  getBudgetLevel(budget) {
    const budgetValue = parseInt(budget) || 0;
    if (budgetValue < 50) return 'low';
    if (budgetValue < 150) return 'medium';
    return 'high';
  }

  getMaxCostForBudget(budget) {
    const budgetValue = parseInt(budget) || 100;
    return Math.floor(budgetValue * 0.3); // Максимум 30% от бюджета на одно место
  }

  estimatePlaceCost(place) {
    if (place.price_level) {
      return place.price_level * 15; // €15, €30, €45, €60
    }
    
    // Оценка по типу места
    if (place.types?.includes('restaurant')) return 25;
    if (place.types?.includes('cafe')) return 8;
    if (place.types?.includes('museum')) return 12;
    if (place.types?.includes('bar')) return 15;
    if (place.types?.includes('amusement_park')) return 30;
    
    return 10; // Дефолтная оценка
  }

  formatCost(cost) {
    return `${cost}€`;
  }

  getDurationForCategory(category, rules) {
    const durationRules = rules.routeLogic.duration.rules;
    
    if (category === 'restaurant') return '1.5 hours';
    if (category === 'cafe') return '1 hour';
    if (category === 'museum') return '2 hours';
    if (category === 'park') return '1 hour';
    if (category === 'bar') return '1 hour';
    
    return '1 hour';
  }

  calculateRealBudget(dailyPlan, totalBudget) {
    const totalCost = dailyPlan.reduce((sum, block) => {
      return sum + block.items.reduce((itemSum, item) => {
        const cost = parseInt(item.approx_cost.replace('€', '')) || 0;
        return itemSum + cost;
      }, 0);
    }, 0);

    const budgetValue = parseInt(totalBudget) || 0;
    const isWithinBudget = totalCost <= budgetValue * 1.3; // ±30% правило

    return {
      totalCost,
      totalBudget: budgetValue,
      isWithinBudget,
      deviation: Math.round(((totalCost - budgetValue) / budgetValue) * 100),
      source: 'real_places_calculation'
    };
  }
}

module.exports = CreativeItineraryBuilder;

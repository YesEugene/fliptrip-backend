/**
 * Real Places Itinerary Builder
 * Использует ТОЛЬКО реальные данные из Google Places API
 * Простая и надежная архитектура
 */

const { generateTitle, generateSubtitle, generateWeather, generateLocationDescription, generateLocationTips, generateConceptualPlan } = require('../textGenerator');
const PlacesService = require('../placesService');
const ConceptualPlanGenerator = require('./conceptualPlanGenerator');
const ConceptualMatcher = require('./conceptualMatcher');

class RealPlacesItineraryBuilder {
  constructor() {
    this.placesService = new PlacesService();
    this.conceptualGenerator = new ConceptualPlanGenerator();
    this.conceptualMatcher = new ConceptualMatcher();
    
    // Проверяем доступность API ключей при инициализации
    this.hasGoogleKey = !!(process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_PLACES_API_KEY);
    this.hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    
    console.log('🔑 RealPlacesBuilder initialized:');
    console.log(`   Google API: ${this.hasGoogleKey ? '✅' : '❌'}`);
    console.log(`   OpenAI API: ${this.hasOpenAIKey ? '✅' : '❌'}`);
  }

  /**
   * Строит маршрут используя ТОЛЬКО реальные места + концептуальный план
   */
  async buildRealItinerary(filterParams) {
    console.log('🌍 REAL PLACES ITINERARY BUILDER WITH CONCEPTUAL PLANNING');
    console.log('📋 Filter params:', filterParams);

    try {
      // ШАГ 0: Генерируем концептуальный план через OpenAI (НОВОЕ!)
      let conceptualPlan = null;
      try {
        if (this.hasOpenAIKey) {
          conceptualPlan = await this.conceptualGenerator.generateConceptualPlan(filterParams);
          console.log('🎨 Conceptual plan created:', conceptualPlan.concept);
        } else {
          console.log('⚠️ OpenAI not available, using standard approach');
        }
      } catch (conceptError) {
        console.log('⚠️ Conceptual plan failed, using fallback approach:', conceptError.message);
      }

      // Шаг 1: Генерируем тексты
      const [title, subtitle, weather] = await Promise.all([
        generateTitle(filterParams.city, filterParams.interests, filterParams.audience),
        generateSubtitle(filterParams.city, filterParams.interests, filterParams.audience, filterParams.date),
        generateWeather(filterParams.city, filterParams.interests, filterParams.date)
      ]);

      console.log('✨ Texts generated:', { title });

      // Шаг 2: Получаем реальные места (с концептуальным планом или без)
      const realPlaces = conceptualPlan 
        ? await this.findRealPlacesWithConcept(conceptualPlan, filterParams)
        : await this.getRealPlaces(filterParams);
      
      console.log(`🌍 Found ${realPlaces.length} real places`);

      if (realPlaces.length === 0) {
        throw new Error(`No real places found for ${filterParams.city}. Google Places API returned no results.`);
      }

      if (realPlaces.length < 3) {
        console.log(`⚠️ Only ${realPlaces.length} places found, but continuing...`);
      }

      // Шаг 3: Создаем план дня (с концептуальным планом или без)
      const dailyPlan = conceptualPlan
        ? await this.createConceptualDayPlan(conceptualPlan, realPlaces, filterParams)
        : await this.createRealDayPlan(realPlaces, filterParams);
      
      console.log(`📅 Created plan with ${dailyPlan.length} activities`);

      // Шаг 4: Рассчитываем бюджет
      const budget = this.calculateBudget(dailyPlan, filterParams.budget);

      // Шаг 5: Собираем итоговый маршрут
      return {
        meta: {
          city: filterParams.city,
          date: filterParams.date,
          audience: filterParams.audience,
          interests: filterParams.interests,
          budget: filterParams.budget,
          generated_at: new Date().toISOString(),
          architecture: conceptualPlan ? 'real_places_with_concept' : 'real_places_only',
          data_source: 'google_places_api',
          hasConceptualPlan: !!conceptualPlan
        },
        title: this.cleanText(title),
        subtitle: this.cleanText(subtitle),
        weather: {
          forecast: this.cleanText(weather.forecast || weather),
          clothing: this.cleanText(weather.clothing || ''),
          tips: this.cleanText(weather.tips || '')
        },
        budget: budget,
        conceptual_plan: conceptualPlan?.concept || null, // Добавляем концепцию в ответ
        daily_plan: [{
          blocks: dailyPlan
        }]
      };

    } catch (error) {
      console.error('❌ Real places itinerary error:', error);
      throw error;
    }
  }

  /**
   * Получает реальные места из Google Places API
   */
  async getRealPlaces(filterParams) {
    const allPlaces = [];
    
    // Базовые категории для поиска
    const searchQueries = [
      `restaurant in ${filterParams.city}`,
      `cafe in ${filterParams.city}`,
      `tourist attraction in ${filterParams.city}`,
      `museum in ${filterParams.city}`,
      `park in ${filterParams.city}`
    ];

    // Добавляем специфичные запросы для интересов
    filterParams.interests.forEach(interest => {
      if (interest === 'romantic') {
        searchQueries.push(`romantic restaurant in ${filterParams.city}`);
        searchQueries.push(`scenic view in ${filterParams.city}`);
      }
      if (interest === 'culture') {
        searchQueries.push(`museum in ${filterParams.city}`);
        searchQueries.push(`art gallery in ${filterParams.city}`);
      }
      if (interest === 'architecture') {
        searchQueries.push(`historic building in ${filterParams.city}`);
        searchQueries.push(`landmark in ${filterParams.city}`);
      }
    });

    console.log('🔍 Search queries:', searchQueries);

    // Выполняем поиск по всем запросам
    for (const query of searchQueries) {
      try {
        const places = await this.searchPlacesByText(query);
        console.log(`📍 Query "${query}": ${places.length} places`);
        allPlaces.push(...places);
      } catch (error) {
        console.error(`❌ Error searching "${query}":`, error.message);
      }
    }

    // Убираем дубликаты и фильтруем
    const uniquePlaces = this.removeDuplicates(allPlaces);
    const filteredPlaces = this.filterPlaces(uniquePlaces, filterParams);
    
    console.log(`🎯 Final: ${filteredPlaces.length} unique real places`);
    return filteredPlaces;
  }

  /**
   * НАДЕЖНЫЙ поиск мест по тексту с защитой от ошибок
   */
  async searchPlacesByText(query) {
    try {
      console.log(`🔍 Searching: "${query}"`);
      
      const response = await this.placesService.client.textSearch({
        params: {
          query: query,
          key: this.placesService.apiKey,
          language: 'en'
        }
      });

      if (!response.data?.results || response.data.results.length === 0) {
        console.log(`❌ No results for "${query}"`);
        return [];
      }

      console.log(`✅ Found ${response.data.results.length} results for "${query}"`);

      // БЕЗОПАСНОЕ форматирование с проверками
      const places = [];
      for (const place of response.data.results.slice(0, 5)) {
        try {
          // Проверяем обязательные поля
          if (!place.name || !place.place_id) {
            console.log(`⚠️ Skipping place with missing name or place_id`);
            continue;
          }

          const formattedPlace = {
            name: place.name,
            address: place.formatted_address || place.vicinity || 'Address not available',
            rating: parseFloat(place.rating) || 0,
            price_level: parseInt(place.price_level) || 2,
            place_id: place.place_id,
            types: Array.isArray(place.types) ? place.types : [],
            geometry: place.geometry || {},
            user_ratings_total: parseInt(place.user_ratings_total) || 0,
            opening_hours: place.opening_hours || {},
            lat: place.geometry?.location?.lat || 0,
            lng: place.geometry?.location?.lng || 0,
            photos: [], // Будем загружать отдельно
            category: this.determineCategory(place.types || [])
          };

          places.push(formattedPlace);
          console.log(`✅ Formatted: ${formattedPlace.name} (${formattedPlace.category})`);

        } catch (formatError) {
          console.error(`❌ Error formatting place ${place.name}:`, formatError.message);
          // Продолжаем с другими местами
        }
      }

      return places;

    } catch (error) {
      console.error(`❌ Search error for "${query}":`, error.message);
      return []; // Возвращаем пустой массив вместо падения
    }
  }

  /**
   * Определяет категорию места по типам
   */
  determineCategory(types) {
    if (types.includes('restaurant') || types.includes('meal_takeaway')) return 'restaurant';
    if (types.includes('cafe') || types.includes('bakery')) return 'cafe';
    if (types.includes('museum')) return 'museum';
    if (types.includes('park')) return 'park';
    if (types.includes('bar') || types.includes('night_club')) return 'bar';
    if (types.includes('tourist_attraction')) return 'attraction';
    if (types.includes('amusement_park')) return 'amusement';
    if (types.includes('zoo')) return 'zoo';
    
    return 'attraction'; // Дефолт
  }

  /**
   * Убирает дубликаты
   */
  removeDuplicates(places) {
    const seen = new Set();
    return places.filter(place => {
      const id = place.place_id || place.name;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  /**
   * Фильтрует места по параметрам с учетом реального бюджета
   */
  filterPlaces(places, filterParams) {
    let filtered = places;

    // Фильтр по аудитории
    if (filterParams.audience === 'kids') {
      filtered = filtered.filter(place => 
        !place.types.some(type => ['bar', 'night_club', 'casino'].includes(type))
      );
    }

    // Фильтр по рейтингу
    filtered = filtered.filter(place => place.rating >= 3.5);

    // УМНЫЙ фильтр по бюджету
    const budgetValue = parseInt(filterParams.budget) || 100;
    const maxBudget = budgetValue * 1.3; // +30%
    const averageCostPerActivity = maxBudget / 9; // 9 активностей в день
    
    console.log(`💰 Budget filtering: max ${maxBudget}€ total, ~${Math.round(averageCostPerActivity)}€ per activity`);

    // Фильтруем места, которые слишком дорогие для нашего бюджета
    filtered = filtered.filter(place => {
      const avgCost = this.getAverageCost(place.price_level || 2, place.category);
      const isAffordable = avgCost <= averageCostPerActivity * 2; // Позволяем некоторым быть дороже
      
      if (!isAffordable) {
        console.log(`💸 Filtered out ${place.name}: ${avgCost}€ > ${Math.round(averageCostPerActivity * 2)}€`);
      }
      
      return isAffordable;
    });

    console.log(`💰 Budget filter: ${places.length} → ${filtered.length} places`);
    return filtered;
  }

  /**
   * Создает план дня из реальных мест (9:00 - 21:30)
   */
  async createRealDayPlan(realPlaces, filterParams) {
    const timeSlots = [
      { time: "09:00", category: "cafe", title: "Morning Coffee" },
      { time: "10:00", category: "attraction", title: "Morning Discovery" },
      { time: "11:30", category: "attraction", title: "Cultural Experience" },
      { time: "13:00", category: "restaurant", title: "Lunch" },
      { time: "14:30", category: "attraction", title: "Afternoon Exploration" },
      { time: "16:00", category: "attraction", title: "Scenic Activity" },
      { time: "17:30", category: "cafe", title: "Coffee Break" },
      { time: "19:00", category: "restaurant", title: "Dinner" },
      { time: "21:00", category: "bar", title: "Evening Drinks" }
    ];

    const usedPlaces = new Set();
    const dailyPlan = [];

    for (const slot of timeSlots) {
      console.log(`🎯 Processing slot ${slot.time} - ${slot.category}`);
      
      // Находим подходящие места
      let suitablePlaces = realPlaces.filter(place => 
        place.category === slot.category && 
        !usedPlaces.has(place.place_id)
      );

      // Если не нашли точное совпадение, ищем похожие
      if (suitablePlaces.length === 0) {
        suitablePlaces = realPlaces.filter(place => 
          this.isSimilarCategory(place.category, slot.category) && 
          !usedPlaces.has(place.place_id)
        );
      }

      if (suitablePlaces.length === 0) {
        console.log(`⚠️ No places for slot ${slot.time}`);
        continue;
      }

      // Выбираем лучшее место
      const selectedPlace = suitablePlaces.sort((a, b) => b.rating - a.rating)[0];
      usedPlaces.add(selectedPlace.place_id);

      console.log(`✅ Selected: ${selectedPlace.name} (${selectedPlace.rating}⭐)`);

      // Генерируем описание и советы
      const [description, tips] = await Promise.all([
        generateLocationDescription(
          selectedPlace.name,
          selectedPlace.address,
          selectedPlace.category,
          filterParams.interests,
          filterParams.audience
        ).catch(() => `Discover the charm of ${selectedPlace.name}.`),
        generateLocationTips(
          selectedPlace.name,
          selectedPlace.category,
          filterParams.interests,
          filterParams.audience
        ).catch(() => `Perfect place to experience local culture.`)
      ]);

      dailyPlan.push({
        time: slot.time,
        title: slot.title,
        items: [{
          title: selectedPlace.name,
          why: this.cleanText(description),
          address: selectedPlace.address,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
          approx_cost: this.formatCost(selectedPlace.price_level, selectedPlace.category),
          tips: this.cleanText(tips),
          duration: this.getDuration(selectedPlace.category),
          photos: await this.getSimplePhotos(selectedPlace),
          rating: selectedPlace.rating,
          place_id: selectedPlace.place_id,
          source: 'google_places_real'
        }]
      });
    }

    return dailyPlan;
  }

  /**
   * Проверяет похожие категории
   */
  isSimilarCategory(placeCategory, slotCategory) {
    const similarCategories = {
      'cafe': ['restaurant', 'attraction'],
      'restaurant': ['cafe', 'attraction'],
      'attraction': ['museum', 'park', 'cafe'],
      'museum': ['attraction', 'park'],
      'park': ['attraction', 'museum']
    };

    return similarCategories[slotCategory]?.includes(placeCategory) || false;
  }

  /**
   * Вспомогательные функции
   */
  cleanText(text) {
    if (!text) return text;
    return text.replace(/^[\"']|[\"']$/g, '').trim();
  }

  getMaxPriceLevel(budget) {
    const budgetValue = parseInt(budget) || 100;
    if (budgetValue < 100) return 2;
    if (budgetValue < 300) return 3;
    return 4;
  }

  /**
   * Переводит Google price_level в реальные цены
   * Google: 0=Free, 1=Inexpensive, 2=Moderate, 3=Expensive, 4=Very Expensive
   */
  formatCost(priceLevel, category) {
    // Базовые цены по категориям
    const basePrices = {
      'cafe': { 0: '0€', 1: '5-8€', 2: '10-15€', 3: '18-25€', 4: '30-40€' },
      'restaurant': { 0: '0€', 1: '12-18€', 2: '20-35€', 3: '40-65€', 4: '70-120€' },
      'attraction': { 0: '0€', 1: '5-10€', 2: '12-20€', 3: '25-40€', 4: '50-80€' },
      'museum': { 0: '0€', 1: '8-12€', 2: '15-25€', 3: '30-45€', 4: '50-70€' },
      'park': { 0: '0€', 1: '0€', 2: '5-10€', 3: '15-25€', 4: '30-50€' },
      'bar': { 0: '0€', 1: '8-12€', 2: '15-25€', 3: '30-50€', 4: '60-100€' }
    };
    
    const categoryPrices = basePrices[category] || basePrices['attraction'];
    return categoryPrices[priceLevel] || categoryPrices[2];
  }

  /**
   * Получает среднюю стоимость для расчета бюджета
   */
  getAverageCost(priceLevel, category) {
    const averageCosts = {
      'cafe': { 0: 0, 1: 6, 2: 12, 3: 21, 4: 35 },
      'restaurant': { 0: 0, 1: 15, 2: 27, 3: 52, 4: 95 },
      'attraction': { 0: 0, 1: 7, 2: 16, 3: 32, 4: 65 },
      'museum': { 0: 0, 1: 10, 2: 20, 3: 37, 4: 60 },
      'park': { 0: 0, 1: 0, 2: 7, 3: 20, 4: 40 },
      'bar': { 0: 0, 1: 10, 2: 20, 3: 40, 4: 80 }
    };
    
    const categoryAverages = averageCosts[category] || averageCosts['attraction'];
    return categoryAverages[priceLevel] || categoryAverages[2];
  }

  getDuration(category) {
    const durations = {
      'restaurant': '1.5 hours',
      'cafe': '1 hour',
      'museum': '2 hours',
      'attraction': '1.5 hours',
      'park': '1 hour'
    };
    return durations[category] || '1 hour';
  }

  /**
   * НАДЕЖНОЕ получение фотографий с тройной защитой
   */
  async getSimplePhotos(place) {
    try {
      console.log(`📸 Getting photos for: ${place.name} (${place.place_id})`);
      
      // ПОПЫТКА 1: Реальные фотографии из Google Places
      if (place.place_id) {
        try {
          const photos = await this.placesService.getPlacePhotos(place.place_id);
          if (photos && Array.isArray(photos) && photos.length > 0) {
            console.log(`✅ Got ${photos.length} real photos for ${place.name}`);
            return photos;
          }
        } catch (photoError) {
          console.log(`⚠️ Real photos failed for ${place.name}: ${photoError.message}`);
        }
      }
      
      // ПОПЫТКА 2: Категорийные фотографии
      console.log(`📸 Using category photos for ${place.name} (${place.category})`);
      return this.getCategoryPhotos(place.category);
      
    } catch (error) {
      console.error(`❌ All photo methods failed for ${place.name}:`, error.message);
      
      // ПОПЫТКА 3: Минимальные fallback фотографии
      return [{
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop&q=80',
        source: 'emergency_fallback'
      }];
    }
  }

  /**
   * Получает фотографии по категории
   */
  getCategoryPhotos(category) {
    const categoryPhotos = {
      'restaurant': [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80'
      ],
      'cafe': [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80'
      ],
      'attraction': [
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'
      ],
      'museum': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'
      ],
      'park': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80'
      ]
    };

    const photos = categoryPhotos[category] || categoryPhotos['attraction'];
    return photos.map(url => ({
      url,
      thumbnail: url.replace('w=800&h=600', 'w=200&h=150'),
      source: 'unsplash'
    }));
  }

  calculateBudget(dailyPlan, totalBudget) {
    let totalCost = 0;
    
    // Рассчитываем стоимость используя средние цены
    dailyPlan.forEach(block => {
      block.items.forEach(item => {
        // Извлекаем среднюю стоимость из диапазона цен
        const costStr = item.approx_cost;
        if (costStr === '0€') {
          totalCost += 0;
        } else if (costStr.includes('-')) {
          // Для диапазонов берем среднее значение
          const [min, max] = costStr.replace('€', '').split('-').map(x => parseInt(x.trim()));
          totalCost += Math.round((min + max) / 2);
        } else {
          // Для одиночных значений
          totalCost += parseInt(costStr.replace('€', '')) || 0;
        }
      });
    });

    const budgetValue = parseInt(totalBudget) || 0;
    const minBudget = budgetValue * 0.7; // -30%
    const maxBudget = budgetValue * 1.3; // +30%
    
    const isWithinBudget = totalCost >= minBudget && totalCost <= maxBudget;
    const deviation = Math.round(((totalCost - budgetValue) / budgetValue) * 100);

    console.log(`💰 Budget calculation: ${totalCost}€ (target: ${budgetValue}€, range: ${minBudget}-${maxBudget}€)`);

    return {
      totalCost,
      totalBudget: budgetValue,
      isWithinBudget,
      deviation,
      minBudget,
      maxBudget,
      source: 'realistic_calculation'
    };
  }

  /**
   * НОВЫЕ МЕТОДЫ ДЛЯ КОНЦЕПТУАЛЬНОГО ПЛАНИРОВАНИЯ
   */

  /**
   * Находит реальные места используя концептуальный план
   */
  async findRealPlacesWithConcept(conceptualPlan, filterParams) {
    console.log('🎯 Finding real places with conceptual guidance...');
    
    const allPlaces = [];
    const processedQueries = new Set();

    // Создаем умные запросы для каждого концептуального слота
    for (const slot of conceptualPlan.timeSlots) {
      const smartQueries = this.conceptualMatcher.buildSmartQueries(slot, filterParams.city);
      
      for (const query of smartQueries) {
        if (processedQueries.has(query)) continue;
        processedQueries.add(query);
        
        try {
          const places = await this.searchPlacesByText(query);
          console.log(`🔍 Query "${query}": ${places.length} places`);
          
          // Обогащаем места информацией о концептуальном слоте
          const enrichedPlaces = places.map(place => ({
            ...place,
            sourceQuery: query,
            conceptualSlot: slot.time,
            conceptualActivity: slot.activity
          }));
          
          allPlaces.push(...enrichedPlaces);
        } catch (error) {
          console.error(`❌ Error searching "${query}":`, error.message);
        }
      }
    }

    // Убираем дубликаты
    const uniquePlaces = this.removeDuplicates(allPlaces);
    
    // Обогащаем места концептуальными скорами
    const enrichedPlaces = this.conceptualMatcher.enrichPlacesWithConcepts(uniquePlaces, conceptualPlan);
    
    // Фильтруем по стандартным критериям
    const filteredPlaces = this.filterPlaces(enrichedPlaces, filterParams);
    
    console.log(`🎯 Conceptual search result: ${filteredPlaces.length} places with concept matching`);
    return filteredPlaces;
  }

  /**
   * Создает план дня на основе концептуального плана
   */
  async createConceptualDayPlan(conceptualPlan, realPlaces, filterParams) {
    console.log('🎨 Creating conceptual day plan...');
    
    const dailyPlan = [];
    const usedPlaces = new Set();

    for (const conceptSlot of conceptualPlan.timeSlots) {
      console.log(`🎯 Processing conceptual slot ${conceptSlot.time} - ${conceptSlot.activity}`);
      
      // Находим места, подходящие для этого концептуального слота
      let suitablePlaces = realPlaces.filter(place => 
        place.conceptSlot === conceptSlot.time && 
        !usedPlaces.has(place.place_id)
      );

      // Если нет прямых совпадений, ищем по категории с высоким скором
      if (suitablePlaces.length === 0) {
        suitablePlaces = realPlaces.filter(place => 
          place.category === conceptSlot.category && 
          place.matchScore > 50 &&
          !usedPlaces.has(place.place_id)
        );
      }

      // Fallback к стандартному алгоритму
      if (suitablePlaces.length === 0) {
        suitablePlaces = realPlaces.filter(place => 
          place.category === conceptSlot.category && 
          !usedPlaces.has(place.place_id)
        );
      }

      if (suitablePlaces.length === 0) {
        console.log(`⚠️ No suitable places for conceptual slot ${conceptSlot.time}`);
        continue;
      }

      // Выбираем лучшее место (по концептуальному скору, затем по рейтингу)
      const selectedPlace = suitablePlaces.sort((a, b) => {
        if (a.matchScore && b.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return b.rating - a.rating;
      })[0];

      usedPlaces.add(selectedPlace.place_id);

      console.log(`✅ Selected for concept "${conceptSlot.activity}": ${selectedPlace.name} (score: ${selectedPlace.matchScore || 'N/A'})`);

      // Генерируем описание с учетом концепции
      const [description, tips] = await Promise.all([
        generateLocationDescription(
          selectedPlace.name,
          selectedPlace.address,
          selectedPlace.category,
          filterParams.interests,
          filterParams.audience
        ).catch(() => `${conceptSlot.description} at ${selectedPlace.name}.`),
        generateLocationTips(
          selectedPlace.name,
          selectedPlace.category,
          filterParams.interests,
          filterParams.audience
        ).catch(() => `Perfect for ${conceptSlot.activity.toLowerCase()}.`)
      ]);

      dailyPlan.push({
        time: conceptSlot.time,
        title: conceptSlot.activity, // Используем концептуальное название активности
        conceptualDescription: conceptSlot.description, // Добавляем концептуальное описание
        items: [{
          title: selectedPlace.name,
          why: this.cleanText(description),
          address: selectedPlace.address,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
          approx_cost: this.formatCost(selectedPlace.price_level, selectedPlace.category),
          tips: this.cleanText(tips),
          duration: this.getDuration(selectedPlace.category),
          photos: await this.getSimplePhotos(selectedPlace),
          rating: selectedPlace.rating,
          place_id: selectedPlace.place_id,
          source: 'google_places_conceptual',
          conceptualScore: selectedPlace.matchScore || 0
        }]
      });
    }

    console.log(`🎨 Conceptual day plan created with ${dailyPlan.length} activities`);
    return dailyPlan;
  }
}

module.exports = RealPlacesItineraryBuilder;

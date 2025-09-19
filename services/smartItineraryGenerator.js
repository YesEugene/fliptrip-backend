const OpenAI = require('openai');
const PlacesService = require('./placesService');

class SmartItineraryGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'mock-key-for-development'
    });
    this.placesService = new PlacesService();
  }

  /**
   * Анализ пользовательских предпочтений и бюджета
   */
  analyzeUserPreferences(interests, budget) {
    // Handle undefined or invalid budget values
    let totalBudget = parseInt(budget);
    if (isNaN(totalBudget) || totalBudget <= 0) {
      totalBudget = 100; // Default budget
      console.log(`Invalid budget "${budget}", using default: ${totalBudget}€`);
    }
    
    const numPlaces = 10; // 8-12 мест в день
    const budgetPerPlace = Math.floor(totalBudget / numPlaces);
    
    // Определяем приоритетные категории на основе интересов
    const interestToCategories = {
      // Взрослые интересы
      'Romantic': ['restaurant', 'park', 'attraction', 'cafe', 'bar'],
      'Culture & Arts': ['museum', 'gallery', 'theater', 'attraction', 'cafe'],
      'Adventure': ['park', 'attraction', 'bar', 'restaurant'],
      'Food & Drink': ['restaurant', 'cafe', 'bar', 'market'],
      'Shopping': ['shopping', 'market', 'cafe', 'restaurant'],
      'Nature': ['park', 'attraction', 'cafe'],
      'History': ['museum', 'attraction', 'cafe', 'restaurant'],
      'Nightlife': ['bar', 'restaurant', 'attraction'],
      'Photography': ['attraction', 'park', 'museum', 'cafe'],
      'Architecture': ['attraction', 'museum', 'park', 'cafe'],
      'Music': ['bar', 'attraction', 'restaurant', 'cafe'],
      'Sports': ['park', 'attraction', 'restaurant'],
      'Wellness': ['park', 'cafe', 'restaurant'],
      'Budget': ['cafe', 'park', 'attraction', 'market'],
      
      // Детские интересы
      'Kids - Fun': ['park', 'attraction', 'restaurant', 'cafe'],
      'Kids - Educational': ['museum', 'attraction', 'park', 'restaurant'],
      'Kids - Adventure': ['park', 'attraction', 'restaurant'],
      'Kids - Creative': ['museum', 'attraction', 'park', 'restaurant'],
      'Kids - Nature': ['park', 'attraction', 'restaurant'],
      'Kids - Games': ['attraction', 'park', 'restaurant']
    };

    // Проверяем, есть ли детские интересы
    const hasKidsInterests = interests.some(interest => interest.startsWith('Kids -'));
    
    // Определяем категории на основе интересов
    const priorityCategories = [];
    interests.forEach(interest => {
      if (interestToCategories[interest]) {
        priorityCategories.push(...interestToCategories[interest]);
      }
    });

    // Добавляем креативные категории для расширения поиска
    const creativeCategories = this.generateCreativeCategories(interests);
    priorityCategories.push(...creativeCategories);

    // Убираем дубликаты
    const uniqueCategories = [...new Set(priorityCategories)];
    
    // Если нет подходящих категорий, используем детские по умолчанию для детей
    const defaultCategories = hasKidsInterests 
      ? ['park', 'attraction', 'restaurant', 'cafe']
      : ['restaurant', 'cafe', 'museum', 'park', 'attraction'];
    
    return {
      budgetPerPlace,
      totalBudget,
      priorityCategories: uniqueCategories.length > 0 ? uniqueCategories : defaultCategories,
      budgetLevel: this.getBudgetLevel(totalBudget),
      isKidsTrip: hasKidsInterests,
      kidsInterests: hasKidsInterests ? interests.filter(i => i.startsWith('Kids -')) : []
    };
  }

  /**
   * Определение уровня бюджета
   */
  getBudgetLevel(budget) {
    if (budget <= 50) return 'budget';
    if (budget <= 150) return 'moderate';
    if (budget <= 300) return 'upscale';
    return 'luxury';
  }

  /**
   * Генерация креативных категорий на основе ассоциативного ряда (более точная логика)
   */
  generateCreativeCategories(interests) {
    const creativeMap = {
      'Music': {
        associations: ['creativity', 'emotion', 'rhythm', 'atmosphere', 'culture', 'art', 'experience'],
        categories: ['cafe', 'bar', 'restaurant', 'attraction', 'museum'] // Убрали слишком далекие ассоциации
      },
      'Romantic': {
        associations: ['intimacy', 'beauty', 'atmosphere', 'emotion', 'connection', 'elegance', 'charm'],
        categories: ['cafe', 'restaurant', 'park', 'attraction', 'museum', 'bar']
      },
      'Culture & Arts': {
        associations: ['creativity', 'beauty', 'history', 'tradition', 'inspiration', 'knowledge', 'aesthetics'],
        categories: ['museum', 'attraction', 'cafe', 'restaurant', 'park', 'bar']
      },
      'Adventure': {
        associations: ['excitement', 'discovery', 'challenge', 'exploration', 'energy', 'freedom', 'thrill'],
        categories: ['park', 'attraction', 'restaurant', 'cafe', 'bar']
      },
      'Food & Drink': {
        associations: ['taste', 'experience', 'culture', 'tradition', 'pleasure', 'social', 'discovery'],
        categories: ['restaurant', 'cafe', 'bar', 'attraction', 'park']
      },
      'Photography': {
        associations: ['beauty', 'perspective', 'light', 'composition', 'moment', 'art', 'creativity'],
        categories: ['attraction', 'park', 'museum', 'cafe', 'restaurant', 'bar']
      },
      'Architecture': {
        associations: ['design', 'beauty', 'history', 'structure', 'aesthetics', 'innovation', 'heritage'],
        categories: ['attraction', 'museum', 'park', 'cafe', 'restaurant', 'bar']
      },
      'Sports': {
        associations: ['energy', 'movement', 'competition', 'fitness', 'achievement', 'teamwork', 'strength'],
        categories: ['park', 'attraction', 'restaurant', 'cafe'] // Убрали слишком далекие ассоциации
      }
    };

    const primaryInterest = interests[0] || 'Romantic';
    const creativeData = creativeMap[primaryInterest] || creativeMap['Romantic'];
    
    console.log(`Creative associations for "${primaryInterest}":`, creativeData.associations);
    console.log(`Creative categories for "${primaryInterest}":`, creativeData.categories);
    
    return creativeData.categories;
  }

  /**
   * Умный поиск мест с учетом интересов и бюджета
   */
  async searchPlacesByInterests(city, interests, budgetPerPlace, priorityCategories, audience = 'him', totalBudget = 100) {
    const allPlaces = [];
    
    // Фильтруем категории для детей
    let filteredCategories = priorityCategories;
    if (audience === 'kids') {
      // Для детей исключаем бары и взрослые места
      filteredCategories = priorityCategories.filter(cat => 
        !['bar', 'nightclub', 'adult'].includes(cat)
      );
      console.log(`Filtered categories for kids:`, filteredCategories);
    }
    
    // Для каждой приоритетной категории ищем места
    for (const category of filteredCategories) {
      try {
        // Сначала пробуем поиск с основными интересами
        let places = await this.placesService.searchPlaces(city, category, interests);
        console.log(`Found ${places.length} places for category ${category} with main interests:`, places.map(p => p.name));
        
        // Если мест мало, пробуем ассоциативный поиск
        if (places.length < 3) {
          console.log(`Not enough places found, trying associative search...`);
          const associativePlaces = await this.searchWithAssociations(city, category, interests);
          places = [...places, ...associativePlaces];
          console.log(`After associative search: ${places.length} places`);
        }
        
        // Если все еще мало мест, пробуем поиск без интересов
        if (places.length < 3) {
          console.log(`Still not enough places, trying fallback search...`);
          const fallbackPlaces = await this.placesService.searchPlaces(city, category, []);
          places = [...places, ...fallbackPlaces];
          console.log(`After fallback search: ${places.length} places`);
        }
        
        // Для mock данных используем более мягкую фильтрацию
        let filteredPlaces;
        console.log(`Places before filtering: ${places.length}`);
        console.log(`First place:`, places[0]);
        
        if (places.length > 0 && places[0].name && places[0].name.includes('Local')) {
          // Это mock данные - используем мягкую фильтрацию
          console.log('Using mock data filtering');
          filteredPlaces = this.filterMockPlacesByBudget(places, totalBudget);
        } else {
          // Реальные данные - используем строгую фильтрацию
          console.log('Using real data filtering');
          filteredPlaces = this.filterPlacesByBudget(places, budgetPerPlace, totalBudget);
        }
        console.log(`After budget filter: ${filteredPlaces.length} places`);
        
        // Сортируем по рейтингу
        const sortedPlaces = filteredPlaces.sort((a, b) => b.rating - a.rating);
        
        // Берем топ-3 места из каждой категории для большего разнообразия
        const selectedPlaces = sortedPlaces.slice(0, 3);
        allPlaces.push(...selectedPlaces);
        console.log(`Selected ${selectedPlaces.length} places from ${category}`);
      } catch (error) {
        console.error(`Error searching places for category ${category}:`, error);
      }
    }

    console.log(`Total places found: ${allPlaces.length}`);
    return allPlaces;
  }

  /**
   * Получение сезонных событий для города и даты
   */
  async getSeasonalEvents(city, date) {
    const dateObj = new Date(date);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    
    // Сезонные события для разных городов
    const seasonalEvents = {
      'Moscow': {
        12: [
          { name: 'Christmas Market on Red Square', category: 'attraction', price_level: 1, rating: 4.5, address: 'Red Square, Moscow' },
          { name: 'Ice Skating at Gorky Park', category: 'attraction', price_level: 1, rating: 4.3, address: 'Gorky Park, Moscow' }
        ],
        1: [
          { name: 'New Year Celebrations', category: 'attraction', price_level: 0, rating: 4.7, address: 'Various locations, Moscow' }
        ],
        6: [
          { name: 'White Nights Festival', category: 'attraction', price_level: 0, rating: 4.6, address: 'Various locations, Moscow' }
        ]
      },
      'Barcelona': {
        4: [
          { name: 'Sant Jordi Festival', category: 'attraction', price_level: 0, rating: 4.8, address: 'Various locations, Barcelona' }
        ],
        9: [
          { name: 'La Mercè Festival', category: 'attraction', price_level: 0, rating: 4.7, address: 'Various locations, Barcelona' }
        ],
        6: [
          { name: 'Sónar Music Festival', category: 'attraction', price_level: 3, rating: 4.5, address: 'Various locations, Barcelona' }
        ]
      },
      'Lisbon': {
        6: [
          { name: 'Santo António Festival', category: 'attraction', price_level: 0, rating: 4.6, address: 'Various locations, Lisbon' }
        ],
        9: [
          { name: 'Lisbon Book Fair', category: 'attraction', price_level: 0, rating: 4.4, address: 'Parque Eduardo VII, Lisbon' }
        ]
      },
      'Paris': {
        4: [
          { name: 'Cherry Blossom Season', category: 'attraction', price_level: 0, rating: 4.8, address: 'Parc de Sceaux, Paris' }
        ],
        7: [
          { name: 'Bastille Day Celebrations', category: 'attraction', price_level: 0, rating: 4.7, address: 'Champs-Élysées, Paris' }
        ],
        12: [
          { name: 'Christmas Markets', category: 'attraction', price_level: 1, rating: 4.5, address: 'Various locations, Paris' }
        ]
      },
      'Rome': {
        4: [
          { name: 'Easter Celebrations', category: 'attraction', price_level: 0, rating: 4.8, address: 'Vatican City, Rome' }
        ],
        6: [
          { name: 'Estate Romana Festival', category: 'attraction', price_level: 1, rating: 4.4, address: 'Various locations, Rome' }
        ]
      }
    };

    const cityEvents = seasonalEvents[city];
    if (!cityEvents) return [];

    const monthEvents = cityEvents[month] || [];
    
    // Фильтруем события по дню (если есть специфичные события)
    const dayEvents = monthEvents.filter(event => {
      // Здесь можно добавить логику для конкретных дней
      return true;
    });

    return dayEvents.map(event => ({
      ...event,
      place_id: `seasonal_${city}_${month}_${day}_${event.name.replace(/\s+/g, '_')}`,
      user_ratings_total: Math.floor(Math.random() * 100) + 50,
      types: ['seasonal_event', 'attraction'],
      photos: []
    }));
  }

  /**
   * Ассоциативный поиск мест на основе интересов
   */
  async searchWithAssociations(city, category, interests) {
    const creativeMap = {
      'Music': {
        associations: ['jazz', 'live music', 'concert', 'acoustic', 'vinyl', 'record', 'studio', 'performance'],
        categories: ['cafe', 'restaurant', 'bar', 'attraction', 'museum']
      },
      'Romantic': {
        associations: ['intimate', 'cozy', 'charming', 'elegant', 'beautiful', 'scenic', 'quiet', 'romantic'],
        categories: ['cafe', 'restaurant', 'park', 'attraction', 'museum', 'bar']
      },
      'Culture & Arts': {
        associations: ['art', 'gallery', 'exhibition', 'cultural', 'historic', 'traditional', 'creative', 'artistic'],
        categories: ['museum', 'attraction', 'cafe', 'restaurant', 'park', 'bar']
      },
      'Sports': {
        associations: ['fitness', 'gym', 'sport', 'active', 'outdoor', 'running', 'cycling', 'athletic'],
        categories: ['park', 'attraction', 'restaurant', 'cafe']
      },
      'Food & Drink': {
        associations: ['gourmet', 'cuisine', 'local', 'traditional', 'authentic', 'specialty', 'craft', 'artisanal'],
        categories: ['restaurant', 'cafe', 'bar', 'attraction', 'park']
      },
      'Nature': {
        associations: ['green', 'garden', 'park', 'outdoor', 'natural', 'scenic', 'peaceful', 'tranquil'],
        categories: ['park', 'attraction', 'cafe', 'restaurant']
      },
      'Shopping': {
        associations: ['boutique', 'local', 'artisan', 'craft', 'unique', 'vintage', 'designer', 'market'],
        categories: ['shopping', 'cafe', 'restaurant', 'attraction']
      },
      'Nightlife': {
        associations: ['bar', 'club', 'night', 'evening', 'cocktail', 'dance', 'party', 'social'],
        categories: ['bar', 'restaurant', 'cafe', 'attraction']
      }
    };

    const allPlaces = [];
    
    for (const interest of interests) {
      const creativeData = creativeMap[interest];
      if (!creativeData) continue;
      
      // Пробуем поиск с ассоциативными терминами
      for (const association of creativeData.associations.slice(0, 3)) { // Берем только первые 3 ассоциации
        try {
          const places = await this.placesService.searchPlaces(city, category, [association]);
          allPlaces.push(...places);
          console.log(`Found ${places.length} places with association "${association}"`);
        } catch (error) {
          console.log(`Error searching with association "${association}":`, error.message);
        }
      }
    }
    
    // Убираем дубликаты
    const uniquePlaces = allPlaces.filter((place, index, self) => 
      index === self.findIndex(p => p.place_id === place.place_id)
    );
    
    return uniquePlaces;
  }

  /**
   * Фильтрация mock мест по бюджету (более мягкая)
   */
  filterMockPlacesByBudget(places, totalBudget) {
    return places.filter(place => {
      if (place.price_level !== undefined) {
        const priceLevelCost = this.getPriceLevelCost(place.price_level, place.category);
        
        // Очень мягкая фильтрация для mock данных
        if (totalBudget <= 50) {
          return priceLevelCost <= 15; // Очень дешевые места
        } else if (totalBudget <= 100) {
          return priceLevelCost <= 25; // Дешевые и средние места
        } else if (totalBudget <= 200) {
          return priceLevelCost <= 40; // Средние места
        } else {
          return priceLevelCost <= 60; // Все места кроме очень дорогих
        }
      }
      
      // Если нет price_level, разрешаем все места
      return true;
    });
  }

  /**
   * Фильтрация мест по бюджету с умной логикой
   */
  filterPlacesByBudget(places, budgetPerPlace, totalBudget) {
    return places.filter(place => {
      // Если у места есть price_level, используем его
      if (place.price_level !== undefined) {
        const priceLevelCost = this.getPriceLevelCost(place.price_level, place.category);
        
        // Умная логика в зависимости от бюджета
        if (totalBudget <= 100) {
          // Низкий бюджет - более строгий контроль, приоритет дешевым местам
          return priceLevelCost <= budgetPerPlace * 1.5;
        } else if (totalBudget <= 300) {
          // Средний бюджет - умеренный контроль
          return priceLevelCost <= budgetPerPlace * 2;
        } else {
          // Высокий бюджет - более мягкий контроль, приоритет качеству
          return priceLevelCost <= budgetPerPlace * 3;
        }
      }
      
      // Для mock данных без price_level - более мягкая фильтрация
      // Разрешаем все места, но приоритизируем по рейтингу
      return true;
    });
  }

  /**
   * Конвертация price_level в реалистичную стоимость с учетом категории
   * Основано на реальных данных Google Places API price_level
   */
  getPriceLevelCost(priceLevel, category = 'attraction') {
    // Реалистичные диапазоны цен для каждого price_level (в евро)
    const priceLevelRanges = {
      0: { min: 0, max: 5 },    // Бесплатно или очень дешево (0-5€)
      1: { min: 5, max: 15 },   // Дешево (5-15€)
      2: { min: 15, max: 30 },  // Умеренно (15-30€)
      3: { min: 30, max: 60 },  // Дорого (30-60€)
      4: { min: 60, max: 120 }  // Очень дорого (60-120€)
    };
    
    const range = priceLevelRanges[priceLevel] || priceLevelRanges[2];
    
    // Корректируем диапазон в зависимости от категории
    const categoryAdjustments = {
      'cafe': { min: 0.5, max: 0.8 },      // Кафе: 50-80% от базового диапазона
      'restaurant': { min: 1.0, max: 1.5 }, // Рестораны: 100-150% от базового диапазона
      'bar': { min: 0.8, max: 1.2 },       // Бары: 80-120% от базового диапазона
      'museum': { min: 0.6, max: 1.0 },    // Музеи: 60-100% от базового диапазона
      'attraction': { min: 0.8, max: 1.2 }, // Достопримечательности: 80-120% от базового диапазона
      'park': { min: 0.2, max: 0.5 },      // Парки: 20-50% от базового диапазона (часто бесплатно)
      'shopping': { min: 0.9, max: 1.3 }   // Шопинг: 90-130% от базового диапазона
    };
    
    const adjustment = categoryAdjustments[category] || { min: 1.0, max: 1.0 };
    
    // Вычисляем скорректированный диапазон
    const adjustedMin = Math.round(range.min * adjustment.min);
    const adjustedMax = Math.round(range.max * adjustment.max);
    
    // Выбираем случайную цену в диапазоне (для разнообразия)
    const randomPrice = Math.floor(Math.random() * (adjustedMax - adjustedMin + 1)) + adjustedMin;
    
    return Math.max(1, randomPrice); // Минимум €1
  }

  /**
   * Оптимизация маршрута по расстоянию и логике
   */
  optimizeRoute(places, city) {
    if (places.length === 0) return [];

    // Определяем стартовую и конечную точки
    const startPoint = this.getStartPoint(places, city);
    const endPoint = this.getEndPoint(places, city);

    // Группируем места по времени дня
    const timeGroups = this.groupPlacesByTime(places);

    // Создаем оптимизированный маршрут
    const optimizedRoute = [];
    
    // Утренние активности (8:00-12:00)
    if (timeGroups.morning.length > 0) {
      optimizedRoute.push(...this.optimizeGroup(timeGroups.morning, startPoint, 'morning'));
    }

    // Дневные активности (12:00-18:00)
    if (timeGroups.afternoon.length > 0) {
      optimizedRoute.push(...this.optimizeGroup(timeGroups.afternoon, optimizedRoute[optimizedRoute.length - 1], 'afternoon'));
    }

    // Вечерние активности (18:00-22:00)
    if (timeGroups.evening.length > 0) {
      optimizedRoute.push(...this.optimizeGroup(timeGroups.evening, optimizedRoute[optimizedRoute.length - 1], 'evening'));
    }

    return optimizedRoute;
  }

  /**
   * Группировка мест по времени дня
   */
  groupPlacesByTime(places) {
    const groups = {
      morning: [],
      afternoon: [],
      evening: []
    };

    places.forEach(place => {
      const category = place.category;
      
      if (['cafe', 'restaurant'].includes(category)) {
        // Кафе и рестораны могут быть в любое время, но приоритет утром/днем
        groups.morning.push(place);
      } else if (['museum', 'attraction', 'park', 'shopping'].includes(category)) {
        groups.afternoon.push(place);
      } else if (['bar'].includes(category)) {
        groups.evening.push(place);
      } else {
        groups.afternoon.push(place);
      }
    });

    return groups;
  }

  /**
   * Оптимизация группы мест с учетом расстояния
   */
  optimizeGroup(places, startPoint, timeOfDay) {
    if (places.length === 0) return [];
    
    // Если только одно место, возвращаем его
    if (places.length === 1) return places;
    
    // Сортируем по рейтингу как fallback
    const sortedByRating = places.sort((a, b) => b.rating - a.rating);
    
    // Простая оптимизация маршрута: начинаем с ближайшего к стартовой точке
    const optimized = [];
    const remaining = [...sortedByRating];
    
    // Находим ближайшее место к стартовой точке
    let currentPoint = startPoint;
    
    while (remaining.length > 0) {
      // Находим ближайшее место к текущей точке
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(currentPoint, remaining[0]);
      
      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(currentPoint, remaining[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }
      
      // Добавляем ближайшее место в маршрут
      const nearestPlace = remaining.splice(nearestIndex, 1)[0];
      optimized.push(nearestPlace);
      currentPoint = nearestPlace;
    }
    
    return optimized;
  }

  /**
   * Простой расчет расстояния между двумя точками (в километрах)
   * Использует формулу гаверсинуса для расчета расстояния по координатам
   */
  calculateDistance(point1, point2) {
    // Если у мест нет координат, используем случайное расстояние
    if (!point1.geometry || !point2.geometry) {
      return Math.random() * 5; // Случайное расстояние 0-5 км
    }
    
    const lat1 = point1.geometry.location.lat;
    const lon1 = point1.geometry.location.lng;
    const lat2 = point2.geometry.location.lat;
    const lon2 = point2.geometry.location.lng;
    
    const R = 6371; // Радиус Земли в километрах
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Расстояние в километрах
    
    return distance;
  }

  /**
   * Конвертация градусов в радианы
   */
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Определение стартовой точки
   */
  getStartPoint(places, city) {
    // Ищем кафе или ресторан для завтрака
    const breakfastPlace = places.find(p => 
      p.category === 'cafe' || p.category === 'restaurant'
    );
    
    return breakfastPlace || places[0];
  }

  /**
   * Определение конечной точки
   */
  getEndPoint(places, city) {
    // Ищем бар или ресторан для ужина
    const dinnerPlace = places.find(p => 
      p.category === 'bar' || p.category === 'restaurant'
    );
    
    return dinnerPlace || places[places.length - 1];
  }

  /**
   * Валидация бюджета
   */
  validateBudget(itinerary, totalBudget) {
    const totalCost = itinerary.reduce((sum, place) => {
      return sum + this.getPriceLevelCost(place.price_level || 2, place.category);
    }, 0);

    const budgetRatio = totalCost / totalBudget;
    
    return {
      totalCost,
      totalBudget,
      budgetRatio,
      isWithinBudget: budgetRatio <= 1.1, // 10% допуск
      needsAdjustment: budgetRatio > 1.2
    };
  }

  /**
   * Основная функция генерации умного маршрута
   */
  async generateSmartItinerary(city, audience, interests, date, budget) {
    try {
      console.log(`Generating smart itinerary for: ${city}, budget: ${budget}€, interests: ${interests.join(', ')}`);

      // 1. Анализ пользовательских предпочтений
      const preferences = this.analyzeUserPreferences(interests, budget);
      console.log('User preferences:', preferences);

      // 2. Проверка сезонных событий
      const seasonalEvents = await this.getSeasonalEvents(city, date);
      console.log('Seasonal events:', seasonalEvents);

      // 3. Поиск мест с учетом интересов и бюджета
      const places = await this.searchPlacesByInterests(
        city, 
        interests, 
        preferences.budgetPerPlace, 
        preferences.priorityCategories,
        audience,
        preferences.totalBudget
      );
      console.log(`Found ${places.length} places`);

      // 4. Добавление сезонных событий к местам
      if (seasonalEvents.length > 0) {
        places.push(...seasonalEvents);
        console.log(`Added ${seasonalEvents.length} seasonal events`);
      }

      // 5. Оптимизация маршрута
      const optimizedPlaces = this.optimizeRoute(places, city);
      console.log(`Optimized to ${optimizedPlaces.length} places`);

      // 6. Валидация бюджета
      const budgetValidation = this.validateBudget(optimizedPlaces, preferences.totalBudget);
      console.log('Budget validation:', budgetValidation);

      // 7. Генерация финального маршрута через OpenAI
      const finalItinerary = await this.generateFinalItinerary(
        city, 
        audience, 
        interests, 
        date, 
        budget, 
        optimizedPlaces, 
        preferences,
        seasonalEvents
      );

      return finalItinerary;

    } catch (error) {
      console.error('Error generating smart itinerary:', error);
      throw error;
    }
  }

  /**
   * Генерация финального маршрута через OpenAI
   */
  async generateFinalItinerary(city, audience, interests, date, budget, places, preferences, seasonalEvents = []) {
    const prompt = this.generateSmartItineraryPrompt(
      city, 
      audience, 
      interests, 
      date, 
      budget, 
      places, 
      preferences
    );

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key-for-development') {
      return await this.getMockSmartItinerary(city, audience, interests, date, places, preferences);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const responseContent = completion.choices[0].message.content;
      return JSON.parse(responseContent);
    } catch (error) {
      console.error('Error generating final itinerary:', error);
      return await this.getMockSmartItinerary(city, audience, interests, date, places, preferences);
    }
  }

  /**
   * Промпт для умной генерации маршрута
   */
  generateSmartItineraryPrompt(city, audience, interests, date, budget, places, preferences, seasonalEvents = []) {
    const isKidsTrip = preferences.isKidsTrip;
    const specialInstructions = isKidsTrip 
      ? `\nSPECIAL INSTRUCTIONS FOR KIDS TRIP:
- This is a family trip with children
- Focus on child-friendly activities and venues
- Shorter duration per location (30-60 minutes max)
- Include playgrounds, interactive museums, and family restaurants
- Avoid bars and adult-only venues
- Consider nap times and meal schedules for children
- Make activities educational and fun for kids`
      : '';

    return `Create an intelligent day plan for ${city} based on user preferences and budget optimization.

USER PROFILE:
- City: ${city}
- Audience: ${audience}
- Interests: ${interests.join(', ')}
- Date: ${date}
- Budget: ${budget}€ (${preferences.budgetLevel} level)
- Budget per place: ${preferences.budgetPerPlace}€
- Trip type: ${isKidsTrip ? 'Family trip with children' : 'Adult trip'}${specialInstructions}

OPTIMIZED PLACES (selected based on interests, ratings, and budget):
${places.map((place, index) => 
  `${index + 1}. ${place.name} (${place.category})
   - Address: ${place.address}
   - Rating: ${place.rating}/5
   - Price Level: ${place.price_level}/4 (≈${this.getPriceLevelCost(place.price_level)}€)
   - Category: ${place.category}`
).join('\n')}

${seasonalEvents.length > 0 ? `\nSEASONAL EVENTS (special events happening on ${date}):
${seasonalEvents.map((event, index) => 
  `${index + 1}. ${event.name} (${event.category})
   - Address: ${event.address}
   - Rating: ${event.rating}/5
   - Price Level: ${event.price_level}/4 (≈${this.getPriceLevelCost(event.price_level)}€)
   - Special: Seasonal event`
).join('\n')}

IMPORTANT: Consider including seasonal events in the itinerary as they are unique to this specific date!` : ''}

REQUIREMENTS:
1. Create 8-10 time blocks from 08:00 to 22:30
2. Use ONLY the places provided above
3. Ensure total cost stays within ${budget}€ budget
4. Logical flow: breakfast → morning activities → lunch → afternoon activities → dinner → evening activities
5. Consider travel time between locations
6. Match activities to time of day (museums during day, bars in evening)
7. Ensure places are open during scheduled times

OUTPUT FORMAT:
{
  "city": "${city}",
  "date": "${date}",
  "meta": {
    "creative_title": "Emotional title based on interests and city",
    "creative_subtitle": "Inspiring subtitle describing the day experience",
    "total_estimated_cost": "Total cost in euros",
    "budget_utilization": "Percentage of budget used",
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
        "time": "08:00 — Morning Start",
        "items": [{
          "title": "Place name from list above",
          "why": "Why this place is perfect for this person and time",
          "address": "Exact address from place data",
          "approx_cost": "Estimated cost in euros",
          "tips": "Practical tips and insider knowledge",
          "duration": "Recommended duration",
          "photo": "Photo URL if available"
        }]
      }
    ]
  }]
}`;
  }

  /**
   * Генерация яркого заголовка на основе промптов
   */
  async generateBrightTitle(city, audience, interests, date) {
    const interestsText = interests.join(', ');
    
    // Используем OpenAI для генерации заголовка по промпту
    const prompt = `Напиши короткий и вдохновляющий заголовок для маршрута дня. Он должен содержать название города и отразить выбранные интересы, быть ёмким и цепляющим, максимум одно предложение.

Город: ${city}
Интересы: ${interestsText}

Создай вдохновляющий заголовок на английском языке.`;
    
    try {
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock-key-for-development') {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 100,
        });
        return completion.choices[0].message.content.trim();
      }
    } catch (error) {
      console.log('OpenAI error for title generation, using fallback:', error.message);
    }
    
    // Fallback заголовки если OpenAI недоступен
    const fallbackTitles = {
      'him': {
        'Music': `Musical Soul in ${city}`,
        'Romantic': `Romantic Escape in ${city}`,
        'Culture & Arts': `Cultural Discovery in ${city}`,
        'Sports': `Active Adventure in ${city}`,
        'Food & Drink': `Culinary Journey in ${city}`,
        'Nature': `Natural Escape in ${city}`,
        'Shopping': `Urban Explorer in ${city}`,
        'Nightlife': `Night Vibes in ${city}`,
        'seasonal': `Seasonal Magic in ${city}`,
        'luxury': `Luxury Experience in ${city}`,
        'adventure': `Adventure Quest in ${city}`,
        'wellness': `Wellness Retreat in ${city}`,
        'photography': `Photographic Journey in ${city}`,
        'architecture': `Architectural Wonders in ${city}`,
        'history': `Historical Discovery in ${city}`,
        'budget': `Smart Explorer in ${city}`
      },
      'her': {
        'Music': `Melodic Moments in ${city}`,
        'Romantic': `Romantic Getaway in ${city}`,
        'Culture & Arts': `Artistic Exploration in ${city}`,
        'Sports': `Energetic Day in ${city}`,
        'Food & Drink': `Gourmet Experience in ${city}`,
        'Nature': `Serene Nature in ${city}`,
        'Shopping': `Style Discovery in ${city}`,
        'Nightlife': `Evening Elegance in ${city}`,
        'seasonal': `Seasonal Beauty in ${city}`,
        'luxury': `Luxury Indulgence in ${city}`,
        'adventure': `Adventure Spirit in ${city}`,
        'wellness': `Wellness Journey in ${city}`,
        'photography': `Photographic Art in ${city}`,
        'architecture': `Architectural Elegance in ${city}`,
        'history': `Historical Romance in ${city}`,
        'budget': `Smart Style in ${city}`
      },
      'couple': {
        'Music': `Harmonious Day in ${city}`,
        'Romantic': `Romantic Rendezvous in ${city}`,
        'Culture & Arts': `Cultural Journey Together in ${city}`,
        'Sports': `Active Bonding in ${city}`,
        'Food & Drink': `Culinary Romance in ${city}`,
        'Nature': `Natural Connection in ${city}`,
        'Shopping': `Shared Discoveries in ${city}`,
        'Nightlife': `Evening Together in ${city}`,
        'seasonal': `Seasonal Romance in ${city}`,
        'luxury': `Luxury Together in ${city}`,
        'adventure': `Adventure Duo in ${city}`,
        'wellness': `Wellness Bond in ${city}`,
        'photography': `Photographic Love in ${city}`,
        'architecture': `Architectural Romance in ${city}`,
        'history': `Historical Love Story in ${city}`,
        'budget': `Smart Couple in ${city}`
      },
      'kids': {
        'Music': `Fun Musical Adventure in ${city}`,
        'Romantic': `Magical Day in ${city}`,
        'Culture & Arts': `Wonderful Discovery in ${city}`,
        'Sports': `Exciting Adventure in ${city}`,
        'Food & Drink': `Tasty Adventure in ${city}`,
        'Nature': `Nature Explorer in ${city}`,
        'Shopping': `Treasure Hunt in ${city}`,
        'Nightlife': `Evening Fun in ${city}`
      }
    };
    
    const primaryInterest = interests[0] || 'Romantic';
    return fallbackTitles[audience]?.[primaryInterest] || `Perfect Day in ${city}`;
  }

  /**
   * Генерация советов для локации на основе реальных данных
   */
  generateLocationTips(place, category, interest) {
    // Собираем информацию о месте для промпта
    const placeInfo = {
      name: place.name,
      category: category,
      rating: place.rating || 'N/A',
      address: place.address || 'N/A',
      user_ratings_total: place.user_ratings_total || 0,
      price_level: place.price_level || 'N/A',
      types: place.types ? place.types.join(', ') : 'N/A'
    };

    // Используем OpenAI для генерации советов на основе реальных данных
    const prompt = `Напиши 1–2 коротких совета для посещения локации. Тон дружеский, лёгкий, чуть поэтичный. Советы должны создавать настроение путешествия и показывать заботу о пользователе.

Информация о месте:
- Название: ${placeInfo.name}
- Категория: ${placeInfo.category}
- Рейтинг: ${placeInfo.rating}/5 (${placeInfo.user_ratings_total} отзывов)
- Адрес: ${placeInfo.address}
- Уровень цен: ${placeInfo.price_level}/4
- Типы: ${placeInfo.types}
- Интересы пользователя: ${interest}

Создай дружеские советы на английском языке.`;
    
    try {
      // Здесь должен быть вызов OpenAI API
      // const response = await this.callOpenAI(prompt);
      // return response.choices[0].message.content;
      
      // Пока используем fallback с реальными данными
      return this.generateFallbackTips(placeInfo, interest);
    } catch (error) {
      console.log('OpenAI error, using fallback:', error.message);
      return this.generateFallbackTips(placeInfo, interest);
    }
  }

  /**
   * Fallback советы на основе реальных данных
   */
  generateFallbackTips(placeInfo, interest) {
    const ratingText = placeInfo.rating !== 'N/A' ? ` (rated ${placeInfo.rating}/5)` : '';
    const priceText = placeInfo.price_level !== 'N/A' ? ` with ${placeInfo.price_level}/4 price level` : '';
    
    // Создаем более дружеские и поэтичные советы в зависимости от категории
    const categoryTips = {
      'cafe': `Arrive early to ${placeInfo.name}${ratingText} to enjoy the morning atmosphere and find the perfect spot for your ${interest} experience${priceText}. The early hours offer the most authentic local vibe.`,
      'restaurant': `Make a reservation at ${placeInfo.name}${ratingText} to secure the best table for your ${interest} dining experience${priceText}. The evening ambiance is particularly magical.`,
      'museum': `Plan to spend at least an hour at ${placeInfo.name}${ratingText} to fully appreciate the ${interest} exhibits${priceText}. The quiet morning hours offer the most peaceful exploration.`,
      'park': `Visit ${placeInfo.name}${ratingText} during golden hour for the most beautiful ${interest} experience${priceText}. Bring a camera to capture the magical moments.`,
      'attraction': `Check the opening hours of ${placeInfo.name}${ratingText} before visiting to ensure the best ${interest} experience${priceText}. Weekday mornings are usually less crowded.`
    };
    
    return categoryTips[placeInfo.category] || 
           `Visit ${placeInfo.name}${ratingText} for an authentic ${interest} experience${priceText}. Take your time to fully appreciate the atmosphere and create lasting memories.`;
  }

  /**
   * Генерация блока погоды
   */
  async generateWeatherBlock(city, date) {
    // Используем OpenAI для генерации погоды по промпту
    const prompt = `Сформулируй 2 коротких предложения о погоде в выбранном городе и дате. Дай конкретный совет, что надеть, чтобы чувствовать себя комфортно весь день. Используй лёгкий, дружеский тон.

Город: ${city}
Дата: ${date}

Создай описание погоды на английском языке.`;
    
    try {
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock-key-for-development') {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 150,
        });
        const description = completion.choices[0].message.content.trim();
        
        // Генерируем базовые данные о температуре на основе сезона
        const dateObj = new Date(date);
        const month = dateObj.getMonth() + 1;
        let season = 'spring';
        if (month >= 3 && month <= 5) season = 'spring';
        else if (month >= 6 && month <= 8) season = 'summer';
        else if (month >= 9 && month <= 11) season = 'autumn';
        else season = 'winter';
        
        const tempRanges = {
          'spring': { t_min: 10, t_max: 20 },
          'summer': { t_min: 20, t_max: 30 },
          'autumn': { t_min: 10, t_max: 20 },
          'winter': { t_min: 0, t_max: 10 }
        };
        
        const temps = tempRanges[season] || { t_min: 15, t_max: 25 };
        
        return {
          ...temps,
          precip_prob: Math.floor(Math.random() * 50) + 10,
          description: description
        };
      }
    } catch (error) {
      console.log('OpenAI error for weather generation, using fallback:', error.message);
    }
    
    // Fallback погода если OpenAI недоступен
    const weatherData = {
      'Moscow': {
        'spring': { t_min: 5, t_max: 15, precip_prob: 40, description: 'Spring brings mild temperatures with occasional rain showers. Perfect for exploring the city with light layers.' },
        'summer': { t_min: 15, t_max: 25, precip_prob: 30, description: 'Summer offers warm, pleasant weather ideal for outdoor activities. Light clothing and sun protection recommended.' },
        'autumn': { t_min: 5, t_max: 15, precip_prob: 50, description: 'Autumn brings cool, crisp air with beautiful foliage. Layered clothing and a light jacket will keep you comfortable.' },
        'winter': { t_min: -10, t_max: 0, precip_prob: 60, description: 'Winter is cold and snowy, perfect for experiencing the city\'s magical winter atmosphere. Warm, insulated clothing is essential.' }
      },
      'Barcelona': {
        'spring': { t_min: 12, t_max: 20, precip_prob: 35, description: 'Spring in Barcelona is mild and pleasant, perfect for strolling through the city. Light layers and comfortable shoes recommended.' },
        'summer': { t_min: 20, t_max: 30, precip_prob: 20, description: 'Summer brings warm, sunny weather perfect for beach visits and outdoor dining. Light, breathable clothing and sun protection essential.' },
        'autumn': { t_min: 15, t_max: 22, precip_prob: 40, description: 'Autumn offers comfortable temperatures with occasional rain. A light jacket and umbrella will keep you prepared.' },
        'winter': { t_min: 8, t_max: 16, precip_prob: 45, description: 'Winter is mild and pleasant, perfect for exploring without heavy winter gear. Light layers and a light jacket sufficient.' }
      },
      'Lisbon': {
        'spring': { t_min: 12, t_max: 20, precip_prob: 35, description: 'Spring in Lisbon is mild and pleasant, perfect for exploring the city. Light layers and comfortable shoes recommended.' },
        'summer': { t_min: 20, t_max: 28, precip_prob: 15, description: 'Summer brings warm, sunny weather perfect for outdoor activities. Light, breathable clothing and sun protection essential.' },
        'autumn': { t_min: 15, t_max: 22, precip_prob: 40, description: 'Autumn offers comfortable temperatures with occasional rain. A light jacket and umbrella will keep you prepared.' },
        'winter': { t_min: 8, t_max: 16, precip_prob: 45, description: 'Winter is mild and pleasant, perfect for exploring without heavy winter gear. Light layers and a light jacket sufficient.' }
      },
      'Paris': {
        'spring': { t_min: 8, t_max: 18, precip_prob: 40, description: 'Spring in Paris is mild with occasional showers. Perfect for romantic walks with an umbrella and light layers.' },
        'summer': { t_min: 15, t_max: 25, precip_prob: 30, description: 'Summer offers pleasant weather ideal for outdoor cafes and sightseeing. Light clothing and comfortable walking shoes recommended.' },
        'autumn': { t_min: 8, t_max: 16, precip_prob: 50, description: 'Autumn brings crisp air and beautiful foliage. Layered clothing and a light jacket will keep you comfortable.' },
        'winter': { t_min: 2, t_max: 8, precip_prob: 60, description: 'Winter is cool and occasionally rainy. Warm layers and waterproof clothing recommended for comfortable exploration.' }
      },
      'Rome': {
        'spring': { t_min: 10, t_max: 20, precip_prob: 35, description: 'Spring in Rome is mild and pleasant, perfect for exploring ancient sites. Light layers and comfortable walking shoes recommended.' },
        'summer': { t_min: 20, t_max: 30, precip_prob: 20, description: 'Summer brings warm, sunny weather perfect for outdoor activities. Light, breathable clothing and sun protection essential.' },
        'autumn': { t_min: 12, t_max: 22, precip_prob: 40, description: 'Autumn offers comfortable temperatures with occasional rain. A light jacket and umbrella will keep you prepared.' },
        'winter': { t_min: 5, t_max: 15, precip_prob: 45, description: 'Winter is mild and pleasant, perfect for exploring without heavy winter gear. Light layers and a light jacket sufficient.' }
      },
      'Venice': {
        'spring': { t_min: 10, t_max: 18, precip_prob: 45, description: 'Spring in Venice brings mild temperatures with occasional rain. Perfect for romantic gondola rides with an umbrella and light layers.' },
        'summer': { t_min: 18, t_max: 28, precip_prob: 25, description: 'Summer offers warm, sunny weather perfect for exploring canals and outdoor dining. Light, breathable clothing and sun protection essential.' },
        'autumn': { t_min: 12, t_max: 20, precip_prob: 50, description: 'Autumn brings comfortable temperatures with occasional rain. A light jacket and umbrella will keep you prepared for canal exploration.' },
        'winter': { t_min: 3, t_max: 12, precip_prob: 55, description: 'Winter is cool and occasionally foggy, perfect for experiencing Venice\'s magical atmosphere. Warm layers and waterproof clothing recommended.' }
      },
      'Amsterdam': {
        'spring': { t_min: 8, t_max: 16, precip_prob: 50, description: 'Spring in Amsterdam brings mild temperatures with frequent rain showers. Perfect for exploring canals with an umbrella and light layers.' },
        'summer': { t_min: 16, t_max: 24, precip_prob: 35, description: 'Summer offers pleasant weather ideal for cycling and outdoor activities. Light clothing and comfortable walking shoes recommended.' },
        'autumn': { t_min: 8, t_max: 16, precip_prob: 60, description: 'Autumn brings cool, crisp air with beautiful foliage. Layered clothing and a light jacket will keep you comfortable.' },
        'winter': { t_min: 2, t_max: 8, precip_prob: 65, description: 'Winter is cool and frequently rainy. Warm layers and waterproof clothing essential for comfortable exploration.' }
      },
      'Prague': {
        'spring': { t_min: 8, t_max: 18, precip_prob: 40, description: 'Spring in Prague is mild with occasional showers. Perfect for exploring historic sites with an umbrella and light layers.' },
        'summer': { t_min: 16, t_max: 26, precip_prob: 30, description: 'Summer offers warm, pleasant weather ideal for outdoor activities and sightseeing. Light clothing and comfortable walking shoes recommended.' },
        'autumn': { t_min: 8, t_max: 16, precip_prob: 50, description: 'Autumn brings crisp air and beautiful foliage. Layered clothing and a light jacket will keep you comfortable.' },
        'winter': { t_min: -2, t_max: 6, precip_prob: 60, description: 'Winter is cold and occasionally snowy, perfect for experiencing Prague\'s magical winter atmosphere. Warm, insulated clothing is essential.' }
      },
      'Berlin': {
        'spring': { t_min: 8, t_max: 18, precip_prob: 40, description: 'Spring in Berlin is mild with occasional showers. Perfect for exploring the city with light layers and an umbrella.' },
        'summer': { t_min: 16, t_max: 26, precip_prob: 30, description: 'Summer offers warm, pleasant weather ideal for outdoor activities and sightseeing. Light clothing and comfortable walking shoes recommended.' },
        'autumn': { t_min: 8, t_max: 16, precip_prob: 50, description: 'Autumn brings crisp air and beautiful foliage. Layered clothing and a light jacket will keep you comfortable.' },
        'winter': { t_min: -1, t_max: 6, precip_prob: 60, description: 'Winter is cool and occasionally snowy, perfect for experiencing Berlin\'s winter charm. Warm layers and waterproof clothing recommended.' }
      },
      'Vienna': {
        'spring': { t_min: 8, t_max: 18, precip_prob: 40, description: 'Spring in Vienna is mild with occasional showers. Perfect for exploring imperial sites with light layers and an umbrella.' },
        'summer': { t_min: 16, t_max: 26, precip_prob: 30, description: 'Summer offers warm, pleasant weather ideal for outdoor activities and sightseeing. Light clothing and comfortable walking shoes recommended.' },
        'autumn': { t_min: 8, t_max: 16, precip_prob: 50, description: 'Autumn brings crisp air and beautiful foliage. Layered clothing and a light jacket will keep you comfortable.' },
        'winter': { t_min: -1, t_max: 6, precip_prob: 60, description: 'Winter is cool and occasionally snowy, perfect for experiencing Vienna\'s winter elegance. Warm layers and waterproof clothing recommended.' }
      }
    };

    const dateObj = new Date(date);
    const month = dateObj.getMonth() + 1;
    let season = 'spring';
    if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'autumn';
    else season = 'winter';

    return weatherData[city]?.[season] || {
      t_min: 15,
      t_max: 25,
      precip_prob: 30,
      description: 'Perfect weather for exploring the city. Light, comfortable clothing recommended.'
    };
  }

  /**
   * Генерация советов по одежде
   */
  generateClothingAdvice(city, date) {
    // Используем OpenAI для генерации советов по одежде по промпту
    const prompt = `Дай конкретный совет по одежде для города "${city}" на дату "${date}", чтобы чувствовать себя комфортно весь день. Используй лёгкий и дружеский тон.

Пример: "Лёгкая прохлада утром, мягкое тепло днём. Возьми лёгкий жакет для прогулок."

Создай совет по одежде на английском языке.`;
    
    // Fallback советы если OpenAI недоступен
    const clothingAdvice = {
      'Moscow': {
        'spring': 'Light layers with a waterproof jacket. Comfortable walking shoes for city exploration.',
        'summer': 'Light, breathable clothing. Comfortable walking shoes and sun protection.',
        'autumn': 'Layered clothing with a light jacket. Comfortable walking shoes for changing weather.',
        'winter': 'Warm, insulated clothing with waterproof outer layer. Sturdy, warm boots for winter walking.'
      },
      'Barcelona': {
        'spring': 'Light layers with a light jacket. Comfortable walking shoes for city and beach exploration.',
        'summer': 'Light, breathable clothing. Comfortable walking shoes and sun protection for beach visits.',
        'autumn': 'Light layers with a light jacket. Comfortable walking shoes for city exploration.',
        'winter': 'Light layers with a light jacket. Comfortable walking shoes for mild winter weather.'
      },
      'Lisbon': {
        'spring': 'Light layers with a light jacket. Comfortable walking shoes for city exploration.',
        'summer': 'Light, breathable clothing. Comfortable walking shoes and sun protection for outdoor activities.',
        'autumn': 'Light layers with a light jacket. Comfortable walking shoes for city exploration.',
        'winter': 'Light layers with a light jacket. Comfortable walking shoes for mild winter weather.'
      },
      'Paris': {
        'spring': 'Light layers with an umbrella. Comfortable walking shoes for romantic city walks.',
        'summer': 'Light, breathable clothing. Comfortable walking shoes for outdoor cafes and sightseeing.',
        'autumn': 'Layered clothing with a light jacket. Comfortable walking shoes for changing weather.',
        'winter': 'Warm layers with waterproof clothing. Comfortable walking shoes for cool weather.'
      },
      'Rome': {
        'spring': 'Light layers with comfortable walking shoes. Perfect for exploring ancient sites.',
        'summer': 'Light, breathable clothing. Comfortable walking shoes and sun protection for outdoor activities.',
        'autumn': 'Light layers with a light jacket. Comfortable walking shoes for city exploration.',
        'winter': 'Light layers with a light jacket. Comfortable walking shoes for mild winter weather.'
      }
    };

    const dateObj = new Date(date);
    const month = dateObj.getMonth() + 1;
    let season = 'spring';
    if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'autumn';
    else season = 'winter';

    return clothingAdvice[city]?.[season] || 'Comfortable walking shoes and layered clothing for changing weather conditions.';
  }

  /**
   * Генерация эмоционального подзаголовка
   */
  async generateBrightSubtitle(city, audience, interests, date, budget) {
    const dateObj = new Date(date);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const day = dateObj.getDate();
    const month = monthNames[dateObj.getMonth()];
    
    const interest = interests[0] || 'Romantic';
    
    // Используем OpenAI для генерации подзаголовка по промпту
    const prompt = `Составь вдохновляющий подзаголовок для маршрута дня. Укажи дату "${month} ${day}", для кого маршрут ("${audience}"), отрази выбранные интересы "${interests.join(', ')}". Свяжи все вводные параметры и опиши день как трейлер к фильму, ярко, динамично, так чтобы человек захотел сразу отправиться в это путешествие. Описание должно состоять из 2-4 предложений и быть оригинальным.

Создай вдохновляющий подзаголовок на английском языке.`;
    
    try {
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'mock-key-for-development') {
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 200,
        });
        return completion.choices[0].message.content.trim();
      }
    } catch (error) {
      console.log('OpenAI error for subtitle generation, using fallback:', error.message);
    }
    
    // Fallback подзаголовки если OpenAI недоступен
    const fallbackSubtitles = {
      'him': {
        'Music': `On ${month} ${day} you'll discover ${city}'s musical heartbeat through authentic venues and legendary spots. Every melody tells a story of this city's soul.`,
        'Romantic': `On ${month} ${day} you'll experience ${city}'s romantic side through intimate cafes and memorable moments. A day crafted for connection and beauty.`,
        'Culture & Arts': `On ${month} ${day} you'll dive deep into ${city}'s artistic heritage through museums and cultural landmarks. Each visit reveals the city's creative spirit.`,
        'Sports': `On ${month} ${day} you'll feel ${city}'s energy through active adventures and sports venues. Every moment brings new excitement and vitality.`,
        'seasonal': `On ${month} ${day} you'll embrace ${city}'s seasonal beauty through carefully curated experiences. Each moment captures the essence of this magical time.`,
        'luxury': `On ${month} ${day} you'll indulge in ${city}'s finest offerings through premium venues and exclusive experiences. A day of refined elegance awaits.`,
        'adventure': `On ${month} ${day} you'll embark on thrilling adventures in ${city}, discovering hidden gems and exciting experiences. Every turn brings new excitement.`,
        'wellness': `On ${month} ${day} you'll find peace and rejuvenation in ${city} through wellness activities and serene moments. A day dedicated to your well-being.`,
        'photography': `On ${month} ${day} you'll capture ${city}'s beauty through your lens, discovering photogenic spots and creating visual memories. Every frame tells a story.`,
        'architecture': `On ${month} ${day} you'll marvel at ${city}'s architectural wonders through historic buildings and modern masterpieces. Each structure tells a story.`,
        'history': `On ${month} ${day} you'll journey through ${city}'s rich history through ancient sites and cultural landmarks. Every step reveals the past.`,
        'budget': `On ${month} ${day} you'll explore ${city} smartly through affordable yet amazing experiences. Great value and unforgettable memories await.`
      },
      'her': {
        'Music': `On ${month} ${day} you'll feel ${city}'s musical rhythm through charming venues and melodic experiences. Let the music guide your day.`,
        'Romantic': `On ${month} ${day} you'll enjoy a day of care and beauty in ${city}, where luxury meets warmth, and every moment is designed for your pleasure.`,
        'Culture & Arts': `On ${month} ${day} you'll explore ${city}'s artistic soul through curated galleries and inspiring landmarks. Beauty awaits at every turn.`,
        'Sports': `On ${month} ${day} you'll embrace ${city}'s active spirit through energizing activities and sports venues. Feel the power and grace of movement.`,
        'seasonal': `On ${month} ${day} you'll embrace ${city}'s seasonal charm through elegant experiences and beautiful moments. A day of grace and beauty awaits.`,
        'luxury': `On ${month} ${day} you'll indulge in ${city}'s most luxurious offerings through premium venues and exclusive experiences. A day of pure elegance.`,
        'adventure': `On ${month} ${day} you'll discover ${city}'s adventurous side through exciting activities and thrilling experiences. Feel the thrill of discovery.`,
        'wellness': `On ${month} ${day} you'll find inner peace in ${city} through wellness activities and serene moments. A day dedicated to your well-being and beauty.`,
        'photography': `On ${month} ${day} you'll capture ${city}'s beauty through your lens, discovering photogenic spots and creating stunning memories. Every shot is art.`,
        'architecture': `On ${month} ${day} you'll admire ${city}'s architectural beauty through historic buildings and modern masterpieces. Each structure tells a story of elegance.`,
        'history': `On ${month} ${day} you'll explore ${city}'s rich history through ancient sites and cultural landmarks. Every step reveals the past's beauty.`,
        'budget': `On ${month} ${day} you'll discover ${city}'s hidden gems through smart, affordable experiences. Great value and beautiful memories await.`
      },
      'couple': {
        'Music': `On ${month} ${day} you'll create musical memories together in ${city}, discovering hidden venues and sharing intimate moments through the city's rhythm.`,
        'Romantic': `On ${month} ${day} you'll embark on a romantic journey through ${city}, where every step brings you closer and every moment creates lasting memories.`,
        'Culture & Arts': `On ${month} ${day} you'll bond over ${city}'s cultural treasures, exploring art, history, and beauty together. A day of shared discovery.`,
        'Sports': `On ${month} ${day} you'll share active adventures in ${city}, building memories through sports and movement. Together, you'll feel the city's energy.`,
        'seasonal': `On ${month} ${day} you'll embrace ${city}'s seasonal beauty together through romantic experiences and magical moments. A day of shared wonder.`,
        'luxury': `On ${month} ${day} you'll indulge in ${city}'s finest offerings together through premium venues and exclusive experiences. A day of shared elegance.`,
        'adventure': `On ${month} ${day} you'll embark on thrilling adventures together in ${city}, discovering hidden gems and exciting experiences. Every turn brings new excitement.`,
        'wellness': `On ${month} ${day} you'll find peace and rejuvenation together in ${city} through wellness activities and serene moments. A day dedicated to your shared well-being.`,
        'photography': `On ${month} ${day} you'll capture ${city}'s beauty together through your lenses, discovering photogenic spots and creating visual memories. Every frame tells your story.`,
        'architecture': `On ${month} ${day} you'll marvel at ${city}'s architectural wonders together through historic buildings and modern masterpieces. Each structure tells a story of love.`,
        'history': `On ${month} ${day} you'll journey through ${city}'s rich history together through ancient sites and cultural landmarks. Every step reveals the past's romance.`,
        'budget': `On ${month} ${day} you'll explore ${city} smartly together through affordable yet amazing experiences. Great value and unforgettable shared memories await.`
      },
      'kids': {
        'Kids - Fun': `On ${month} ${day} your little ones will have the adventure of a lifetime in ${city}, with exciting activities and memories to treasure.`,
        'Kids - Educational': `On ${month} ${day} your children will learn and explore in ${city}, discovering history and culture through interactive experiences.`,
        'Kids - Adventure': `On ${month} ${day} young explorers will discover ${city}'s secrets through exciting adventures and thrilling discoveries.`,
        'Kids - Sports': `On ${month} ${day} your active kids will enjoy ${city}'s sports venues and outdoor activities, building strength and confidence.`
      }
    };

    return fallbackSubtitles[audience]?.[interest] || 
           `On ${month} ${day} you'll experience the best of ${city} tailored to your ${interest} interests and ${budget}€ budget.`;
  }

  /**
   * Моковые данные для умного маршрута с яркими заголовками
   */
  async getMockSmartItinerary(city, audience, interests, date, places, preferences) {
    // Фильтруем категории для детей
    let filteredCategories = ['cafe', 'restaurant', 'park', 'attraction', 'museum', 'bar'];
    if (audience === 'kids') {
      // Для детей исключаем бары и взрослые места
      filteredCategories = filteredCategories.filter(cat => 
        !['bar', 'nightclub', 'adult'].includes(cat)
      );
      console.log(`Filtered categories for kids:`, filteredCategories);
    }
    
    // Адаптируем блоки в зависимости от бюджета
    let timeBlocks;
    
    if (preferences.totalBudget <= 100) {
      // Низкий бюджет - больше бесплатных активностей
      timeBlocks = [
        { time: '08:00 — Morning Start', category: 'cafe' },
        { time: '09:30 — Morning Activity', category: 'park' }, // Бесплатно
        { time: '11:00 — Cultural Experience', category: 'attraction' },
        { time: '13:00 — Lunch Break', category: 'cafe' }, // Дешевле ресторана
        { time: '14:30 — Afternoon Exploration', category: 'park' }, // Бесплатно
        { time: '16:00 — Shopping & Leisure', category: 'attraction' },
        { time: '18:00 — Evening Activity', category: 'park' }, // Бесплатно
        { time: '20:00 — Dinner', category: 'restaurant' },
        { time: '21:30 — Evening Drinks', category: 'cafe' } // Дешевле бара
      ];
    } else if (preferences.totalBudget <= 300) {
      // Средний бюджет - сбалансированный подход
      timeBlocks = [
        { time: '08:00 — Morning Start', category: 'cafe' },
        { time: '09:30 — Morning Activity', category: 'attraction' },
        { time: '11:00 — Cultural Experience', category: 'museum' },
        { time: '13:00 — Lunch Break', category: 'restaurant' },
        { time: '14:30 — Afternoon Exploration', category: 'park' },
        { time: '16:00 — Shopping & Leisure', category: 'shopping' },
        { time: '18:00 — Evening Activity', category: 'attraction' },
        { time: '20:00 — Dinner', category: 'restaurant' },
        { time: '21:30 — Evening Drinks', category: 'bar' }
      ];
    } else {
      // Высокий бюджет - премиум активности
      timeBlocks = [
        { time: '08:00 — Morning Start', category: 'restaurant' }, // Премиум завтрак
        { time: '09:30 — Morning Activity', category: 'attraction' },
        { time: '11:00 — Cultural Experience', category: 'museum' },
        { time: '13:00 — Lunch Break', category: 'restaurant' },
        { time: '14:30 — Afternoon Exploration', category: 'attraction' },
        { time: '16:00 — Shopping & Leisure', category: 'shopping' },
        { time: '18:00 — Evening Activity', category: 'attraction' },
        { time: '20:00 — Dinner', category: 'restaurant' },
        { time: '21:30 — Evening Drinks', category: 'bar' }
      ];
    }
    
    // Фильтруем блоки для детей
    if (audience === 'kids') {
      timeBlocks = timeBlocks.filter(block => 
        filteredCategories.includes(block.category)
      );
      console.log(`Filtered time blocks for kids:`, timeBlocks.map(b => b.category));
    }

    // Убираем дубликаты мест и создаем уникальный список
    const usedPlaces = new Set();
    const selectedPlaces = [];

    const blocks = await Promise.all(timeBlocks.map(async (block, index) => {
      console.log(`Processing block ${index}: ${block.category} at ${block.time}`);
      console.log(`Used places so far:`, Array.from(usedPlaces));
      
      // Сначала ищем подходящие места для этой категории, которые еще не использованы
      let suitablePlaces = places.filter(p => 
        p.category === block.category && !usedPlaces.has(p.name)
      );
      
      console.log(`Found ${suitablePlaces.length} suitable places for category ${block.category}`);
      
      // Если нет подходящих мест в категории, ищем любые неиспользованные
      if (suitablePlaces.length === 0) {
        suitablePlaces = places.filter(p => !usedPlaces.has(p.name));
        console.log(`No places in category, found ${suitablePlaces.length} unused places total`);
      }
      
      // Если все места использованы, используем циклический подход
      if (suitablePlaces.length === 0) {
        console.log('All places used, using fallback approach');
        // Находим место, которое использовалось давно
        const allPlaces = places.filter(p => p.category === block.category);
        if (allPlaces.length > 0) {
          // Используем место, которое не использовалось в последних 4 блоках (увеличиваем интервал)
          const recentPlaces = Array.from(usedPlaces).slice(-4);
          suitablePlaces = allPlaces.filter(p => !recentPlaces.includes(p.name));
          if (suitablePlaces.length === 0) {
            // Если все места в категории были использованы недавно, попробуем другие категории
            const alternativeCategories = ['cafe', 'restaurant', 'park', 'attraction', 'museum'];
            for (const altCategory of alternativeCategories) {
              if (altCategory !== block.category) {
                const altPlaces = places.filter(p => p.category === altCategory && !recentPlaces.includes(p.name));
                if (altPlaces.length > 0) {
                  suitablePlaces = altPlaces;
                  console.log(`Using alternative category ${altCategory} for block ${block.category}`);
                  break;
                }
              }
            }
            // Если все еще нет подходящих мест, используем места из категории, но не самые последние
            if (suitablePlaces.length === 0) {
              suitablePlaces = allPlaces.filter(p => !Array.from(usedPlaces).slice(-2).includes(p.name));
              if (suitablePlaces.length === 0) {
                suitablePlaces = allPlaces;
              }
            }
          }
        } else {
          // Если нет мест в категории, используем любые доступные места
          suitablePlaces = places.filter(p => !usedPlaces.has(p.name));
          if (suitablePlaces.length === 0) {
            // Если все места использованы, используем их повторно, но не самые последние
            const recentPlaces = Array.from(usedPlaces).slice(-3);
            suitablePlaces = places.filter(p => !recentPlaces.includes(p.name));
            if (suitablePlaces.length === 0) {
              suitablePlaces = places;
            }
          }
        }
      }
      
      // Выбираем место случайным образом из подходящих
      let selectedPlace;
      if (suitablePlaces.length > 0) {
        const randomIndex = Math.floor(Math.random() * suitablePlaces.length);
        selectedPlace = suitablePlaces[randomIndex];
      } else {
        // Fallback - создаем уникальное место
        selectedPlace = {
          name: `${block.category} in ${city} (${index + 1})`,
          address: `${city} ${block.category} District`,
          rating: 4.0,
          price_level: 1,
          category: block.category,
          photos: []
        };
      }
      
      console.log(`Selected place: ${selectedPlace.name}`);
      
      // Проверяем, что место существует
      if (!selectedPlace) {
        console.log(`No place found for block ${index}, using fallback`);
        // Используем fallback место вместо пропуска
        selectedPlace = {
          name: `${block.category} in ${city}`,
          address: `${city} ${block.category} District`,
          rating: 4.0,
          price_level: 1,
          category: block.category,
          photos: []
        };
      }
      
      // Отмечаем место как использованное
      usedPlaces.add(selectedPlace.name);
      selectedPlaces.push(selectedPlace);

      // Генерируем уникальные описания для каждого места
      const interest = interests[0] || 'Romantic';
      const placeName = selectedPlace.name;
      const placeCategory = block.category;
      
      // Создаем уникальные описания на основе реальных данных о месте
      const generateUniqueDescription = async (place, category, interest, totalBudget) => {
        // Собираем информацию о месте для промпта
        const placeInfo = {
          name: place.name,
          category: category,
          rating: place.rating || 'N/A',
          address: place.address || 'N/A',
          user_ratings_total: place.user_ratings_total || 0,
          price_level: place.price_level || 'N/A',
          types: place.types ? place.types.join(', ') : 'N/A'
        };

        // Используем OpenAI для генерации описания на основе реальных данных
        const prompt = `Напиши 2–3 предложения о локации, которая выбрана в маршруте. Опиши её атмосферу и особенности через призму интересов пользователя. Сделай текст вдохновляющим, чтобы захотелось посетить это место, но избегай сухого перечисления фактов.

Информация о месте:
- Название: ${placeInfo.name}
- Категория: ${placeInfo.category}
- Рейтинг: ${placeInfo.rating}/5 (${placeInfo.user_ratings_total} отзывов)
- Адрес: ${placeInfo.address}
- Уровень цен: ${placeInfo.price_level}/4
- Типы: ${placeInfo.types}
- Интересы пользователя: ${interest}

Создай вдохновляющее описание на английском языке.`;
        
        try {
          // Здесь должен быть вызов OpenAI API
          // const response = await this.callOpenAI(prompt);
          // return response.choices[0].message.content;
          
          // Пока используем fallback с реальными данными
          return generateFallbackDescription(placeInfo, interest);
        } catch (error) {
          console.log('OpenAI error, using fallback:', error.message);
          return generateFallbackDescription(placeInfo, interest);
        }
      };

      // Fallback описание на основе реальных данных
      const generateFallbackDescription = (placeInfo, interest) => {
        const ratingText = placeInfo.rating !== 'N/A' ? ` (rated ${placeInfo.rating}/5 by ${placeInfo.user_ratings_total} visitors)` : '';
        const priceText = placeInfo.price_level !== 'N/A' ? ` with ${placeInfo.price_level}/4 price level` : '';
        
        // Создаем более вдохновляющие описания в зависимости от категории
        const categoryDescriptions = {
          'cafe': `Step into ${placeInfo.name}${ratingText}, where the aroma of freshly brewed coffee meets the cozy atmosphere perfect for ${interest} enthusiasts${priceText}. This charming spot offers a warm welcome and authentic local experience.`,
          'restaurant': `Discover ${placeInfo.name}${ratingText}, a culinary gem that celebrates the essence of ${interest} through its carefully crafted menu and inviting ambiance${priceText}. Every dish tells a story of local tradition and flavor.`,
          'museum': `Explore ${placeInfo.name}${ratingText}, where history and culture come alive through fascinating exhibits that perfectly complement your ${interest} interests${priceText}. Each gallery offers new discoveries and inspiration.`,
          'park': `Immerse yourself in ${placeInfo.name}${ratingText}, a natural oasis that provides the perfect setting for ${interest} activities and peaceful moments${priceText}. The beauty of nature surrounds you at every turn.`,
          'attraction': `Experience ${placeInfo.name}${ratingText}, a remarkable destination that captures the spirit of ${interest} and offers unforgettable moments${priceText}. This special place will create lasting memories.`
        };
        
        return categoryDescriptions[placeInfo.category] || 
               `Discover ${placeInfo.name}${ratingText}, a ${placeInfo.category} that perfectly captures the essence of ${interest} in this beautiful city${priceText}. This carefully selected location offers an authentic experience that aligns with your interests and creates lasting memories.`;
      };

      const description = await generateUniqueDescription(selectedPlace, placeCategory, interest, preferences.totalBudget);

      return {
        time: block.time,
        items: [{
          title: selectedPlace.name,
          why: description,
          address: selectedPlace.address,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
          approx_cost: `${this.getPriceLevelCost(selectedPlace.price_level || 2, placeCategory)}€`,
          tips: this.generateLocationTips(selectedPlace, placeCategory, interest),
          duration: block.category === 'restaurant' ? '1.5 hours' : '1 hour',
          photos: selectedPlace.photos || []
        }]
      };
    }));

    // Рассчитываем общую стоимость только для выбранных мест
    const totalCost = selectedPlaces.reduce((sum, place) => sum + this.getPriceLevelCost(place.price_level || 2, place.category), 0);
    
    // Умная проверка бюджета с учетом уровня бюджета
    let budgetStatus;
    if (preferences.totalBudget <= 100) {
      // Низкий бюджет - более строгий контроль (±20%)
      const budgetMin = preferences.totalBudget * 0.8;
      const budgetMax = preferences.totalBudget * 1.2;
      budgetStatus = totalCost >= budgetMin && totalCost <= budgetMax ? 'Within budget' : 'Adjusted';
    } else if (preferences.totalBudget <= 300) {
      // Средний бюджет - умеренный контроль (±30%)
      const budgetMin = preferences.totalBudget * 0.7;
      const budgetMax = preferences.totalBudget * 1.3;
      budgetStatus = totalCost >= budgetMin && totalCost <= budgetMax ? 'Within budget' : 'Adjusted';
    } else {
      // Высокий бюджет - более мягкий контроль (±40%)
      const budgetMin = preferences.totalBudget * 0.6;
      const budgetMax = preferences.totalBudget * 1.4;
      budgetStatus = totalCost >= budgetMin && totalCost <= budgetMax ? 'Within budget' : 'Adjusted';
    }
    
    console.log(`Budget check: totalCost=${totalCost}, budget=${preferences.totalBudget}, status=${budgetStatus}`);

    return {
      city,
      date,
      meta: {
        creative_title: await this.generateBrightTitle(city, audience, interests, date),
        creative_subtitle: await this.generateBrightSubtitle(city, audience, interests, date, preferences.totalBudget),
        total_estimated_cost: `${totalCost}€`,
        budget_status: budgetStatus,
        weather: await this.generateWeatherBlock(city, date),
        clothing_advice: this.generateClothingAdvice(city, date)
      },
      daily_plan: [{ blocks }]
    };
  }
}

module.exports = SmartItineraryGenerator;

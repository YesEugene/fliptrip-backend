/**
 * Locations Database Entity
 * Отвечает за поиск и фильтрацию локаций
 * НЕ ТРОГАТЬ если работает корректно!
 */

const { searchPlacesByInterests } = require('../placesService');

class LocationsDatabase {
  constructor() {
    this.cache = new Map();
    this.cityData = new Map();
  }

  /**
   * Получает все подходящие локации для фильтра
   * @param {Object} filterParams - Параметры фильтра
   * @returns {Array} - Массив локаций
   */
  async getLocationsForFilter(filterParams) {
    const cacheKey = this.getCacheKey(filterParams);
    
    // Проверяем кэш
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const locations = await this.searchLocations(filterParams);
      
      // Кэшируем результат
      this.cache.set(cacheKey, locations);
      
      return locations;
    } catch (error) {
      console.error('Error getting locations:', error);
      return this.getFallbackLocations(filterParams);
    }
  }

  /**
   * Поиск локаций по параметрам
   */
  async searchLocations(filterParams) {
    const { city, interests, budget, audience } = filterParams;
    console.log('🔍 Поиск локаций для:', { city, interests, budget, audience });
    
    // Получаем данные по городу
    const cityData = await this.getCityData(city);
    
    if (cityData && cityData.places) {
      // Используем данные из файла города
      const allPlaces = [];
      Object.values(cityData.places).forEach(categoryPlaces => {
        allPlaces.push(...categoryPlaces);
      });
      
      // КРИТИЧНО: Фильтруем по интересам ПЕРВЫМ
      const interestFilteredPlaces = this.filterByInterests(allPlaces, interests, audience);
      console.log(`🎯 Фильтрация по интересам: ${allPlaces.length} → ${interestFilteredPlaces.length}`);
      
      // Фильтруем по аудитории
      const audienceFilteredPlaces = this.filterByAudience(interestFilteredPlaces, audience);
      console.log(`👥 Фильтрация по аудитории: ${interestFilteredPlaces.length} → ${audienceFilteredPlaces.length}`);
      
      // Фильтруем по бюджету
      const budgetFilteredPlaces = this.filterByBudget(audienceFilteredPlaces, budget);
      console.log(`💰 Фильтрация по бюджету: ${audienceFilteredPlaces.length} → ${budgetFilteredPlaces.length}`);
      
      return budgetFilteredPlaces;
    } else {
      // Fallback к старому API с интересами
      console.log('📡 Используем Google Places API с интересами:', interests);
      const places = await searchPlacesByInterests(
        city, 
        interests, 
        budget || 100
      );

      // Фильтруем по аудитории
      const audienceFilteredPlaces = this.filterByAudience(places, audience);
      console.log(`👥 API фильтрация по аудитории: ${places.length} → ${audienceFilteredPlaces.length}`);
      
      // Фильтруем по бюджету
      const budgetFilteredPlaces = this.filterByBudget(audienceFilteredPlaces, budget);
      console.log(`💰 API фильтрация по бюджету: ${audienceFilteredPlaces.length} → ${budgetFilteredPlaces.length}`);
      
      return budgetFilteredPlaces;
    }
  }

  /**
   * Получает данные по городу
   */
  async getCityData(city) {
    if (this.cityData.has(city)) {
      return this.cityData.get(city);
    }

    try {
      // Загружаем данные по городу
      const cityModule = require(`../data/cities/${city.toLowerCase()}.js`);
      this.cityData.set(city, cityModule);
      return cityModule;
    } catch (error) {
      console.error(`Error loading city data for ${city}:`, error);
      return null;
    }
  }

  /**
   * Фильтрация по бюджету
   */
  filterByBudget(places, budget) {
    if (!budget) return places;
    
    const budgetNum = parseInt(budget);
    return places.filter(place => {
      const placeCost = this.getPlaceCost(place);
      return placeCost <= budgetNum;
    });
  }

  /**
   * Фильтрация по интересам
   */
  filterByInterests(places, interests, audience) {
    if (!interests || interests.length === 0) {
      return places;
    }

    console.log('🎯 Фильтруем по интересам:', interests);

    // Полный маппинг ВСЕХ интересов к категориям мест
    const interestToCategories = {
      // Основные интересы (для всех аудиторий)
      'adventure': ['adventure_park', 'outdoor_activity', 'sports', 'hiking', 'climbing', 'extreme_sports'],
      'culture': ['museum', 'gallery', 'theater', 'cultural_center', 'opera_house', 'concert_hall'],
      'food': ['restaurant', 'cafe', 'food_market', 'local_cuisine', 'street_food', 'cooking_class'],
      'nature': ['park', 'garden', 'nature_reserve', 'outdoor', 'botanical_garden', 'forest'],
      'art': ['gallery', 'art_center', 'museum', 'creative_space', 'art_studio', 'street_art'],
      'music': ['concert_hall', 'music_venue', 'jazz_club', 'opera_house', 'music_store'],
      'sports': ['sports_center', 'stadium', 'gym', 'outdoor_activity', 'fitness_center'],
      'relaxation': ['spa', 'park', 'cafe', 'wellness_center', 'massage', 'yoga_studio'],
      'romantic': ['restaurant', 'cafe', 'park', 'scenic_view', 'rooftop_bar', 'romantic_spot'],
      'history': ['museum', 'historical_site', 'monument', 'cultural_center', 'castle', 'archaeological_site'],
      'photography': ['scenic_view', 'landmark', 'park', 'museum', 'architecture', 'street_art'],
      'shopping': ['shopping_center', 'market', 'boutique', 'store', 'mall', 'local_market'],
      'nightlife': ['bar', 'club', 'entertainment_venue', 'rooftop_bar', 'cocktail_bar'],
      'wellness': ['spa', 'wellness_center', 'yoga_studio', 'massage', 'fitness_center'],
      'architecture': ['cathedral', 'historical_building', 'architectural_site', 'landmark', 'monument'],
      'local': ['local_market', 'traditional_restaurant', 'local_experience', 'street_food', 'cultural_center'],
      'family': ['park', 'family_restaurant', 'family_entertainment', 'playground', 'zoo'],
      'budget': ['park', 'free_attraction', 'street_food', 'local_market', 'walking_tour'],
      'luxury': ['luxury_restaurant', 'spa', 'luxury_hotel', 'premium_bar', 'exclusive_venue'],
      'outdoor': ['park', 'garden', 'hiking', 'cycling', 'outdoor_activity', 'nature_reserve'],
      'indoor': ['museum', 'gallery', 'shopping_center', 'cafe', 'theater', 'indoor_activity'],
      'seasonal': ['seasonal_event', 'festival', 'seasonal_market', 'holiday_attraction'],
      'festivals': ['festival', 'concert', 'cultural_event', 'music_festival', 'art_festival'],

      // Детские интересы (расширенные)
      'swimming': ['pool', 'water_park', 'aquatic_center', 'spa', 'swimming_pool'],
      'zoo': ['zoo', 'aquarium', 'animal_park', 'wildlife_center', 'petting_zoo'],
      'playground': ['playground', 'park', 'family_entertainment', 'children_park'],
      'museums': ['museum', 'science_center', 'children_museum', 'interactive_museum'],
      'amusement': ['amusement_park', 'theme_park', 'entertainment', 'fun_center'],
      'science': ['science_center', 'planetarium', 'observatory', 'interactive_museum'],
      'cycling': ['bike_rental', 'cycling_path', 'park', 'outdoor_activity'],
      'theater': ['children_theater', 'puppet_theater', 'family_show', 'entertainment'],
      'educational': ['museum', 'science_center', 'library', 'educational_center']
    };

    // Определяем подходящие категории на основе интересов
    const targetCategories = new Set();
    interests.forEach(interest => {
      const categories = interestToCategories[interest] || [];
      categories.forEach(cat => targetCategories.add(cat));
      
      // Также добавляем сам интерес как категорию
      targetCategories.add(interest);
    });

    console.log('🎯 Целевые категории:', Array.from(targetCategories));

    // Фильтруем места по интересам
    const filteredPlaces = places.filter(place => {
      const placeCategory = place.category || '';
      const placeName = place.name || '';
      const placeTypes = place.types || [];
      
      // Проверяем совпадение по категории
      if (targetCategories.has(placeCategory)) {
        return true;
      }
      
      // Проверяем совпадение по типам Google Places
      if (placeTypes.some(type => targetCategories.has(type))) {
        return true;
      }
      
      // Проверяем совпадение по названию (для специфических мест)
      const lowerName = placeName.toLowerCase();
      if (interests.some(interest => {
        const lowerInterest = interest.toLowerCase();
        return lowerName.includes(lowerInterest) || 
               lowerName.includes('pool') && interest === 'swimming' ||
               lowerName.includes('aqua') && interest === 'swimming' ||
               lowerName.includes('water') && interest === 'swimming';
      })) {
        return true;
      }
      
      return false;
    });

    return filteredPlaces;
  }

  /**
   * Фильтрация по аудитории
   */
  filterByAudience(places, audience) {
    console.log('👥 Фильтруем по аудитории:', audience);
    
    if (audience === 'kids') {
      const filtered = places.filter(place => 
        !['bar', 'nightclub', 'adult', 'casino', 'strip_club'].includes(place.category) &&
        !place.types?.some(type => ['bar', 'night_club', 'casino'].includes(type))
      );
      console.log(`👶 Детская фильтрация: убрано ${places.length - filtered.length} неподходящих мест`);
      return filtered;
    }
    
    return places;
  }

  /**
   * Получает стоимость места
   */
  getPlaceCost(place) {
    if (place.price_level === 0) return 0;
    if (place.price_level === 1) return 10;
    if (place.price_level === 2) return 25;
    if (place.price_level === 3) return 50;
    if (place.price_level === 4) return 100;
    return 25; // default
  }

  /**
   * Создает ключ для кэширования
   */
  getCacheKey(filterParams) {
    return `${filterParams.city}_${filterParams.audience}_${filterParams.interests.join('_')}_${filterParams.budget}`;
  }

  /**
   * Fallback локации если API недоступен
   */
  getFallbackLocations(filterParams) {
    throw new Error(`No location data available for ${filterParams.city}. Please ensure city data is properly configured.`);
  }

  /**
   * Очищает кэш
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = LocationsDatabase;

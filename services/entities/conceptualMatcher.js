/**
 * Концептуальный матчер
 * Сопоставляет реальные места с концептуальным планом и вычисляет скоры соответствия
 */
class ConceptualMatcher {
  constructor() {
    // Синонимы категорий для лучшего матчинга
    this.categorySynonyms = {
      'cafe': ['coffee_shop', 'bakery', 'breakfast_spot'],
      'restaurant': ['eatery', 'dining', 'bistro', 'tavern'],
      'attraction': ['tourist_attraction', 'landmark', 'museum', 'gallery', 'monument'],
      'park': ['garden', 'square', 'outdoor_space'],
      'bar': ['pub', 'lounge', 'nightlife'],
      'spa': ['wellness', 'health', 'relaxation'],
      'shopping': ['store', 'market', 'boutique']
    };

    // Временные предпочтения для разных категорий
    this.timePreferences = {
      'cafe': {
        preferred: ['09:00', '10:00', '17:00', '18:00'],
        acceptable: ['08:00', '11:00', '16:00', '19:00']
      },
      'restaurant': {
        preferred: ['12:00', '13:00', '19:00', '20:00'],
        acceptable: ['11:00', '14:00', '18:00', '21:00']
      },
      'attraction': {
        preferred: ['10:00', '11:00', '14:00', '15:00', '16:00'],
        acceptable: ['09:00', '12:00', '13:00', '17:00']
      },
      'bar': {
        preferred: ['20:00', '21:00', '22:00'],
        acceptable: ['19:00', '23:00']
      }
    };
  }

  /**
   * Обогащает места концептуальной информацией и скорами
   */
  enrichPlacesWithConcepts(places, conceptualPlan) {
    console.log(`🎯 Enriching ${places.length} places with conceptual matching...`);
    
    const enrichedPlaces = places.map(place => {
      const bestMatch = this.findBestConceptualMatch(place, conceptualPlan.timeSlots);
      
      return {
        ...place,
        conceptualMatch: bestMatch,
        matchScore: bestMatch.score,
        conceptSlot: bestMatch.slot?.time,
        conceptActivity: bestMatch.slot?.activity,
        conceptKeywords: bestMatch.slot?.keywords || []
      };
    });

    // Сортируем по скору соответствия концепции
    enrichedPlaces.sort((a, b) => b.matchScore - a.matchScore);
    
    console.log(`✅ Places enriched. Top matches:`, 
      enrichedPlaces.slice(0, 3).map(p => `${p.name} (${p.matchScore})`));
    
    return enrichedPlaces;
  }

  /**
   * Находит лучший концептуальный матч для места
   */
  findBestConceptualMatch(place, conceptSlots) {
    let bestMatch = {
      slot: null,
      score: 0,
      reasons: []
    };

    for (const slot of conceptSlots) {
      const score = this.calculateMatchScore(place, slot);
      
      if (score > bestMatch.score) {
        bestMatch = {
          slot: slot,
          score: score,
          reasons: this.getMatchReasons(place, slot, score)
        };
      }
    }

    return bestMatch;
  }

  /**
   * Вычисляет скор соответствия места концептуальному слоту
   */
  calculateMatchScore(place, conceptSlot) {
    let score = 0;
    const reasons = [];

    // 1. Базовый скор по рейтингу места (0-50 баллов)
    score += Math.min(place.rating * 10, 50);

    // 2. Соответствие категории (0-100 баллов)
    const categoryScore = this.getCategoryMatchScore(place, conceptSlot);
    score += categoryScore;

    // 3. Соответствие ключевым словам (0-80 баллов)
    const keywordScore = this.getKeywordMatchScore(place, conceptSlot);
    score += keywordScore;

    // 4. Временное соответствие (0-30 баллов)
    const timeScore = this.getTimeRelevanceScore(conceptSlot.time, place.category);
    score += timeScore;

    // 5. Приоритет слота (0-20 баллов)
    const priorityScore = this.getPriorityScore(conceptSlot);
    score += priorityScore;

    // 6. Уровень энергии (0-15 баллов)
    const energyScore = this.getEnergyMatchScore(place, conceptSlot);
    score += energyScore;

    return Math.round(score);
  }

  /**
   * Скор соответствия категории
   */
  getCategoryMatchScore(place, conceptSlot) {
    // Точное совпадение категории
    if (place.category === conceptSlot.category) {
      return 100;
    }

    // Проверяем синонимы
    const synonyms = this.categorySynonyms[conceptSlot.category] || [];
    if (synonyms.includes(place.category)) {
      return 80;
    }

    // Проверяем типы места из Google Places
    if (place.types && place.types.length > 0) {
      const hasMatchingType = place.types.some(type => 
        type.includes(conceptSlot.category) || 
        synonyms.some(syn => type.includes(syn))
      );
      if (hasMatchingType) {
        return 60;
      }
    }

    // Частичное совпадение по логике
    const logicalMatches = {
      'cafe': ['food', 'establishment'],
      'restaurant': ['food', 'meal', 'establishment'],
      'attraction': ['tourist', 'point_of_interest', 'establishment'],
      'bar': ['night_club', 'establishment']
    };

    const logicalTypes = logicalMatches[conceptSlot.category] || [];
    if (place.types && place.types.some(type => 
      logicalTypes.some(logical => type.includes(logical))
    )) {
      return 40;
    }

    return 0;
  }

  /**
   * Скор соответствия ключевым словам
   */
  getKeywordMatchScore(place, conceptSlot) {
    if (!conceptSlot.keywords || conceptSlot.keywords.length === 0) {
      return 0;
    }

    let score = 0;
    const placeName = place.name.toLowerCase();
    const placeTypes = place.types ? place.types.join(' ').toLowerCase() : '';

    for (const keyword of conceptSlot.keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Совпадение в названии места (высокий приоритет)
      if (placeName.includes(keywordLower)) {
        score += 25;
      }
      
      // Совпадение в типах места
      if (placeTypes.includes(keywordLower)) {
        score += 15;
      }

      // Семантические совпадения
      const semanticMatches = this.getSemanticMatches(keywordLower);
      for (const semantic of semanticMatches) {
        if (placeName.includes(semantic) || placeTypes.includes(semantic)) {
          score += 10;
        }
      }
    }

    return Math.min(score, 80); // Максимум 80 баллов за ключевые слова
  }

  /**
   * Семантические совпадения для ключевых слов
   */
  getSemanticMatches(keyword) {
    const semanticMap = {
      'breakfast': ['morning', 'coffee', 'bakery'],
      'coffee': ['cafe', 'espresso', 'cappuccino'],
      'lunch': ['dining', 'restaurant', 'bistro'],
      'dinner': ['restaurant', 'fine', 'dining'],
      'culture': ['museum', 'gallery', 'art', 'historic'],
      'history': ['historic', 'heritage', 'monument', 'ancient'],
      'art': ['gallery', 'museum', 'artistic', 'creative'],
      'romantic': ['intimate', 'cozy', 'wine', 'candlelit'],
      'local': ['traditional', 'authentic', 'typical'],
      'scenic': ['view', 'panoramic', 'lookout', 'terrace'],
      'relax': ['spa', 'wellness', 'peaceful', 'quiet']
    };

    return semanticMap[keyword] || [];
  }

  /**
   * Скор временного соответствия
   */
  getTimeRelevanceScore(slotTime, placeCategory) {
    const timePrefs = this.timePreferences[placeCategory];
    if (!timePrefs) return 15; // Нейтральный скор

    if (timePrefs.preferred.includes(slotTime)) {
      return 30;
    }
    
    if (timePrefs.acceptable.includes(slotTime)) {
      return 20;
    }

    return 10; // Не идеальное время, но приемлемо
  }

  /**
   * Скор приоритета слота
   */
  getPriorityScore(conceptSlot) {
    const priorityScores = {
      'essential': 20,
      'high': 15,
      'medium': 10,
      'low': 5
    };

    return priorityScores[conceptSlot.priority] || 10;
  }

  /**
   * Скор соответствия уровня энергии
   */
  getEnergyMatchScore(place, conceptSlot) {
    // Простая логика на основе категории и времени
    const energyMap = {
      'cafe': { 'morning': 'medium', 'afternoon': 'low', 'evening': 'low' },
      'restaurant': { 'morning': 'low', 'afternoon': 'medium', 'evening': 'medium' },
      'attraction': { 'morning': 'high', 'afternoon': 'medium', 'evening': 'low' },
      'bar': { 'morning': 'low', 'afternoon': 'low', 'evening': 'high' }
    };

    const timeOfDay = this.getTimeOfDay(conceptSlot.time);
    const expectedEnergy = energyMap[place.category]?.[timeOfDay] || 'medium';
    
    if (expectedEnergy === conceptSlot.energyLevel) {
      return 15;
    }

    return 8; // Частичное совпадение
  }

  /**
   * Определяет время дня по часу
   */
  getTimeOfDay(time) {
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Получает причины матчинга для отладки
   */
  getMatchReasons(place, slot, score) {
    return [
      `Rating: ${place.rating}/5`,
      `Category: ${place.category} → ${slot.category}`,
      `Time: ${slot.time}`,
      `Keywords: ${slot.keywords?.join(', ') || 'none'}`,
      `Total score: ${score}`
    ];
  }

  /**
   * Создает умные поисковые запросы на основе концептуального слота
   */
  buildSmartQueries(conceptSlot, city) {
    const queries = [];
    
    // Базовый запрос по категории
    queries.push(`${conceptSlot.category} in ${city}`);
    
    // Запросы на основе ключевых слов
    if (conceptSlot.keywords && conceptSlot.keywords.length > 0) {
      conceptSlot.keywords.forEach(keyword => {
        queries.push(`${keyword} ${city}`);
        queries.push(`${conceptSlot.category} ${keyword} ${city}`);
      });
    }

    // Запрос по активности
    if (conceptSlot.activity) {
      const activityWords = conceptSlot.activity.toLowerCase().split(' ');
      const relevantWords = activityWords.filter(word => 
        word.length > 3 && !['with', 'and', 'the', 'for'].includes(word)
      );
      
      if (relevantWords.length > 0) {
        queries.push(`${relevantWords.join(' ')} ${city}`);
      }
    }

    // Убираем дубликаты
    return [...new Set(queries)];
  }
}

module.exports = ConceptualMatcher;

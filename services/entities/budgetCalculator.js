/**
 * Budget Calculator Entity
 * Отвечает за расчеты бюджета и стоимости
 * НЕ ТРОГАТЬ если работает корректно!
 */

class BudgetCalculator {
  constructor() {
    this.priceLevels = {
      0: 0,    // Free
      1: 10,   // Budget
      2: 25,   // Moderate
      3: 50,   // Expensive
      4: 100   // Very Expensive
    };
  }

  /**
   * Рассчитывает общую стоимость маршрута
   * @param {Array} places - Массив мест
   * @param {Number} totalBudget - Общий бюджет
   * @returns {Object} - { totalCost, budgetBreakdown, isWithinBudget }
   */
  calculateRouteCost(places, totalBudget) {
    let totalCost = 0;
    const budgetBreakdown = [];

    places.forEach(place => {
      const cost = this.getPlaceCost(place);
      totalCost += cost;
      budgetBreakdown.push({
        name: place.name,
        cost: cost,
        priceLevel: place.price_level
      });
    });

    // Учитываем правило ±30% из itineraryRules.js
    const budgetNum = parseInt(totalBudget) || 0;
    const minBudget = budgetNum * 0.7; // -30%
    const maxBudget = budgetNum * 1.3; // +30%
    
    const isWithinBudget = totalCost >= minBudget && totalCost <= maxBudget;
    const budgetRatio = budgetNum > 0 ? totalCost / budgetNum : 1;

    return {
      totalCost,
      totalBudget: budgetNum,
      minBudget,
      maxBudget,
      budgetBreakdown,
      isWithinBudget,
      budgetRatio,
      remainingBudget: budgetNum - totalCost
    };
  }

  /**
   * Получает стоимость места
   */
  getPlaceCost(place) {
    return this.priceLevels[place.price_level] || 25;
  }

  /**
   * Оптимизирует маршрут по бюджету с учетом правила ±30%
   */
  optimizeForBudget(places, totalBudget) {
    const budgetNum = parseInt(totalBudget) || 0;
    const targetBudget = budgetNum; // Стремимся к основному бюджету
    const maxBudget = budgetNum * 1.3; // Максимум +30%
    
    // Сортируем по стоимости и важности (рестораны важнее баров)
    const sortedPlaces = [...places].sort((a, b) => {
      const priorityA = this.getPlacePriority(a);
      const priorityB = this.getPlacePriority(b);
      
      // Сначала по приоритету, потом по стоимости
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Высокий приоритет первым
      }
      return this.getPlaceCost(a) - this.getPlaceCost(b);
    });

    const optimizedPlaces = [];
    let currentCost = 0;

    // Сначала добавляем обязательные места (еда)
    for (const place of sortedPlaces) {
      const placeCost = this.getPlaceCost(place);
      const priority = this.getPlacePriority(place);
      
      // Обязательные места добавляем в любом случае, если не превышаем maxBudget
      if (priority >= 3 && currentCost + placeCost <= maxBudget) {
        optimizedPlaces.push(place);
        currentCost += placeCost;
      }
      // Остальные места добавляем только если помещаемся в targetBudget
      else if (priority < 3 && currentCost + placeCost <= targetBudget) {
        optimizedPlaces.push(place);
        currentCost += placeCost;
      }
    }

    return optimizedPlaces;
  }
  
  /**
   * Определяет приоритет места для бюджетной оптимизации
   */
  getPlacePriority(place) {
    const category = place.category || 'attraction';
    const priorities = {
      'restaurant': 5, // Высший приоритет - еда обязательна
      'cafe': 4,
      'attraction': 2,
      'museum': 2,
      'park': 1,
      'bar': 1
    };
    return priorities[category] || 2;
  }

  /**
   * Получает рекомендации по бюджету
   */
  getBudgetRecommendations(budgetInfo) {
    const recommendations = [];

    if (budgetInfo.budgetRatio > 1.2) {
      recommendations.push("Consider reducing the number of expensive places");
    }

    if (budgetInfo.budgetRatio < 0.5) {
      recommendations.push("You can add more premium experiences");
    }

    if (budgetInfo.remainingBudget > 50) {
      recommendations.push("You have room for additional activities");
    }

    return recommendations;
  }

  /**
   * Валидирует бюджет
   */
  validateBudget(budget) {
    const budgetNum = parseInt(budget);
    
    if (isNaN(budgetNum) || budgetNum < 0) {
      return { isValid: false, error: "Invalid budget amount" };
    }

    if (budgetNum > 1000) {
      return { isValid: false, error: "Budget too high" };
    }

    return { isValid: true };
  }

  /**
   * Получает уровень бюджета
   */
  getBudgetLevel(budget) {
    const budgetNum = parseInt(budget);
    
    if (budgetNum <= 50) return 'budget';
    if (budgetNum <= 150) return 'moderate';
    if (budgetNum <= 300) return 'comfortable';
    return 'luxury';
  }
}

module.exports = BudgetCalculator;

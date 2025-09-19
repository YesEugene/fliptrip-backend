/**
 * FlipTrip Itinerary Rules and Principles
 * 
 * Этот файл содержит свод правил и принципов для составления маршрута дня.
 * Система обращается к этому файлу за консультацией о том, как правильно
 * составить план на основе фильтров пользователя.
 */

class ItineraryRules {
  constructor() {
    this.rules = {
      // 1. Базовые параметры фильтра
      filterParameters: {
        audience: {
          description: "Влияет на стиль заголовков, подзаголовков, описаний",
          rules: {
            'her': "Индивидуальная тональность, элегантность, внимание к деталям",
            'him': "Активная тональность, приключения, практичность",
            'couple': "Романтичная тональность, совместные переживания, интимность",
            'kids': "Детская тональность, безопасность, развлечения, образовательность"
          }
        },
        interests: {
          description: "Определяют основное наполнение маршрута",
          rules: {
            'local': "Акцент на аутентичные места, местную кухню, традиции",
            'adventure': "Активные активности, экстремальные виды спорта, исследования",
            'cultural': "Музеи, галереи, исторические места, культурные события",
            'romantic': "Романтичные локации, красивые виды, интимная атмосфера",
            'seasonal': "Сезонные активности, праздники, временные события",
            'festivals': "Фестивали, концерты, культурные события",
            'music': "Музыкальные заведения, концерты, музыкальные магазины"
          },
          expansion: {
            'music': ['art', 'creative spaces', 'clubs', 'concerts', 'music venues'],
            'adventure': ['outdoor activities', 'sports', 'exploration', 'nature'],
            'cultural': ['museums', 'galleries', 'historical sites', 'art centers']
          }
        },
        date: {
          description: "Используется для прогноза погоды и определения актуальных событий",
          rules: [
            "Проверять расписание заведений на указанную дату",
            "Учитывать сезонные особенности и погодные условия",
            "Проверять наличие специальных событий или фестивалей"
          ]
        },
        budget: {
          description: "Общий план должен вписываться в заданный бюджет с допуском ±30%",
          rules: [
            "При превышении бюджета заменять дорогие точки на более доступные",
            "Использовать бесплатные активности (парки, прогулки, виды)",
            "Балансировать дорогие и недорогие активности",
            "Учитывать стоимость транспорта между локациями"
          ]
        }
      },

      // 2. Логика маршрута
      routeLogic: {
        sequence: {
          description: "Маршрут выстраивается логично с минимальными перемещениями",
          rules: [
            "Группировать близко расположенные локации",
            "Избегать 'скачков' по городу",
            "Учитывать время перемещения между точками",
            "Планировать логичную последовательность активностей"
          ]
        },
        timeSlots: {
          description: "План всегда содержит еду и активности по интересам",
          required: [
            "Завтрак (утром, 8:00-10:00)",
            "Обед (днем, 13:00-15:00)",
            "Ужин (вечером, 19:00-21:00)"
          ],
          optional: [
            "Перекус/кофе (11:00-12:00)",
            "Бар/напитки (вечером, 21:00-23:00)"
          ],
          rules: [
            "Время слотов согласуется с естественным ритмом дня",
            "Учитывать расписание заведений",
            "Оставлять время на перемещения"
          ]
        },
        balance: {
          description: "Не перегружать маршрут однотипными активностями",
          rules: [
            "Разнообразить типы активностей даже при одном интересе",
            "Чередовать активные и спокойные активности",
            "Включать уникальные локации города",
            "Балансировать культурные и развлекательные активности"
          ]
        },
        uniqueness: {
          description: "Локации не должны повторяться в рамках одного дня",
          rules: [
            "Каждая локация может быть посещена только один раз в день",
            "При выборе локаций проверять, что она еще не была использована",
            "Если все подходящие локации уже использованы, использовать альтернативные категории",
            "Вести учет уже использованных локаций для предотвращения повторений"
          ]
        },
        duration: {
          description: "Фиксировать примерное время пребывания для реалистичности",
          rules: [
            "Кафе/рестораны: 1-1.5 часа",
            "Музеи/галереи: 1-2 часа",
            "Парки/прогулки: 30-60 минут",
            "Аттракционы: 1-2 часа",
            "Бары: 1-2 часа"
          ]
        },
        availability: {
          description: "Учитывать расписания заведений и событий",
          rules: [
            "Проверять часы работы заведений",
            "Учитывать выходные дни",
            "Проверять наличие специальных событий",
            "Исключать закрытые в указанное время места"
          ]
        }
      },

      // 3. Бюджет и цены
      budgetAndPricing: {
        pricing: {
          description: "Каждая локация содержит ориентировочную цену",
          rules: [
            "Указывать средний чек для ресторанов",
            "Указывать стоимость билетов для музеев/аттракционов",
            "Учитывать стоимость аренды оборудования",
            "Включать стоимость транспорта"
          ]
        },
        budgetControl: {
          description: "Постоянно проверять соответствие общему бюджету",
          rules: [
            "Рассчитывать общую стоимость маршрута",
            "Сравнивать с бюджетом пользователя",
            "При превышении заменять дорогие активности",
            "Добавлять бесплатные активности при необходимости"
          ]
        },
        budgetLevels: {
          low: {
            description: "Минимальный бюджет - больше бесплатных активностей",
            strategies: [
              "Использовать парки и бесплатные виды",
              "Выбирать недорогие кафе и стрит-фуд",
              "Включать бесплатные музеи и галереи",
              "Планировать пешие прогулки"
            ]
          },
          medium: {
            description: "Средний бюджет - баланс платных и бесплатных активностей",
            strategies: [
              "Смешивать платные и бесплатные активности",
              "Выбирать рестораны среднего ценового сегмента",
              "Включать 1-2 дорогие активности",
              "Использовать общественный транспорт"
            ]
          },
          high: {
            description: "Высокий бюджет - премиальные активности",
            strategies: [
              "Включать премиальные рестораны",
              "Выбирать эксклюзивные активности",
              "Использовать такси или аренду автомобиля",
              "Планировать VIP-экскурсии"
            ]
          }
        }
      },

      // 4. Специальные правила
      specialRules: {
        weather: {
          description: "Учитывать погодные условия при планировании",
          rules: [
            "В дождь планировать больше крытых активностей",
            "В жаркую погоду включать места с кондиционером",
            "В холодную погоду планировать теплые заведения",
            "Адаптировать одежду и обувь под погоду"
          ]
        },
        safety: {
          description: "Обеспечивать безопасность маршрута",
          rules: [
            "Избегать опасных районов",
            "Планировать маршрут по освещенным улицам",
            "Учитывать время возвращения в отель",
            "Включать контактную информацию экстренных служб"
          ]
        },
        accessibility: {
          description: "Учитывать доступность для разных групп",
          rules: [
            "Проверять доступность для людей с ограниченными возможностями",
            "Учитывать возрастные ограничения",
            "Планировать удобные маршруты для детей",
            "Учитывать языковые барьеры"
          ]
        }
      }
    };
  }

  /**
   * Получить правила для конкретного фильтра
   */
  getRulesForFilter(filterType, filterValue) {
    if (this.rules.filterParameters[filterType]) {
      return this.rules.filterParameters[filterType];
    }
    return null;
  }

  /**
   * Получить правила для логики маршрута
   */
  getRouteLogicRules() {
    return this.rules.routeLogic;
  }

  /**
   * Получить правила уникальности локаций
   */
  getUniquenessRules() {
    return this.rules.routeLogic.uniqueness;
  }

  /**
   * Получить правила для бюджета
   */
  getBudgetRules() {
    return this.rules.budgetAndPricing;
  }

  /**
   * Получить все правила
   */
  getAllRules() {
    return this.rules;
  }

  /**
   * Получить рекомендации по составлению маршрута
   */
  getItineraryRecommendations(filters) {
    const recommendations = [];

    // Рекомендации по аудитории
    if (filters.audience) {
      const audienceRules = this.rules.filterParameters.audience.rules[filters.audience];
      if (audienceRules) {
        recommendations.push({
          type: 'audience',
          rule: audienceRules,
          description: this.rules.filterParameters.audience.description
        });
      }
    }

    // Рекомендации по интересам
    if (filters.interests && filters.interests.length > 0) {
      filters.interests.forEach(interest => {
        const interestRules = this.rules.filterParameters.interests.rules[interest];
        if (interestRules) {
          recommendations.push({
            type: 'interest',
            interest: interest,
            rule: interestRules,
            description: this.rules.filterParameters.interests.description
          });
        }
      });
    }

    // Рекомендации по бюджету
    if (filters.budget) {
      const budgetLevel = this.getBudgetLevel(filters.budget);
      const budgetRules = this.rules.budgetAndPricing.budgetLevels[budgetLevel];
      if (budgetRules) {
        recommendations.push({
          type: 'budget',
          level: budgetLevel,
          rule: budgetRules,
          description: this.rules.budgetAndPricing.budgetControl.description
        });
      }
    }

    return recommendations;
  }

  /**
   * Определить уровень бюджета
   */
  getBudgetLevel(budget) {
    const budgetValue = parseInt(budget) || 0;
    if (budgetValue < 50) return 'low';
    if (budgetValue < 150) return 'medium';
    return 'high';
  }

  /**
   * Получить расширенные интересы
   */
  getExpandedInterests(interests) {
    const expanded = [];
    interests.forEach(interest => {
      if (this.rules.filterParameters.interests.expansion[interest]) {
        expanded.push(...this.rules.filterParameters.interests.expansion[interest]);
      }
    });
    return [...new Set(expanded)]; // Убираем дубликаты
  }
}

module.exports = ItineraryRules;

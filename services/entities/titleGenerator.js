/**
 * Title Generator Entity
 * Отвечает за генерацию заголовков и подзаголовков
 * НЕ ТРОГАТЬ если работает корректно!
 */

const { generateTitle, generateSubtitle } = require('../textGenerator');

class TitleGenerator {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Генерирует заголовок и подзаголовок для маршрута
   * @param {Object} filterParams - Параметры фильтра
   * @returns {Object} - { title, subtitle }
   */
  async generateTitles(filterParams) {
    const cacheKey = this.getCacheKey(filterParams);
    
    // Проверяем кэш
    if (this.cache.has(cacheKey)) {
      console.log('📦 Используем кэшированные заголовки');
      return this.cache.get(cacheKey);
    }

    console.log('🤖 Генерируем заголовки через OpenAI для:', filterParams);

    try {
      const title = await generateTitle(filterParams.city, filterParams.interests, filterParams.audience);
      const subtitle = await generateSubtitle(filterParams.city, filterParams.interests, filterParams.audience, filterParams.date);
      
      console.log('✅ OpenAI заголовки сгенерированы:', { title, subtitle });
      
      const result = { title, subtitle };
      
      // Кэшируем результат
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('❌ Ошибка генерации заголовков через OpenAI:', error);
      
      // ВАЖНО: Генерируем fallback заголовки согласно промптам, а не статичные
      const fallbackTitle = this.generateFallbackTitleFromPrompt(filterParams);
      const fallbackSubtitle = this.generateFallbackSubtitleFromPrompt(filterParams);
      
      console.log('🔄 Используем fallback заголовки согласно промптам:', { fallbackTitle, fallbackSubtitle });
      
      return { 
        title: fallbackTitle, 
        subtitle: fallbackSubtitle 
      };
    }
  }

  /**
   * Генерирует только заголовок
   */
  async generateBrightTitle(city, interests, audience) {
    const filterParams = { city, interests, audience };
    const titles = await this.generateTitles(filterParams);
    return titles.title;
  }

  /**
   * Генерирует только подзаголовок
   */
  async generateBrightSubtitle(city, interests, audience) {
    const filterParams = { city, interests, audience };
    const titles = await this.generateTitles(filterParams);
    return titles.subtitle;
  }

  /**
   * Создает ключ для кэширования
   */
  getCacheKey(filterParams) {
    return `${filterParams.city}_${filterParams.audience}_${filterParams.interests.join('_')}_${filterParams.budget}`;
  }

  /**
   * Fallback заголовки если API недоступен
   */
  /**
   * Генерирует fallback заголовок согласно промптам из textGenerator.js
   */
  generateFallbackTitleFromPrompt(filterParams) {
    const { city, interests, audience } = filterParams;
    
    // Следуем правилам промпта: короткий, вдохновляющий, город + интересы
    const interestMap = {
      'swimming': 'Aquatic adventures',
      'zoo': 'Wildlife discoveries', 
      'playground': 'Family fun',
      'adventure': 'Adventures',
      'culture': 'Cultural treasures',
      'food': 'Culinary journey',
      'romantic': 'Romantic escapes',
      'art': 'Artistic discoveries',
      'music': 'Musical journey',
      'nature': 'Nature exploration',
      'history': 'Historical wonders',
      'shopping': 'Shopping adventures',
      'nightlife': 'Night discoveries',
      'relaxation': 'Peaceful retreat',
      'wellness': 'Wellness journey',
      'architecture': 'Architectural marvels',
      'photography': 'Photo adventures',
      'local': 'Local discoveries',
      'sports': 'Active adventures',
      'outdoor': 'Outdoor exploration',
      'indoor': 'Indoor discoveries'
    };
    
    const mainInterest = interests?.[0] || 'exploration';
    const interestText = interestMap[mainInterest] || mainInterest;
    
    // Используем правила капитализации из промпта
    return `${interestText} in ${city}`;
  }

  /**
   * Генерирует fallback подзаголовок согласно промптам из textGenerator.js
   */
  generateFallbackSubtitleFromPrompt(filterParams) {
    const { city, interests, audience, date } = filterParams;
    
    // Следуем правилам промпта: дата + аудитория + интересы + поэтично (3-5 предложений)
    const formattedDate = new Date(date).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    
    const audienceMap = {
      'him': 'for him',
      'her': 'for her', 
      'couples': 'for couples',
      'kids': 'for children'
    };
    
    const audienceText = audienceMap[audience] || 'for you';
    const mainInterest = interests?.[0] || 'exploration';
    
    // Создаем вдохновляющий подзаголовок в стиле трейлера к фильму
    const subtitleTemplates = {
      'swimming': `${formattedDate} ${audienceText} - dive into aquatic adventures in the heart of ${city}. Splash through crystal waters, discover hidden pools, and let the rhythm of the waves guide your perfect day. An unforgettable journey of water and wonder awaits.`,
      'zoo': `${formattedDate} ${audienceText} - embark on a wildlife adventure in ${city}. Meet amazing creatures, discover nature's secrets, and create magical memories with every step. A day where wonder meets wild in the most beautiful way.`,
      'romantic': `${formattedDate} ${audienceText} - fall in love with ${city} all over again. Stroll through enchanting streets, share intimate moments, and let the city's magic weave around you. Romance, passion, and unforgettable memories await.`,
      'culture': `${formattedDate} ${audienceText} - immerse yourself in the cultural heart of ${city}. Discover artistic treasures, explore historic wonders, and let creativity inspire your soul. A journey through time and culture unfolds.`,
      'adventure': `${formattedDate} ${audienceText} - unleash your adventurous spirit in ${city}. Conquer new heights, explore hidden paths, and embrace the thrill of discovery. An epic day of excitement and exploration begins.`
    };
    
    return subtitleTemplates[mainInterest] || `${formattedDate} ${audienceText} - discover the magic of ${city}. Experience authentic moments, create lasting memories, and let the city's unique charm captivate your heart. An extraordinary adventure awaits your arrival.`;
  }

  getFallbackTitles(filterParams) {
    // Используем новые функции, следующие промптам
    return {
      title: this.generateFallbackTitleFromPrompt(filterParams),
      subtitle: this.generateFallbackSubtitleFromPrompt(filterParams)
    };
  }

  /**
   * Очищает кэш
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = TitleGenerator;

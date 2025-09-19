/**
 * Weather Prompts
 * Промпты для генерации информации о погоде
 * Изменяйте ТОЛЬКО промпты, не трогайте логику!
 */

const { generateWeather } = require('../textGenerator');

/**
 * Генерирует блок с информацией о погоде
 */
async function generateWeatherBlock(filterParams) {
  return await generateWeather(filterParams.city, filterParams.interests, filterParams.date);
}

module.exports = {
  generateWeatherBlock
};

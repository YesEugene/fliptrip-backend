/**
 * Smart Itinerary API v2
 * Использует новую модульную архитектуру
 */

const ItineraryBuilder = require('../services/entities/itineraryBuilder');

module.exports = async (req, res) => {
  try {
    console.log('🚀 Smart Itinerary API v2 - New Architecture');
    console.log('Request body:', req.body);

    const { city, audience, interests, date, budget } = req.body;

    // Валидация параметров
    if (!city || !audience || !interests || !date || !budget) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['city', 'audience', 'interests', 'date', 'budget']
      });
    }

    // Создаем параметры фильтра
    const filterParams = {
      city,
      audience,
      interests: Array.isArray(interests) ? interests : [interests],
      date,
      budget: parseInt(budget)
    };

    console.log('Filter params:', filterParams);

    // Создаем сборщик маршрута
    const itineraryBuilder = new ItineraryBuilder();

    // Строим маршрут
    const itinerary = await itineraryBuilder.buildItinerary(filterParams);

    console.log('✅ Itinerary built successfully');
    console.log('Title:', itinerary.title);
    console.log('Locations count:', itinerary.daily_plan[0].blocks.length);

    res.json(itinerary);

  } catch (error) {
    console.error('Error in smart itinerary v2:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      architecture: 'modular_v2'
    });
  }
};

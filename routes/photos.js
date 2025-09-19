const express = require('express');
const axios = require('axios');
const router = express.Router();

// Прокси для Google Places API фотографий
router.get('/google-places/:photoReference', async (req, res) => {
  try {
    const { photoReference } = req.params;
    const { maxwidth = '800' } = req.query;
    
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${photoReference}&key=${process.env.GOOGLE_MAPS_KEY}`;
    
    // Получаем фотографию от Google
    const response = await axios.get(photoUrl, {
      responseType: 'stream',
      maxRedirects: 5
    });
    
    // Устанавливаем правильные заголовки
    res.set({
      'Content-Type': response.headers['content-type'] || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400', // Кешируем на 24 часа
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    // Пересылаем поток данных
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Error proxying Google Places photo:', error.message);
    res.status(500).json({ error: 'Failed to load photo' });
  }
});

module.exports = router;



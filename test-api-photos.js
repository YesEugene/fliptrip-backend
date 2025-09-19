const axios = require('axios');

async function testApiPhotos() {
  console.log('🌐 Тестирование API фотографий\n');
  
  try {
    const response = await axios.post('http://localhost:3000/api/smart-itinerary', {
      city: 'Lisbon',
      audience: 'him',
      interests: ['Sports'],
      budget: '80',
      date: '2025-09-16'
    });
    
    console.log('📋 Результат API:');
    console.log(`Город: ${response.data.city}`);
    console.log(`Заголовок: ${response.data.meta.creative_title}`);
    console.log(`Подзаголовок: ${response.data.meta.creative_subtitle}\n`);
    
    console.log('📍 Места и их фотографии:');
    response.data.daily_plan[0].blocks.forEach((block, blockIndex) => {
      const item = block.items[0];
      console.log(`\n${blockIndex + 1}. ${item.title}`);
      console.log(`   Категория: ${item.photos[0]?.source || 'unknown'}`);
      console.log(`   Количество фото: ${item.photos.length}`);
      console.log(`   Фото ID: ${item.photos.map(p => p.url.split('/').pop().split('?')[0]).join(', ')}`);
      console.log(`   Адрес: ${item.address}`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка API:', error.message);
  }
}

testApiPhotos();



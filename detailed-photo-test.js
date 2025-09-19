const PlacesService = require('./services/placesService');

// Создаем экземпляр сервиса
const placesService = new PlacesService();

console.log('🔍 Детальный анализ логики выбора фотографий\n');

// Тестируем конкретные места из API
const apiPlaces = [
  { name: 'Buzzz! Sports Bar & Grill', category: 'bar' },
  { name: 'Miradouro de Santa Luzia', category: 'attraction' },
  { name: 'Sporting Museum', category: 'museum' },
  { name: 'The Cup\'s Cafe & Snack Bar', category: 'cafe' },
  { name: 'Parque Florestal de Monsanto', category: 'park' },
  { name: 'Colombo Shopping Centre', category: 'shopping' }
];

apiPlaces.forEach((place, index) => {
  console.log(`📍 ${index + 1}. "${place.name}" (${place.category})`);
  console.log('─'.repeat(60));
  
  // Шаг 1: Проверяем специфичные фотографии
  const specificPhotos = placesService.getPlaceSpecificPhotos(place.name, place.category);
  console.log(`1️⃣ Специфичные фото: ${specificPhotos.length > 0 ? '✅' : '❌'}`);
  if (specificPhotos.length > 0) {
    console.log(`   Найдено: ${specificPhotos.length} фото`);
    specificPhotos.forEach((photo, i) => {
      console.log(`   ${i + 1}. ${photo.url.split('/').pop().split('?')[0]} (${photo.source})`);
    });
  } else {
    console.log('   Причина: Название не найдено в базе специфичных мест');
  }
  
  // Шаг 2: Проверяем категорийные фотографии
  const categoryPhotos = placesService.getCategoryPhotos(place.category);
  console.log(`\n2️⃣ Категорийные фото: ${categoryPhotos.length} шт.`);
  categoryPhotos.forEach((photo, i) => {
    console.log(`   ${i + 1}. ${photo.split('/').pop().split('?')[0]}`);
  });
  
  // Шаг 3: Финальный результат
  const finalPhotos = placesService.getRelevantFallbackPhotos(place.category, place.name);
  console.log(`\n3️⃣ Итоговый выбор: ${finalPhotos.length} фото`);
  console.log(`   Источники: ${finalPhotos.map(p => p.source).join(', ')}`);
  console.log(`   Фото ID: ${finalPhotos.map(p => p.url.split('/').pop().split('?')[0]).join(', ')}`);
  
  // Анализ логики
  if (specificPhotos.length > 0) {
    console.log(`\n✅ Логика: Использованы специфичные фото для "${place.name}"`);
  } else {
    console.log(`\n⚠️  Логика: Использованы категорийные фото для ${place.category}`);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
});

// Проверяем, какие места есть в базе специфичных
console.log('📚 База специфичных мест:');
const specificPlaces = [
  'plaza mayor', 'red square', 'tretyakov', 'stanislavski', 'legends',
  'miradouro', 'santa luzia', 'sporting', 'buzzz'
];
specificPlaces.forEach(place => {
  console.log(`   - ${place}`);
});



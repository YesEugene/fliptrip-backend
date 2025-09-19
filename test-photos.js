const PlacesService = require('./services/placesService');

// Создаем экземпляр сервиса
const placesService = new PlacesService();

// Тестируем различные места
const testPlaces = [
  { name: 'Plaza Mayor', category: 'attraction' },
  { name: 'Miradouro de Santa Luzia', category: 'attraction' },
  { name: 'Buzzz! Sports Bar & Grill', category: 'bar' },
  { name: 'Sporting Museum', category: 'museum' },
  { name: 'Red Square', category: 'attraction' },
  { name: 'Tretyakov Gallery', category: 'museum' },
  { name: 'Unknown Place', category: 'restaurant' }
];

console.log('🔍 Тестирование логики выбора фотографий\n');

testPlaces.forEach((place, index) => {
  console.log(`${index + 1}. Место: "${place.name}" (категория: ${place.category})`);
  
  // Тестируем getPlaceSpecificPhotos
  const specificPhotos = placesService.getPlaceSpecificPhotos(place.name, place.category);
  console.log(`   Специфичные фото: ${specificPhotos.length > 0 ? '✅ Найдены' : '❌ Не найдены'}`);
  if (specificPhotos.length > 0) {
    console.log(`   Фото: ${specificPhotos.map(p => p.url.split('/').pop().split('?')[0]).join(', ')}`);
  }
  
  // Тестируем getCategoryPhotos
  const categoryPhotos = placesService.getCategoryPhotos(place.category);
  console.log(`   Категорийные фото: ${categoryPhotos.length} шт.`);
  
  // Тестируем полную логику getRelevantFallbackPhotos
  const finalPhotos = placesService.getRelevantFallbackPhotos(place.category, place.name);
  console.log(`   Итоговые фото: ${finalPhotos.length} шт.`);
  console.log(`   Источники: ${finalPhotos.map(p => p.source).join(', ')}`);
  console.log(`   URL: ${finalPhotos.map(p => p.url.split('/').pop().split('?')[0]).join(', ')}`);
  console.log('');
});

// Тестируем хеш-функцию для проверки уникальности
console.log('🔢 Тестирование уникальности фотографий:');
const testName = 'Miradouro de Santa Luzia';
for (let i = 0; i < 5; i++) {
  const photos = placesService.getRelevantFallbackPhotos('attraction', testName);
  const photoIds = photos.map(p => p.url.split('/').pop().split('?')[0]);
  console.log(`   Попытка ${i + 1}: ${photoIds.join(', ')}`);
}



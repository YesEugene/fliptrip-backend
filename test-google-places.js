const PlacesService = require('./services/placesService');

async function testGooglePlaces() {
  const placesService = new PlacesService();
  
  console.log('=== Testing Google Places API ===');
  console.log(`API Key available: ${!!placesService.apiKey}`);
  console.log(`API Key value: ${placesService.apiKey ? placesService.apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
  
  if (!placesService.apiKey) {
    console.log('❌ No API key found. Please set GOOGLE_MAPS_KEY environment variable.');
    console.log('Example: export GOOGLE_MAPS_KEY=AIzaSyC3qYUj8A8wpdCD3__Z');
    return;
  }
  
  try {
    console.log('\n=== Testing restaurant search in Moscow ===');
    const restaurants = await placesService.searchPlaces('Moscow', 'restaurant', ['Music']);
    console.log(`Found ${restaurants.length} restaurants:`);
    restaurants.forEach((place, index) => {
      console.log(`${index + 1}. ${place.name}`);
      console.log(`   Address: ${place.address}`);
      console.log(`   Rating: ${place.rating}`);
      console.log(`   Price Level: ${place.price_level}`);
      console.log(`   Category: ${place.category}`);
      console.log('');
    });
    
    console.log('\n=== Testing cafe search in Moscow ===');
    const cafes = await placesService.searchPlaces('Moscow', 'cafe', ['Music']);
    console.log(`Found ${cafes.length} cafes:`);
    cafes.forEach((place, index) => {
      console.log(`${index + 1}. ${place.name}`);
      console.log(`   Address: ${place.address}`);
      console.log(`   Rating: ${place.rating}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error testing Google Places API:', error.message);
  }
}

testGooglePlaces();



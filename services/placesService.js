const { Client } = require('@googlemaps/google-maps-services-js');

class PlacesService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_PLACES_API_KEY;
    this.client = new Client({});
    console.log('🔑 Google Places API key available:', !!this.apiKey);
    if (this.apiKey) {
      console.log('🔑 API key prefix:', this.apiKey.substring(0, 10) + '...');
    }
  }

  async searchPlaces(city, category, interests = []) {
    console.log(`Searching places for: ${city}, ${category}, interests: ${interests.join(', ')}`);
    console.log(`API Key available: ${!!this.apiKey}`);
    console.log(`API Key value: ${this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'NOT SET'}`);
    
    if (!this.apiKey) {
      throw new Error('Google Maps API key is required for places search');
    }

    try {
      const query = this.buildSearchQuery(city, category, interests);
      console.log(`Google Places query: ${query}`);
      
      const response = await this.client.textSearch({
        params: {
          query: query,
          key: this.apiKey,
          type: this.getPlaceType(category),
          language: 'en',
          fields: ['name', 'formatted_address', 'rating', 'price_level', 'place_id', 'photos', 'types', 'place_id']
        }
      });

      console.log(`Google Places API response: ${response.data.results.length} results`);
      const formattedResults = await this.formatPlacesResponse(response.data.results);
      console.log(`Formatted results: ${formattedResults.length} places`);
      
      return formattedResults;
    } catch (error) {
      console.error('Google Places API error:', error.message);
      console.error('Error details:', error.response?.data || error);
      console.log('Falling back to mock data');
      return this.getMockPlaces(city, category);
    }
  }

  async getPlacePhotos(placeId) {
    if (!this.apiKey) {
      return this.getCategoryPhotos('attraction');
    }

    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: ['photos']
        }
      });

      if (response.data.result.photos && response.data.result.photos.length > 0) {
        return response.data.result.photos.slice(0, 3).map(photo => ({
          url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&maxheight=600&photo_reference=${photo.photo_reference}&key=${this.apiKey}`,
          thumbnail: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&maxheight=150&photo_reference=${photo.photo_reference}&key=${this.apiKey}`,
          source: 'google_places'
        }));
      }
    } catch (error) {
      console.error('Error fetching place photos:', error.message);
    }

    return this.getCategoryPhotos('attraction');
  }

  buildSearchQuery(city, category, interests) {
    let query = `${category} in ${city}`;
    
    // Специфические ключевые слова для ВСЕХ категорий
    const categoryKeywords = {
      // Детские
      'pool': 'swimming pool aquatic center water park',
      'water_park': 'water park aquatic swimming',
      'aquatic_center': 'swimming pool aquatic water',
      'zoo': 'zoo animals wildlife aquarium',
      'aquarium': 'aquarium fish marine life',
      'playground': 'playground children kids family park',
      'amusement_park': 'amusement park theme park entertainment children',
      'science_center': 'science center planetarium interactive museum',
      'children_museum': 'children museum interactive kids',
      
      // Культура и искусство
      'gallery': 'art gallery museum exhibition',
      'theater': 'theater performance show',
      'cultural_center': 'cultural center arts venue',
      'opera_house': 'opera house classical music',
      'concert_hall': 'concert hall music venue',
      
      // Еда и напитки
      'food_market': 'food market local cuisine street food',
      'local_cuisine': 'local restaurant traditional food',
      'street_food': 'street food market local',
      'rooftop_bar': 'rooftop bar view cocktails',
      'cocktail_bar': 'cocktail bar drinks',
      'jazz_club': 'jazz club music live',
      
      // Природа и активности
      'garden': 'garden botanical park',
      'nature_reserve': 'nature reserve park forest',
      'botanical_garden': 'botanical garden plants',
      'hiking': 'hiking trail nature walk',
      'cycling_path': 'cycling bike path park',
      'outdoor_activity': 'outdoor activity adventure',
      'sports_center': 'sports center gym fitness',
      'fitness_center': 'fitness center gym workout',
      
      // Wellness и релаксация
      'wellness_center': 'wellness center spa massage',
      'yoga_studio': 'yoga studio meditation wellness',
      'massage': 'massage spa wellness',
      
      // Шоппинг
      'shopping_center': 'shopping center mall',
      'local_market': 'local market traditional',
      'boutique': 'boutique unique shopping',
      
      // Достопримечательности
      'scenic_view': 'scenic view panorama lookout',
      'historical_site': 'historical site monument',
      'monument': 'monument historical landmark',
      'landmark': 'landmark famous attraction',
      'castle': 'castle historical architecture',
      
      // Развлечения
      'club': 'nightclub entertainment dancing',
      'entertainment_venue': 'entertainment venue show',
      'festival': 'festival event cultural',
      'seasonal_event': 'seasonal event festival'
    };
    
    // Добавляем специфические ключевые слова
    const keywords = categoryKeywords[category] || interests.join(' ');
    query += ` ${keywords}`;
    
    return query.trim();
  }

  getPlaceType(category) {
    const typeMap = {
      // Базовые категории
      'restaurant': 'restaurant',
      'cafe': 'cafe',
      'museum': 'museum',
      'park': 'park',
      'bar': 'bar',
      'shopping': 'shopping_mall',
      'attraction': 'tourist_attraction',
      
      // Расширенные категории для всех интересов
      'gallery': 'art_gallery',
      'theater': 'performing_arts_theater',
      'cultural_center': 'cultural_center',
      'opera_house': 'performing_arts_theater',
      'concert_hall': 'performing_arts_theater',
      'food_market': 'food',
      'local_cuisine': 'restaurant',
      'street_food': 'food',
      'cooking_class': 'school',
      'garden': 'park',
      'nature_reserve': 'park',
      'botanical_garden': 'park',
      'forest': 'park',
      'art_center': 'art_gallery',
      'creative_space': 'art_gallery',
      'art_studio': 'art_gallery',
      'street_art': 'tourist_attraction',
      'music_venue': 'night_club',
      'jazz_club': 'night_club',
      'music_store': 'store',
      'sports_center': 'gym',
      'stadium': 'stadium',
      'gym': 'gym',
      'fitness_center': 'gym',
      'outdoor_activity': 'tourist_attraction',
      'wellness_center': 'spa',
      'massage': 'spa',
      'yoga_studio': 'gym',
      'scenic_view': 'tourist_attraction',
      'rooftop_bar': 'bar',
      'romantic_spot': 'tourist_attraction',
      'historical_site': 'museum',
      'monument': 'tourist_attraction',
      'castle': 'tourist_attraction',
      'archaeological_site': 'museum',
      'landmark': 'tourist_attraction',
      'shopping_center': 'shopping_mall',
      'market': 'shopping_mall',
      'boutique': 'clothing_store',
      'store': 'store',
      'mall': 'shopping_mall',
      'local_market': 'market',
      'club': 'night_club',
      'entertainment_venue': 'night_club',
      'cocktail_bar': 'bar',
      'luxury_restaurant': 'restaurant',
      'luxury_hotel': 'lodging',
      'premium_bar': 'bar',
      'exclusive_venue': 'tourist_attraction',
      'hiking': 'park',
      'cycling': 'bicycle_store',
      'cycling_path': 'park',
      'indoor_activity': 'amusement_center',
      'seasonal_event': 'tourist_attraction',
      'festival': 'tourist_attraction',
      'cultural_event': 'cultural_center',
      'music_festival': 'tourist_attraction',
      'art_festival': 'art_gallery',
      'free_attraction': 'tourist_attraction',
      'walking_tour': 'tourist_attraction',
      
      // Детские категории (расширенные)
      'pool': 'swimming_pool',
      'water_park': 'amusement_park',
      'aquatic_center': 'swimming_pool',
      'playground': 'park',
      'zoo': 'zoo',
      'aquarium': 'aquarium',
      'amusement': 'amusement_park',
      'amusement_park': 'amusement_park',
      'theme_park': 'amusement_park',
      'family_entertainment': 'amusement_park',
      'children_park': 'park',
      'children_museum': 'museum',
      'interactive_museum': 'museum',
      'science_center': 'museum',
      'planetarium': 'museum',
      'observatory': 'museum',
      'bike_rental': 'bicycle_store',
      'children_theater': 'performing_arts_theater',
      'puppet_theater': 'performing_arts_theater',
      'family_show': 'performing_arts_theater',
      'educational_center': 'school',
      'library': 'library',
      'fun_center': 'amusement_center',
      'wildlife_center': 'zoo',
      'petting_zoo': 'zoo',
      'animal_park': 'zoo'
    };
    
    return typeMap[category?.toLowerCase()] || 'tourist_attraction';
  }

  async formatPlacesResponse(places) {
    const formattedPlaces = [];
    
    for (const place of places.slice(0, 8)) {
      // Получаем дополнительные фотографии через Place Details API
      let enhancedPlace = place;
      if (place.place_id) {
        try {
          const detailsResponse = await this.client.placeDetails({
            params: {
              place_id: place.place_id,
              key: this.apiKey,
              fields: ['photos']
            }
          });
          
          if (detailsResponse.data.result.photos) {
            enhancedPlace = {
              ...place,
              photos: detailsResponse.data.result.photos
            };
          }
        } catch (error) {
          console.log(`Could not get additional photos for ${place.name}:`, error.message);
        }
      }
      
      formattedPlaces.push({
        name: enhancedPlace.name,
        address: enhancedPlace.formatted_address,
        rating: enhancedPlace.rating || 0,
        price_level: enhancedPlace.price_level || 0,
        place_id: enhancedPlace.place_id,
        photos: enhancedPlace.place_id ? await this.getPlacePhotos(enhancedPlace.place_id).catch(() => []) : [],
        types: enhancedPlace.types || [],
        category: this.determineCategory(enhancedPlace.types || [])
      });
    }
    
    return formattedPlaces;
  }

  determineCategory(types) {
    // Определяем категорию на основе типов места
    if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
    if (types.includes('cafe') || types.includes('bakery')) return 'cafe';
    if (types.includes('museum') || types.includes('art_gallery')) return 'museum';
    if (types.includes('park') || types.includes('amusement_park')) return 'park';
    if (types.includes('bar') || types.includes('night_club')) return 'bar';
    if (types.includes('shopping_mall') || types.includes('store')) return 'shopping';
    if (types.includes('tourist_attraction') || types.includes('landmark')) return 'attraction';
    
    return 'attraction'; // По умолчанию
  }

  /**
   * Получение фотографий места по place_id
   */
  async getPlacePhotos(placeId) {
    try {
      if (!placeId) {
        console.log('❌ No place_id provided for photos');
        return [];
      }

      console.log(`📸 Getting photos for place_id: ${placeId}`);

      // Получаем детали места включая фотографии
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          key: this.apiKey,
          fields: ['photos', 'name']
        }
      });

      const place = response.data.result;
      
      if (!place.photos || place.photos.length === 0) {
        console.log(`📸 No photos found for ${place.name || placeId}`);
        return [];
      }

      console.log(`📸 Found ${place.photos.length} photos for ${place.name}`);

      // Конвертируем Google Photos в наш формат
      const photos = place.photos.slice(0, 3).map(photo => {
        const baseUrl = `https://maps.googleapis.com/maps/api/place/photo`;
        return {
          url: `${baseUrl}?maxwidth=800&photo_reference=${photo.photo_reference}&key=${this.apiKey}`,
          thumbnail: `${baseUrl}?maxwidth=200&photo_reference=${photo.photo_reference}&key=${this.apiKey}`,
          source: 'google_places'
        };
      });

      console.log(`✅ Converted ${photos.length} Google Photos`);
      return photos;

    } catch (error) {
      console.error(`❌ Error getting photos for ${placeId}:`, error.message);
      return [];
    }
  }

  /**
   * Получение релевантных fallback фотографий для места
   */
  getRelevantFallbackPhotos(category, placeName) {
    // Создаем поиск фотографий по названию места
    const nameHash = this.hashString(placeName);
    const photoIndex = nameHash % 3;
    
    // База фотографий для конкретных мест
    const placePhotos = this.getPlaceSpecificPhotos(placeName, category);
    
    // Если есть фотографии для конкретного места, используем их
    if (placePhotos.length > 0) {
      return placePhotos.slice(0, 3);
    }
    
    // Иначе используем общие фотографии по категории
    const categoryPhotos = this.getCategoryPhotos(category);
    const selectedPhotos = [
      categoryPhotos[photoIndex],
      categoryPhotos[(photoIndex + 1) % categoryPhotos.length],
      categoryPhotos[(photoIndex + 2) % categoryPhotos.length]
    ];
    
    return selectedPhotos.map(photo => {
      const photoUrl = typeof photo === 'string' ? photo : photo.url || photo;
      return {
        url: photoUrl,
        source: 'unsplash',
        thumbnail: photoUrl.includes('w=800&h=600') ? photoUrl.replace('w=800&h=600', 'w=200&h=150') : photoUrl
      };
    });
  }

  /**
   * Получение фотографий для конкретного места
   */
  getPlaceSpecificPhotos(placeName, category) {
    if (!placeName || typeof placeName !== 'string') {
      return [];
    }
    const placeNameLower = placeName.toLowerCase();
    
    // Специфичные фотографии для известных мест
    const specificPlaces = {
      'plaza mayor': [
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80', // Plaza Mayor Madrid
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80', // Plaza Mayor архитектура
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80'  // Plaza Mayor площадь
      ],
      'red square': [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80', // Red Square Moscow
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80', // Red Square St. Basil's
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80'  // Red Square Kremlin
      ],
      'tretyakov': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80', // Tretyakov Gallery
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Russian art
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'  // Museum interior
      ],
      'stanislavski': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80', // Theatre interior
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Stage
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'  // Theatre seats
      ],
      'legends': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80', // Football museum
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Sports memorabilia
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'  // Football history
      ],
      'miradouro': [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80', // Lisbon viewpoint
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80', // City view
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80'  // Lisbon skyline
      ],
      'santa luzia': [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80', // Santa Luzia viewpoint
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80', // Lisbon view
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80'  // City panorama
      ],
      'sporting': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80', // Sporting museum
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Sports memorabilia
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'  // Football history
      ],
      'buzzz': [
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop&q=80', // Sports bar
        'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=600&fit=crop&q=80', // Bar interior
        'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&q=80'  // Sports bar
      ],
      'nulevoy': [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80', // Zero kilometer monument
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80', // Moscow landmark
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80'  // Bronze plaque
      ],
      'kilometr': [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80', // Zero kilometer monument
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80', // Moscow landmark
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80'  // Bronze plaque
      ],
      'kusochki': [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80', // Cafe interior
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80', // Coffee shop
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80'  // Cafe atmosphere
      ],
      // Venice specific places
      'caffè florian': [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80', // Historic Venetian cafe
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80', // Elegant cafe interior
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'  // St. Mark's Square cafe
      ],
      'caffè quadri': [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80', // Historic Venetian cafe
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80', // Elegant cafe interior
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'  // St. Mark's Square cafe
      ],
      'st. mark\'s basilica': [
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80', // St. Mark's Basilica exterior
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Byzantine architecture
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80'  // Venice basilica interior
      ],
      'doge\'s palace': [
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80', // Doge's Palace exterior
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Gothic architecture
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80'  // Palace interior
      ],
      'rialto bridge': [
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80', // Rialto Bridge
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Grand Canal view
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80'  // Venice bridge architecture
      ],
      'grand canal': [
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80', // Grand Canal panorama
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Venice waterway
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80'  // Venetian palaces
      ],
      'bridge of sighs': [
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80', // Bridge of Sighs
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Venice canal bridge
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80'  // Historic Venetian bridge
      ],
      'peggy guggenheim collection': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80', // Modern art museum
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Art gallery interior
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80'  // Contemporary art
      ],
      'gallerie dell\'accademia': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80', // Art museum
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Renaissance art
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80'  // Venetian art
      ],
      'torrefazione marchi': [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80', // Coffee roastery
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80', // Coffee shop
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'  // Artisan coffee
      ],
      'harry\'s bar': [
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop&q=80', // Historic bar
        'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=600&fit=crop&q=80', // Bar interior
        'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&q=80'  // Cocktail bar
      ]
    };
    
    // Ищем точное совпадение
    for (const [key, photos] of Object.entries(specificPlaces)) {
      if (placeNameLower.includes(key)) {
        return photos.map(photo => ({
          url: photo,
          source: 'unsplash',
          thumbnail: typeof photo === 'string' ? photo.replace('w=800&h=600', 'w=200&h=150') : photo
        }));
      }
    }
    
    return [];
  }

  /**
   * Получение общих фотографий по категории
   */
  getCategoryPhotos(category) {
    const photoMap = {
      'restaurant': [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&q=80'
      ],
      'cafe': [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80'
      ],
      'museum': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'
      ],
      'park': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80'
      ],
      'attraction': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80'
      ],
      'bar': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80'
      ],
      'shopping': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80'
      ]
    };
    
    const photos = photoMap[category] || photoMap['attraction'];
    
    // Преобразуем в формат объектов с url и thumbnail
    return photos.map(photo => ({
      url: photo,
      source: 'unsplash',
      thumbnail: typeof photo === 'string' ? photo.replace('w=800&h=600', 'w=200&h=150') : photo
    }));
  }

  /**
   * Получение fallback фотографий для места (старая версия)
   */
  getFallbackPhotos(category, placeName) {
    // Создаем уникальные фотографии на основе названия места
    const nameHash = this.hashString(placeName);
    const photoIndex = nameHash % 3; // Выбираем одну из 3 фотографий
    
    const photoMap = {
      'restaurant': [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop'
      ],
      'cafe': [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
      ],
      'bar': [
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop'
      ],
      'museum': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'
      ],
      'park': [
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=600&fit=crop'
      ],
      'attraction': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
      ],
      'shopping': [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop'
      ]
    };
    
    const categoryPhotos = photoMap[category] || photoMap['attraction'];
    const selectedPhoto = categoryPhotos[photoIndex];
    
    // Возвращаем 3 разные фотографии для разнообразия
    return [
      {
        url: selectedPhoto,
        source: 'unsplash',
        thumbnail: selectedPhoto.replace('w=800&h=600', 'w=200&h=150')
      },
      {
        url: categoryPhotos[(photoIndex + 1) % 3],
        source: 'unsplash',
        thumbnail: categoryPhotos[(photoIndex + 1) % 3].replace('w=800&h=600', 'w=200&h=150')
      },
      {
        url: categoryPhotos[(photoIndex + 2) % 3],
        source: 'unsplash',
        thumbnail: categoryPhotos[(photoIndex + 2) % 3].replace('w=800&h=600', 'w=200&h=150')
      }
    ];
  }

  /**
   * Простая хеш-функция для генерации псевдослучайного числа
   */
  hashString(str) {
    if (!str || typeof str !== 'string') {
      return 0;
    }
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  getPlacePhotosByName(placeName, city) {
    // Специальные фотографии для известных мест с более релевантными изображениями
    const specialPhotos = {
      'Les Deux Magots': [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80', // Parisian cafe
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80', // Coffee shop interior
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80'  // Cafe atmosphere
      ],
      'Eiffel Tower': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80', // Eiffel Tower
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80', // Paris skyline
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80'  // Tower view
      ],
      'Louvre Museum': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80', // Museum interior
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Art gallery
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80'  // Louvre pyramid
      ],
      'Notre-Dame Cathedral': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80', // Notre-Dame
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80', // Gothic architecture
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80'  // Cathedral exterior
      ],
      'Jardin du Luxembourg': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80', // Luxembourg Gardens
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80', // Park landscape
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80'  // Garden paths
      ],
      'Colosseum': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80', // Colosseum exterior
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80', // Ancient Rome
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80'  // Roman architecture
      ],
      'Pantheon': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80', // Pantheon Rome
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80', // Roman temple
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80'  // Classical architecture
      ],
      'Vatican Museums': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80', // Vatican interior
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Art collection
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80'  // Museum halls
      ],
      'Prado Museum': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80', // Prado Museum
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Spanish art
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80'  // Art gallery
      ],
      'Royal Palace': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80', // Royal Palace Madrid
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80', // Palace architecture
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80'  // Royal residence
      ],
      'Caffè Florian': [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80', // Venetian cafe
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80', // Cafe interior
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80'  // Historic cafe
      ],
      'Doge\'s Palace': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80', // Doge's Palace
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Venetian architecture
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80'  // Palace exterior
      ],
      'St. Mark\'s Basilica': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80', // St. Mark's Basilica
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80', // Byzantine architecture
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80'  // Basilica exterior
      ],
      'Rialto Bridge': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80', // Rialto Bridge
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80', // Venetian bridge
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80'  // Bridge architecture
      ],
      'Grand Canal': [
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80', // Grand Canal
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Venetian canals
        'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=800&h=600&fit=crop&q=80'  // Canal view
      ],
      'Caffè Quadri': [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80', // Historic Venetian cafe
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80', // Elegant cafe interior
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'  // St. Mark's Square cafe
      ],
      'Peggy Guggenheim Collection': [
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80', // Modern art museum
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80', // Art gallery interior
        'https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&h=600&fit=crop&q=80'  // Contemporary art
      ],
      'Torrefazione Marchi': [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop&q=80', // Coffee roastery
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop&q=80', // Coffee shop
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=80'  // Artisan coffee
      ],
      'Harry\'s Bar': [
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop&q=80', // Historic bar
        'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=600&fit=crop&q=80', // Bar interior
        'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&q=80'  // Cocktail bar
      ]
    };

    if (specialPhotos[placeName]) {
      return specialPhotos[placeName].map(url => ({
        url: url,
        thumbnail: url.replace('w=800&h=600', 'w=200&h=150'),
        source: 'unsplash'
      }));
    }

    return this.getCategoryPhotos('attraction');
  }

  getMockPlaces(city, category) {
    const cityName = city?.toLowerCase() || '';
    
    // Реалистичные названия для каждого города
    const cityPlaces = {
      'lisbon': {
        'restaurant': [
          { name: 'Cervejaria Ramiro', address: 'Av. Almirante Reis, Lisbon', rating: 4.6, price_level: 3, category: 'restaurant', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('restaurant') },
          { name: 'A Cevicheria', address: 'Rua Dom Pedro V, Lisbon', rating: 4.4, price_level: 3, category: 'restaurant', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('restaurant') },
          { name: 'Taberna da Rua das Flores', address: 'Rua das Flores, Lisbon', rating: 4.3, price_level: 2, category: 'restaurant', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('restaurant') },
          { name: 'Pasteis de Belem', address: 'Rua de Belém, Lisbon', rating: 4.5, price_level: 1, category: 'restaurant', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('restaurant') },
          { name: 'Time Out Market', address: 'Mercado da Ribeira, Lisbon', rating: 4.2, price_level: 2, category: 'restaurant', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('restaurant') }
        ],
        'cafe': [
          { name: 'A Brasileira', address: 'Rua Garrett, Lisbon', rating: 4.1, price_level: 2, category: 'cafe', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('cafe') },
          { name: 'Café Nicola', address: 'Praça Dom Pedro IV, Lisbon', rating: 4.0, price_level: 2, category: 'cafe', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('cafe') },
          { name: 'Fábrica Coffee Roasters', address: 'Rua das Portas de Santo Antão, Lisbon', rating: 4.4, price_level: 2, category: 'cafe', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('cafe') },
          { name: 'Café Tavares', address: 'Rua da Misericórdia, Lisbon', rating: 4.2, price_level: 2, category: 'cafe', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('cafe') }
        ],
        'museum': [
          { name: 'Museu Nacional de Arte Antiga', address: 'Rua das Janelas Verdes, Lisbon', rating: 4.3, price_level: 2, category: 'museum', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('museum') },
          { name: 'Museu Calouste Gulbenkian', address: 'Av. de Berna, Lisbon', rating: 4.5, price_level: 2, category: 'museum', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('museum') },
          { name: 'Museu do Azulejo', address: 'Rua da Madre de Deus, Lisbon', rating: 4.2, price_level: 2, category: 'museum', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('museum') },
          { name: 'MAAT - Museum of Art, Architecture and Technology', address: 'Av. Brasília, Lisbon', rating: 4.1, price_level: 2, category: 'museum', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('museum') }
        ],
        'park': [
          { name: 'Jardim da Estrela', address: 'Praça da Estrela, Lisbon', rating: 4.3, price_level: 0, category: 'park', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('park') },
          { name: 'Parque Eduardo VII', address: 'Av. Sidónio Pais, Lisbon', rating: 4.1, price_level: 0, category: 'park', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('park') },
          { name: 'Miradouro de São Pedro de Alcântara', address: 'Rua de São Pedro de Alcântara, Lisbon', rating: 4.4, price_level: 0, category: 'park', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('park') },
          { name: 'Jardim do Príncipe Real', address: 'Praça do Príncipe Real, Lisbon', rating: 4.2, price_level: 0, category: 'park', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('park') }
        ],
        'attraction': [
          { name: 'Castelo de São Jorge', address: 'Rua de Santa Cruz do Castelo, Lisbon', rating: 4.4, price_level: 2, category: 'attraction', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('attraction') },
          { name: 'Torre de Belém', address: 'Av. Brasília, Lisbon', rating: 4.5, price_level: 2, category: 'attraction', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('attraction') },
          { name: 'Mosteiro dos Jerónimos', address: 'Praça do Império, Lisbon', rating: 4.6, price_level: 2, category: 'attraction', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('attraction') },
          { name: 'Elevador de Santa Justa', address: 'Rua de Santa Justa, Lisbon', rating: 4.0, price_level: 2, category: 'attraction', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('attraction') },
          { name: 'Oceanário de Lisboa', address: 'Esplanada Dom Carlos I, Lisbon', rating: 4.5, price_level: 3, category: 'attraction', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('attraction') }
        ],
        'bar': [
          { name: 'Pensão Amor', address: 'Rua do Alecrim, Lisbon', rating: 4.3, price_level: 2, category: 'bar', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('bar') },
          { name: 'Pavilhão Chinês', address: 'Rua Dom Pedro V, Lisbon', rating: 4.2, price_level: 2, category: 'bar', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('bar') },
          { name: 'Park Bar', address: 'Calçada do Combro, Lisbon', rating: 4.4, price_level: 2, category: 'bar', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('bar') },
          { name: 'LX Factory', address: 'Rua Rodrigues de Faria, Lisbon', rating: 4.1, price_level: 2, category: 'bar', lat: 38.7223, lng: -9.1393, photos: this.getCategoryPhotos('bar') }
        ]
      },
      'paris': {
        'restaurant': [
          { name: 'Le Bistrot du Coin', address: 'Rue de Rivoli, Paris', rating: 4.2, price_level: 2, category: 'restaurant', lat: 48.8566, lng: 2.3522, photos: this.getCategoryPhotos('restaurant') },
          { name: 'Café de Flore', address: 'Boulevard Saint-Germain, Paris', rating: 4.5, price_level: 3, category: 'restaurant', lat: 48.8542, lng: 2.3308, photos: this.getCategoryPhotos('restaurant') },
          { name: 'Brasserie Lipp', address: 'Boulevard Saint-Germain, Paris', rating: 4.3, price_level: 2, category: 'restaurant', lat: 48.8542, lng: 2.3308, photos: this.getCategoryPhotos('restaurant') }
        ],
        'cafe': [
          { name: 'Les Deux Magots', address: 'Place Saint-Germain-des-Prés, Paris', rating: 4.4, price_level: 2, category: 'cafe', lat: 48.8542, lng: 2.3308, photos: this.getPlacePhotosByName('Les Deux Magots', 'Paris') },
          { name: 'Café de la Paix', address: 'Place de l\'Opéra, Paris', rating: 4.2, price_level: 2, category: 'cafe', lat: 48.8720, lng: 2.3317, photos: this.getCategoryPhotos('cafe') },
          { name: 'Angelina', address: 'Rue de Rivoli, Paris', rating: 4.3, price_level: 2, category: 'cafe', lat: 48.8566, lng: 2.3522, photos: this.getCategoryPhotos('cafe') }
        ],
        'museum': [
          { name: 'Louvre Museum', address: 'Rue de Rivoli, Paris', rating: 4.6, price_level: 2, category: 'museum', lat: 48.8606, lng: 2.3376, photos: this.getPlacePhotosByName('Louvre Museum', 'Paris') },
          { name: 'Musée d\'Orsay', address: 'Rue de Lille, Paris', rating: 4.5, price_level: 2, category: 'museum', lat: 48.8600, lng: 2.3266, photos: this.getCategoryPhotos('museum') },
          { name: 'Centre Pompidou', address: 'Place Georges-Pompidou, Paris', rating: 4.3, price_level: 2, category: 'museum', lat: 48.8606, lng: 2.3522, photos: this.getCategoryPhotos('museum') }
        ],
        'park': [
          { name: 'Jardin du Luxembourg', address: 'Rue de Vaugirard, Paris', rating: 4.5, price_level: 0, category: 'park', lat: 48.8462, lng: 2.3372, photos: this.getPlacePhotosByName('Jardin du Luxembourg', 'Paris') },
          { name: 'Tuileries Garden', address: 'Place de la Concorde, Paris', rating: 4.4, price_level: 0, category: 'park', lat: 48.8634, lng: 2.3274, photos: this.getCategoryPhotos('park') },
          { name: 'Parc des Buttes-Chaumont', address: 'Rue Botzaris, Paris', rating: 4.3, price_level: 0, category: 'park', lat: 48.8833, lng: 2.3833, photos: this.getCategoryPhotos('park') }
        ],
        'attraction': [
          { name: 'Eiffel Tower', address: 'Champ de Mars, Paris', rating: 4.7, price_level: 2, category: 'attraction', lat: 48.8584, lng: 2.2945, photos: this.getPlacePhotosByName('Eiffel Tower', 'Paris') },
          { name: 'Notre-Dame Cathedral', address: 'Parvis Notre-Dame, Paris', rating: 4.6, price_level: 0, category: 'attraction', lat: 48.8530, lng: 2.3499, photos: this.getPlacePhotosByName('Notre-Dame Cathedral', 'Paris') },
          { name: 'Arc de Triomphe', address: 'Place Charles de Gaulle, Paris', rating: 4.5, price_level: 1, category: 'attraction', lat: 48.8738, lng: 2.2950, photos: this.getCategoryPhotos('attraction') }
        ],
        'bar': [
          { name: 'Harry\'s New York Bar', address: 'Rue Daunou, Paris', rating: 4.2, price_level: 3, category: 'bar', lat: 48.8720, lng: 2.3317, photos: this.getCategoryPhotos('bar') },
          { name: 'Le Comptoir du Relais', address: 'Carrefour de l\'Odéon, Paris', rating: 4.3, price_level: 2, category: 'bar', lat: 48.8542, lng: 2.3308, photos: this.getCategoryPhotos('bar') },
          { name: 'Bar Hemingway', address: 'Rue Cambon, Paris', rating: 4.4, price_level: 3, category: 'bar', lat: 48.8667, lng: 2.3333, photos: this.getCategoryPhotos('bar') }
        ]
      },
      'rome': {
        'restaurant': [
          { name: 'Trattoria da Enzo', address: 'Via dei Vascellari, Rome', rating: 4.3, price_level: 2, category: 'restaurant', photos: this.getCategoryPhotos('restaurant') },
          { name: 'Roscioli', address: 'Via dei Giubbonari, Rome', rating: 4.4, price_level: 2, category: 'restaurant', photos: this.getCategoryPhotos('restaurant') },
          { name: 'Armando al Pantheon', address: 'Salita dei Crescenzi, Rome', rating: 4.5, price_level: 2, category: 'restaurant', photos: this.getCategoryPhotos('restaurant') }
        ],
        'cafe': [
          { name: 'Sant\'Eustachio Il Caffè', address: 'Piazza di Sant\'Eustachio, Rome', rating: 4.2, price_level: 1, category: 'cafe', photos: this.getCategoryPhotos('cafe') },
          { name: 'Tazza d\'Oro', address: 'Via degli Orfani, Rome', rating: 4.1, price_level: 1, category: 'cafe', photos: this.getCategoryPhotos('cafe') },
          { name: 'Caffè Greco', address: 'Via dei Condotti, Rome', rating: 4.3, price_level: 2, category: 'cafe', photos: this.getCategoryPhotos('cafe') }
        ],
        'museum': [
          { name: 'Vatican Museums', address: 'Viale Vaticano, Rome', rating: 4.7, price_level: 2, category: 'museum', photos: this.getPlacePhotosByName('Vatican Museums', 'Rome') },
          { name: 'Capitoline Museums', address: 'Piazza del Campidoglio, Rome', rating: 4.4, price_level: 2, category: 'museum', photos: this.getCategoryPhotos('museum') },
          { name: 'Galleria Borghese', address: 'Piazzale Scipione Borghese, Rome', rating: 4.5, price_level: 2, category: 'museum', photos: this.getCategoryPhotos('museum') }
        ],
        'park': [
          { name: 'Villa Borghese', address: 'Piazzale Scipione Borghese, Rome', rating: 4.5, price_level: 0, category: 'park', photos: this.getCategoryPhotos('park') },
          { name: 'Villa Doria Pamphilj', address: 'Via di San Pancrazio, Rome', rating: 4.3, price_level: 0, category: 'park', photos: this.getCategoryPhotos('park') },
          { name: 'Parco degli Acquedotti', address: 'Via Lemonia, Rome', rating: 4.2, price_level: 0, category: 'park', photos: this.getCategoryPhotos('park') }
        ],
        'attraction': [
          { name: 'Colosseum', address: 'Piazza del Colosseo, Rome', rating: 4.7, price_level: 2, category: 'attraction', photos: this.getPlacePhotosByName('Colosseum', 'Rome') },
          { name: 'Pantheon', address: 'Piazza della Rotonda, Rome', rating: 4.6, price_level: 0, category: 'attraction', photos: this.getPlacePhotosByName('Pantheon', 'Rome') },
          { name: 'Trevi Fountain', address: 'Piazza di Trevi, Rome', rating: 4.5, price_level: 0, category: 'attraction', photos: this.getCategoryPhotos('attraction') }
        ],
        'bar': [
          { name: 'Jerry Thomas Speakeasy', address: 'Vicolo Cellini, Rome', rating: 4.3, price_level: 3, category: 'bar', photos: this.getCategoryPhotos('bar') },
          { name: 'The Court', address: 'Via del Governo Vecchio, Rome', rating: 4.2, price_level: 2, category: 'bar', photos: this.getCategoryPhotos('bar') },
          { name: 'Open Baladin', address: 'Via degli Specchi, Rome', rating: 4.1, price_level: 2, category: 'bar', photos: this.getCategoryPhotos('bar') }
        ]
      },
      'madrid': {
        'restaurant': [
          { name: 'Casa Lucio', address: 'Calle Cava Baja, Madrid', rating: 4.3, price_level: 2, category: 'restaurant', photos: this.getCategoryPhotos('restaurant') },
          { name: 'Botín', address: 'Calle de Cuchilleros, Madrid', rating: 4.4, price_level: 3, category: 'restaurant', photos: this.getCategoryPhotos('restaurant') },
          { name: 'Casa Mono', address: 'Calle de la Cava Baja, Madrid', rating: 4.2, price_level: 2, category: 'restaurant', photos: this.getCategoryPhotos('restaurant') }
        ],
        'cafe': [
          { name: 'Café Gijón', address: 'Paseo de Recoletos, Madrid', rating: 4.2, price_level: 2, category: 'cafe', photos: this.getCategoryPhotos('cafe') },
          { name: 'Café Central', address: 'Plaza del Ángel, Madrid', rating: 4.1, price_level: 1, category: 'cafe', photos: this.getCategoryPhotos('cafe') },
          { name: 'Café de Oriente', address: 'Plaza de Oriente, Madrid', rating: 4.3, price_level: 2, category: 'cafe', photos: this.getCategoryPhotos('cafe') }
        ],
        'museum': [
          { name: 'Prado Museum', address: 'Calle de Ruiz de Alarcón, Madrid', rating: 4.6, price_level: 2, category: 'museum', photos: this.getPlacePhotosByName('Prado Museum', 'Madrid') },
          { name: 'Reina Sofía', address: 'Calle de Santa Isabel, Madrid', rating: 4.4, price_level: 2, category: 'museum', photos: this.getCategoryPhotos('museum') },
          { name: 'Thyssen-Bornemisza', address: 'Paseo del Prado, Madrid', rating: 4.5, price_level: 2, category: 'museum', photos: this.getCategoryPhotos('museum') }
        ],
        'park': [
          { name: 'Retiro Park', address: 'Plaza de la Independencia, Madrid', rating: 4.5, price_level: 0, category: 'park', photos: this.getCategoryPhotos('park') },
          { name: 'Casa de Campo', address: 'Casa de Campo, Madrid', rating: 4.3, price_level: 0, category: 'park', photos: this.getCategoryPhotos('park') },
          { name: 'Parque del Oeste', address: 'Paseo de Ruperto Chapí, Madrid', rating: 4.2, price_level: 0, category: 'park', photos: this.getCategoryPhotos('park') }
        ],
        'attraction': [
          { name: 'Royal Palace', address: 'Calle de Bailén, Madrid', rating: 4.6, price_level: 2, category: 'attraction', photos: this.getPlacePhotosByName('Royal Palace', 'Madrid') },
          { name: 'Plaza Mayor', address: 'Plaza Mayor, Madrid', rating: 4.4, price_level: 0, category: 'attraction', photos: this.getCategoryPhotos('attraction') },
          { name: 'Puerta del Sol', address: 'Puerta del Sol, Madrid', rating: 4.3, price_level: 0, category: 'attraction', photos: this.getCategoryPhotos('attraction') }
        ],
        'bar': [
          { name: '1862 Dry Bar', address: 'Calle del Pez, Madrid', rating: 4.3, price_level: 2, category: 'bar', photos: this.getCategoryPhotos('bar') },
          { name: 'Salmon Guru', address: 'Calle de Echegaray, Madrid', rating: 4.4, price_level: 3, category: 'bar', photos: this.getCategoryPhotos('bar') },
          { name: 'Del Diego', address: 'Calle de la Reina, Madrid', rating: 4.2, price_level: 2, category: 'bar', photos: this.getCategoryPhotos('bar') }
        ]
      },
      'venice': {
        'restaurant': [
          { name: 'Osteria alle Testiere', address: 'Calle del Mondo Novo, Venice', rating: 4.5, price_level: 3, category: 'restaurant', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('restaurant') },
          { name: 'Trattoria da Fiore', address: 'Calle del Scaleter, Venice', rating: 4.3, price_level: 2, category: 'restaurant', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('restaurant') },
          { name: 'Ristorante Quadri', address: 'Piazza San Marco, Venice', rating: 4.4, price_level: 4, category: 'restaurant', lat: 45.4342, lng: 12.3388, photos: this.getCategoryPhotos('restaurant') },
          { name: 'Al Covo', address: 'Campiello della Pescaria, Venice', rating: 4.6, price_level: 3, category: 'restaurant', lat: 45.4362, lng: 12.3419, photos: this.getCategoryPhotos('restaurant') },
          { name: 'Osteria da Carla', address: 'Corte del Bianco, Venice', rating: 4.2, price_level: 2, category: 'restaurant', lat: 45.4389, lng: 12.3267, photos: this.getCategoryPhotos('restaurant') },
          { name: 'Trattoria Antiche Carampane', address: 'Rio Terà delle Carampane, Venice', rating: 4.4, price_level: 3, category: 'restaurant', lat: 45.4371, lng: 12.3298, photos: this.getCategoryPhotos('restaurant') }
        ],
        'cafe': [
          { name: 'Caffè Florian', address: 'Piazza San Marco, Venice', rating: 4.2, price_level: 3, category: 'cafe', lat: 45.4342, lng: 12.3388, photos: this.getPlacePhotosByName('Caffè Florian', 'Venice') },
          { name: 'Caffè Quadri', address: 'Piazza San Marco, Venice', rating: 4.1, price_level: 3, category: 'cafe', lat: 45.4342, lng: 12.3388, photos: this.getCategoryPhotos('cafe') },
          { name: 'Torrefazione Marchi', address: 'Calle del Caffè, Venice', rating: 4.3, price_level: 2, category: 'cafe', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('cafe') },
          { name: 'Rosa Salva', address: 'Calle Fiubera, Venice', rating: 4.0, price_level: 2, category: 'cafe', lat: 45.4348, lng: 12.3372, photos: this.getCategoryPhotos('cafe') },
          { name: 'Caffè del Doge', address: 'Calle dei Cinque, Venice', rating: 4.2, price_level: 2, category: 'cafe', lat: 45.4381, lng: 12.3301, photos: this.getCategoryPhotos('cafe') },
          { name: 'Pasticceria Tonolo', address: 'Crosera San Pantalon, Venice', rating: 4.5, price_level: 1, category: 'cafe', lat: 45.4298, lng: 12.3201, photos: this.getCategoryPhotos('cafe') }
        ],
        'museum': [
          { name: 'Doge\'s Palace', address: 'Piazza San Marco, Venice', rating: 4.6, price_level: 2, category: 'museum', lat: 45.4342, lng: 12.3388, photos: this.getPlacePhotosByName('Doge\'s Palace', 'Venice') },
          { name: 'Gallerie dell\'Accademia', address: 'Campo della Carità, Venice', rating: 4.5, price_level: 2, category: 'museum', lat: 45.4312, lng: 12.3281, photos: this.getCategoryPhotos('museum') },
          { name: 'Peggy Guggenheim Collection', address: 'Dorsoduro, Venice', rating: 4.4, price_level: 2, category: 'museum', lat: 45.4308, lng: 12.3294, photos: this.getCategoryPhotos('museum') },
          { name: 'Ca\' Rezzonico', address: 'Dorsoduro, Venice', rating: 4.3, price_level: 2, category: 'museum', lat: 45.4298, lng: 12.3267, photos: this.getCategoryPhotos('museum') },
          { name: 'Palazzo Grassi', address: 'Campo San Samuele, Venice', rating: 4.2, price_level: 2, category: 'museum', lat: 45.4321, lng: 12.3298, photos: this.getCategoryPhotos('museum') },
          { name: 'Ca\' Pesaro', address: 'Santa Croce, Venice', rating: 4.1, price_level: 2, category: 'museum', lat: 45.4401, lng: 12.3267, photos: this.getCategoryPhotos('museum') }
        ],
        'park': [
          { name: 'Giardini della Biennale', address: 'Castello, Venice', rating: 4.3, price_level: 0, category: 'park', lat: 45.4308, lng: 12.3594, photos: this.getCategoryPhotos('park') },
          { name: 'Parco delle Rimembranze', address: 'Lido, Venice', rating: 4.2, price_level: 0, category: 'park', lat: 45.4000, lng: 12.3667, photos: this.getCategoryPhotos('park') },
          { name: 'Giardini Papadopoli', address: 'Santa Croce, Venice', rating: 4.1, price_level: 0, category: 'park', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('park') },
          { name: 'Giardini Reali', address: 'San Marco, Venice', rating: 4.0, price_level: 0, category: 'park', lat: 45.4338, lng: 12.3401, photos: this.getCategoryPhotos('park') },
          { name: 'Parco San Giuliano', address: 'Mestre, Venice', rating: 4.2, price_level: 0, category: 'park', lat: 45.4567, lng: 12.2789, photos: this.getCategoryPhotos('park') },
          { name: 'Giardino della Marinaressa', address: 'Castello, Venice', rating: 4.1, price_level: 0, category: 'park', lat: 45.4289, lng: 12.3567, photos: this.getCategoryPhotos('park') }
        ],
        'attraction': [
          { name: 'St. Mark\'s Basilica', address: 'Piazza San Marco, Venice', rating: 4.7, price_level: 0, category: 'attraction', lat: 45.4342, lng: 12.3388, photos: this.getPlacePhotosByName('St. Mark\'s Basilica', 'Venice') },
          { name: 'Rialto Bridge', address: 'San Polo, Venice', rating: 4.5, price_level: 0, category: 'attraction', lat: 45.4378, lng: 12.3358, photos: this.getPlacePhotosByName('Rialto Bridge', 'Venice') },
          { name: 'Grand Canal', address: 'Venice', rating: 4.8, price_level: 0, category: 'attraction', lat: 45.4408, lng: 12.3155, photos: this.getPlacePhotosByName('Grand Canal', 'Venice') },
          { name: 'Bridge of Sighs', address: 'Piazza San Marco, Venice', rating: 4.6, price_level: 0, category: 'attraction', lat: 45.4341, lng: 12.3409, photos: this.getPlacePhotosByName('Bridge of Sighs', 'Venice') },
          { name: 'Campanile di San Marco', address: 'Piazza San Marco, Venice', rating: 4.4, price_level: 1, category: 'attraction', lat: 45.4342, lng: 12.3388, photos: this.getCategoryPhotos('attraction') },
          { name: 'Murano Island', address: 'Murano, Venice', rating: 4.3, price_level: 0, category: 'attraction', lat: 45.4586, lng: 12.3567, photos: this.getCategoryPhotos('attraction') }
        ],
        'bar': [
          { name: 'Harry\'s Bar', address: 'Calle Vallaresso, Venice', rating: 4.3, price_level: 4, category: 'bar', lat: 45.4342, lng: 12.3388, photos: this.getCategoryPhotos('bar') },
          { name: 'Caffè Centrale', address: 'Cannaregio, Venice', rating: 4.2, price_level: 2, category: 'bar', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('bar') },
          { name: 'Bacaro Jazz', address: 'San Marco, Venice', rating: 4.4, price_level: 3, category: 'bar', lat: 45.4342, lng: 12.3388, photos: this.getCategoryPhotos('bar') },
          { name: 'Cantina Do Spade', address: 'Calle delle Do Spade, Venice', rating: 4.1, price_level: 2, category: 'bar', lat: 45.4381, lng: 12.3345, photos: this.getCategoryPhotos('bar') },
          { name: 'Al Mercà', address: 'Campo Bella Vienna, Venice', rating: 4.0, price_level: 1, category: 'bar', lat: 45.4371, lng: 12.3356, photos: this.getCategoryPhotos('bar') },
          { name: 'Osteria alle Botteghe', address: 'Calle delle Botteghe, Venice', rating: 4.3, price_level: 2, category: 'bar', lat: 45.4298, lng: 12.3289, photos: this.getCategoryPhotos('bar') }
        ]
      }
    };
    
    // Fallback для других городов
    const fallbackPlaces = {
      'restaurant': [
        { name: 'Local Restaurant', address: `${city} Restaurant District`, rating: 4.2, price_level: 2, category: 'restaurant', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('restaurant') },
        { name: 'Traditional Eatery', address: `${city} Food Street`, rating: 4.0, price_level: 1, category: 'restaurant', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('restaurant') },
        { name: 'Fine Dining', address: `${city} Upscale Area`, rating: 4.5, price_level: 3, category: 'restaurant', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('restaurant') }
      ],
      'cafe': [
        { name: 'Coffee Corner', address: `${city} Coffee District`, rating: 4.1, price_level: 1, category: 'cafe', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('cafe') },
        { name: 'Artisan Cafe', address: `${city} Arts Quarter`, rating: 4.3, price_level: 2, category: 'cafe', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('cafe') },
        { name: 'Local Brew', address: `${city} Historic Center`, rating: 4.0, price_level: 1, category: 'cafe', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('cafe') }
      ],
      'museum': [
        { name: 'City Museum', address: `${city} Museum District`, rating: 4.4, price_level: 2, category: 'museum', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('museum') },
        { name: 'Art Gallery', address: `${city} Arts Quarter`, rating: 4.2, price_level: 1, category: 'museum', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('museum') },
        { name: 'History Center', address: `${city} Historic District`, rating: 4.3, price_level: 2, category: 'museum', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('museum') }
      ],
      'park': [
        { name: 'Central Park', address: `${city} Park District`, rating: 4.5, price_level: 0, category: 'park', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('park') },
        { name: 'Botanical Garden', address: `${city} Nature Area`, rating: 4.3, price_level: 1, category: 'park', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('park') },
        { name: 'Waterfront Park', address: `${city} Waterfront`, rating: 4.4, price_level: 0, category: 'park', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('park') }
      ],
      'attraction': [
        { name: 'Historic Landmark', address: `${city} Historic Center`, rating: 4.6, price_level: 2, category: 'attraction', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('attraction') },
        { name: 'Cultural Site', address: `${city} Cultural District`, rating: 4.4, price_level: 1, category: 'attraction', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('attraction') },
        { name: 'Viewpoint', address: `${city} Scenic Area`, rating: 4.5, price_level: 0, category: 'attraction', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('attraction') }
      ],
      'bar': [
        { name: 'Local Bar', address: `${city} Nightlife District`, rating: 4.2, price_level: 2, category: 'bar', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('bar') },
        { name: 'Craft Brewery', address: `${city} Brewery Quarter`, rating: 4.3, price_level: 2, category: 'bar', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('bar') },
        { name: 'Rooftop Bar', address: `${city} Skyline Area`, rating: 4.4, price_level: 3, category: 'bar', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('bar') }
      ],
      'shopping': [
        { name: 'Local Market', address: `${city} Market Square`, rating: 4.1, price_level: 1, category: 'shopping', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('shopping') },
        { name: 'Boutique District', address: `${city} Shopping Area`, rating: 4.3, price_level: 2, category: 'shopping', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('shopping') },
        { name: 'Artisan Shops', address: `${city} Crafts Quarter`, rating: 4.2, price_level: 2, category: 'shopping', lat: 45.4408, lng: 12.3155, photos: this.getCategoryPhotos('shopping') }
      ]
    };
    
    // Возвращаем места для конкретного города или fallback
    const places = cityPlaces[cityName] || fallbackPlaces;
    return places[category] || [
      { name: 'Local Attraction', address: `${city} City Center`, rating: 4.0, price_level: 1, category: 'attraction', photos: this.getCategoryPhotos('attraction') }
    ];
  }
}

/**
 * Поиск мест по интересам (для совместимости с новой архитектурой)
 */
async function searchPlacesByInterests(city, interests, budget = 100) {
  const placesService = new PlacesService();
  
  if (!placesService.apiKey) {
    throw new Error('Google Maps API key is required for places search');
  }

  const categories = ['restaurant', 'cafe', 'museum', 'park', 'attraction', 'bar'];
  const allPlaces = [];

  for (const category of categories) {
    try {
      const places = await placesService.searchPlaces(city, category, interests);
      allPlaces.push(...places);
    } catch (error) {
      console.error(`Error searching ${category} places:`, error);
      // Продолжаем с другими категориями
    }
  }

  return allPlaces;
}

module.exports = PlacesService;
module.exports.searchPlacesByInterests = searchPlacesByInterests;
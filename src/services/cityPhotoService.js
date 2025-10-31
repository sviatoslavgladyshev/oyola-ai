/**
 * City Photo Service
 * Fetches city photos from Unsplash API
 * Fallback to curated static images if API fails
 */

// Curated city photos (fallback and for demo mode)
const CURATED_CITY_PHOTOS = {
  'new-york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop&q=80',
  'los-angeles': 'https://images.unsplash.com/photo-1597982087634-9884f03198ce?w=800&h=600&fit=crop&q=80',
  'chicago': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop&q=80',
  'houston': 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&h=600&fit=crop&q=80',
  'phoenix': 'https://images.unsplash.com/photo-1650917409385-a3a9dc5b1e4c?w=800&h=600&fit=crop&q=80',
  'philadelphia': 'https://images.unsplash.com/photo-1570940677726-10cb96370dba?w=800&h=600&fit=crop&q=80',
  'san-antonio': 'https://images.unsplash.com/photo-1514510249063-e0faf6c6ec0c?w=800&h=600&fit=crop&q=80',
  'san-diego': 'https://images.unsplash.com/photo-1630375604571-4e370942fa65?w=800&h=600&fit=crop&q=80',
  'dallas': 'https://images.unsplash.com/photo-1621904878414-d4ca4756bd7e?w=800&h=600&fit=crop&q=80',
  'austin': 'https://images.unsplash.com/photo-1557335200-a65f7f032602?w=800&h=600&fit=crop&q=80',
  'miami': 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800&h=600&fit=crop&q=80',
  'seattle': 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=800&h=600&fit=crop&q=80',
  'boston': 'https://images.unsplash.com/photo-1573524949339-b830334a31ee?w=800&h=600&fit=crop&q=80',
  'denver': 'https://images.unsplash.com/photo-1619856699906-09e1f58c98b1?w=800&h=600&fit=crop&q=80',
  'las-vegas': 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800&h=600&fit=crop&q=80',
  'portland': 'https://images.unsplash.com/photo-1545572695-807bb906b1cf?w=800&h=600&fit=crop&q=80',
  'detroit': 'https://images.unsplash.com/photo-1605873173962-86b5acd7877c?w=800&h=600&fit=crop&q=80',
  'nashville': 'https://images.unsplash.com/photo-1568501395741-8273f2f2c13f?w=800&h=600&fit=crop&q=80',
  'orlando': 'https://images.unsplash.com/photo-1600094333035-0286197f8035?w=800&h=600&fit=crop&q=80',
  'minneapolis': 'https://images.unsplash.com/photo-1583370320315-42943edb7e7f?w=800&h=600&fit=crop&q=80',
  'atlanta': 'https://images.unsplash.com/photo-1526042812429-b2e9c4986c99?w=800&h=600&fit=crop&q=80',
  'tampa': 'https://images.unsplash.com/photo-1559728327-63bcd79d7c6e?w=800&h=600&fit=crop&q=80',
  'new-orleans': 'https://images.unsplash.com/photo-1561180126-54d6adc2a1e8?w=800&h=600&fit=crop&q=80',
  'san-francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop&q=80',
  'washington': 'https://images.unsplash.com/photo-1617581629397-a72507c3de9e?w=800&h=600&fit=crop&q=80',
  'baltimore': 'https://images.unsplash.com/photo-1594655801942-c9d951977b7b?w=800&h=600&fit=crop&q=80',
  'pittsburgh': 'https://images.unsplash.com/photo-1605742387864-3b79181c04cc?w=800&h=600&fit=crop&q=80',
  'charlotte': 'https://images.unsplash.com/photo-1619931396793-6f10e1e5a3f0?w=800&h=600&fit=crop&q=80',
  'indianapolis': 'https://images.unsplash.com/photo-1583500557349-fb5238f8d946?w=800&h=600&fit=crop&q=80'
};

/**
 * Get photo for a single city (uses curated database)
 */
export const getCityPhoto = async (cityId) => {
  try {
    // Return curated photo if available
    if (CURATED_CITY_PHOTOS[cityId]) {
      return CURATED_CITY_PHOTOS[cityId];
    }
    
    // Return null if not found (will trigger gradient fallback)
    return null;
  } catch (error) {
    console.error('Error fetching city photo:', error);
    return null;
  }
};

/**
 * Get photos for multiple cities
 */
export const getCityPhotos = async (cities) => {
  try {
    const citiesWithPhotos = cities.map(city => ({
      ...city,
      image: CURATED_CITY_PHOTOS[city.id] || null
    }));

    return citiesWithPhotos;
  } catch (error) {
    console.error('Error fetching city photos:', error);
    return cities;
  }
};

/**
 * Fetch from Unsplash API (optional enhancement)
 * Requires UNSPLASH_ACCESS_KEY to be set
 */
export const fetchFromUnsplash = async (cityName, stateName, accessKey) => {
  if (!accessKey || accessKey === 'demo') {
    return null;
  }

  try {
    const query = encodeURIComponent(`${cityName} ${stateName} skyline`);
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Unsplash API request failed');
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }

    return null;
  } catch (error) {
    console.error('Error fetching from Unsplash:', error);
    return null;
  }
};


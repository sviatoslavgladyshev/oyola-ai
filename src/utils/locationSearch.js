import { searchCities, getStates, getCities, getCitiesBySateName } from '@mardillu/us-cities-utils';

/**
 * Load initial list of locations (states and popular cities)
 */
export const loadInitialLocations = () => {
  try {
    // Get all states first
    const states = getStates();
    console.log('States loaded:', states.length);
    
    // Build a comprehensive list by searching for cities
    // Since we can't load all cities at once efficiently, we'll start with popular cities
    // and let the user search for specific ones
    const popularCities = [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 
      'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
      'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
      'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston',
      'Miami', 'Atlanta', 'Las Vegas', 'Portland', 'Nashville',
      'Detroit', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee',
      'Orlando', 'Tampa', 'Minneapolis', 'Cleveland', 'Raleigh'
    ];
    
    const allCitiesData = [];
    
    // Search for each popular city
    popularCities.forEach(cityName => {
      const results = searchCities(cityName);
      if (results && results.length > 0) {
        allCitiesData.push(...results);
      }
    });
    
    console.log('Total cities loaded:', allCitiesData.length);
    console.log('Sample city data:', allCitiesData[0]);
    console.log('City properties:', allCitiesData[0] ? Object.keys(allCitiesData[0]) : 'none');
    
    const formattedCities = allCitiesData
      .filter((city, index, self) => {
        // Remove duplicates based on city name
        const cityName = city.name || city.city || city.City;
        const stateName = city.state || city.state_name || city.State;
        return index === self.findIndex(c => {
          const cName = c.name || c.city || c.City;
          const sName = c.state || c.state_name || c.State;
          return cName === cityName && sName === stateName;
        });
      })
      .map(city => {
        const cityName = city.name || city.city || city.City || 'Unknown';
        const stateName = city.state || city.state_name || city.State || 'Unknown';
        return {
          value: `${cityName}, ${stateName}`,
          city: cityName,
          state: stateName,
          stateCode: city.state_id || city.stateId || city.state_code || '',
          type: 'city'
        };
      })
      .sort((a, b) => a.value.localeCompare(b.value));
    
    // Format states for the dropdown
    const formattedStates = states.map(state => ({
      value: state.name,
      city: '',
      state: state.name,
      stateCode: state.code || state.id || '',
      type: 'state'
    })).sort((a, b) => a.value.localeCompare(b.value));
    
    // Add "All Locations" at the beginning, then states, then cities
    return [
      { value: 'All Locations', city: 'All', state: 'Locations', stateCode: 'ALL', type: 'all' },
      ...formattedStates,
      ...formattedCities
    ];
  } catch (error) {
    console.error('Error loading cities:', error);
    // Return a fallback list if the library fails
    return [
      { value: 'All Locations', city: 'All', state: 'Locations', stateCode: 'ALL', type: 'all' }
    ];
  }
};

/**
 * Search for locations by city name, state name, or zip code
 */
export const searchLocations = (searchTerm) => {
  try {
    let results = [];
    const trimmedSearch = searchTerm.trim();
    
    // Check if it's a zip code (starts with digits, can be partial or full 5-digit)
    const isZipCode = /^\d{1,5}$/.test(trimmedSearch);
    
    if (isZipCode) {
      // For zip code search, try getCities which might have more complete data
      try {
        console.log('Searching for zip code:', trimmedSearch);
        
        // Map zip code prefixes to state names to narrow down search
        const zipPrefixToState = {
          '902': 'California', '900': 'California', '901': 'California', '903': 'California',
          '904': 'California', '905': 'California', '906': 'California', '907': 'California',
          '908': 'California', '910': 'California', '911': 'California', '912': 'California',
          '913': 'California', '914': 'California', '915': 'California', '916': 'California',
          '917': 'California', '918': 'California', '919': 'California', '920': 'California',
          '921': 'California', '922': 'California', '923': 'California', '924': 'California',
          '925': 'California', '926': 'California', '927': 'California', '928': 'California',
          '930': 'California', '931': 'California', '932': 'California', '933': 'California',
          '934': 'California', '935': 'California', '936': 'California', '937': 'California',
          '938': 'California', '939': 'California', '940': 'California', '941': 'California',
          '942': 'California', '943': 'California', '944': 'California', '945': 'California',
          '946': 'California', '947': 'California', '948': 'California', '949': 'California',
          '950': 'California', '951': 'California', '952': 'California', '953': 'California',
          '954': 'California', '959': 'California', '960': 'California', '961': 'California',
          '100': 'New York', '101': 'New York', '102': 'New York', '103': 'New York',
          '104': 'New York', '105': 'New York', '106': 'New York', '107': 'New York',
          '108': 'New York', '109': 'New York', '110': 'New York', '111': 'New York',
          '112': 'New York', '113': 'New York', '114': 'New York', '115': 'New York',
          '116': 'New York', '117': 'New York', '118': 'New York', '119': 'New York',
          '606': 'Illinois', '600': 'Illinois', '601': 'Illinois', '602': 'Illinois',
          '774': 'Massachusetts', '021': 'Massachusetts', '022': 'Massachusetts',
          '770': 'Texas', '750': 'Texas', '751': 'Texas', '752': 'Texas',
          '331': 'Florida', '320': 'Florida', '321': 'Florida', '322': 'Florida'
        };
        
        // Find matching state for this zip
        const matchingStates = new Set();
        Object.entries(zipPrefixToState).forEach(([prefix, state]) => {
          if (trimmedSearch.startsWith(prefix)) {
            matchingStates.add(state);
          }
        });
        
        // Search cities in matching states
        if (matchingStates.size > 0) {
          matchingStates.forEach(stateName => {
            try {
              // Try different ways to call getCities based on the library's API
              let stateCities = null;
              
              // First try getCitiesBySateName (note the typo in the library's function name)
              try {
                stateCities = getCitiesBySateName(stateName);
                console.log(`getCitiesBySateName returned:`, stateCities ? stateCities.length : 0, 'cities');
              } catch (e) {
                console.log(`getCitiesBySateName failed for ${stateName}:`, e.message);
              }
              
              // If that didn't work, try getCities with state name
              if (!stateCities || stateCities.length === 0) {
                try {
                  stateCities = getCities(stateName);
                  console.log(`getCities returned:`, stateCities ? stateCities.length : 0, 'cities');
                } catch (e) {
                  console.log(`getCities failed for ${stateName}:`, e.message);
                  // Try with state code instead
                  const stateToCode = {
                    'California': 'CA',
                    'New York': 'NY',
                    'Illinois': 'IL',
                    'Massachusetts': 'MA',
                    'Texas': 'TX',
                    'Florida': 'FL'
                  };
                  const stateCode = stateToCode[stateName];
                  if (stateCode) {
                    try {
                      stateCities = getCities(stateCode);
                      console.log(`getCities with code returned:`, stateCities ? stateCities.length : 0, 'cities');
                    } catch (e2) {
                      console.log(`getCities with code failed:`, e2.message);
                    }
                  }
                }
              }
              
              console.log(`Total found ${stateCities ? stateCities.length : 0} cities in ${stateName}`);
              
              if (stateCities && stateCities.length > 0) {
                // Log first city to see structure
                console.log('Sample city from getCities:', stateCities[0]);
                console.log('Sample city keys:', Object.keys(stateCities[0]));
                
                // Check if Beverly Hills with 90210 exists in the data
                const beverlyHills = stateCities.find(c => 
                  c.zip === '90210' || c.name?.toLowerCase().includes('beverly hills')
                );
                console.log('Beverly Hills in data?', beverlyHills);
                
                const filtered = stateCities.filter(city => {
                  const cityZip = city.zip || city.zipCode || city.zip_code || city.zipcode || '';
                  const zipStr = cityZip.toString().trim();
                  const searchStr = trimmedSearch.trim();
                  
                  return zipStr === searchStr || zipStr.startsWith(searchStr);
                });
                
                console.log(`Filtered ${filtered.length} cities matching zip ${trimmedSearch}`);
                
                // If no exact match, try to find cities with similar zip codes (within 10)
                if (filtered.length === 0 && trimmedSearch.length === 5) {
                  const searchNum = parseInt(trimmedSearch);
                  const nearbyCities = stateCities.filter(city => {
                    const cityZip = city.zip || city.zipCode || city.zip_code || city.zipcode || '';
                    const zipNum = parseInt(cityZip.toString().trim());
                    // Find cities within a range of 10 zip codes
                    return Math.abs(zipNum - searchNum) <= 10;
                  }).sort((a, b) => {
                    // Sort by closest zip code
                    const aZip = parseInt((a.zip || '').toString());
                    const bZip = parseInt((b.zip || '').toString());
                    return Math.abs(aZip - searchNum) - Math.abs(bZip - searchNum);
                  });
                  
                  console.log(`No exact match for ${trimmedSearch}, found ${nearbyCities.length} nearby cities`);
                  if (nearbyCities.length > 0) {
                    console.log('Closest match:', nearbyCities[0]);
                    results.push(...nearbyCities.slice(0, 5)); // Show top 5 closest
                  }
                } else if (filtered.length > 0) {
                  console.log('First match:', filtered[0]);
                  results.push(...filtered);
                }
              }
            } catch (stateError) {
              console.log(`Error getting cities for ${stateName}:`, stateError);
            }
          });
        }
        
        // If still no results, try broader search
        if (results.length === 0) {
          console.log('No results from getCities, trying searchCities fallback');
          // Try searching common cities for this zip
          const commonCities = ['Beverly Hills', 'Los Angeles', 'Santa Monica', 'Pasadena'];
          commonCities.forEach(cityName => {
            const cityResults = searchCities(cityName);
            if (cityResults && cityResults.length > 0) {
              results.push(...cityResults);
            }
          });
        }
        
      } catch (zipError) {
        console.error('Error searching by zip code:', zipError);
      }
    } else {
      // Search by city or state name
      results = searchCities(trimmedSearch);
    }
    
    if (results && results.length > 0) {
      return results.map(city => {
        const cityName = city.name || city.city || city.City || 'Unknown';
        const stateName = city.state || city.state_name || city.State || 'Unknown';
        const zipCode = city.zip || city.zipCode || city.zip_code || '';
        return {
          value: `${cityName}, ${stateName}${zipCode ? ` (${zipCode})` : ''}`,
          city: cityName,
          state: stateName,
          stateCode: city.state_id || city.stateId || city.state_code || '',
          zipCode: zipCode,
          type: 'city'
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

/**
 * Filter loaded locations by search term
 */
export const filterLoadedLocations = (allLocations, searchTerm) => {
  if (!searchTerm) {
    return [];
  }
  
  return allLocations.filter(loc =>
    loc && loc.value && loc.value.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

/**
 * Geocode current position to get location name
 * Note: This is a simplified version. In production, use a proper geocoding API
 */
export const getCurrentLocationName = async (latitude, longitude) => {
  // This is a placeholder - in production you would use a reverse geocoding API
  // like Google Maps Geocoding API, OpenCage, or similar
  return 'New York, New York'; // Simplified for now
};


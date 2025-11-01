import React, { useState, useEffect } from 'react';
import FilterPanel from '../ui/FilterPanel';
import Button from '../ui/Button';
import { searchCities } from '@mardillu/us-cities-utils';
import { PROPERTY_TYPES, BEDROOM_OPTIONS, BATHROOM_OPTIONS } from '../../config/constants';

const PropertyFilters = ({ filters, onFilterChange, onReset }) => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    try {
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
      popularCities.forEach(cityName => {
        const results = searchCities(cityName);
        if (results && results.length > 0) {
          allCitiesData.push(...results);
        }
      });
      
      const formattedCities = allCitiesData
        .filter((city, index, self) => {
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
          return `${cityName}, ${stateName}`;
        })
        .sort();
      
      setLocations(['All Locations', ...formattedCities]);
    } catch (error) {
      console.error('Error loading cities:', error);
      setLocations(['All Locations']);
    }
  }, []);

  return (
    <FilterPanel title="Filter Properties" onReset={onReset}>
      <FilterPanel.Group label="Location">
        <select 
          value={filters.location} 
          onChange={(e) => onFilterChange('location', e.target.value)}
        >
          {locations.map((loc, index) => (
            <option key={`${loc}-${index}`} value={loc}>{loc}</option>
          ))}
        </select>
      </FilterPanel.Group>

      <FilterPanel.Group label="Property Type">
        <select 
          value={filters.type} 
          onChange={(e) => onFilterChange('type', e.target.value)}
        >
          {PROPERTY_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </FilterPanel.Group>

      <FilterPanel.Group label="Price Range">
        <FilterPanel.InputGroup>
          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) => onFilterChange('minPrice', e.target.value)}
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
          />
        </FilterPanel.InputGroup>
      </FilterPanel.Group>

      <FilterPanel.Group label="Bedrooms">
        <FilterPanel.ButtonGroup>
          {BEDROOM_OPTIONS.map(bed => (
            <Button
              key={bed}
              variant="filter"
              active={filters.bedrooms === bed}
              onClick={() => onFilterChange('bedrooms', bed)}
            >
              {bed}
            </Button>
          ))}
        </FilterPanel.ButtonGroup>
      </FilterPanel.Group>

      <FilterPanel.Group label="Bathrooms">
        <FilterPanel.ButtonGroup>
          {BATHROOM_OPTIONS.map(bath => (
            <Button
              key={bath}
              variant="filter"
              active={filters.bathrooms === bath}
              onClick={() => onFilterChange('bathrooms', bath)}
            >
              {bath}
            </Button>
          ))}
        </FilterPanel.ButtonGroup>
      </FilterPanel.Group>
    </FilterPanel>
  );
};

export default PropertyFilters;

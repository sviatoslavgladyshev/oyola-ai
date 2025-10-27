import React from 'react';
import FilterPanel from './FilterPanel';
import Button from './Button';

const PropertyFilters = ({ filters, onFilterChange, onReset }) => {
  const locations = ['All', 'Downtown', 'Midtown', 'Uptown', 'Suburbs', 'Coastal', 'Mountains'];
  const propertyTypes = ['All', 'House', 'Condo', 'Apartment', 'Townhouse'];

  return (
    <FilterPanel title="Filter Properties" onReset={onReset}>
      <FilterPanel.Group label="Location">
        <select 
          value={filters.location} 
          onChange={(e) => onFilterChange('location', e.target.value)}
        >
          {locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </FilterPanel.Group>

      <FilterPanel.Group label="Property Type">
        <select 
          value={filters.type} 
          onChange={(e) => onFilterChange('type', e.target.value)}
        >
          {propertyTypes.map(type => (
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
          {['Any', '1+', '2+', '3+', '4+'].map(bed => (
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
          {['Any', '1+', '2+', '3+'].map(bath => (
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

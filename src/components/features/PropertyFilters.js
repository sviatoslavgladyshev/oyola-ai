import React from 'react';
import FilterPanel from '../ui/FilterPanel';
import Button from '../ui/Button';
import { LOCATIONS, PROPERTY_TYPES, BEDROOM_OPTIONS, BATHROOM_OPTIONS } from '../../config/constants';

const PropertyFilters = ({ filters, onFilterChange, onReset }) => {

  return (
    <FilterPanel title="Filter Properties" onReset={onReset}>
      <FilterPanel.Group label="Location">
        <select 
          value={filters.location} 
          onChange={(e) => onFilterChange('location', e.target.value)}
        >
          {LOCATIONS.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
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

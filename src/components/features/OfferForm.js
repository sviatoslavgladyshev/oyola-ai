import React, { useState, useEffect } from 'react';
import FilterPanel from '../ui/FilterPanel';
import Button from '../ui/Button';
import { searchCities } from '@mardillu/us-cities-utils';
import { 
  PROPERTY_TYPES, 
  FINANCING_TYPES, 
  CLOSING_TIMELINES, 
  CONTINGENCY_OPTIONS, 
  BEDROOM_OPTIONS, 
  BATHROOM_OPTIONS 
} from '../../config/constants';

const OfferForm = ({ user, onSubmitOffer }) => {
  const [formData, setFormData] = useState({
    // Property Criteria
    location: 'All Locations',
    type: 'All',
    minPrice: '',
    maxPrice: '',
    bedrooms: 'Any',
    bathrooms: 'Any',
    
    // Offer Details
    offerAmount: '',
    offerMessage: '',
    financingType: 'Cash',
    closingTimeline: '30 days',
    contingencies: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
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

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleContingencyToggle = (contingency) => {
    setFormData(prev => {
      const newContingencies = prev.contingencies.includes(contingency)
        ? prev.contingencies.filter(c => c !== contingency)
        : [...prev.contingencies, contingency];
      return { ...prev, contingencies: newContingencies };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.maxPrice) newErrors.maxPrice = 'Maximum budget is required';
    if (!formData.offerAmount) newErrors.offerAmount = 'Offer amount is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add user information to form data
      const offerData = {
        ...formData,
        buyerName: user.name,
        buyerEmail: user.email,
        buyerPhone: user.phone || '',
        buyerId: user.id
      };
      await onSubmitOffer(offerData);
    } catch (error) {
      console.error('Error submitting offer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="offer-form">
      <FilterPanel title="Offers">
        <div className="form-section">
          <h3 className="section-title">Property Criteria</h3>
          
          <FilterPanel.Group label="Preferred Location">
            <select 
              value={formData.location} 
              onChange={(e) => handleChange('location', e.target.value)}
            >
              {locations.map((loc, index) => (
                <option key={`${loc}-${index}`} value={loc}>{loc}</option>
              ))}
            </select>
          </FilterPanel.Group>

          <FilterPanel.Group label="Property Type">
            <select 
              value={formData.type} 
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {PROPERTY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </FilterPanel.Group>

          <FilterPanel.Group label="Budget Range *">
            <FilterPanel.InputGroup>
              <input
                type="number"
                className="form-input"
                placeholder="Min Budget"
                value={formData.minPrice}
                onChange={(e) => handleChange('minPrice', e.target.value)}
              />
              <span>to</span>
              <input
                type="number"
                className={`form-input ${errors.maxPrice ? 'error' : ''}`}
                placeholder="Max Budget *"
                value={formData.maxPrice}
                onChange={(e) => handleChange('maxPrice', e.target.value)}
              />
            </FilterPanel.InputGroup>
            {errors.maxPrice && <span className="error-message">{errors.maxPrice}</span>}
          </FilterPanel.Group>

          <FilterPanel.Group label="Bedrooms">
            <FilterPanel.ButtonGroup>
              {BEDROOM_OPTIONS.map(bed => (
                <Button
                  key={bed}
                  type="button"
                  variant="filter"
                  active={formData.bedrooms === bed}
                  onClick={() => handleChange('bedrooms', bed)}
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
                  type="button"
                  variant="filter"
                  active={formData.bathrooms === bath}
                  onClick={() => handleChange('bathrooms', bath)}
                >
                  {bath}
                </Button>
              ))}
            </FilterPanel.ButtonGroup>
          </FilterPanel.Group>
        </div>

        <div className="form-section">
          <h3 className="section-title">Offer Details</h3>
          
          <FilterPanel.Group label="Your Offer Amount *">
            <input
              type="number"
              className={`form-input ${errors.offerAmount ? 'error' : ''}`}
              placeholder="e.g., 500000"
              value={formData.offerAmount}
              onChange={(e) => handleChange('offerAmount', e.target.value)}
            />
            {errors.offerAmount && <span className="error-message">{errors.offerAmount}</span>}
            <small className="helper-text">
              This offer will be sent to all matching property owners
            </small>
          </FilterPanel.Group>

          <FilterPanel.Group label="Financing Type">
            <select 
              value={formData.financingType} 
              onChange={(e) => handleChange('financingType', e.target.value)}
            >
              {FINANCING_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </FilterPanel.Group>

          <FilterPanel.Group label="Desired Closing Timeline">
            <select 
              value={formData.closingTimeline} 
              onChange={(e) => handleChange('closingTimeline', e.target.value)}
            >
              {CLOSING_TIMELINES.map(timeline => (
                <option key={timeline} value={timeline}>{timeline}</option>
              ))}
            </select>
          </FilterPanel.Group>

          <FilterPanel.Group label="Contingencies">
            <FilterPanel.ButtonGroup>
              {CONTINGENCY_OPTIONS.map(contingency => (
                <Button
                  key={contingency}
                  type="button"
                  variant="filter"
                  active={formData.contingencies.includes(contingency)}
                  onClick={() => handleContingencyToggle(contingency)}
                >
                  {contingency}
                </Button>
              ))}
            </FilterPanel.ButtonGroup>
          </FilterPanel.Group>

          <FilterPanel.Group label="Personal Message to Owner (Optional)">
            <textarea
              className="form-textarea"
              placeholder="Tell the property owner why you're interested in their property..."
              rows="4"
              value={formData.offerMessage}
              onChange={(e) => handleChange('offerMessage', e.target.value)}
            />
          </FilterPanel.Group>
        </div>

        <div className="form-actions">
          <Button 
            type="submit" 
            variant="primary" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Finding & Contacting Owners...' : 'Find Properties & Send Offers'}
          </Button>
          <p className="disclaimer">
            By submitting, you authorize us to send your offer to all property owners matching your criteria.
          </p>
        </div>
      </FilterPanel>
    </form>
  );
};

export default OfferForm;


import React, { useState, useEffect } from 'react';
// Removed unused imports
import { searchCities } from '@mardillu/us-cities-utils';
import { 
  PROPERTY_TYPES, 
  FINANCING_TYPES, 
  CLOSING_TIMELINES, 
  BEDROOM_OPTIONS, 
  BATHROOM_OPTIONS 
} from '../../config/constants';

const OfferForm = ({ user, onSubmitOffer, selectedCity }) => {
  const [formData, setFormData] = useState({
    // Property Criteria
    location: selectedCity ? `${selectedCity.name}, ${selectedCity.state}` : 'All Locations',
    intent: 'Long-term',
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

  // Update location when selectedCity changes
  useEffect(() => {
    if (selectedCity) {
      setFormData(prev => ({
        ...prev,
        location: `${selectedCity.name}, ${selectedCity.state}`
      }));
    }
  }, [selectedCity]);

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

  // contingency toggle reserved for future use

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
    <form onSubmit={handleSubmit} className="offer-form-simple">
      <div className="offer-form-header">
        <h2>🏡 Find Your Dream Home</h2>
        <p>Tell us what you're looking for and we'll match you with property owners</p>
      </div>

      <div className="offer-form-card">
        {/* Intent - Long-term vs Fix & Flip */}
        <div className="form-field-full">
          <label>🎯 What are you looking for?</label>
          <div className="button-group-compact">
            {['Long-term', 'Fix & Flip'].map(option => (
              <button
                key={option}
                type="button"
                className={`btn-chip ${formData.intent === option ? 'active' : ''}`}
                onClick={() => handleChange('intent', option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Location & Property Type - Single Row */}
        <div className="form-row">
          <div className="form-field">
            <label>📍 Location</label>
            <select 
              value={formData.location} 
              onChange={(e) => handleChange('location', e.target.value)}
              className="form-select"
            >
              {locations.map((loc, index) => (
                <option key={`${loc}-${index}`} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>🏠 Property Type</label>
            <select 
              value={formData.type} 
              onChange={(e) => handleChange('type', e.target.value)}
              className="form-select"
            >
              {PROPERTY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Budget */}
        <div className="form-field-full">
          <label>💰 Your Budget *</label>
          <div className="budget-inputs">
            <input
              type="number"
              className="form-input-modern"
              placeholder="Min"
              value={formData.minPrice}
              onChange={(e) => handleChange('minPrice', e.target.value)}
            />
            <span className="range-separator">—</span>
            <input
              type="number"
              className={`form-input-modern ${errors.maxPrice ? 'error' : ''}`}
              placeholder="Max *"
              value={formData.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
            />
          </div>
          {errors.maxPrice && <span className="error-message">{errors.maxPrice}</span>}
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="form-row">
          <div className="form-field">
            <label>🛏️ Bedrooms</label>
            <div className="button-group-compact">
              {BEDROOM_OPTIONS.map(bed => (
                <button
                  key={bed}
                  type="button"
                  className={`btn-chip ${formData.bedrooms === bed ? 'active' : ''}`}
                  onClick={() => handleChange('bedrooms', bed)}
                >
                  {bed}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>🚿 Bathrooms</label>
            <div className="button-group-compact">
              {BATHROOM_OPTIONS.map(bath => (
                <button
                  key={bath}
                  type="button"
                  className={`btn-chip ${formData.bathrooms === bath ? 'active' : ''}`}
                  onClick={() => handleChange('bathrooms', bath)}
                >
                  {bath}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-divider"></div>

        {/* Offer Amount */}
        <div className="form-field-full">
          <label>💵 Your Offer Amount *</label>
          <input
            type="number"
            className={`form-input-modern large ${errors.offerAmount ? 'error' : ''}`}
            placeholder="Enter your offer amount"
            value={formData.offerAmount}
            onChange={(e) => handleChange('offerAmount', e.target.value)}
          />
          {errors.offerAmount && <span className="error-message">{errors.offerAmount}</span>}
        </div>

        {/* Financing & Timeline */}
        <div className="form-row">
          <div className="form-field">
            <label>💳 Financing</label>
            <select 
              value={formData.financingType} 
              onChange={(e) => handleChange('financingType', e.target.value)}
              className="form-select"
            >
              {FINANCING_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>📅 Closing Timeline</label>
            <select 
              value={formData.closingTimeline} 
              onChange={(e) => handleChange('closingTimeline', e.target.value)}
              className="form-select"
            >
              {CLOSING_TIMELINES.map(timeline => (
                <option key={timeline} value={timeline}>{timeline}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Message */}
        <div className="form-field-full">
          <label>✉️ Message to Property Owners (Optional)</label>
          <textarea
            className="form-textarea-modern"
            placeholder="Why are you the perfect buyer for this property?"
            rows="3"
            value={formData.offerMessage}
            onChange={(e) => handleChange('offerMessage', e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <div className="form-submit">
          <button 
            type="submit" 
            className="btn-submit-modern"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>⏳ Finding Properties...</>
            ) : (
              <>🚀 Find Properties & Send Offers</>
            )}
          </button>
          <p className="form-note">
            We'll send your offer to all matching property owners
          </p>
        </div>
      </div>
    </form>
  );
};

export default OfferForm;


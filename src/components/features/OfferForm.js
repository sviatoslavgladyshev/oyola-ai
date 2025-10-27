import React, { useState } from 'react';
import FilterPanel from '../ui/FilterPanel';
import Button from '../ui/Button';
import { 
  LOCATIONS, 
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
    location: 'All',
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
      <FilterPanel title="🏡 Automated Property Offer System">
        <div className="buyer-info-banner">
          <div className="banner-icon">👤</div>
          <div>
            <strong>Submitting as: {user.name}</strong>
            <p>{user.email} {user.phone && `• ${user.phone}`}</p>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Property Criteria</h3>
          
          <FilterPanel.Group label="Preferred Location">
            <select 
              value={formData.location} 
              onChange={(e) => handleChange('location', e.target.value)}
            >
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
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
            {isSubmitting ? '🔄 Finding & Contacting Owners...' : '🚀 Find Properties & Send Offers'}
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


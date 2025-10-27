import React, { useState } from 'react';
import FilterPanel from './FilterPanel';
import Button from './Button';

const AddProperty = ({ onAddProperty, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    location: 'Downtown',
    price: '',
    bedrooms: 2,
    bathrooms: 2,
    sqft: '',
    type: 'House',
    description: '',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locations = ['Downtown', 'Midtown', 'Uptown', 'Suburbs', 'Coastal', 'Mountains'];
  const propertyTypes = ['House', 'Condo', 'Apartment', 'Townhouse'];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Property title is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (!formData.sqft) newErrors.sqft = 'Square footage is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
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
      await onAddProperty(formData);
    } catch (error) {
      console.error('Error adding property:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-property-form">
      <FilterPanel title="🏠 List New Property">
        <div className="form-section">
          <FilterPanel.Group label="Property Title *">
            <input
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="e.g., Modern Downtown Condo"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </FilterPanel.Group>

          <FilterPanel.Group label="Location *">
            <select 
              value={formData.location} 
              onChange={(e) => handleChange('location', e.target.value)}
            >
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </FilterPanel.Group>

          <FilterPanel.Group label="Property Type *">
            <select 
              value={formData.type} 
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {propertyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </FilterPanel.Group>

          <FilterPanel.Group label="Asking Price *">
            <input
              type="number"
              className={`form-input ${errors.price ? 'error' : ''}`}
              placeholder="e.g., 500000"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
            />
            {errors.price && <span className="error-message">{errors.price}</span>}
          </FilterPanel.Group>

          <FilterPanel.Group label="Square Footage *">
            <input
              type="number"
              className={`form-input ${errors.sqft ? 'error' : ''}`}
              placeholder="e.g., 2500"
              value={formData.sqft}
              onChange={(e) => handleChange('sqft', e.target.value)}
            />
            {errors.sqft && <span className="error-message">{errors.sqft}</span>}
          </FilterPanel.Group>

          <FilterPanel.Group label="Bedrooms">
            <FilterPanel.ButtonGroup>
              {[1, 2, 3, 4, 5].map(bed => (
                <Button
                  key={bed}
                  type="button"
                  variant="filter"
                  active={formData.bedrooms === bed}
                  onClick={() => handleChange('bedrooms', bed)}
                >
                  {bed} bed
                </Button>
              ))}
            </FilterPanel.ButtonGroup>
          </FilterPanel.Group>

          <FilterPanel.Group label="Bathrooms">
            <FilterPanel.ButtonGroup>
              {[1, 1.5, 2, 2.5, 3, 4].map(bath => (
                <Button
                  key={bath}
                  type="button"
                  variant="filter"
                  active={formData.bathrooms === bath}
                  onClick={() => handleChange('bathrooms', bath)}
                >
                  {bath} bath
                </Button>
              ))}
            </FilterPanel.ButtonGroup>
          </FilterPanel.Group>

          <FilterPanel.Group label="Description *">
            <textarea
              className={`form-textarea ${errors.description ? 'error' : ''}`}
              placeholder="Describe your property's features, amenities, location highlights..."
              rows="5"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </FilterPanel.Group>

          <FilterPanel.Group label="Property Image URL">
            <input
              type="url"
              className="form-input"
              placeholder="https://example.com/image.jpg"
              value={formData.image}
              onChange={(e) => handleChange('image', e.target.value)}
            />
            <small className="helper-text">
              Enter an image URL or leave default
            </small>
          </FilterPanel.Group>
        </div>

        <div className="form-actions">
          <Button 
            type="submit" 
            variant="primary" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '⏳ Publishing...' : '🚀 Publish Property'}
          </Button>
          <Button 
            type="button" 
            variant="reset"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </FilterPanel>
    </form>
  );
};

export default AddProperty;


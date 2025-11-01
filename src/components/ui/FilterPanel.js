import React from 'react';

// Reusable Filter Panel Component
const FilterPanel = ({ children, title, onReset, className = '' }) => {
  return (
    <div className={`filter-panel ${className}`}>
      {(title || onReset) && (
        <div className="filter-header">
          {title && <h2>{title}</h2>}
          {onReset && (
            <button className="btn btn-reset" onClick={onReset}>
              Reset Filters
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

// Filter Group Subcomponent
FilterPanel.Group = ({ children, label, className = '' }) => (
  <div className={`filter-group ${className}`}>
    {label && <label>{label}</label>}
    {children}
  </div>
);

// Input Group Subcomponent
FilterPanel.InputGroup = ({ children, className = '' }) => (
  <div className={`input-group ${className}`}>
    {children}
  </div>
);

// Button Group Subcomponent
FilterPanel.ButtonGroup = ({ children, className = '' }) => (
  <div className={`button-group ${className}`}>
    {children}
  </div>
);

export default FilterPanel;


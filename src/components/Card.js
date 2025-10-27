import React from 'react';

// Reusable Card Component
const Card = ({ children, className = '', onClick }) => {
  return (
    <div className={`card ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};

// Card Subcomponents for composition
Card.Image = ({ src, alt, badge }) => (
  <div className="card-image">
    <img src={src} alt={alt} />
    {badge && <div className="card-badge">{badge}</div>}
  </div>
);

Card.Content = ({ children, className = '' }) => (
  <div className={`card-content ${className}`}>
    {children}
  </div>
);

Card.Title = ({ children, className = '' }) => (
  <h3 className={`card-title ${className}`}>
    {children}
  </h3>
);

Card.Subtitle = ({ children, className = '' }) => (
  <p className={`card-subtitle ${className}`}>
    {children}
  </p>
);

Card.Description = ({ children, className = '' }) => (
  <p className={`card-description ${className}`}>
    {children}
  </p>
);

Card.Specs = ({ children, className = '' }) => (
  <div className={`card-specs ${className}`}>
    {children}
  </div>
);

Card.Spec = ({ children, className = '' }) => (
  <span className={`card-spec ${className}`}>
    {children}
  </span>
);

Card.Price = ({ children, className = '' }) => (
  <div className={`card-price ${className}`}>
    {children}
  </div>
);

export default Card;


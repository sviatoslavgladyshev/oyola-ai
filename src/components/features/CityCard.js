import React, { useState } from 'react';

const CityCard = ({ city, onClick }) => {
  const [imageError, setImageError] = useState(false);
  
  // Fallback gradient colors for cities without images
  const fallbackGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  ];
  
  const gradientIndex = city.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % fallbackGradients.length;
  const fallbackGradient = fallbackGradients[gradientIndex];

  return (
    <div className="city-card" onClick={() => onClick(city)}>
      <div className="city-card-image-container">
        {!imageError && city.image ? (
          <img 
            src={city.image} 
            alt={`${city.name}, ${city.state}`}
            onError={() => setImageError(true)}
            className="city-card-image"
          />
        ) : (
          <div 
            className="city-card-fallback"
            style={{ background: fallbackGradient }}
          />
        )}
        <div className="city-card-overlay">
          <h3 className="city-card-name">{city.name}</h3>
        </div>
      </div>
    </div>
  );
};

export default CityCard;


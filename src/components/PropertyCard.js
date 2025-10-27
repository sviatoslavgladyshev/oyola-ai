import React from 'react';
import Card from './Card';

const PropertyCard = ({ property }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card>
      <Card.Image 
        src={property.image} 
        alt={property.title}
        badge={property.type}
      />
      <Card.Content>
        <Card.Title>{property.title}</Card.Title>
        <Card.Subtitle>📍 {property.location}</Card.Subtitle>
        <Card.Description>{property.description}</Card.Description>
        <Card.Specs>
          <Card.Spec>🛏️ {property.bedrooms} bed</Card.Spec>
          <Card.Spec>🚿 {property.bathrooms} bath</Card.Spec>
          <Card.Spec>📐 {property.sqft} sqft</Card.Spec>
        </Card.Specs>
        <Card.Price>{formatPrice(property.price)}</Card.Price>
      </Card.Content>
    </Card>
  );
};

export default PropertyCard;

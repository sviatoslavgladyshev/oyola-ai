// Property Management Service
import { properties as sampleProperties } from '../data/properties';

const PROPERTIES_KEY = 'property_platform_properties';
const OWNER_OFFERS_KEY = 'property_platform_owner_offers';
const INITIALIZED_KEY = 'property_platform_initialized';

// Initialize sample data (run once)
export const initializeSampleData = () => {
  const isInitialized = localStorage.getItem(INITIALIZED_KEY);
  
  if (!isInitialized) {
    // Add ownerId to sample properties (assign to a demo owner)
    const propertiesWithOwner = sampleProperties.map(prop => ({
      ...prop,
      ownerId: 'demo-owner-1', // Demo owner ID
      status: 'active',
      createdAt: new Date().toISOString(),
      views: Math.floor(Math.random() * 50),
      offersReceived: 0
    }));
    
    localStorage.setItem(PROPERTIES_KEY, JSON.stringify(propertiesWithOwner));
    localStorage.setItem(INITIALIZED_KEY, 'true');
    console.log('Sample properties initialized');
  }
};

// Get all properties
export const getAllProperties = () => {
  const properties = localStorage.getItem(PROPERTIES_KEY);
  return properties ? JSON.parse(properties) : [];
};

// Save properties
const saveProperties = (properties) => {
  localStorage.setItem(PROPERTIES_KEY, JSON.stringify(properties));
};

// Get properties by owner
export const getPropertiesByOwner = (ownerId) => {
  const properties = getAllProperties();
  return properties.filter(p => p.ownerId === ownerId);
};

// Add new property
export const addProperty = async (propertyData, ownerId) => {
  const properties = getAllProperties();
  
  const newProperty = {
    id: `property-${Date.now()}`,
    ...propertyData,
    ownerId,
    status: 'active', // active, pending, sold
    createdAt: new Date().toISOString(),
    views: 0,
    offersReceived: 0
  };

  properties.push(newProperty);
  saveProperties(properties);

  return newProperty;
};

// Update property
export const updateProperty = async (propertyId, updates) => {
  const properties = getAllProperties();
  const index = properties.findIndex(p => p.id === propertyId);

  if (index === -1) {
    throw new Error('Property not found');
  }

  properties[index] = { ...properties[index], ...updates };
  saveProperties(properties);

  return properties[index];
};

// Delete property
export const deleteProperty = async (propertyId) => {
  const properties = getAllProperties();
  const filtered = properties.filter(p => p.id !== propertyId);
  saveProperties(filtered);
};

// Get offers received by owner
export const getOffersForOwner = (ownerId) => {
  const ownerOffers = localStorage.getItem(OWNER_OFFERS_KEY);
  const allOffers = ownerOffers ? JSON.parse(ownerOffers) : [];
  return allOffers.filter(offer => offer.property.ownerId === ownerId);
};

// Save offer for owner to review
export const saveOfferForOwner = (offer) => {
  const ownerOffers = localStorage.getItem(OWNER_OFFERS_KEY);
  const allOffers = ownerOffers ? JSON.parse(ownerOffers) : [];
  allOffers.push(offer);
  localStorage.setItem(OWNER_OFFERS_KEY, JSON.stringify(allOffers));
};

// Update offer status (accept/reject)
export const updateOfferStatus = async (offerId, status, ownerResponse) => {
  const ownerOffers = localStorage.getItem(OWNER_OFFERS_KEY);
  const allOffers = ownerOffers ? JSON.parse(ownerOffers) : [];
  
  const index = allOffers.findIndex(o => o.id === offerId);
  if (index === -1) {
    throw new Error('Offer not found');
  }

  allOffers[index] = {
    ...allOffers[index],
    status,
    ownerResponse,
    respondedAt: new Date().toISOString()
  };

  localStorage.setItem(OWNER_OFFERS_KEY, JSON.stringify(allOffers));
  
  return allOffers[index];
};


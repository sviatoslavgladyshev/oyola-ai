import React, { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import Card from './Card';
import AddProperty from './AddProperty';
import { getPropertiesByOwner, getOffersForOwner, addProperty, deleteProperty, updateOfferStatus } from '../services/propertyService';

const OwnerDashboard = ({ user, onShowNotification }) => {
  const [view, setView] = useState('properties'); // 'properties', 'offers', 'add-property'
  const [properties, setProperties] = useState([]);
  const [offers, setOffers] = useState([]);

  const loadData = useCallback(() => {
    const userProperties = getPropertiesByOwner(user.id);
    const userOffers = getOffersForOwner(user.id);
    setProperties(userProperties);
    setOffers(userOffers);
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddProperty = async (propertyData) => {
    try {
      await addProperty(propertyData, user.id);
      loadData();
      setView('properties');
      onShowNotification('Property published successfully!', 'success');
    } catch (error) {
      onShowNotification(error.message, 'error');
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await deleteProperty(propertyId);
        loadData();
        onShowNotification('Property deleted successfully', 'success');
      } catch (error) {
        onShowNotification(error.message, 'error');
      }
    }
  };

  const handleRespondToOffer = async (offerId, status, response) => {
    try {
      await updateOfferStatus(offerId, status, response);
      loadData();
      onShowNotification(`Offer ${status} successfully`, 'success');
    } catch (error) {
      onShowNotification(error.message, 'error');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getOfferStatusColor = (status) => {
    switch (status) {
      case 'sent': return '#2563eb';
      case 'viewed': return '#f59e0b';
      case 'accepted': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const pendingOffers = offers.filter(o => o.status === 'sent' || o.status === 'viewed');
  const respondedOffers = offers.filter(o => o.status === 'accepted' || o.status === 'rejected');

  if (view === 'add-property') {
    return (
      <div className="owner-dashboard">
        <AddProperty 
          onAddProperty={handleAddProperty}
          onCancel={() => setView('properties')}
        />
      </div>
    );
  }

  return (
    <div className="owner-dashboard">
      <div className="dashboard-header">
        <h2>🏘️ Property Owner Dashboard</h2>
        <Button variant="primary" onClick={() => setView('add-property')}>
          ➕ Add New Property
        </Button>
      </div>

      <div className="owner-stats">
        <div className="stat-card">
          <span className="stat-value">{properties.length}</span>
          <span className="stat-label">Active Listings</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{pendingOffers.length}</span>
          <span className="stat-label">Pending Offers</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{offers.length}</span>
          <span className="stat-label">Total Offers Received</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{offers.filter(o => o.status === 'accepted').length}</span>
          <span className="stat-label">Accepted Offers</span>
        </div>
      </div>

      <div className="owner-tabs">
        <button 
          className={`tab ${view === 'properties' ? 'active' : ''}`}
          onClick={() => setView('properties')}
        >
          🏠 My Properties ({properties.length})
        </button>
        <button 
          className={`tab ${view === 'offers' ? 'active' : ''}`}
          onClick={() => setView('offers')}
        >
          📨 Offers Received ({pendingOffers.length} pending)
        </button>
      </div>

      {view === 'properties' ? (
        <div className="properties-section">
          {properties.length > 0 ? (
            <div className="property-grid">
              {properties.map(property => (
                <Card key={property.id}>
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
                    <div className="property-actions">
                      <Button variant="reset" onClick={() => handleDeleteProperty(property.id)}>
                        🗑️ Delete
                      </Button>
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏠</div>
              <h3>No Properties Listed</h3>
              <p>Start by adding your first property to receive offers from buyers</p>
              <Button variant="primary" onClick={() => setView('add-property')}>
                ➕ Add Your First Property
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="offers-section">
          {offers.length > 0 ? (
            <>
              {pendingOffers.length > 0 && (
                <div className="offers-group">
                  <h3>⏳ Pending Offers ({pendingOffers.length})</h3>
                  <div className="offers-list">
                    {pendingOffers.map(offer => (
                      <div key={offer.id} className="offer-card">
                        <div className="offer-card-header">
                          <div>
                            <h4>{offer.property.title}</h4>
                            <p className="offer-buyer">From: {offer.buyerName}</p>
                          </div>
                          <div className="offer-amount-badge">
                            {formatPrice(offer.offerAmount)}
                          </div>
                        </div>
                        <div className="offer-card-details">
                          <div className="detail-item">
                            <span>📧</span>
                            <span>{offer.buyerEmail}</span>
                          </div>
                          <div className="detail-item">
                            <span>📞</span>
                            <span>{offer.buyerPhone || 'Not provided'}</span>
                          </div>
                          <div className="detail-item">
                            <span>💳</span>
                            <span>{offer.financingType}</span>
                          </div>
                          <div className="detail-item">
                            <span>📅</span>
                            <span>{offer.closingTimeline}</span>
                          </div>
                          <div className="detail-item">
                            <span>📋</span>
                            <span>{offer.contingencies.length > 0 ? offer.contingencies.join(', ') : 'No contingencies'}</span>
                          </div>
                        </div>
                        {offer.offerMessage && (
                          <div className="offer-message">
                            <strong>💬 Buyer's Message:</strong>
                            <p>{offer.offerMessage}</p>
                          </div>
                        )}
                        <div className="offer-card-footer">
                          <small>Received: {formatDate(offer.sentAt)}</small>
                          <div className="offer-actions">
                            <Button 
                              variant="primary" 
                              onClick={() => handleRespondToOffer(offer.id, 'accepted', "I'm interested in your offer! Let's discuss the details.")}
                            >
                              ✅ Accept Offer
                            </Button>
                            <Button 
                              variant="reset" 
                              onClick={() => handleRespondToOffer(offer.id, 'rejected', "Thank you for your interest. I've decided to keep the property at this time.")}
                            >
                              ❌ Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {respondedOffers.length > 0 && (
                <div className="offers-group">
                  <h3>✅ Responded Offers ({respondedOffers.length})</h3>
                  <div className="offers-list">
                    {respondedOffers.map(offer => (
                      <div key={offer.id} className="offer-card responded">
                        <div className="offer-card-header">
                          <div>
                            <h4>{offer.property.title}</h4>
                            <p className="offer-buyer">From: {offer.buyerName}</p>
                          </div>
                          <div>
                            <div className="offer-amount-badge small">
                              {formatPrice(offer.offerAmount)}
                            </div>
                            <div 
                              className="status-badge" 
                              style={{ backgroundColor: getOfferStatusColor(offer.status) }}
                            >
                              {offer.status === 'accepted' ? '✅ Accepted' : '❌ Declined'}
                            </div>
                          </div>
                        </div>
                        <div className="offer-response-display">
                          <strong>Your Response:</strong>
                          <p>{offer.ownerResponse}</p>
                          <small>Responded: {formatDate(offer.respondedAt)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No Offers Yet</h3>
              <p>Once buyers submit offers on your properties, they'll appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;


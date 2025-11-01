import React from 'react';
import Card from '../ui/Card';
import { formatPrice, getOfferStatusColor, getOfferStatusIcon } from '../../utils/formatters';

const OfferResults = ({ offers, matchingProperties, onSelectOffer }) => {
  const getStatusText = (status) => {
    const icon = getOfferStatusIcon(status);
    switch (status) {
      case 'sent':
        return `${icon} Offer Sent`;
      case 'viewed':
        return '👀 Owner Viewed';
      case 'accepted':
        return `${icon} Accepted`;
      case 'rejected':
        return `${icon} Declined`;
      default:
        return '⏳ Pending';
    }
  };

  return (
    <div className="offer-results">
      <div className="results-summary animate-on-load">
        <div className="summary-card">
          <div className="summary-icon">🏠</div>
          <div className="summary-content">
            <h3>{matchingProperties}</h3>
            <p>Properties Found</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📨</div>
          <div className="summary-content">
            <h3>{offers.filter(o => o.status === 'sent' || o.status === 'viewed').length}</h3>
            <p>Offers Pending</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <h3>{offers.filter(o => o.status === 'accepted').length}</h3>
            <p>Offers Accepted</p>
          </div>
        </div>
      </div>

      <div className="offers-timeline">
        <h2 className="timeline-title">Your Offers Timeline</h2>
        {offers.length > 0 ? (
          <div className="timeline animate-on-load">
            {offers.map((offer) => (
              <div key={offer.id} className="timeline-item">
                <div className="timeline-marker" style={{ backgroundColor: getOfferStatusColor(offer.status) }} />
                <Card className="timeline-card" onClick={() => onSelectOffer(offer)}>
                  <Card.Content>
                    <div className="offer-header">
                      <div>
                        <Card.Title>{offer.property.title}</Card.Title>
                        <Card.Subtitle>📍 {offer.property.location}</Card.Subtitle>
                      </div>
                      <div className="offer-status" style={{ color: getOfferStatusColor(offer.status) }}>
                        {getStatusText(offer.status)}
                      </div>
                    </div>
                    
                    <div className="offer-details">
                      <div className="detail-row">
                        <span className="detail-label">Your Offer:</span>
                        <span className="detail-value highlight">{formatPrice(offer.offerAmount)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Asking Price:</span>
                        <span className="detail-value">{formatPrice(offer.property.price)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Financing:</span>
                        <span className="detail-value">{offer.financingType}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Closing:</span>
                        <span className="detail-value">{offer.closingTimeline}</span>
                      </div>
                      {offer.contingencies.length > 0 && (
                        <div className="detail-row">
                          <span className="detail-label">Contingencies:</span>
                          <span className="detail-value">{offer.contingencies.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="offer-timeline-info">
                      <small>📅 Sent: {new Date(offer.sentAt).toLocaleDateString()}</small>
                      {offer.viewedAt && (
                        <small> • 👁️ Viewed: {new Date(offer.viewedAt).toLocaleDateString()}</small>
                      )}
                    </div>

                    {offer.ownerResponse && (
                      <div className="owner-response">
                        <strong>💬 Owner Response:</strong>
                        <p>{offer.ownerResponse}</p>
                      </div>
                    )}
                  </Card.Content>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No Offers Yet</h3>
            <p>Submit your criteria to automatically find and contact property owners</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferResults;


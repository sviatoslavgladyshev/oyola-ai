import React from 'react';
import Button from './Button';
import Card from './Card';

const OfferDetail = ({ offer, onBack }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return '#2563eb';
      case 'viewed':
        return '#f59e0b';
      case 'accepted':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return '📤';
      case 'viewed':
        return '👀';
      case 'accepted':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'sent':
        return 'Offer Sent';
      case 'viewed':
        return 'Owner Viewed';
      case 'accepted':
        return 'Offer Accepted';
      case 'rejected':
        return 'Offer Declined';
      default:
        return 'Pending';
    }
  };

  const offerPercentage = ((offer.offerAmount / offer.property.price) * 100).toFixed(1);
  const difference = offer.offerAmount - offer.property.price;

  return (
    <div className="offer-detail">
      <div className="detail-header">
        <Button variant="reset" onClick={onBack}>
          ← Back to All Offers
        </Button>
      </div>

      <div className="detail-status-banner" style={{ backgroundColor: getStatusColor(offer.status) }}>
        <div className="status-banner-content">
          <span className="status-icon-large">{getStatusIcon(offer.status)}</span>
          <div>
            <h2>{getStatusText(offer.status)}</h2>
            <p>Deal ID: {offer.id}</p>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Property Information */}
        <div className="detail-section">
          <Card>
            <Card.Image 
              src={offer.property.image} 
              alt={offer.property.title}
              badge={offer.property.type}
            />
            <Card.Content>
              <Card.Title>{offer.property.title}</Card.Title>
              <Card.Subtitle>📍 {offer.property.location}</Card.Subtitle>
              <Card.Description>{offer.property.description}</Card.Description>
              <Card.Specs>
                <Card.Spec>🛏️ {offer.property.bedrooms} bed</Card.Spec>
                <Card.Spec>🚿 {offer.property.bathrooms} bath</Card.Spec>
                <Card.Spec>📐 {offer.property.sqft} sqft</Card.Spec>
              </Card.Specs>
              <div className="property-asking-price">
                <span className="price-label">Asking Price</span>
                <Card.Price>{formatPrice(offer.property.price)}</Card.Price>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Offer Details */}
        <div className="detail-section">
          <div className="info-card">
            <h3 className="info-card-title">💰 Your Offer Details</h3>
            
            <div className="detail-row-large">
              <span className="detail-label-large">Your Offer Amount</span>
              <span className="detail-value-large offer-amount">{formatPrice(offer.offerAmount)}</span>
            </div>

            <div className="offer-comparison">
              <div className="comparison-item">
                <span className="comparison-label">Asking Price</span>
                <span className="comparison-value">{formatPrice(offer.property.price)}</span>
              </div>
              <div className="comparison-item">
                <span className="comparison-label">Your Offer</span>
                <span className="comparison-value highlight">{formatPrice(offer.offerAmount)}</span>
              </div>
              <div className="comparison-item">
                <span className="comparison-label">Difference</span>
                <span className={`comparison-value ${difference >= 0 ? 'positive' : 'negative'}`}>
                  {difference >= 0 ? '+' : ''}{formatPrice(difference)}
                </span>
              </div>
              <div className="comparison-item">
                <span className="comparison-label">Offer Percentage</span>
                <span className="comparison-value">{offerPercentage}% of asking</span>
              </div>
            </div>

            <div className="detail-divider"></div>

            <div className="detail-row">
              <span className="detail-label">💳 Financing Type</span>
              <span className="detail-value">{offer.financingType}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">📅 Closing Timeline</span>
              <span className="detail-value">{offer.closingTimeline}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">📋 Contingencies</span>
              <span className="detail-value">
                {offer.contingencies.length > 0 ? (
                  <div className="contingency-tags">
                    {offer.contingencies.map((contingency, index) => (
                      <span key={index} className="tag">{contingency}</span>
                    ))}
                  </div>
                ) : (
                  'No contingencies'
                )}
              </span>
            </div>

            {offer.offerMessage && (
              <>
                <div className="detail-divider"></div>
                <div className="message-box">
                  <h4>💬 Your Message to Owner</h4>
                  <p>{offer.offerMessage}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Buyer Information */}
        <div className="detail-section">
          <div className="info-card">
            <h3 className="info-card-title">👤 Buyer Information</h3>
            
            <div className="detail-row">
              <span className="detail-label">Name</span>
              <span className="detail-value">{offer.buyerName}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value">{offer.buyerEmail}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{offer.buyerPhone}</span>
            </div>
          </div>
        </div>

        {/* Timeline & Status */}
        <div className="detail-section">
          <div className="info-card">
            <h3 className="info-card-title">📊 Offer Timeline</h3>
            
            <div className="status-timeline">
              <div className="timeline-step completed">
                <div className="timeline-step-marker">✓</div>
                <div className="timeline-step-content">
                  <h4>Offer Sent</h4>
                  <p>{formatDate(offer.sentAt)}</p>
                  <small>Your offer was sent to the property owner</small>
                </div>
              </div>

              {offer.viewedAt && (
                <div className="timeline-step completed">
                  <div className="timeline-step-marker">✓</div>
                  <div className="timeline-step-content">
                    <h4>Offer Viewed</h4>
                    <p>{formatDate(offer.viewedAt)}</p>
                    <small>Property owner opened and reviewed your offer</small>
                  </div>
                </div>
              )}

              {offer.respondedAt && (
                <div className="timeline-step completed">
                  <div className="timeline-step-marker">✓</div>
                  <div className="timeline-step-content">
                    <h4>Owner Responded</h4>
                    <p>{formatDate(offer.respondedAt)}</p>
                    <small>Property owner has made a decision</small>
                  </div>
                </div>
              )}

              {!offer.viewedAt && (
                <div className="timeline-step pending">
                  <div className="timeline-step-marker">⏳</div>
                  <div className="timeline-step-content">
                    <h4>Awaiting Owner Review</h4>
                    <small>Waiting for property owner to view the offer</small>
                  </div>
                </div>
              )}

              {offer.viewedAt && !offer.respondedAt && (
                <div className="timeline-step pending">
                  <div className="timeline-step-marker">⏳</div>
                  <div className="timeline-step-content">
                    <h4>Awaiting Owner Decision</h4>
                    <small>Owner is considering your offer</small>
                  </div>
                </div>
              )}
            </div>

            {offer.ownerResponse && (
              <>
                <div className="detail-divider"></div>
                <div className="owner-response-box">
                  <h4>💬 Owner's Response</h4>
                  <p className="response-text">{offer.ownerResponse}</p>
                  <div className="response-actions">
                    {offer.status === 'accepted' && (
                      <Button variant="primary">
                        📄 Proceed to Documentation
                      </Button>
                    )}
                    {offer.status === 'rejected' && (
                      <Button variant="primary">
                        📝 Submit New Offer
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="detail-actions">
        {offer.status === 'sent' || offer.status === 'viewed' ? (
          <>
            <Button variant="primary">
              📧 Send Follow-up Message
            </Button>
            <Button variant="reset">
              ❌ Withdraw Offer
            </Button>
          </>
        ) : offer.status === 'accepted' ? (
          <>
            <Button variant="primary">
              📋 View Next Steps
            </Button>
            <Button variant="primary">
              📞 Schedule Inspection
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={onBack}>
            ← Back to All Offers
          </Button>
        )}
      </div>
    </div>
  );
};

export default OfferDetail;


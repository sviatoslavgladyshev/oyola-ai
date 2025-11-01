// Service to handle offer submissions and property matching
import { getAllProperties } from './propertyService';
import { saveOfferForOwner } from './propertyService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

// Simulate async API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Filter properties based on criteria
export const findMatchingProperties = (criteria) => {
  const properties = getAllProperties();
  return properties.filter(property => {
    // Location filter
    if (criteria.location !== 'All' && property.location !== criteria.location) {
      return false;
    }

    // Type filter
    if (criteria.type !== 'All' && property.type !== criteria.type) {
      return false;
    }

    // Price filters
    if (criteria.minPrice && property.price < parseInt(criteria.minPrice)) {
      return false;
    }
    if (criteria.maxPrice && property.price > parseInt(criteria.maxPrice)) {
      return false;
    }

    // Bedroom filter
    if (criteria.bedrooms !== 'Any') {
      const minBeds = parseInt(criteria.bedrooms.replace('+', ''));
      if (property.bedrooms < minBeds) {
        return false;
      }
    }

    // Bathroom filter
    if (criteria.bathrooms !== 'Any') {
      const minBaths = parseInt(criteria.bathrooms.replace('+', ''));
      if (property.bathrooms < minBaths) {
        return false;
      }
    }

    return true;
  });
};

// Submit offer and contact property owners
export const submitOfferToOwners = async (formData) => {
  // Find matching properties
  const matchingProperties = findMatchingProperties(formData);
  
  if (matchingProperties.length === 0) {
    throw new Error('No properties match your criteria');
  }

  // Simulate sending offers to owners
  await delay(2000); // Simulate API delay

  // Create offer records for each property
  const offers = matchingProperties.map((property, index) => {
    const offer = {
      id: `offer-${Date.now()}-${index}`,
      property: property,
      buyerId: formData.buyerId,
      buyerName: formData.buyerName,
      buyerEmail: formData.buyerEmail,
      buyerPhone: formData.buyerPhone,
      offerAmount: parseInt(formData.offerAmount),
      financingType: formData.financingType,
      closingTimeline: formData.closingTimeline,
      contingencies: formData.contingencies,
      offerMessage: formData.offerMessage,
      ownerEmail: 'sg7622@nyu.edu', // Property owner email
      status: 'sent', // sent, viewed, accepted, rejected
      sentAt: new Date().toISOString(),
      viewedAt: null,
      respondedAt: null,
      ownerResponse: null
    };
    
    // Save offer for property owner to review
    saveOfferForOwner(offer);
    
    return offer;
  });

  // Send emails via Firebase Function
  try {
    const sendOfferToOwnersFunction = httpsCallable(functions, 'sendOfferToOwners');
    const emailResult = await sendOfferToOwnersFunction({ offers });
    
    console.log('📤 Offers sent to owners via email:', emailResult.data);
    
    // Update offer statuses based on email results
    const updatedOffers = offers.map((offer, index) => {
      const emailStatus = emailResult.data?.results?.[index];
      return {
        ...offer,
        emailSent: emailStatus?.status === 'sent',
        emailError: emailStatus?.error || null
      };
    });
    
    return {
      success: true,
      matchingCount: matchingProperties.length,
      offers: updatedOffers,
      message: emailResult.data?.message || `Successfully sent offers to ${matchingProperties.length} property owners!`
    };
  } catch (error) {
    console.error('Error sending offer emails:', error);
    // Still return offers even if email fails
    return {
      success: true,
      matchingCount: matchingProperties.length,
      offers: offers,
      message: `Offers created for ${matchingProperties.length} properties. Email sending failed: ${error.message}`,
      emailError: error.message
    };
  }
};

// Send follow-up email for a specific offer
export const sendFollowUpEmail = async (offer) => {
  try {
    if (!offer) {
      throw new Error('Offer is required');
    }

    const sendFollowUpFunction = httpsCallable(functions, 'sendOfferFollowUps');
    const result = await sendFollowUpFunction({ offer });
    
    console.log('📧 Follow-up email sent:', result.data);
    
    return {
      success: true,
      message: result.data?.message || 'Follow-up email sent successfully',
      sentAt: result.data?.sentAt || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error sending follow-up email:', error);
    throw new Error(error.message || 'Failed to send follow-up email');
  }
};

// Simulate owner responses (for demo purposes)
export const simulateOwnerResponses = (offers) => {
  return offers.map(offer => {
    const random = Math.random();
    let status = 'sent';
    let viewedAt = null;
    let respondedAt = null;
    let ownerResponse = null;

    if (random > 0.3) {
      status = 'viewed';
      viewedAt = new Date(Date.now() + Math.random() * 86400000).toISOString();
      
      if (random > 0.7) {
        status = 'accepted';
        respondedAt = new Date(Date.now() + Math.random() * 172800000).toISOString();
        ownerResponse = "We're interested in your offer! Let's schedule a time to discuss the details.";
      } else if (random > 0.5) {
        status = 'rejected';
        respondedAt = new Date(Date.now() + Math.random() * 172800000).toISOString();
        ownerResponse = "Thank you for your interest. We've decided to keep the property at this time.";
      }
    }

    return {
      ...offer,
      status,
      viewedAt,
      respondedAt,
      ownerResponse
    };
  });
};


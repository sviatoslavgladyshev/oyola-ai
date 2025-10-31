// Sample offers data
// Reusable function to generate sample offers for a user

import { properties } from './properties.js';

/**
 * Generate sample offers for a user
 * @param {Object} user - User object with id, name, email, phone
 * @returns {Array} Array of sample offers
 */
export const getSampleOffers = (user) => {
  const userId = user.id || user.uid || 'buyer-001';
  const userName = user.name || user.displayName || 'John Doe';
  const userEmail = user.email || 'user@example.com';
  const userPhone = user.phone || '(555) 123-4567';

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  return [
    {
      id: `offer-${Date.now()}-1`,
      property: {
        ...properties[0],
        address: properties[0].title,
        city: 'New York',
        state: 'NY'
      },
      buyerId: userId,
      buyerName: userName,
      buyerEmail: userEmail,
      buyerPhone: userPhone,
      offerAmount: 420000,
      financingType: 'Cash',
      closingTimeline: '30 days',
      contingencies: ['inspection', 'appraisal'],
      offerMessage: 'I\'m a serious buyer looking for a quick close. This property fits all my requirements.',
      ownerEmail: 'glsvyatoslav@gmail.com',
      status: 'accepted',
      sentAt: threeDaysAgo.toISOString(),
      viewedAt: twoDaysAgo.toISOString(),
      respondedAt: oneDayAgo.toISOString(),
      ownerResponse: 'We accept your offer! Looking forward to working with you.'
    },
    {
      id: `offer-${Date.now()}-2`,
      property: {
        ...properties[1],
        address: properties[1].title,
        city: 'Los Angeles',
        state: 'CA'
      },
      buyerId: userId,
      buyerName: userName,
      buyerEmail: userEmail,
      buyerPhone: userPhone,
      offerAmount: 625000,
      financingType: 'Conventional Loan',
      closingTimeline: '45 days',
      contingencies: ['inspection', 'appraisal', 'financing'],
      offerMessage: 'Beautiful home! Would love to make this our family home.',
      ownerEmail: 'glsvyatoslav@gmail.com',
      status: 'viewed',
      sentAt: twoDaysAgo.toISOString(),
      viewedAt: oneDayAgo.toISOString(),
      respondedAt: null,
      ownerResponse: null
    },
    {
      id: `offer-${Date.now()}-3`,
      property: {
        ...properties[2],
        address: properties[2].title,
        city: 'Chicago',
        state: 'IL'
      },
      buyerId: userId,
      buyerName: userName,
      buyerEmail: userEmail,
      buyerPhone: userPhone,
      offerAmount: 235000,
      financingType: 'FHA Loan',
      closingTimeline: '60 days',
      contingencies: ['inspection', 'appraisal', 'financing'],
      offerMessage: 'Perfect starter home for me. Ready to move forward!',
      ownerEmail: 'glsvyatoslav@gmail.com',
      status: 'sent',
      sentAt: oneDayAgo.toISOString(),
      viewedAt: null,
      respondedAt: null,
      ownerResponse: null
    },
    {
      id: `offer-${Date.now()}-4`,
      property: {
        ...properties[3],
        address: properties[3].title,
        city: 'Miami',
        state: 'FL'
      },
      buyerId: userId,
      buyerName: userName,
      buyerEmail: userEmail,
      buyerPhone: userPhone,
      offerAmount: 1150000,
      financingType: 'Cash',
      closingTimeline: '21 days',
      contingencies: ['inspection'],
      offerMessage: 'Luxury penthouse with amazing views. Very interested!',
      ownerEmail: 'glsvyatoslav@gmail.com',
      status: 'viewed',
      sentAt: threeDaysAgo.toISOString(),
      viewedAt: twoDaysAgo.toISOString(),
      respondedAt: null,
      ownerResponse: null
    },
    {
      id: `offer-${Date.now()}-5`,
      property: {
        ...properties[4],
        address: properties[4].title,
        city: 'Dallas',
        state: 'TX'
      },
      buyerId: userId,
      buyerName: userName,
      buyerEmail: userEmail,
      buyerPhone: userPhone,
      offerAmount: 530000,
      financingType: 'Conventional Loan',
      closingTimeline: '45 days',
      contingencies: ['inspection', 'appraisal'],
      offerMessage: 'This townhouse looks perfect for our needs.',
      ownerEmail: 'glsvyatoslav@gmail.com',
      status: 'rejected',
      sentAt: threeDaysAgo.toISOString(),
      viewedAt: twoDaysAgo.toISOString(),
      respondedAt: oneDayAgo.toISOString(),
      ownerResponse: 'Thank you for your offer, but we\'ve accepted another offer.'
    },
    {
      id: `offer-${Date.now()}-6`,
      property: {
        ...properties[5],
        address: properties[5].title,
        city: 'San Diego',
        state: 'CA'
      },
      buyerId: userId,
      buyerName: userName,
      buyerEmail: userEmail,
      buyerPhone: userPhone,
      offerAmount: 1200000,
      financingType: 'Cash',
      closingTimeline: '30 days',
      contingencies: [],
      offerMessage: 'Dream beachfront property. No contingencies, cash offer.',
      ownerEmail: 'glsvyatoslav@gmail.com',
      status: 'sent',
      sentAt: now.toISOString(),
      viewedAt: null,
      respondedAt: null,
      ownerResponse: null
    }
  ];
};

/**
 * Get sample offers with default user info if none provided
 * @returns {Array} Array of sample offers
 */
export const getDefaultSampleOffers = () => {
  return getSampleOffers({
    id: 'buyer-001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567'
  });
};


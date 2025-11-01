// Utility functions for formatting data

/**
 * Format a number as currency (USD)
 * @param {number} price - The price to format
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(price);
};

/**
 * Format a date string to a readable format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format a date string to include time
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

/**
 * Get status color based on offer status
 * @param {string} status - The offer status
 * @returns {string} Color hex code
 */
export const getOfferStatusColor = (status) => {
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

/**
 * Get status icon based on offer status
 * @param {string} status - The offer status
 * @returns {string} Emoji icon
 */
export const getOfferStatusIcon = (status) => {
  switch (status) {
    case 'sent':
      return '📤';
    case 'viewed':
      return '👁️';
    case 'accepted':
      return '✅';
    case 'rejected':
      return '❌';
    default:
      return '📋';
  }
};

/**
 * Get notification icon based on type
 * @param {string} type - The notification type
 * @returns {string} Emoji icon
 */
export const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return '✅';
    case 'error':
      return '⚠️';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    default:
      return 'ℹ️';
  }
};


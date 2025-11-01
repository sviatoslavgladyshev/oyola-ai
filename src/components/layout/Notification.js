import React from 'react';
import { getNotificationIcon } from '../../utils/formatters';

/**
 * Reusable Notification Component
 * @param {Object} props - Component props
 * @param {Object} props.notification - Notification object with type and message
 * @param {Function} props.onClose - Callback when notification is closed
 */
const Notification = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <div className={`notification ${notification.type}`}>
      <span className="notification-icon">
        {getNotificationIcon(notification.type)}
      </span>
      <span className="notification-message">{notification.message}</span>
      <button 
        className="notification-close" 
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
};

export default Notification;


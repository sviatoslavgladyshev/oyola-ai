import React from 'react';

// Reusable Button Component
const Button = ({ 
  children, 
  onClick, 
  variant = 'default', 
  active = false,
  className = '',
  type = 'button',
  ...props 
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'filter':
        return 'btn-filter';
      case 'reset':
        return 'btn-reset';
      case 'primary':
        return 'btn-primary';
      default:
        return '';
    }
  };

  const activeClass = active ? 'active' : '';
  const combinedClassName = `btn ${getVariantClass()} ${activeClass} ${className}`.trim();

  return (
    <button 
      type={type}
      className={combinedClassName}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;


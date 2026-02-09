import React, { useState } from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, secondary, danger
  size = 'md', // sm, md, lg
  disabled = false,
  className = '',
  loading = false,
  style = {}, // Allow overriding styles
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Base styles
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.7 : 1,
    outline: 'none',
    border: 'none',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transform: isPressed ? 'scale(0.98)' : (isHovered && !disabled && !loading ? 'translateY(-1px)' : 'none'),
    ...style
  };

  // Size styles
  const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: '13px' },
    md: { padding: '12px 24px', fontSize: '14px' },
    lg: { padding: '16px 32px', fontSize: '16px' }
  };

  // Variant styles
  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
      border: '1px solid rgba(59, 130, 246, 0.5)',
      boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)'
    },
    secondary: {
      background: 'rgba(31, 41, 55, 0.6)',
      color: '#e5e7eb',
      border: '1px solid rgba(75, 85, 99, 0.5)',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      border: '1px solid rgba(239, 68, 68, 0.5)',
      boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)'
    }
  };

  const finalStyle = {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style // Allow overrides again at the end
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={finalStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg style={{ animation: 'spin 1s linear infinite', height: '16px', width: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : children}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </button>
  );
};

export default Button;
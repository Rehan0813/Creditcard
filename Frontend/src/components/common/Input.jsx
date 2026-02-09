import React, { useState } from 'react';

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error = '',
  required = false,
  disabled = false,
  className = '',
  options = [],
  helperText = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Robust inline styles to ensure visibility regardless of Tailwind
  const containerStyle = {
    marginBottom: '16px',
    width: '100%'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#e5e7eb', // gray-200
    marginBottom: '8px'
  };

  const inputBaseStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(31, 41, 55, 0.8)', // gray-800 with opacity
    border: error ? '1px solid #ef4444' : (isFocused ? '1px solid #ef4444' : '1px solid rgba(75, 85, 99, 0.5)'),
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
    boxShadow: isFocused ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };

  const selectStyle = {
    ...inputBaseStyle,
    appearance: 'none', // Remove default arrow
    cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 0.5rem center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.5em 1.5em',
    paddingRight: '2.5rem'
  };

  if (type === 'select') {
    return (
      <div style={containerStyle}>
        {label && (
          <label style={labelStyle}>
            {label}
            {required && <span style={{ color: '#f87171', marginLeft: '4px' }}>*</span>}
          </label>
        )}
        <div style={{ position: 'relative' }}>
          <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            style={{
              ...selectStyle,
              opacity: disabled ? 0.6 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          >
            <option value="" style={{ backgroundColor: '#1f2937' }}>{placeholder || 'Select an option'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value} style={{ backgroundColor: '#1f2937' }}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {helperText && !error && (
          <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '6px' }}>
            {helperText}
          </p>
        )}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span style={{ color: '#f87171', fontSize: '14px' }}>⚠️</span>
            <p style={{ color: '#f87171', fontSize: '13px', fontWeight: '500' }}>{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {label && (
        <label style={labelStyle}>
          {label}
          {required && <span style={{ color: '#f87171', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            ...inputBaseStyle,
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'text'
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </div>
      {helperText && !error && (
        <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '6px' }}>
          {helperText}
        </p>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
          <span style={{ color: '#f87171', fontSize: '14px' }}>⚠️</span>
          <p style={{ color: '#f87171', fontSize: '13px', fontWeight: '500' }}>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Input;
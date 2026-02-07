import React from 'react';

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
  ...props
}) => {
  const baseStyles = 'w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3b9eff] focus:border-transparent focus:shadow-[0_0_20px_rgba(59,158,255,0.3)] transition-all duration-200';
  const errorStyles = error ? 'border-[#f87171] focus:ring-[#f87171] focus:shadow-[0_0_20px_rgba(248,113,113,0.3)]' : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const inputStyles = `${baseStyles} ${errorStyles} ${disabledStyles} ${className}`;

  if (type === 'select') {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-300">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={inputStyles}
          {...props}
        >
          <option value="">{placeholder || 'Select an option'}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-red-400 text-sm mt-1">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={inputStyles}
        {...props}
      />
      {error && (
        <p className="text-red-400 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;
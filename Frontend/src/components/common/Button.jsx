import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  onClick, 
  disabled = false, 
  type = 'button',
  className = '',
  ...props 
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#3b9eff] to-[#a855f7] hover:from-[#2b8eef] hover:to-[#9333ea] text-white focus:ring-blue-500 shadow-lg hover:shadow-[0_0_30px_rgba(59,158,255,0.5)] transition-shadow',
    secondary: 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white focus:ring-gray-500 shadow-md hover:shadow-lg',
    success: 'bg-gradient-to-r from-[#34d399] to-[#10b981] hover:from-[#2dd38d] hover:to-[#059669] text-white focus:ring-emerald-500 shadow-lg hover:shadow-[0_0_30px_rgba(52,211,153,0.5)] transition-shadow',
    danger: 'bg-gradient-to-r from-[#f87171] to-[#f472b6] hover:from-[#ef4444] hover:to-[#ec4899] text-white focus:ring-red-500 shadow-lg hover:shadow-[0_0_30px_rgba(248,113,113,0.5)] transition-shadow',
    outline: 'border-2 border-[#3b9eff] text-blue-400 hover:bg-[#3b9eff] hover:text-white focus:ring-blue-500 hover:shadow-[0_0_20px_rgba(59,158,255,0.4)]'
  };
  
  const sizes = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  };

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 12, 
  className = '' 
}) => {
  return (
    <div className={`animate-spin rounded-full h-${size} w-${size} border-b-2 border-blue-600 ${className}`}></div>
  );
};

export default LoadingSpinner;
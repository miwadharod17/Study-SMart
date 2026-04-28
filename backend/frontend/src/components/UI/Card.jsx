import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-4 py-3 border-b border-gray-200 ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`px-4 py-3 border-t border-gray-200 ${className}`}>{children}</div>
);

export default Card;
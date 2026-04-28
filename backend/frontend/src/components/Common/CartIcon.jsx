import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const CartIcon = () => {
  const { cartCount } = useCart();

  return (
    <Link to="/cart" className="relative">
      <svg 
        className="w-6 h-6 text-gray-700 hover:text-primary-600 transition"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6m12 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-9 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" 
        />
      </svg>
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </Link>
  );
};

export default CartIcon;
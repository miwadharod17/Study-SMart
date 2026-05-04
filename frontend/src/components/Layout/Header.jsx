import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import CartIcon from '../Common/CartIcon';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary-600">StudySMart</span>
            <span className="text-xs text-gray-500 hidden sm:inline">BOOKS · NOTES · KNOWLEDGE</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/marketplace" className="text-gray-700 hover:text-primary-600">Browse</Link>
            {user && (
              <>
                <Link to="/forum" className="text-gray-700 hover:text-primary-600">Forum</Link>
                <Link to="/sell" className="text-gray-700 hover:text-primary-600">Sell</Link>
                <Link to="/orders" className="text-gray-700 hover:text-primary-600">My Orders</Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user && <CartIcon />}
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="text-gray-700 hover:text-primary-600">
                  {user.name}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link to="/signin" className="text-gray-700 hover:text-primary-600">Sign in</Link>
                <Link
                  to="/signup"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
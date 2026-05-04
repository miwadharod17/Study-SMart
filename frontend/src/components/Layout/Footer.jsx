import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-bold text-primary-600 mb-4">StudySMart</h3>
            <p className="text-gray-600 text-sm">
              The student-first marketplace and Q&A community for academic life.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Marketplace</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/marketplace" className="hover:text-primary-600">Browse</Link></li>
              <li><Link to="/sell" className="hover:text-primary-600">Sell items</Link></li>
              <li><Link to="/orders" className="hover:text-primary-600">My orders</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/forum" className="hover:text-primary-600">Forum</Link></li>
              <li><Link to="/ask" className="hover:text-primary-600">Ask a question</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">For vendors</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/vendor-signup" className="hover:text-primary-600">Become a vendor</Link></li>
              <li><Link to="/vendor/dashboard" className="hover:text-primary-600">Vendor dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>© 2026 StudySMart · Built for students, by students</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
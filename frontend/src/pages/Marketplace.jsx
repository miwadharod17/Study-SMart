import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Card, { CardHeader, CardBody, CardFooter } from '../components/UI/Card';
import Badge from '../components/UI/Badge';

const Marketplace = () => {
  const [filters, setFilters] = useState({ condition: 'All', category: 'All', priceRange: [0, 1500] });
  const [searchTerm, setSearchTerm] = useState('');

  const listings = [
    { id: 1, title: 'Systems — Oppenheim', condition: 'Used', price: 480, stock: 1, category: 'Textbooks' },
    { id: 2, title: 'Data Structures — Class Notes + Cheatsheet', condition: 'Used', price: 150, stock: 1, category: 'Notes' },
    { id: 3, title: 'Microeconomics Notes — Mankiw chapters 1–12', condition: 'Notes', price: 120, stock: 1, category: 'Notes' },
  ];

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <span className="text-gray-600">12 of 12 listings</span>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="md:w-64 space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Filters</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">CONDITION</h4>
                  <div className="space-y-1">
                    {['All', 'New', 'Used'].map(cond => (
                      <label key={cond} className="flex items-center space-x-2">
                        <input type="radio" name="condition" checked={filters.condition === cond} onChange={() => setFilters({...filters, condition: cond})} />
                        <span className="text-sm">{cond}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">CATEGORY</h4>
                  <div className="space-y-1">
                    {['All', 'Textbooks', 'Notes', 'Lab Manuals', 'Past Papers', 'Stationery', 'Other'].map(cat => (
                      <label key={cat} className="flex items-center space-x-2">
                        <input type="checkbox" value={cat} />
                        <span className="text-sm">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">PRICE: ₹0 – ₹1500</h4>
                  <input type="range" min="0" max="1500" className="w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="Search by title, subject, keyword..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select className="px-4 py-2 border rounded-lg bg-white">
                <option>Newest first</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map(item => (
                <Link to={`/product/${item.id}`} key={item.id}>
                  <Card className="hover:shadow-md transition">
                    <CardBody>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{item.title}</h3>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={item.condition === 'Used' ? 'used' : 'new'}>
                              {item.condition}
                            </Badge>
                            <span className="text-sm text-gray-500">{item.category}</span>
                          </div>
                          <p className="text-2xl font-bold text-primary-600 mt-2">₹{item.price}</p>
                          <p className="text-sm text-gray-500">{item.stock} in stock</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Marketplace;
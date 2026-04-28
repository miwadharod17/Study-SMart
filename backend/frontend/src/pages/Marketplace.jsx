import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Card, { CardBody } from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import { getBooks } from '../services/api';

const Marketplace = () => {
  const [filters, setFilters] = useState({ condition: 'All', category: 'All' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sort, setSort] = useState('newest');
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = { page: pagination.page, limit: 20 };
    if (filters.condition !== 'All') params.condition = filters.condition;
    if (filters.category !== 'All') params.category = filters.category;
    if (searchTerm) params.search = searchTerm;

    setLoading(true);
    getBooks(params)
      .then((data) => {
        setListings(data.books || []);
        setPagination(data.pagination || {});
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters, searchTerm, pagination.page]);

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <span className="text-gray-600">{pagination.total || 0} listings</span>
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
                        <input type="radio" name="condition" checked={filters.condition === cond}
                          onChange={() => setFilters({ ...filters, condition: cond })} />
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
                        <input type="radio" name="category" checked={filters.category === cat}
                          onChange={() => setFilters({ ...filters, category: cat })} />
                        <span className="text-sm">{cat}</span>
                      </label>
                    ))}
                  </div>
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
              <select className="px-4 py-2 border rounded-lg bg-white"
                value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            {loading && <p className="text-gray-500">Loading listings...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && listings.length === 0 && !error && (
              <p className="text-gray-500">No listings found. Be the first to sell!</p>
            )}

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
                          {item.seller_name && (
                            <p className="text-xs text-gray-400 mt-1">by {item.seller_name}</p>
                          )}
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

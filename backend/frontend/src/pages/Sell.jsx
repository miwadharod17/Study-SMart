import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Card, { CardBody } from '../components/UI/Card';
import { AuthContext } from '../context/AuthContext';
import { createBook } from '../services/api';

const Sell = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Textbooks',
    condition: 'Used',
    stock: '1',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/signin'); return; }
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      await createBook(fd);
      navigate('/marketplace');
    } catch (err) {
      setError(err.message || 'Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container-custom py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Sell your items</h1>
        <p className="text-gray-600 mb-8">
          Turn your used books and notes into cash.
        </p>

        <Card>
          <CardBody>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <Input
                label="Title"
                placeholder="e.g., Engineering Mathematics Notes"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Describe your item..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <Input
                label="Price (₹)"
                type="number"
                placeholder="500"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />

              <Input
                label="Stock (quantity available)"
                type="number"
                placeholder="1"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {['Textbooks', 'Notes', 'Lab Manuals', 'Past Papers', 'Stationery', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                >
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Images (up to 5, max 5MB each)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => setImages(Array.from(e.target.files).slice(0, 5))}
                  className="w-full text-sm text-gray-600"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Posting listing...' : 'Post listing'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </Layout>
  );
};

export default Sell;

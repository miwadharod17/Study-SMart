import React, { useState } from 'react';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Card, { CardHeader, CardBody, CardFooter } from '../components/UI/Card';

const Sell = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Textbooks',
    imageUrl: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Listing submitted:', formData);
  };

  return (
    <Layout>
      <div className="container-custom py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Sell your items</h1>
        <p className="text-gray-600 mb-8">
          Turn your used books and notes into cash. Listings are marked as 'Used'.
        </p>

        <Card>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <Input
                label="Title"
                placeholder="e.g., Engineering Mathematics Notes"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />

              <Input
                label="Description"
                placeholder="Describe your item..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                textarea
              />

              <Input
                label="Price (₹)"
                type="number"
                placeholder="500"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option>Textbooks</option>
                  <option>Notes</option>
                  <option>Lab Manuals</option>
                  <option>Past Papers</option>
                  <option>Stationery</option>
                  <option>Other</option>
                </select>
              </div>

              <Input
                label="Image URL (optional)"
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
              />

              <Button type="submit" className="w-full">Publish listing</Button>
            </form>
          </CardBody>
        </Card>

        <div className="mt-8">
          <h2 className="font-semibold mb-4">Your listings (0)</h2>
          <Card>
            <CardBody className="text-center text-gray-500 py-8">
              No listings yet. Publish your first item.
            </CardBody>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Sell;
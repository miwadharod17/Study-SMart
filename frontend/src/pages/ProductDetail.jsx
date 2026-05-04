import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import Card, { CardBody } from '../components/UI/Card';
import { useCart } from '../context/CartContext';
import { getBook } from '../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getBook(id)
      .then((data) => {
        setProduct(data);
        setError('');
      })
      .catch((err) => {
        setError(err.message || 'Failed to load product');
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    alert('Added to cart!');
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <p className="text-gray-500">Loading product...</p>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container-custom py-8">
          <p className="text-red-500">{error || 'Product not found'}</p>
          <Link to="/marketplace" className="text-primary-600 hover:underline mt-4 inline-block">Back to marketplace</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-custom py-8">
        <Link to="/marketplace" className="text-primary-600 hover:underline mb-4 inline-block">← Back to marketplace</Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center overflow-hidden">
            {product.images && product.images[0] && !imageError ? (
              <img
                src={product.images[0]}
                alt={product.title}
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center px-4">
                <p className="text-gray-400 mb-2">Image not available</p>
                <p className="text-sm text-gray-500">
                  {product.images && product.images[0]
                    ? 'Link could not be loaded'
                    : 'No image provided'}
                </p>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
            <p className="text-3xl font-bold text-primary-600 mb-2">₹{product.price}</p>
            <p className="text-gray-600 mb-4">In stock · {product.stock}</p>
            <p className="text-gray-700 mb-6">{product.description}</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 border rounded hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 border rounded hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            <Card className="mb-6">
              <CardBody>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      {product.seller_name || product.seller?.name || 'Seller information unavailable'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {product.seller_email || 'Contact unavailable'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Rating</p>
                    <p className="font-semibold">⭐ {product.reputation ?? 'N/A'}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <div className="flex gap-4">
              <Button onClick={handleAddToCart} className="flex-1">
                Add to cart
              </Button>
              <Button onClick={handleBuyNow} variant="secondary" className="flex-1">
                Buy now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
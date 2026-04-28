import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Card, { CardBody } from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import { AuthContext } from '../context/AuthContext';
import { getOrders } from '../services/api';

const statusVariant = {
  pending: 'warning',
  paid: 'success',
  shipped: 'info',
  delivered: 'success',
  refunded: 'used',
};

const MyOrders = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/signin'); return; }
    getOrders()
      .then(setOrders)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <Layout>
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {loading && <p className="text-gray-500">Loading orders...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && orders.length === 0 && !error && (
          <p className="text-gray-500">No orders yet. <a href="/marketplace" className="text-primary-600 hover:underline">Browse the marketplace</a>.</p>
        )}

        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id}>
              <CardBody>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{order.book_title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Order #{order.id} · Qty: {order.quantity}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-600">₹{order.total_amount}</p>
                    <Badge variant={statusVariant[order.status] || 'default'} className="mt-2">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default MyOrders;

import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import Card, { CardBody, CardHeader } from '../components/UI/Card';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder, createPayment, confirmPayment } from '../services/api';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { cartItems, clearCart, getCartTotal } = useCart();
  const [step, setStep] = useState('address');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.fullName || '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    hostel: '',
    college: '',
  });

  const totalAmount = getCartTotal();

  const handleAddressChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/signin'); return; }
    setError('');
    setProcessing(true);
    try {
      const orderIds = [];
      for (const item of cartItems) {
        const order = await createOrder({
          bookId: item.id,
          quantity: item.quantity,
          shippingAddress,
        });
        orderIds.push(order.id);
      }

      const payment = await createPayment({
        amount: totalAmount,
        currency: 'inr',
        orderId: orderIds[0],
        userId: user.id,
        paymentMethod: 'mock',
      });

      await confirmPayment(payment.paymentId, { paymentMethod: 'mock' });

      clearCart();
      setStep('done');
    } catch (err) {
      setError(err.message || 'Order placement failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (step === 'done') {
    return (
      <Layout>
        <div className="container-custom py-16 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-2">Order placed!</h1>
          <p className="text-gray-600 mb-6">Your order has been confirmed and payment processed.</p>
          <Button onClick={() => navigate('/orders')}>View my orders</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/cart" className="text-primary-600 hover:underline">← Back to cart</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">Checkout</span>
        </div>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><h2 className="font-semibold text-lg">Shipping Address</h2></CardHeader>
              <CardBody>
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  {[
                    { name: 'fullName', label: 'Full Name', placeholder: 'Aarav Sharma' },
                    { name: 'phone', label: 'Phone', placeholder: '+91 9876543210' },
                    { name: 'address', label: 'Address', placeholder: 'Flat / Room / Street' },
                    { name: 'city', label: 'City', placeholder: 'Mumbai' },
                    { name: 'pincode', label: 'Pincode', placeholder: '400001' },
                    { name: 'college', label: 'College', placeholder: 'IIT Bombay' },
                    { name: 'hostel', label: 'Hostel (optional)', placeholder: 'Hostel 5, Room 102' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                      <input
                        name={f.name}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={shippingAddress[f.name]}
                        onChange={handleAddressChange}
                        required={f.name !== 'hostel'}
                      />
                    </div>
                  ))}
                  <Button type="submit" className="w-full" disabled={processing || cartItems.length === 0}>
                    {processing ? 'Processing...' : `Place order · ₹${totalAmount}`}
                  </Button>
                </form>
              </CardBody>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader><h2 className="font-semibold text-lg">Order Summary</h2></CardHeader>
              <CardBody>
                {cartItems.length === 0 && <p className="text-gray-500">Your cart is empty.</p>}
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between py-2 border-b">
                    <span className="text-sm">{item.title} × {item.quantity}</span>
                    <span className="text-sm font-semibold">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-4 font-bold">
                  <span>Total</span>
                  <span>₹{totalAmount}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Payment via mock mode (no real charge)</p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;

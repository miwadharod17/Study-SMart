import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Card, { CardBody } from '../components/UI/Card';
import { loginUser } from '../services/api';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      // Store token separately; store user in context
      localStorage.setItem('scholaria_token', data.token);
      login({ ...data.user, token: data.token });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Scholaria</h1>
          <p className="text-gray-600 mt-2">Knowledge has a fair price.</p>
        </div>

        <Card>
          <CardBody>
            <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
            <p className="text-gray-600 mb-6">Sign in to access your orders, cart and forum activity.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                placeholder="you@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-4">
              New here? <Link to="/signup" className="text-primary-600 hover:underline">Create an account</Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;

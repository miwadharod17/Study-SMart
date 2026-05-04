import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Card, { CardBody } from '../components/UI/Card';
import { registerUser } from '../services/api';

const SignUp = () => {
  const [userType, setUserType] = useState('student');
  const [fullName, setFullName] = useState('');
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
      const data = await registerUser({ email, password, fullName, role: userType });
      localStorage.setItem('studysmart_token', data.token);
      login({ ...data.user, token: data.token });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-600">StudySMart</h1>
        </div>

        <Card>
          <CardBody>
            <h2 className="text-2xl font-bold mb-4">Create your account</h2>
            <p className="text-gray-600 mb-6">Choose how you'll use StudySMart.</p>

            <div className="flex gap-4 mb-6">
              <button
                type="button"
                className={`flex-1 py-3 px-4 rounded-lg border transition ${userType === 'student' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-700 hover:border-primary-600'}`}
                onClick={() => setUserType('student')}
              >
                <div className="font-semibold">Student</div>
                <div className="text-xs opacity-75">Buy, sell, and join the forum.</div>
              </button>
              <button
                type="button"
                className={`flex-1 py-3 px-4 rounded-lg border transition ${userType === 'vendor' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-700 hover:border-primary-600'}`}
                onClick={() => setUserType('vendor')}
              >
                <div className="font-semibold">Vendor</div>
                <div className="text-xs opacity-75">Sell new academic materials.</div>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Input
                label="Full name"
                placeholder="Aarav Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
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
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account? <Link to="/signin" className="text-primary-600 hover:underline">Sign in</Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;

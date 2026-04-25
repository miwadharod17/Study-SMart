import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Card, { CardHeader, CardBody, CardFooter } from '../components/UI/Card';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ email, name: email.split('@')[0] });
    navigate('/');
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

            <Button variant="outline" className="w-full mb-4 flex items-center justify-center gap-2">
              <span>Continue with Google</span>
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

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
              <Button type="submit" className="w-full">Sign in</Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-4">
              New here? <Link to="/signup" className="text-primary-600 hover:underline">Create an account</Link>
            </p>
          </CardBody>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-8">
          Demo mode — sign in with any email like aarav@campus.edu or use the demo buttons.
        </p>
      </div>
    </div>
  );
};

export default SignIn;
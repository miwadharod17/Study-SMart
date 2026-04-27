import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Card, { CardHeader, CardBody, CardFooter } from '../components/UI/Card';

const SignUp = () => {
  const [userType, setUserType] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ email, name: fullName, type: userType });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-600">Scholaria</h1>
        </div>

        <Card>
          <CardBody>
            <h2 className="text-2xl font-bold mb-4">Create your account</h2>
            <p className="text-gray-600 mb-6">Choose how you'll use Scholaria.</p>

            <div className="flex gap-4 mb-6">
              <button
                className={`flex-1 py-3 px-4 rounded-lg border transition ${userType === 'student' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-700 hover:border-primary-600'}`}
                onClick={() => setUserType('student')}
              >
                <div className="font-semibold">Student</div>
                <div className="text-xs opacity-75">Buy, sell, and join the forum.</div>
              </button>
              <button
                className={`flex-1 py-3 px-4 rounded-lg border transition ${userType === 'vendor' ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-700 hover:border-primary-600'}`}
                onClick={() => setUserType('vendor')}
              >
                <div className="font-semibold">Vendor</div>
                <div className="text-xs opacity-75">Sell new academic materials.</div>
              </button>
            </div>

            <Button variant="outline" className="w-full mb-4">Continue with Google</Button>

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
                label="Full name"
                placeholder="Aarav Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="nam@ed.com"
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
              <Button type="submit" className="w-full">Create account</Button>
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
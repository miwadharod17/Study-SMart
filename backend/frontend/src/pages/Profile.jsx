import React, { useContext } from 'react';
import Layout from '../components/Layout/Layout';
import Card, { CardHeader, CardBody, CardFooter } from '../components/UI/Card';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const { user } = useContext(AuthContext);

  const stats = [
    { label: 'REPUTATION', value: 0 },
    { label: 'LISTINGS', value: 0 },
    { label: 'QUESTIONS', value: 0 },
    { label: 'ANSWERS', value: 0 },
  ];

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardBody className="text-center">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary-600">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <h1 className="text-2xl font-bold">{user?.name || 'Namrata Dalvi'}</h1>
              <p className="text-gray-500">Student · Joined 2026-04-25</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                {stats.map(stat => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-primary-600">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Marketplace</h3>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2 text-sm">
                  <li className="text-gray-600">Browse</li>
                  <li className="text-gray-600">Sell Items</li>
                  <li className="text-gray-600">My orders</li>
                </ul>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">Community</h3>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2 text-sm">
                  <li className="text-gray-600">Forum</li>
                  <li className="text-gray-600">Ask a question</li>
                </ul>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
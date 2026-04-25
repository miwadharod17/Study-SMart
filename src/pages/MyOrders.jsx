import React from 'react';
import Layout from '../components/Layout/Layout';
import Card, { CardHeader, CardBody, CardFooter } from '../components/UI/Card';

const MyOrders = () => {
  const orders = [];

  return (
    <Layout>
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id}>
                <CardBody>
                  <p>Order #{order.id}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-gray-500">No orders yet</p>
            </CardBody>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default MyOrders;
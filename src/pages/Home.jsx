import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import Card, { CardBody } from '../components/UI/Card';  // ← Fix this import

const Home = () => {
  const featuredProducts = [
    { id: 1, title: 'Engineering Mathematics — 8th Edition', stock: 24, price: 540, type: 'TEXTBOOKS' },
    { id: 2, title: 'Introduction to Algorithms (CLRS)', stock: 12, price: 1290, type: 'TEXTBOOKS' },
    { id: 3, title: 'Organic Chemistry — Morrison & Boyd (Used)', stock: 1, price: 420, type: 'Used' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            The student marketplace for books, notes and knowledge.
          </h1>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Buy textbooks from trusted vendors, sell your used notes to juniors, and ask questions to a community of 4+ students. All in one place.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/marketplace">
              <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                Browse marketplace
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Create free account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* New Section */}
      <section className="container-custom py-16">
        <h2 className="text-3xl font-bold mb-8">New</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredProducts.map(product => (
            <Card key={product.id}>
              <CardBody>
                <div className="text-sm text-primary-600 font-semibold mb-2">{product.type}</div>
                <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{product.stock} in stock</p>
                <p className="text-2xl font-bold text-primary-600">₤{product.price}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Three Things Section */}
      <section className="bg-gray-100 py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">Three things, done well</h2>
          <p className="text-center text-gray-600 mb-12">Scholaria brings together the three things every student actually needs.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardBody className="text-center">
                <h3 className="text-xl font-semibold mb-3">Buy from anyone</h3>
                <p className="text-gray-600">
                  Vendor stock new textbooks and stationery. Fellow students sell used books and notes at fair prices.
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <h3 className="text-xl font-semibold mb-3">Sell your stuff</h3>
                <p className="text-gray-600">
                  Turn last semester's books into next semester's funds. Post a listing in under a minute.
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="text-center">
                <h3 className="text-xl font-semibold mb-3">Ask anything</h3>
                <p className="text-gray-600">
                  Stuck on a concept? Post a question. Earn reputation by helping peers — climb the leaderboard.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-custom py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to save on your next semester?</h2>
        <p className="text-gray-600 mb-8">
          Join thousands of students saving on textbooks and earning from materials they no longer need.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/signup">
            <Button size="lg">Sign up free</Button>
          </Link>
          <Link to="/vendor-signup">
            <Button size="lg" variant="outline">I'm a vendor</Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
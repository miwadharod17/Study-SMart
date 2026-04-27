import React from 'react';
import Layout from '../components/Layout/Layout';
import Card, { CardHeader, CardBody, CardFooter } from '../components/UI/Card';
import Button from '../components/UI/Button';

const Forum = () => {
  const questions = [
    { id: 1, title: 'How does paging differ from segmentation in OS?', votes: 14, answers: 0, views: 410, author: 'Aarav Sharma', date: '2025-04-24', tags: ['operating-systems', 'memory'] },
    { id: 2, title: 'Best way to revise Engineering Maths in 2 weeks before sem?', votes: 18, answers: 0, views: 320, author: 'Kavya Iyer', date: '2025-04-23', tags: ['study-tips', 'exams', 'engineering-maths'] },
    { id: 3, title: 'Difference between SN1 and SN2 reactions — quick mnemonic?', votes: 27, answers: 0, views: 410, author: 'Priya Menon', date: '2025-04-22', tags: ['chemistry', 'organic-chemistry'] },
  ];

  const categories = ['All', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Economics', 'Electrical Engineering', 'General'];
  const contributors = [
    { name: 'Priya Menon', rep: 3120 },
    { name: 'Aarav Sharma', rep: 1240 },
  ];

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Community forum</h1>
          <Button>Ask a question</Button>
        </div>
        <p className="text-gray-600 mb-6">5 questions · 4 answers</p>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Questions List */}
          <div className="flex-1">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search questions, tags..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-4">
              {questions.map(q => (
                <Card key={q.id}>
                  <CardBody>
                    <div className="flex gap-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-xl font-bold">{q.votes}</div>
                        <div className="text-xs text-gray-500">VOTES</div>
                        <div className="text-xl font-bold mt-2">{q.answers}</div>
                        <div className="text-xs text-gray-500">ANSWERS</div>
                        <div className="text-xs text-gray-500 mt-2">{q.views} VIEWS</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg hover:text-primary-600 cursor-pointer">
                          {q.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {q.author} · {q.date}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {q.tags.map(tag => (
                            <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:w-72 space-y-6">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Categories</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-1">
                  {categories.map(cat => (
                    <div key={cat} className="text-sm text-gray-600 hover:text-primary-600 cursor-pointer">
                      {cat}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">Top contributors</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {contributors.map(c => (
                    <div key={c.name} className="flex justify-between">
                      <span className="text-sm">{c.name}</span>
                      <span className="text-sm font-semibold text-primary-600">{c.rep} rep</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Forum;
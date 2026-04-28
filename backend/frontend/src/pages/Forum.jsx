import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout/Layout';
import Card, { CardBody } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { getQuestions, createQuestion, getTrendingTags } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

const Forum = () => {
  const { user } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newQ, setNewQ] = useState({ title: '', content: '', tags: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = () => {
    setLoading(true);
    const params = { sort };
    if (search) params.search = search;
    getQuestions(params)
      .then((data) => {
        setQuestions(data.questions || []);
        setPagination(data.pagination || {});
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQuestions(); }, [sort, search]);

  useEffect(() => {
    getTrendingTags().then(setTags).catch(() => {});
  }, []);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!user) { alert('Please sign in to ask a question.'); return; }
    setSubmitting(true);
    try {
      const tagsArr = newQ.tags.split(',').map(t => t.trim()).filter(Boolean);
      await createQuestion({ title: newQ.title, content: newQ.content, authorId: user.id, tags: tagsArr });
      setShowForm(false);
      setNewQ({ title: '', content: '', tags: '' });
      fetchQuestions();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Community forum</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Ask a question'}
          </Button>
        </div>

        <p className="text-gray-600 mb-6">{pagination.total || 0} questions</p>

        {showForm && (
          <Card className="mb-6">
            <CardBody>
              <h2 className="text-lg font-semibold mb-4">New question</h2>
              <form onSubmit={handleAskQuestion} className="space-y-4">
                <input className="w-full px-4 py-2 border rounded-lg" placeholder="Question title"
                  value={newQ.title} onChange={e => setNewQ({ ...newQ, title: e.target.value })} required />
                <textarea className="w-full px-4 py-2 border rounded-lg" rows="4" placeholder="Describe your question..."
                  value={newQ.content} onChange={e => setNewQ({ ...newQ, content: e.target.value })} required />
                <input className="w-full px-4 py-2 border rounded-lg" placeholder="Tags (comma separated)"
                  value={newQ.tags} onChange={e => setNewQ({ ...newQ, tags: e.target.value })} />
                <Button type="submit" disabled={submitting}>{submitting ? 'Posting...' : 'Post question'}</Button>
              </form>
            </CardBody>
          </Card>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <div className="mb-6">
              <input type="text" placeholder="Search questions, tags..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="flex gap-2 mb-4">
              {['newest', 'votes', 'unanswered'].map(s => (
                <button key={s} onClick={() => setSort(s)}
                  className={`px-3 py-1 rounded text-sm ${sort === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {loading && <p className="text-gray-500">Loading questions...</p>}
            {error && <p className="text-red-500">{error}</p>}

            <div className="space-y-4">
              {questions.map(q => (
                <Card key={q.id}>
                  <CardBody>
                    <div className="flex gap-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-xl font-bold">{q.votes || 0}</div>
                        <div className="text-xs text-gray-500">VOTES</div>
                        <div className="text-xl font-bold mt-2">{q.answers_count || 0}</div>
                        <div className="text-xs text-gray-500">ANSWERS</div>
                        <div className="text-xs text-gray-500 mt-2">{q.views || 0} VIEWS</div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg hover:text-primary-600 cursor-pointer">
                          {q.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {q.author_name} · {new Date(q.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {(q.tags || []).map(tag => (
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
          <div className="md:w-64 space-y-6">
            {tags.length > 0 && (
              <Card>
                <CardBody>
                  <h3 className="font-semibold mb-3">Trending Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(t => (
                      <span key={t.tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded cursor-pointer"
                        onClick={() => setSearch(t.tag)}>
                        {t.tag} ({t.count})
                      </span>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Forum;

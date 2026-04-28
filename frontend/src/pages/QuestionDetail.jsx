import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import Card, { CardBody } from '../components/UI/Card';
import { AuthContext } from '../context/AuthContext';
import { getQuestion, createAnswer } from '../services/api';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [question, setQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getQuestion(id)
      .then(setQuestion)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }
    if (!answerText.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      await createAnswer(id, { content: answerText });
      setAnswerText('');
      const refreshed = await getQuestion(id);
      setQuestion(refreshed);
    } catch (err) {
      setError(err.message || 'Could not submit answer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/forum" className="text-primary-600 hover:underline">← Back to forum</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">Question</span>
        </div>

        {loading && <p className="text-gray-500">Loading question...</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {question && (
          <div className="space-y-6">
            <Card>
              <CardBody>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{question.title}</h1>
                    <p className="text-gray-600 mb-4">{question.author_name} · {new Date(question.created_at).toLocaleDateString()}</p>
                    <p className="text-gray-700 leading-7">{question.content}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold">{question.votes || 0}</div>
                    <div className="text-xs text-gray-500">votes</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  {(question.tags || []).map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{tag}</span>
                  ))}
                </div>
              </CardBody>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Answers</h2>
                      <span className="text-sm text-gray-500">{question.answers.length || 0} answers</span>
                    </div>
                    {question.answers.length === 0 ? (
                      <p className="text-gray-500">No answers yet. Be the first to reply.</p>
                    ) : (
                      <div className="space-y-4">
                        {question.answers.map(answer => (
                          <Card key={answer.id} className="bg-gray-50">
                            <CardBody>
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <p className="text-gray-700 leading-7">{answer.content}</p>
                                  <p className="text-sm text-gray-500 mt-3">Answered by {answer.author_name} · {new Date(answer.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold">{answer.votes || 0}</div>
                                  <div className="text-xs text-gray-500">votes</div>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <h2 className="text-xl font-semibold mb-4">Reply to this question</h2>
                    <form onSubmit={handleSubmitAnswer} className="space-y-4">
                      <textarea
                        rows="5"
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Write your answer here..."
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        required
                      />
                      <Button type="submit" disabled={submitting}>
                        {submitting ? 'Posting answer...' : 'Post answer'}
                      </Button>
                    </form>
                  </CardBody>
                </Card>
              </div>

              <div>
                <Card>
                  <CardBody>
                    <h3 className="text-lg font-semibold mb-3">Question details</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div><strong>Posted:</strong> {new Date(question.created_at).toLocaleDateString()}</div>
                      <div><strong>Answers:</strong> {question.answers.length || 0}</div>
                      <div><strong>Views:</strong> {question.views || 0}</div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QuestionDetail;

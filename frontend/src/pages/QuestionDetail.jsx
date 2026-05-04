import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import Card, { CardBody } from '../components/UI/Card';
import { AuthContext } from '../context/AuthContext';
import { getQuestion, createAnswer, getComments, createComment, getQuestionComments, createQuestionComment } from '../services/api';

const QuestionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [question, setQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState({}); // { answerId: [comments] }
  const [newComments, setNewComments] = useState({}); // { answerId: text }
  const [expandedAnswers, setExpandedAnswers] = useState({}); // { answerId: expanded }
  const [questionComments, setQuestionComments] = useState([]); // comments on the question itself
  const [newQuestionComment, setNewQuestionComment] = useState(''); // new comment on question
  const [expandedQuestionComments, setExpandedQuestionComments] = useState(false); // show question comments

  useEffect(() => {
    setLoading(true);
    getQuestion(id)
      .then((q) => {
        setQuestion(q);
        // Fetch comments for the question
        getQuestionComments(id)
          .then(data => setQuestionComments(data.comments || []))
          .catch(() => setQuestionComments([]));
        // Fetch comments for each answer
        if (q.answers && q.answers.length > 0) {
          const commentPromises = q.answers.map(ans =>
            getComments(ans.id)
              .then(data => ({ answerId: ans.id, comments: data.comments || [] }))
              .catch(() => ({ answerId: ans.id, comments: [] }))
          );
          Promise.all(commentPromises).then((results) => {
            const commentsMap = {};
            results.forEach(({ answerId, comments: ansComments }) => {
              commentsMap[answerId] = ansComments;
            });
            setComments(commentsMap);
          });
        }
      })
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

  const handleSubmitQuestionComment = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }
    if (!newQuestionComment.trim()) return;

    try {
      await createQuestionComment(id, { content: newQuestionComment, authorId: user.id });
      setNewQuestionComment('');
      // Fetch updated comments
      const updatedComments = await getQuestionComments(id);
      setQuestionComments(updatedComments.comments || []);
    } catch (err) {
      alert(err.message || 'Could not submit comment.');
    }
  };

  const handleSubmitComment = async (answerId, e) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }
    const commentText = newComments[answerId];
    if (!commentText || !commentText.trim()) return;

    try {
      await createComment(answerId, { content: commentText, authorId: user.id });
      setNewComments({ ...newComments, [answerId]: '' });
      // Fetch updated comments
      const updatedComments = await getComments(answerId);
      setComments({ ...comments, [answerId]: updatedComments.comments || [] });
    } catch (err) {
      alert(err.message || 'Could not submit comment.');
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
                          <div key={answer.id}>
                            <Card className="bg-gray-50">
                              <CardBody>
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1">
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

                            {/* Comments Section */}
                            {comments[answer.id] && comments[answer.id].length > 0 && (
                              <div className="ml-8 mt-3 space-y-2 border-l-2 border-gray-300 pl-4">
                                <p className="text-xs font-semibold text-gray-600 mb-2">COMMENTS ({comments[answer.id].length})</p>
                                {comments[answer.id].map(comment => (
                                  <div key={comment.id} className="bg-gray-100 rounded p-3 text-sm">
                                    <p className="text-gray-700">{comment.content}</p>
                                    <p className="text-xs text-gray-500 mt-1">{comment.author_name} · {new Date(comment.created_at).toLocaleDateString()}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Comment Form */}
                            <div className="ml-8 mt-3">
                              {expandedAnswers[answer.id] ? (
                                <Card className="bg-blue-50 border border-blue-200">
                                  <CardBody>
                                    <form onSubmit={(e) => handleSubmitComment(answer.id, e)} className="space-y-2">
                                      <textarea
                                        rows="2"
                                        className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Add a comment..."
                                        value={newComments[answer.id] || ''}
                                        onChange={(e) => setNewComments({ ...newComments, [answer.id]: e.target.value })}
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          type="submit"
                                          disabled={!newComments[answer.id] || !newComments[answer.id].trim()}
                                          className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50"
                                        >
                                          Comment
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setExpandedAnswers({ ...expandedAnswers, [answer.id]: false })}
                                          className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </form>
                                  </CardBody>
                                </Card>
                              ) : (
                                <button
                                  onClick={() => setExpandedAnswers({ ...expandedAnswers, [answer.id]: true })}
                                  className="text-xs text-primary-600 hover:underline"
                                >
                                  Add a comment
                                </button>
                              )}
                            </div>
                          </div>
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

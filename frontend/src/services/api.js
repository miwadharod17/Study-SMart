// Central API client — all requests go through nginx on port 80
const DEFAULT_LOCAL_API = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1'
  : '';
const BASE_URL = process.env.REACT_APP_API_URL || DEFAULT_LOCAL_API;

const getHeaders = (includeAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = localStorage.getItem('scholaria_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

// ─── Auth / Users ────────────────────────────────────────────────────────────

export const registerUser = (payload) =>
  fetch(`${BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const loginUser = (payload) =>
  fetch(`${BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: getHeaders(false),
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const getUserProfile = (id) =>
  fetch(`${BASE_URL}/api/users/profile/${id}`, {
    headers: getHeaders(),
  }).then(handleResponse);

// ─── Books / Marketplace ──────────────────────────────────────────────────────

export const getBooks = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/api/books${qs ? '?' + qs : ''}`, {
    headers: getHeaders(false),
  }).then(handleResponse);
};

export const getBook = (id) =>
  fetch(`${BASE_URL}/api/books/${id}`, {
    headers: getHeaders(false),
  }).then(handleResponse);

export const createBook = (formData) =>
  fetch(`${BASE_URL}/api/books`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('scholaria_token')}` },
    body: formData, // FormData (multipart for images)
  }).then(handleResponse);

export const updateBook = (id, payload) =>
  fetch(`${BASE_URL}/api/books/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const deleteBook = (id) =>
  fetch(`${BASE_URL}/api/books/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(handleResponse);

// ─── Orders ───────────────────────────────────────────────────────────────────

export const createOrder = (payload) =>
  fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const getOrders = () =>
  fetch(`${BASE_URL}/api/orders`, {
    headers: getHeaders(),
  }).then(handleResponse);

export const updateOrderStatus = (id, status) =>
  fetch(`${BASE_URL}/api/orders/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  }).then(handleResponse);

// ─── Forum ────────────────────────────────────────────────────────────────────

export const getQuestions = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return fetch(`${BASE_URL}/api/forum/questions${qs ? '?' + qs : ''}`, {
    headers: getHeaders(false),
  }).then(handleResponse);
};

export const getQuestion = (id) =>
  fetch(`${BASE_URL}/api/forum/questions/${id}`, {
    headers: getHeaders(false),
  }).then(handleResponse);

export const createQuestion = (payload) =>
  fetch(`${BASE_URL}/api/forum/questions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const voteQuestion = (id, userId, voteType) =>
  fetch(`${BASE_URL}/api/forum/questions/${id}/vote`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ userId, voteType }),
  }).then(handleResponse);

export const createAnswer = (questionId, payload) =>
  fetch(`${BASE_URL}/api/forum/questions/${questionId}/answers`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const getTrendingTags = () =>
  fetch(`${BASE_URL}/api/forum/tags/trending`, {
    headers: getHeaders(false),
  }).then(handleResponse);

// ─── Payments ─────────────────────────────────────────────────────────────────

export const createPayment = (payload) =>
  fetch(`${BASE_URL}/api/payments/create-payment`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const confirmPayment = (paymentId, payload) =>
  fetch(`${BASE_URL}/api/payments/confirm-payment/${paymentId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  }).then(handleResponse);

export const getPaymentStatus = (paymentId) =>
  fetch(`${BASE_URL}/api/payments/api/payment-status/${paymentId}`, {
    headers: getHeaders(),
  }).then(handleResponse);

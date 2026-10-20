// src/services/api.js — FinTrack API client v2
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
});

// ── Auth token injection (Firebase ID token or active session) ────────────
api.interceptors.request.use(async config => {
  let token = null;
  if (auth?.currentUser) {
    try {
      token = await auth.currentUser.getIdToken();
    } catch {
      // Fallback to cached session
    }
  }
  if (!token) {
    try {
      const saved = localStorage.getItem('fintrack_auth_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.token) token = parsed.token;
      }
    } catch {}
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── On 401: force-refresh the ID token once and retry ───
api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && orig && !orig._retry && auth?.currentUser) {
      orig._retry = true;
      try {
        const token = await auth.currentUser.getIdToken(true);
        orig.headers.Authorization = `Bearer ${token}`;
        return api(orig);
      } catch {
        // Couldn't refresh (session revoked / account disabled) → sign out
        await signOut(auth).catch(() => {});
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth (sign-in is handled by Firebase Auth; the API only serves the profile) ──
export const authAPI = {
  me:              ()        => api.get('/auth/me'),
  updateProfile:   data      => api.put('/auth/me',             data),
  deleteAccount:   ()        => api.delete('/auth/me', { data: { confirm: 'DELETE' } }),
};

// ── Dashboard ──────────────────────────────────────────
export const dashAPI = {
  overview: (params) => api.get('/dashboard/overview', { params }),
  trends:   ()       => api.get('/dashboard/trends'),
};

// ── Transactions ───────────────────────────────────────
export const txnAPI = {
  getAll:  params         => api.get('/transactions',      { params }),
  summary: params         => api.get('/transactions/summary', { params }),
  create:  data           => api.post('/transactions',     data),
  update:  (id, data)     => api.put(`/transactions/${id}`, data),
  remove:  id             => api.delete(`/transactions/${id}`),
  exportCsv: params       => api.get('/transactions/export', { params, responseType: 'blob' }),
};

// ── Accounts ───────────────────────────────────────────
export const accountAPI = {
  getAll:  ()             => api.get('/accounts'),
  create:  data           => api.post('/accounts',         data),
  update:  (id, data)     => api.put(`/accounts/${id}`,    data),
  remove:  id             => api.delete(`/accounts/${id}`),
};

// ── Categories ─────────────────────────────────────────
export const categoryAPI = {
  getAll:  ()             => api.get('/categories'),
  create:  data           => api.post('/categories',       data),
  update:  (id, data)     => api.put(`/categories/${id}`,  data),
  remove:  id             => api.delete(`/categories/${id}`),
};

// ── Budgets ────────────────────────────────────────────
export const budgetAPI = {
  getAll:  ()             => api.get('/budgets'),
  create:  data           => api.post('/budgets',          data),
  update:  (id, data)     => api.put(`/budgets/${id}`,     data),
  remove:  id             => api.delete(`/budgets/${id}`),
};

// ── Goals ──────────────────────────────────────────────
export const goalAPI = {
  getAll:  ()             => api.get('/goals'),
  create:  data           => api.post('/goals',            data),
  update:  (id, data)     => api.put(`/goals/${id}`,       data),
  remove:  id             => api.delete(`/goals/${id}`),
  contribute: (id, data)  => api.post(`/goals/${id}/contribute`, data),
};

// ── Investments ────────────────────────────────────────
export const investAPI = {
  getAll:  params         => api.get('/investments',       { params }),
  create:  data           => api.post('/investments',      data),
  update:  (id, data)     => api.put(`/investments/${id}`, data),
  remove:  id             => api.delete(`/investments/${id}`),
};

// ── Loans ──────────────────────────────────────────────
export const loanAPI = {
  getAll:  ()             => api.get('/loans'),
  create:  data           => api.post('/loans',            data),
  update:  (id, data)     => api.put(`/loans/${id}`,       data),
  remove:  id             => api.delete(`/loans/${id}`),
  pay:     id             => api.post(`/loans/${id}/pay`),
};

// ── Subscriptions ──────────────────────────────────────
export const subAPI = {
  getAll:  ()             => api.get('/subscriptions'),
  create:  data           => api.post('/subscriptions',    data),
  update:  (id, data)     => api.put(`/subscriptions/${id}`, data),
  remove:  id             => api.delete(`/subscriptions/${id}`),
};

// ── AI Chatbot ─────────────────────────────────────────
export const chatAPI = {
  sendMessage: message => api.post('/chat', { message }),
};

export default api;

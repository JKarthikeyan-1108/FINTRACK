// src/services/api.js — FinTrack API client v2
import axios from 'axios';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
});

// ── Auth token injection (Firebase ID token) ────────────
api.interceptors.request.use(async config => {
  if (auth) {
    await auth.authStateReady();
    // getIdToken() returns the cached token and transparently refreshes it when it's near expiry
    const token = await auth.currentUser?.getIdToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
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
};

// ── Dashboard ──────────────────────────────────────────
export const dashAPI = {
  overview: ()      => api.get('/dashboard/overview'),
  trends:   ()      => api.get('/dashboard/trends'),
};

// ── Transactions ───────────────────────────────────────
export const txnAPI = {
  getAll:  params         => api.get('/transactions',      { params }),
  summary: params         => api.get('/transactions/summary', { params }),
  create:  data           => api.post('/transactions',     data),
  update:  (id, data)     => api.put(`/transactions/${id}`, data),
  remove:  id             => api.delete(`/transactions/${id}`),
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
};

// ── Subscriptions ──────────────────────────────────────
export const subAPI = {
  getAll:  ()             => api.get('/subscriptions'),
  create:  data           => api.post('/subscriptions',    data),
  update:  (id, data)     => api.put(`/subscriptions/${id}`, data),
  remove:  id             => api.delete(`/subscriptions/${id}`),
};

export default api;

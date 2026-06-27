// src/services/api.js — FinTrack API client v2
import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
});

// ── Auth token injection ────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('fintrack_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auto-refresh on 401 ─────────────────────────────────
let isRefreshing = false, waitQueue = [];
api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry &&
        !orig.url?.includes('/auth/refresh') && !orig.url?.includes('/auth/logout')) {
      if (isRefreshing) {
        return new Promise((res, rej) => waitQueue.push({ res, rej }))
          .then(token => { orig.headers.Authorization = `Bearer ${token}`; return api(orig); });
      }
      orig._retry = true; isRefreshing = true;
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const token = data.access_token;
        localStorage.setItem('fintrack_token', token);
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        waitQueue.forEach(p => p.res(token));
        waitQueue = []; isRefreshing = false;
        orig.headers.Authorization = `Bearer ${token}`;
        return api(orig);
      } catch(e) {
        waitQueue.forEach(p => p.rej(e));
        waitQueue = []; isRefreshing = false;
        localStorage.removeItem('fintrack_token');
        window.location.href = '/login';
        return Promise.reject(e);
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ───────────────────────────────────────────────
export const authAPI = {
  sendOTP:         phone     => api.post('/auth/send-otp',       { phone }),
  verifyOTP:       (phone,otp)=>api.post('/auth/verify-otp',    { phone, otp }),
  google:          payload   => api.post('/auth/google',         payload),
  emailLogin:      (email,p) => api.post('/auth/email/login',   { email, password: p }),
  emailRegister:   (n,e,p)  => api.post('/auth/email/register',{ name:n, email:e, password:p }),
  refresh:         ()        => api.post('/auth/refresh'),
  logout:          ()        => api.post('/auth/logout'),
  me:              ()        => api.get('/auth/me'),
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

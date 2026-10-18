const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../app');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('GET /health returns 200 with system health information', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.version, '2.0.0');
  assert.equal(data.persistence, 'firestore');
  assert.equal(data.auth, 'firebase-id-token');
});

test('GET /api/health returns 200 with ok status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
});

test('GET unknown route returns 404 JSON', async () => {
  const res = await fetch(`${baseUrl}/api/non-existent-route`);
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.ok(data.error.includes('not found'));
});

test('Protected routes reject unauthenticated requests with 401', async () => {
  const protectedEndpoints = [
    '/api/auth/me',
    '/api/dashboard/overview',
    '/api/transactions',
    '/api/accounts',
    '/api/categories',
    '/api/budgets',
    '/api/goals',
    '/api/investments',
    '/api/loans',
    '/api/subscriptions',
    '/api/recurring',
  ];

  for (const endpoint of protectedEndpoints) {
    const res = await fetch(`${baseUrl}${endpoint}`);
    assert.equal(res.status, 401, `Expected 401 for ${endpoint}, got ${res.status}`);
    const data = await res.json();
    assert.equal(data.error, 'No token provided');
  }
});

test('Protected routes reject invalid tokens with 401', async () => {
  const res = await fetch(`${baseUrl}/api/transactions`, {
    headers: {
      Authorization: 'Bearer invalid.bogus.token',
    },
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.code, 'TOKEN_INVALID');
});

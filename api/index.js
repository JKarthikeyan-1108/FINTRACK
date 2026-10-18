// Vercel serverless entry — reuses the Express app. Do not duplicate routes here.
const app = require('../backend/app');

module.exports = app;

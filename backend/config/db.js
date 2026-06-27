// config/db.js — SQLite wrapper with mysql2 API shim
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

// Open SQLite database
const dbPromise = open({
  filename: path.join(__dirname, '../fintrack.sqlite'),
  driver: sqlite3.Database
});

// A wrapper that mimics mysql2/promise .query() behavior
const pool = {
  query: async (sql, params = []) => {
    const db = await dbPromise;
    // Basic heuristic to determine if query returns rows or affects rows
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT') || 
                     sql.trim().toUpperCase().startsWith('SHOW') || 
                     sql.trim().toUpperCase().startsWith('PRAGMA');
    
    if (isSelect) {
      const rows = await db.all(sql, params);
      return [rows, []]; // Return array of rows, plus empty fields array
    } else {
      const result = await db.run(sql, params);
      // mysql2 returns { insertId, affectedRows }
      return [{ insertId: result.lastID, affectedRows: result.changes }, []];
    }
  },
  execute: async function(sql, params) {
    return this.query(sql, params);
  },
  getConnection: async () => {
    return {
      query: pool.query,
      execute: pool.execute,
      release: () => {}
    };
  }
};

// Verify connection on startup
dbPromise
  .then(() => {
    console.log('✅  SQLite connected — fintrack.sqlite');
  })
  .catch(err => {
    console.error('❌  SQLite connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;

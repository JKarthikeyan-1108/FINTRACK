const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM accounts WHERE user_id=? ORDER BY is_default DESC, created_at ASC', [req.user.id]
    );
    const total = rows.reduce((s,a)=>s+Number(a.balance),0);
    res.json({ data: rows, total_balance: total });
  } catch(err){ next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, type, balance, color } = req.body;
    const [r] = await db.query(
      'INSERT INTO accounts (user_id,name,type,balance,color) VALUES (?,?,?,?,?)',
      [req.user.id, name, type||'savings', balance||0, color||'#4a9eff']
    );
    const [rows] = await db.query('SELECT * FROM accounts WHERE id=?', [r.insertId]);
    res.status(201).json({ data: rows[0] });
  } catch(err){ next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color, balance } = req.body;
    await db.query(
      'UPDATE accounts SET name=?, color=?, balance=? WHERE id=? AND user_id=?',
      [name, color, balance, id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM accounts WHERE id=?', [id]);
    res.json({ data: rows[0] });
  } catch(err){ next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT is_default FROM accounts WHERE id=?', [req.params.id]);
    if (rows[0]?.is_default) return res.status(403).json({ error: 'Cannot delete default account' });
    await db.query('DELETE FROM accounts WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch(err){ next(err); }
};

const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM categories WHERE user_id=? OR user_id IS NULL ORDER BY is_default DESC, name ASC',
      [req.user.id]
    );
    res.json({ data: rows });
  } catch(err){ next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;
    const [r] = await db.query(
      'INSERT INTO categories (user_id,name,type,icon,color) VALUES (?,?,?,?,?)',
      [req.user.id, name, type||'expense', icon||'💰', color||'#4ade80']
    );
    const [rows] = await db.query('SELECT * FROM categories WHERE id=?', [r.insertId]);
    res.status(201).json({ data: rows[0] });
  } catch(err){ next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;
    await db.query(
      'UPDATE categories SET name=?, icon=?, color=? WHERE id=? AND user_id=?',
      [name, icon, color, id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM categories WHERE id=?', [id]);
    res.json({ data: rows[0] });
  } catch(err){ next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT is_default FROM categories WHERE id=?', [req.params.id]);
    if (rows[0]?.is_default) return res.status(403).json({ error: 'Cannot delete default category' });
    await db.query('DELETE FROM categories WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch(err){ next(err); }
};

// controllers/budgetController.js
const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, c.name AS category_name, c.icon,
        COALESCE((
          SELECT SUM(t.amount) FROM transactions t
          WHERE t.user_id=b.user_id AND t.category_id=b.category_id
          AND t.type='expense' AND MONTH(t.date)=MONTH(b.start_date) AND YEAR(t.date)=YEAR(b.start_date)
        ), 0) AS spent
       FROM budgets b LEFT JOIN categories c ON b.category_id=c.id
       WHERE b.user_id=? ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { category_id, name, amount, period, start_date, color } = req.body;
    const [result] = await db.query(
      'INSERT INTO budgets (user_id, category_id, name, amount, period, start_date, color) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, category_id||null, name, amount, period||'monthly', start_date, color||'#2db87d']
    );
    const [rows] = await db.query('SELECT * FROM budgets WHERE id=?', [result.insertId]);
    res.status(201).json({ data: rows[0] });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, amount, color } = req.body;
    await db.query('UPDATE budgets SET name=?, amount=?, color=? WHERE id=? AND user_id=?',
      [name, amount, color, id, req.user.id]);
    const [rows] = await db.query('SELECT * FROM budgets WHERE id=?', [id]);
    res.json({ data: rows[0] });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM budgets WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// controllers/transactionController.js
const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, category_id, from, to, search } = req.query;
    const offset = (page - 1) * limit;
    let sql = `
      SELECT t.*, c.name AS category_name, c.icon AS category_icon, a.name AS account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts   a ON t.account_id  = a.id
      WHERE t.user_id = ?`;
    const params = [req.user.id];
    if (type)        { sql += ' AND t.type = ?';              params.push(type); }
    if (category_id) { sql += ' AND t.category_id = ?';       params.push(category_id); }
    if (from)        { sql += ' AND t.date >= ?';             params.push(from); }
    if (to)          { sql += ' AND t.date <= ?';             params.push(to); }
    if (search)      { sql += ' AND t.title LIKE ?';          params.push(`%${search}%`); }
    sql += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows]  = await db.query(sql, params);
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM transactions WHERE user_id=?', [req.user.id]
    );
    res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { account_id, category_id, type, amount, title, note, date, is_recurring } = req.body;
    const [result] = await db.query(
      `INSERT INTO transactions (user_id, account_id, category_id, type, amount, title, note, date, is_recurring)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [req.user.id, account_id, category_id || null, type, amount, title, note || null, date, is_recurring || false]
    );
    // Update account balance
    const delta = type === 'income' ? amount : -amount;
    await db.query('UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?',
      [delta, account_id, req.user.id]);

    const [rows] = await db.query('SELECT * FROM transactions WHERE id=?', [result.insertId]);
    res.status(201).json({ data: rows[0] });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, note, amount, category_id, date } = req.body;
    await db.query(
      'UPDATE transactions SET title=?, note=?, amount=?, category_id=?, date=? WHERE id=? AND user_id=?',
      [title, note, amount, category_id, date, id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM transactions WHERE id=?', [id]);
    res.json({ data: rows[0] });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM transactions WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.summary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const [rows] = await db.query(
      `SELECT
        SUM(CASE WHEN type='income'   THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type='expense'  THEN amount ELSE 0 END) AS total_expense,
        SUM(CASE WHEN type='income'   THEN amount ELSE -amount END) AS net_savings
       FROM transactions
       WHERE user_id=? AND MONTH(date)=? AND YEAR(date)=?`,
      [req.user.id, month, year]
    );
    const [byCategory] = await db.query(
      `SELECT c.name, c.icon, c.color, SUM(t.amount) AS total
       FROM transactions t LEFT JOIN categories c ON t.category_id=c.id
       WHERE t.user_id=? AND t.type='expense' AND MONTH(t.date)=? AND YEAR(t.date)=?
       GROUP BY t.category_id ORDER BY total DESC`,
      [req.user.id, month, year]
    );
    res.json({ summary: rows[0], by_category: byCategory });
  } catch (err) { next(err); }
};

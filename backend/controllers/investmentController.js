// controllers/investmentController.js
const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM investments WHERE user_id=?';
    const params = [req.user.id];
    if (category) { sql += ' AND category=?'; params.push(category); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await db.query(sql, params);

    const [summary] = await db.query(
      `SELECT category,
        SUM(invested_amount) AS total_invested,
        SUM(current_value)   AS total_current,
        SUM(current_value - invested_amount) AS total_gain
       FROM investments WHERE user_id=? GROUP BY category`,
      [req.user.id]
    );
    res.json({ data: rows, summary });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, category, instrument, invested_amount, current_value, units, sip_amount, sip_date, start_date, maturity_date, notes } = req.body;
    const [result] = await db.query(
      `INSERT INTO investments
        (user_id, name, category, instrument, invested_amount, current_value, units, sip_amount, sip_date, start_date, maturity_date, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.id, name, category, instrument||null, invested_amount||0, current_value||0,
       units||0, sip_amount||0, sip_date||null, start_date||null, maturity_date||null, notes||null]
    );
    const [rows] = await db.query('SELECT * FROM investments WHERE id=?', [result.insertId]);
    res.status(201).json({ data: rows[0] });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { invested_amount, current_value, units, notes } = req.body;
    await db.query(
      'UPDATE investments SET invested_amount=?, current_value=?, units=?, notes=? WHERE id=? AND user_id=?',
      [invested_amount, current_value, units, notes, id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM investments WHERE id=?', [id]);
    res.json({ data: rows[0] });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM investments WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

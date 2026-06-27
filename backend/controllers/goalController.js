// controllers/goalController.js
const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM goals WHERE user_id=? ORDER BY created_at DESC', [req.user.id]
    );
    res.json({ data: rows });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, emoji, target_amount, saved_amount, deadline, note } = req.body;
    const [result] = await db.query(
      'INSERT INTO goals (user_id, name, emoji, target_amount, saved_amount, deadline, note) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, name, emoji||'🎯', target_amount, saved_amount||0, deadline||null, note||null]
    );
    const [rows] = await db.query('SELECT * FROM goals WHERE id=?', [result.insertId]);
    res.status(201).json({ data: rows[0] });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, emoji, target_amount, saved_amount, deadline, note, is_achieved } = req.body;
    await db.query(
      'UPDATE goals SET name=?, emoji=?, target_amount=?, saved_amount=?, deadline=?, note=?, is_achieved=? WHERE id=? AND user_id=?',
      [name, emoji, target_amount, saved_amount, deadline, note, is_achieved||false, id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM goals WHERE id=?', [id]);
    res.json({ data: rows[0] });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM goals WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};

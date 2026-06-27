const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM subscriptions WHERE user_id=? ORDER BY next_due ASC', [req.user.id]
    );
    const monthly_total = rows.filter(s=>s.is_active).reduce((sum,s)=>{
      if(s.period==='monthly') return sum+Number(s.amount);
      if(s.period==='yearly')  return sum+Number(s.amount)/12;
      if(s.period==='weekly')  return sum+Number(s.amount)*4.33;
      return sum;
    }, 0);
    res.json({ data: rows, monthly_total: Math.round(monthly_total) });
  } catch(err){ next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, icon, amount, period, next_due, category } = req.body;
    const [r] = await db.query(
      'INSERT INTO subscriptions (user_id,name,icon,amount,period,next_due,category) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, name, icon||'📱', amount, period||'monthly', next_due, category||'General']
    );
    const [rows] = await db.query('SELECT * FROM subscriptions WHERE id=?', [r.insertId]);
    res.status(201).json({ data: rows[0] });
  } catch(err){ next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, amount, next_due, is_active } = req.body;
    await db.query(
      'UPDATE subscriptions SET name=?, amount=?, next_due=?, is_active=? WHERE id=? AND user_id=?',
      [name, amount, next_due, is_active, id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM subscriptions WHERE id=?', [id]);
    res.json({ data: rows[0] });
  } catch(err){ next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM subscriptions WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch(err){ next(err); }
};

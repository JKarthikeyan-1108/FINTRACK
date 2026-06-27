const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM loans WHERE user_id=? ORDER BY created_at DESC', [req.user.id]
    );
    // Compute summary
    const total_principal = rows.reduce((s,l)=>s+Number(l.principal),0);
    const total_remaining = rows.reduce((s,l)=>s+Number(l.remaining),0);
    const total_emi       = rows.filter(l=>l.is_active).reduce((s,l)=>s+Number(l.emi_amount),0);
    res.json({ data: rows, summary: { total_principal, total_remaining, total_emi } });
  } catch(err){ next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, type, principal, remaining, emi_amount, interest_rate, tenure_months, paid_months, emi_date, lender } = req.body;
    const [r] = await db.query(
      `INSERT INTO loans (user_id,name,type,principal,remaining,emi_amount,interest_rate,tenure_months,paid_months,emi_date,lender)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.id, name, type||'personal', principal, remaining||principal, emi_amount, interest_rate, tenure_months, paid_months||0, emi_date||1, lender||null]
    );
    const [rows] = await db.query('SELECT * FROM loans WHERE id=?', [r.insertId]);
    res.status(201).json({ data: rows[0] });
  } catch(err){ next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remaining, paid_months, is_active } = req.body;
    await db.query(
      'UPDATE loans SET remaining=?, paid_months=?, is_active=? WHERE id=? AND user_id=?',
      [remaining, paid_months, is_active, id, req.user.id]
    );
    const [rows] = await db.query('SELECT * FROM loans WHERE id=?', [id]);
    res.json({ data: rows[0] });
  } catch(err){ next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM loans WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch(err){ next(err); }
};

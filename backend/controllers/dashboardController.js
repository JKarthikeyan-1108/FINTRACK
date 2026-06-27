// controllers/dashboardController.js
const db = require('../config/db');

exports.overview = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const now  = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    const [[netWorth]] = await db.query(
      'SELECT COALESCE(SUM(balance),0) AS net_worth FROM accounts WHERE user_id=?', [uid]
    );
    const [[monthly]] = await db.query(
      `SELECT
        SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expenses
       FROM transactions WHERE user_id=? AND cast(strftime('%m', date) as integer)=? AND cast(strftime('%Y', date) as integer)=?`,
      [uid, month, year]
    );
    const [[investments]] = await db.query(
      'SELECT COALESCE(SUM(current_value),0) AS portfolio FROM investments WHERE user_id=?', [uid]
    );
    const [recentTxns] = await db.query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon
       FROM transactions t LEFT JOIN categories c ON t.category_id=c.id
       WHERE t.user_id=? ORDER BY t.date DESC, t.created_at DESC LIMIT 8`,
      [uid]
    );
    const [accounts] = await db.query(
      'SELECT * FROM accounts WHERE user_id=?', [uid]
    );

    const income   = Number(monthly?.income   || 0);
    const expenses = Number(monthly?.expenses || 0);
    const savings  = income - expenses;
    const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

    res.json({
      net_worth:    Number(netWorth.net_worth),
      income,
      expenses,
      savings,
      savings_rate: Number(savingsRate),
      portfolio:    Number(investments.portfolio),
      recent_transactions: recentTxns,
      accounts,
    });
  } catch (err) { next(err); }
};

exports.trends = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT
        strftime('%Y-%m', date) AS month,
        SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expenses
       FROM transactions WHERE user_id=?
       GROUP BY strftime('%Y-%m', date)
       ORDER BY month DESC LIMIT 6`,
      [req.user.id]
    );
    res.json({ data: rows.reverse() });
  } catch (err) { next(err); }
};

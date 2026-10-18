const db = require('../config/db');
const { toMoney } = require('../utils/money');

exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const userMessage = String(message).toLowerCase();
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const prefix = `${year}-${month}`;

    const txQuery = await db.collection('transactions').where('user_id', '==', req.user.id).get();
    const txs = txQuery.docs.map(doc => doc.data());
    const monthTx = txs.filter(t => t.date && String(t.date).startsWith(prefix));
    const income = toMoney(monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0));
    const expense = toMoney(monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0));
    const savings = toMoney(income - expense);

    let reply = `This month: income ${income}, expenses ${expense}, net ${savings}. Ask about expenses, budgets, or savings for more detail.`;

    if (userMessage.includes('expense') || userMessage.includes('spend')) {
      reply = `You have recorded ${expense} in expenses so far this month (${prefix}).`;
    } else if (userMessage.includes('income')) {
      reply = `You have recorded ${income} in income so far this month (${prefix}).`;
    } else if (userMessage.includes('budget') || userMessage.includes('limit')) {
      const budgetQuery = await db.collection('budgets').where('user_id', '==', req.user.id).get();
      if (budgetQuery.empty) {
        reply = 'You have no budgets yet. Create one under Budgets to track category limits.';
      } else {
        reply = `You currently have ${budgetQuery.size} budget(s). Open the Budgets page to see spent vs limit for each category.`;
      }
    } else if (userMessage.includes('save') || userMessage.includes('savings')) {
      const rate = income > 0 ? ((savings / income) * 100).toFixed(1) : '0.0';
      reply = `This month your net cash flow is ${savings} (${rate}% of income).`;
    } else if (userMessage.includes('hello') || userMessage.includes('hi')) {
      reply = 'Hello. I can summarize this month’s income, expenses, and savings from your FinTrack records.';
    }

    res.json({ reply });
  } catch (err) { next(err); }
};

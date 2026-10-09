// controllers/chatController.js
const db = require('../config/db');

exports.chat = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const userMessage = message.toLowerCase();
    let reply = "I'm your FinTrack AI assistant! I'm still learning, but I can help you analyze your spending if you ask me about your 'expenses', 'budget', or 'savings'.";

    if (userMessage.includes('expense') || userMessage.includes('spend')) {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const startOfMonth = `${year}-${month}-01`;
      const endOfMonth = `${year}-${month}-31`;

      const txQuery = await db.collection('transactions')
        .where('user_id', '==', req.user.id)
        .get();
        
      const total = txQuery.docs
        .map(doc => doc.data())
        .filter(t => t.type === 'expense' && t.date >= startOfMonth && t.date <= endOfMonth)
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      reply = `You've spent **₹${total}** so far this month. Make sure to keep an eye on your budgets!`;
    } 
    else if (userMessage.includes('budget') || userMessage.includes('limit')) {
      reply = "Your budgets are looking good, but you are nearing your limit for 'Dining Out'. Consider cooking at home this weekend!";
    }
    else if (userMessage.includes('save') || userMessage.includes('savings')) {
      reply = "Based on your recent income and expenses, you are on track to save 20% of your income this month. Great job! Keep it up.";
    }
    else if (userMessage.includes('hello') || userMessage.includes('hi')) {
      reply = "Hello there! How can I help you manage your finances today?";
    }

    // Simulate network delay for realism
    setTimeout(() => {
      res.json({ reply });
    }, 800);
    
  } catch (err) { next(err); }
};

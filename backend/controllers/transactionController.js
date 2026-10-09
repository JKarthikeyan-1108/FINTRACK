const db = require('../config/db');
const { getVisibleCategoryDocs } = require('../utils/firestoreHelpers');

exports.getAll = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    
    const { page = 1, limit = 20, type, category_id, from, to, search } = req.query;
    
    // Fetch user's categories and accounts for the "JOIN"
    const [catDocs, accQuery] = await Promise.all([
      getVisibleCategoryDocs(req.user.id),
      db.collection('accounts').where('user_id', '==', req.user.id).get()
    ]);
    
    const categories = {};
    catDocs.forEach(doc => { categories[doc.id] = doc.data(); });
    
    const accounts = {};
    accQuery.docs.forEach(doc => { accounts[doc.id] = doc.data(); });

    // Fetch all of the user's transactions and filter in memory: Firestore has no
    // LIKE '%search%', and mixing equality + range filters needs composite indexes.
    const txQuery = await db.collection('transactions').where('user_id', '==', req.user.id).get();
    let transactions = txQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    transactions = transactions.filter(t => {
      if (type && t.type !== type) return false;
      if (category_id && t.category_id !== category_id) return false;
      if (from && !(t.date >= from)) return false;
      if (to && !(t.date <= to)) return false;
      return true;
    });
    
    // Map JOIN data and apply search filter
    const searchTerm = search ? search.toLowerCase() : null;
    
    transactions = transactions.map(t => ({
      ...t,
      category_name: categories[t.category_id]?.name || null,
      category_icon: categories[t.category_id]?.icon || null,
      account_name: accounts[t.account_id]?.name || null
    })).filter(t => {
      if (!searchTerm) return true;
      return (
        (t.title && t.title.toLowerCase().includes(searchTerm)) ||
        (t.category_name && t.category_name.toLowerCase().includes(searchTerm)) ||
        (t.account_name && t.account_name.toLowerCase().includes(searchTerm))
      );
    });

    // Sort by date DESC, created_at DESC
    transactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      const tA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
      const tB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
      return tB - tA;
    });

    const total = transactions.length;
    
    // Paginate
    const offset = (Number(page) - 1) * Number(limit);
    const paginated = transactions.slice(offset, offset + Number(limit));

    res.json({ data: paginated, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { account_id, category_id, type, amount, title, note, date, is_recurring } = req.body;
    
    // Validate account ownership
    const accountDoc = await db.collection('accounts').doc(account_id).get();
    if (!accountDoc.exists || accountDoc.data().user_id !== req.user.id) {
      return res.status(403).json({ error: 'Invalid account' });
    }
    
    // Validate category ownership
    if (category_id) {
      const catDoc = await db.collection('categories').doc(category_id).get();
      if (!catDoc.exists || (catDoc.data().user_id !== req.user.id && catDoc.data().user_id !== null)) {
        return res.status(403).json({ error: 'Invalid category' });
      }
    }

    const newTxRef = await db.collection('transactions').add({
      user_id: req.user.id,
      account_id,
      category_id: category_id || null,
      type,
      amount: Number(amount),
      title,
      note: note || null,
      date: String(date).slice(0, 10), // stored as YYYY-MM-DD so string comparisons work
      is_recurring: is_recurring || false,
      created_at: new Date(),
      updated_at: new Date()
    });

    const doc = await newTxRef.get();
    res.status(201).json({ data: { id: doc.id, ...doc.data() } });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    const { title, note, amount, category_id, date, type, account_id } = req.body;
    
    const txRef = db.collection('transactions').doc(id);
    const txDoc = await txRef.get();
    
    if (!txDoc.exists || txDoc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const oldTx = txDoc.data();

    if (category_id) {
      const catDoc = await db.collection('categories').doc(category_id).get();
      if (!catDoc.exists || (catDoc.data().user_id !== req.user.id && catDoc.data().user_id !== null)) {
        return res.status(403).json({ error: 'Invalid category' });
      }
    }

    const targetAccountId = account_id || oldTx.account_id;
    if (account_id && account_id !== oldTx.account_id) {
      const accountDoc = await db.collection('accounts').doc(account_id).get();
      if (!accountDoc.exists || accountDoc.data().user_id !== req.user.id) {
        return res.status(403).json({ error: 'Invalid account' });
      }
    }

    await txRef.update({
      title,
      note,
      amount: amount !== undefined ? Number(amount) : oldTx.amount,
      category_id,
      date: date ? String(date).slice(0, 10) : oldTx.date,
      type: type || oldTx.type,
      account_id: targetAccountId,
      updated_at: new Date()
    });

    const updatedDoc = await txRef.get();
    res.json({ data: { id: updatedDoc.id, ...updatedDoc.data() } });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const txRef = db.collection('transactions').doc(req.params.id);
    const txDoc = await txRef.get();
    
    if (!txDoc.exists || txDoc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await txRef.delete();
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.summary = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { month, year } = req.query; // strings like '10', '2026'
    
    const paddedMonth = String(month).padStart(2, '0');
    const startDate = `${year}-${paddedMonth}-01`;
    const endDate = `${year}-${paddedMonth}-31`; // simplified boundary
    
    // Filter the month in memory (equality + range filters would need a composite index)
    const txQuery = await db.collection('transactions')
      .where('user_id', '==', req.user.id)
      .get();
      
    const transactions = txQuery.docs.map(doc => doc.data())
      .filter(t => t.date >= startDate && t.date <= endDate);
    
    let total_income = 0;
    let total_expense = 0;
    
    // Group expenses by category
    const catExpenses = {};
    
    transactions.forEach(t => {
      const amount = Number(t.amount || 0);
      if (t.type === 'income') {
        total_income += amount;
      } else if (t.type === 'expense') {
        total_expense += amount;
        if (t.category_id) {
          catExpenses[t.category_id] = (catExpenses[t.category_id] || 0) + amount;
        }
      }
    });

    // Fetch categories for the mapping
    const catKeys = Object.keys(catExpenses);
    const byCategory = [];
    
    if (catKeys.length > 0) {
      const catDocs = await getVisibleCategoryDocs(req.user.id);
      const categories = {};
      catDocs.forEach(doc => { categories[doc.id] = doc.data(); });
      
      for (const catId of catKeys) {
        const cat = categories[catId];
        if (cat) {
          byCategory.push({
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            total: catExpenses[catId]
          });
        }
      }
      byCategory.sort((a, b) => b.total - a.total);
    }

    res.json({
      summary: {
        total_income,
        total_expense,
        net_savings: total_income - total_expense
      },
      by_category: byCategory
    });
  } catch (err) { next(err); }
};

// controllers/budgetController.js
const db = require('../config/db');
const { getVisibleCategoryDocs } = require('../utils/firestoreHelpers');

exports.getAll = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const uid = req.user.id;

    // 1. Fetch budgets
    const budgetQuery = await db.collection('budgets').where('user_id', '==', uid).get();
    const budgets = budgetQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort by created_at DESC
    budgets.sort((a, b) => {
      const tA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
      const tB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
      return tB - tA;
    });

    // 2. Fetch categories
    const catDocs = await getVisibleCategoryDocs(uid);
    const categoriesMap = {};
    catDocs.forEach(d => categoriesMap[d.id] = d.data());

    // 3. Fetch expense transactions (filtered in memory to avoid a composite index)
    const txQuery = await db.collection('transactions')
      .where('user_id', '==', uid)
      .get();
    const transactions = txQuery.docs.map(doc => doc.data()).filter(t => t.type === 'expense');

    // Helper to get week number (ISO 8601)
    const getWeek = (dateStr) => {
      const d = new Date(dateStr);
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    };

    // 4. Map budgets and calculate spent amount
    const mappedBudgets = budgets.map(b => {
      let spent = 0;
      
      const bStart = b.start_date ? new Date(b.start_date) : null;
      
      transactions.forEach(t => {
        // Match category
        if (b.category_id && t.category_id !== b.category_id) return;
        if (!t.date || !bStart) return;

        const tDate = new Date(t.date);
        let inPeriod = false;

        if (b.period === 'monthly') {
          if (tDate.getMonth() === bStart.getMonth() && tDate.getFullYear() === bStart.getFullYear()) {
            inPeriod = true;
          }
        } else if (b.period === 'yearly') {
          if (tDate.getFullYear() === bStart.getFullYear()) {
            inPeriod = true;
          }
        } else if (b.period === 'weekly') {
          if (getWeek(t.date) === getWeek(b.start_date) && tDate.getFullYear() === bStart.getFullYear()) {
            inPeriod = true;
          }
        } else if (b.period === 'custom') {
          if (t.date >= b.start_date && t.date <= (b.end_date || '9999-12-31')) {
            inPeriod = true;
          }
        } else {
          inPeriod = true; // Fallback for unknown period
        }

        if (inPeriod) {
          spent += Number(t.amount || 0);
        }
      });

      return {
        ...b,
        category_name: categoriesMap[b.category_id]?.name || null,
        icon: categoriesMap[b.category_id]?.icon || null,
        spent
      };
    });

    res.json({ data: mappedBudgets });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { category_id, name, amount, period, start_date, end_date, color } = req.body;
    
    const newBudgetRef = await db.collection('budgets').add({
      user_id: req.user.id,
      category_id: category_id || null,
      name,
      amount: Number(amount),
      period: period || 'monthly',
      start_date,
      end_date: end_date || null,
      color: color || '#2db87d',
      created_at: new Date(),
      updated_at: new Date()
    });

    const doc = await newBudgetRef.get();
    res.status(201).json({ data: { id: doc.id, ...doc.data() } });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    const { category_id, name, amount, period, start_date, end_date, color } = req.body;
    
    const docRef = db.collection('budgets').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await docRef.update({
      category_id: category_id || null,
      name,
      amount: Number(amount),
      period: period || 'monthly',
      start_date,
      end_date: end_date || null,
      color,
      updated_at: new Date()
    });

    const updatedDoc = await docRef.get();
    res.json({ data: { id: updatedDoc.id, ...updatedDoc.data() } });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    
    const docRef = db.collection('budgets').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    await docRef.delete();
    res.json({ success: true });
  } catch (err) { next(err); }
};

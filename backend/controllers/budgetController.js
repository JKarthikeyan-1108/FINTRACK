// controllers/budgetController.js
const db = require('../config/db');
const { getVisibleCategoryDocs } = require('../utils/firestoreHelpers');
const { toMoney } = require('../utils/money');
const { transactionInBudgetPeriod } = require('../utils/finance');

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

    const mappedBudgets = budgets.map(b => {
      let spent = 0;

      transactions.forEach(t => {
        if (b.category_id && t.category_id !== b.category_id) return;
        if (transactionInBudgetPeriod(t.date, b)) {
          spent += Number(t.amount || 0);
        }
      });

      const amount = toMoney(b.amount);
      const spentMoney = toMoney(spent);
      const remaining = toMoney(amount - spentMoney);
      const utilization = amount > 0 ? Number(((spentMoney / amount) * 100).toFixed(1)) : 0;
      return {
        ...b,
        amount,
        category_name: categoriesMap[b.category_id]?.name || null,
        icon: categoriesMap[b.category_id]?.icon || null,
        spent: spentMoney,
        remaining,
        utilization,
        exceeded: spentMoney > amount,
      };
    });

    res.json({ data: mappedBudgets });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { category_id, name, amount, period, start_date, end_date, color } = req.body;
    if (!name || !(Number(amount) > 0)) {
      return res.status(400).json({ error: 'Name and a positive amount are required' });
    }

    const newBudgetRef = await db.collection('budgets').add({
      user_id: req.user.id,
      category_id: category_id || null,
      name,
      amount: toMoney(amount),
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

    const prev = doc.data();
    await docRef.update({
      category_id: category_id !== undefined ? (category_id || null) : prev.category_id,
      name: name !== undefined ? name : prev.name,
      amount: amount !== undefined ? toMoney(amount) : prev.amount,
      period: period || prev.period || 'monthly',
      start_date: start_date !== undefined ? start_date : prev.start_date,
      end_date: end_date !== undefined ? (end_date || null) : prev.end_date,
      color: color !== undefined ? color : prev.color,
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

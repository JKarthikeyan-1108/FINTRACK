const db = require('../config/db');
const { getVisibleCategoryDocs } = require('../utils/firestoreHelpers');

exports.getAll = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    
    // Fetch categories and accounts for mapping
    const [catDocs, accQuery] = await Promise.all([
      getVisibleCategoryDocs(req.user.id),
      db.collection('accounts').where('user_id', '==', req.user.id).get()
    ]);
    
    const categories = {};
    catDocs.forEach(doc => { categories[doc.id] = doc.data(); });
    
    const accounts = {};
    accQuery.docs.forEach(doc => { accounts[doc.id] = doc.data(); });

    // Fetch recurring transactions
    const recQuery = await db.collection('recurring_transactions').where('user_id', '==', req.user.id).get();
    let rows = recQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Map joins
    rows = rows.map(r => ({
      ...r,
      category_name: categories[r.category_id]?.name || null,
      category_icon: categories[r.category_id]?.icon || null,
      account_name: accounts[r.account_id]?.name || null
    }));

    // Sort by next_run ASC
    rows.sort((a, b) => {
      const dateA = new Date(a.next_run || '9999-12-31').getTime();
      const dateB = new Date(b.next_run || '9999-12-31').getTime();
      return dateA - dateB;
    });

    res.json({ data: rows });
  } catch(err){ next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { account_id, category_id, title, amount, type, frequency, next_run, end_date } = req.body;
    
    // Validate account ownership
    const accountDoc = await db.collection('accounts').doc(account_id).get();
    if (!accountDoc.exists || accountDoc.data().user_id !== req.user.id) {
      return res.status(403).json({ error: 'Invalid account' });
    }

    const newDocRef = await db.collection('recurring_transactions').add({
      user_id: req.user.id,
      account_id,
      category_id: category_id || null,
      title,
      amount: Number(amount),
      type,
      frequency,
      next_run: String(next_run).slice(0, 10),
      end_date: end_date || null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const doc = await newDocRef.get();
    res.status(201).json({ data: { id: doc.id, ...doc.data() } });
  } catch(err){ next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    const { account_id, category_id, title, amount, type, frequency, next_run, end_date, is_active } = req.body;
    
    const docRef = db.collection('recurring_transactions').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }

    // Optional account validation
    if (account_id && account_id !== doc.data().account_id) {
      const accountDoc = await db.collection('accounts').doc(account_id).get();
      if (!accountDoc.exists || accountDoc.data().user_id !== req.user.id) {
        return res.status(403).json({ error: 'Invalid account' });
      }
    }

    await docRef.update({
      account_id: account_id || doc.data().account_id,
      category_id: category_id || null,
      title,
      amount: Number(amount),
      type,
      frequency,
      next_run: String(next_run).slice(0, 10),
      end_date: end_date || null,
      is_active,
      updated_at: new Date()
    });
    
    const updatedDoc = await docRef.get();
    res.json({ data: { id: updatedDoc.id, ...updatedDoc.data() } });
  } catch(err){ next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    
    const docRef = db.collection('recurring_transactions').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }
    
    await docRef.delete();
    res.json({ success: true });
  } catch(err){ next(err); }
};

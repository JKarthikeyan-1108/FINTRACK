const db = require('../config/db');
const { toMoney } = require('../utils/money');

exports.getAll = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    
    // Fetch accounts
    const accountsQuery = await db.collection('accounts').where('user_id', '==', req.user.id).get();
    const accounts = accountsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch transactions
    const txQuery = await db.collection('transactions').where('user_id', '==', req.user.id).get();
    const transactions = txQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let total = 0;
    const mappedRows = accounts.map(a => {
      // Calculate current balance based on transactions for this account
      const acctTx = transactions.filter(t => t.account_id === a.id);
      const txSum = acctTx.reduce((sum, t) => {
        if (t.type === 'income') return sum + Number(t.amount || 0);
        if (t.type === 'expense') return sum - Number(t.amount || 0);
        return sum;
      }, 0);
      
      const current_balance = toMoney(Number(a.balance || 0) + txSum);
      total += current_balance;

      return {
        ...a,
        balance: current_balance,
        opening_balance: toMoney(a.balance || 0)
      };
    });

    // Sort by is_default DESC, created_at ASC
    mappedRows.sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      const tA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
      const tB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
      return tA - tB;
    });

    res.json({ data: mappedRows, total_balance: toMoney(total) });
  } catch(err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { name, type, balance, color } = req.body;
    
    const newAcctRef = await db.collection('accounts').add({
      user_id: req.user.id,
      name: String(name).trim(),
      type: type || 'savings',
      balance: toMoney(balance || 0),
      color: color || '#4a9eff',
      is_default: false,
      created_at: new Date(),
      updated_at: new Date()
    });

    const doc = await newAcctRef.get();
    res.status(201).json({ data: { id: doc.id, ...doc.data() } });
  } catch(err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    const { name, color, balance, type } = req.body;
    
    const docRef = db.collection('accounts').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Account not found or access denied' });
    }

    const updates = { updated_at: new Date() };
    if (name) updates.name = String(name).trim();
    if (color) updates.color = color;
    if (type) updates.type = type;
    if (balance !== undefined && balance !== '') updates.balance = toMoney(balance);

    await docRef.update(updates);

    const updatedDoc = await docRef.get();
    res.json({ data: { id: updatedDoc.id, ...updatedDoc.data() } });
  } catch(err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    
    const docRef = db.collection('accounts').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(403).json({ error: 'Account not found or access denied' });
    }
    
    if (doc.data().is_default) {
      return res.status(403).json({ error: 'Cannot delete default account' });
    }

    const txQuery = await db.collection('transactions').where('user_id', '==', req.user.id).get();
    const hasTx = txQuery.docs.some(d => d.data().account_id === id);
    if (hasTx) {
      return res.status(409).json({
        error: 'Cannot delete an account that still has transactions. Reassign or delete those transactions first.',
      });
    }
    
    await docRef.delete();
    res.json({ success: true });
  } catch(err) { next(err); }
};

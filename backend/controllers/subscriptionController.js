const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const snapshot = await db.collection('subscriptions').where('user_id', '==', req.user.id).get();
    const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    rows.sort((a, b) => {
      const dateA = new Date(a.next_due || '9999-12-31').getTime();
      const dateB = new Date(b.next_due || '9999-12-31').getTime();
      return dateA - dateB;
    });

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
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { name, icon, amount, period, next_due, category } = req.body;
    
    const newDocRef = await db.collection('subscriptions').add({
      user_id: req.user.id,
      name,
      icon: icon || '📱',
      amount: Number(amount),
      period: period || 'monthly',
      next_due,
      category: category || 'General',
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
    const { name, amount, next_due, is_active } = req.body;
    
    const docRef = db.collection('subscriptions').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    await docRef.update({
      name,
      amount: Number(amount),
      next_due,
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
    
    const docRef = db.collection('subscriptions').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    await docRef.delete();
    res.json({ success: true });
  } catch(err){ next(err); }
};

// controllers/investmentController.js
const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { category } = req.query;
    
    let query = db.collection('investments').where('user_id', '==', req.user.id);
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query.get();
    const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    rows.sort((a, b) => {
      const tA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
      const tB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
      return tB - tA;
    });

    const summaryMap = {};
    let totalPortfolioValue = 0;

    rows.forEach(r => {
      const cat = r.category || 'Other';
      const invested = Number(r.invested_amount || 0);
      const current = Number(r.current_value || 0);
      
      if (!summaryMap[cat]) {
        summaryMap[cat] = { category: cat, total_invested: 0, total_current: 0, total_gain: 0 };
      }
      summaryMap[cat].total_invested += invested;
      summaryMap[cat].total_current += current;
      summaryMap[cat].total_gain += (current - invested);
      
      totalPortfolioValue += current;
    });

    const summary = Object.values(summaryMap);

    const enrichedRows = rows.map(r => {
      const invested = Number(r.invested_amount || 0);
      const current = Number(r.current_value || 0);
      const profitLoss = current - invested;
      const returnPercent = invested > 0 ? ((profitLoss / invested) * 100).toFixed(2) : 0;
      const allocation = totalPortfolioValue > 0 ? ((current / totalPortfolioValue) * 100).toFixed(2) : 0;
      return {
        ...r,
        profit_loss: profitLoss,
        return_percentage: Number(returnPercent),
        allocation_percentage: Number(allocation)
      };
    });

    res.json({ data: enrichedRows, summary });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { name, category, instrument, invested_amount, current_value, units, sip_amount, sip_date, start_date, maturity_date, notes } = req.body;
    
    const newDocRef = await db.collection('investments').add({
      user_id: req.user.id,
      name,
      category,
      instrument: instrument || null,
      invested_amount: Number(invested_amount || 0),
      current_value: Number(current_value || 0),
      units: Number(units || 0),
      sip_amount: Number(sip_amount || 0),
      sip_date: sip_date || null,
      start_date: start_date || null,
      maturity_date: maturity_date || null,
      notes: notes || null,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    const doc = await newDocRef.get();
    res.status(201).json({ data: { id: doc.id, ...doc.data() } });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    const { invested_amount, current_value, units, notes } = req.body;
    
    const docRef = db.collection('investments').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    
    await docRef.update({
      invested_amount: Number(invested_amount),
      current_value: Number(current_value),
      units: Number(units),
      notes: notes || null,
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
    
    const docRef = db.collection('investments').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Investment not found' });
    }
    
    await docRef.delete();
    res.json({ success: true });
  } catch (err) { next(err); }
};

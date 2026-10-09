// controllers/goalController.js
const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const query = await db.collection('goals').where('user_id', '==', req.user.id).get();
    
    const rows = query.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    rows.sort((a, b) => {
      const tA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
      const tB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
      return tB - tA;
    });
    
    res.json({ data: rows });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { name, emoji, target_amount, saved_amount, deadline, note } = req.body;
    
    const newDocRef = await db.collection('goals').add({
      user_id: req.user.id,
      name,
      emoji: emoji || '🎯',
      target_amount: Number(target_amount),
      saved_amount: Number(saved_amount || 0),
      deadline: deadline || null,
      note: note || null,
      is_achieved: false,
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
    const { name, emoji, target_amount, saved_amount, deadline, note, is_achieved } = req.body;
    
    const docRef = db.collection('goals').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    await docRef.update({
      name,
      emoji,
      target_amount: Number(target_amount),
      saved_amount: Number(saved_amount),
      deadline,
      note,
      is_achieved: is_achieved || false,
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
    
    const docRef = db.collection('goals').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    
    await docRef.delete();
    res.json({ success: true });
  } catch (err) { next(err); }
};

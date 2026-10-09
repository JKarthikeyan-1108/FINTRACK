const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    // Firestore doesn't support OR clauses easily across different fields without composite index tricks,
    // so we'll fetch user categories and default categories (user_id === null) and combine them.
    const userCategoriesQuery = await db.collection('categories').where('user_id', '==', req.user.id).get();
    const defaultCategoriesQuery = await db.collection('categories').where('user_id', '==', null).get();
    
    const categories = [
      ...userCategoriesQuery.docs.map(d => ({ id: d.id, ...d.data() })),
      ...defaultCategoriesQuery.docs.map(d => ({ id: d.id, ...d.data() }))
    ];
    
    categories.sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    res.json({ data: categories });
  } catch(err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { name, type, icon, color } = req.body;
    
    const newCatRef = await db.collection('categories').add({
      user_id: req.user.id,
      name,
      type: type || 'expense',
      icon: icon || '💰',
      color: color || '#4ade80',
      is_default: false,
      created_at: new Date(),
      updated_at: new Date()
    });

    const doc = await newCatRef.get();
    res.status(201).json({ data: { id: doc.id, ...doc.data() } });
  } catch(err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    const { name, icon, color } = req.body;
    
    const docRef = db.collection('categories').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(403).json({ error: 'Category not found or access denied' });
    }

    await docRef.update({
      name,
      icon,
      color,
      updated_at: new Date()
    });

    const updatedDoc = await docRef.get();
    res.json({ data: { id: updatedDoc.id, ...updatedDoc.data() } });
  } catch(err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { id } = req.params;
    
    const docRef = db.collection('categories').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(403).json({ error: 'Category not found or access denied' });
    }
    
    if (doc.data().is_default) {
      return res.status(403).json({ error: 'Cannot delete default category' });
    }
    
    await docRef.delete();
    res.json({ success: true });
  } catch(err) { next(err); }
};

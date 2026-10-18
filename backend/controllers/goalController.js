const db = require('../config/db');
const { toMoney } = require('../utils/money');

function enrich(goal) {
  const target = toMoney(goal.target_amount);
  const saved = toMoney(goal.saved_amount || 0);
  const remaining = toMoney(Math.max(0, target - saved));
  const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
  return {
    ...goal,
    target_amount: target,
    saved_amount: saved,
    remaining,
    progress_pct: Number(pct.toFixed(2)),
    is_achieved: Boolean(goal.is_achieved) || saved >= target && target > 0,
    contributions: Array.isArray(goal.contributions) ? goal.contributions : [],
  };
}

exports.getAll = async (req, res, next) => {
  try {
    const query = await db.collection('goals').where('user_id', '==', req.user.id).get();
    const rows = query.docs.map(doc => enrich({ id: doc.id, ...doc.data() }));
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
    const { name, emoji, target_amount, saved_amount, deadline, note } = req.body;
    if (!name || !(Number(target_amount) > 0)) {
      return res.status(400).json({ error: 'Name and a positive target amount are required' });
    }
    const newDocRef = await db.collection('goals').add({
      user_id: req.user.id,
      name: String(name).trim(),
      emoji: emoji || '🎯',
      target_amount: toMoney(target_amount),
      saved_amount: toMoney(saved_amount || 0),
      deadline: deadline || null,
      note: note || null,
      is_achieved: false,
      contributions: [],
      created_at: new Date(),
      updated_at: new Date(),
    });
    const doc = await newDocRef.get();
    res.status(201).json({ data: enrich({ id: doc.id, ...doc.data() }) });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, emoji, target_amount, saved_amount, deadline, note, is_achieved } = req.body;
    const docRef = db.collection('goals').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    const prev = doc.data();
    const nextSaved = saved_amount !== undefined ? toMoney(saved_amount) : toMoney(prev.saved_amount);
    const nextTarget = target_amount !== undefined ? toMoney(target_amount) : toMoney(prev.target_amount);
    await docRef.update({
      name: name !== undefined ? String(name).trim() : prev.name,
      emoji: emoji !== undefined ? emoji : prev.emoji,
      target_amount: nextTarget,
      saved_amount: nextSaved,
      deadline: deadline !== undefined ? deadline : prev.deadline,
      note: note !== undefined ? note : prev.note,
      is_achieved: is_achieved !== undefined ? Boolean(is_achieved) : nextSaved >= nextTarget && nextTarget > 0,
      updated_at: new Date(),
    });
    const updatedDoc = await docRef.get();
    res.json({ data: enrich({ id: updatedDoc.id, ...updatedDoc.data() }) });
  } catch (err) { next(err); }
};

exports.contribute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const type = req.body.type === 'withdraw' ? 'withdraw' : 'deposit';
    const amount = toMoney(req.body.amount);
    if (!(amount > 0)) return res.status(400).json({ error: 'Amount must be greater than 0' });

    const docRef = db.collection('goals').doc(id);
    const result = await db.runTransaction(async (t) => {
      const snap = await t.get(docRef);
      if (!snap.exists || snap.data().user_id !== req.user.id) {
        const err = new Error('Goal not found');
        err.status = 404;
        throw err;
      }
      const goal = snap.data();
      const current = toMoney(goal.saved_amount || 0);
      const target = toMoney(goal.target_amount);
      let next = type === 'withdraw' ? toMoney(current - amount) : toMoney(current + amount);
      if (next < 0) {
        const err = new Error('Withdrawal exceeds saved amount');
        err.status = 400;
        throw err;
      }
      const entry = {
        id: `${Date.now()}`,
        type,
        amount,
        date: new Date().toISOString().slice(0, 10),
        created_at: new Date(),
      };
      const contributions = Array.isArray(goal.contributions) ? [...goal.contributions, entry] : [entry];
      const achieved = next >= target && target > 0;
      t.update(docRef, {
        saved_amount: next,
        is_achieved: achieved,
        contributions,
        updated_at: new Date(),
      });
      return { ...goal, saved_amount: next, is_achieved: achieved, contributions };
    });
    res.json({ data: enrich({ id, ...result }) });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
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

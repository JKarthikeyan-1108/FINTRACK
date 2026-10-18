const db = require('../config/db');
const { toMoney } = require('../utils/money');
const { calcEMI, amortizationPaid } = require('../utils/finance');

function nextEmiDate(emiDay) {
  const now = new Date();
  const day = Math.min(Math.max(Number(emiDay) || 1, 1), 28);
  const next = new Date(now.getFullYear(), now.getMonth(), day);
  if (next < now) next.setMonth(next.getMonth() + 1);
  return next.toISOString().split('T')[0];
}

function enrich(loan) {
  const paid = amortizationPaid(
    loan.principal,
    loan.interest_rate,
    loan.tenure_months,
    loan.paid_months
  );
  const remainingStored = loan.remaining != null ? toMoney(loan.remaining) : paid.remaining;
  return {
    ...loan,
    emi_amount: paid.emi,
    total_payable: paid.totalPayable,
    total_interest: paid.totalInterest,
    interest_paid: paid.interestPaid,
    principal_paid: paid.principalPaid,
    remaining_tenure: paid.remainingTenure,
    calculated_remaining: paid.remaining,
    remaining: remainingStored,
    next_emi_date: nextEmiDate(loan.emi_date),
  };
}

exports.getAll = async (req, res, next) => {
  try {
    const snapshot = await db.collection('loans').where('user_id', '==', req.user.id).get();
    const rows = snapshot.docs.map(doc => enrich({ id: doc.id, ...doc.data() }));

    rows.sort((a, b) => {
      const tA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
      const tB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
      return tB - tA;
    });

    const total_principal = toMoney(rows.reduce((s, l) => s + Number(l.principal || 0), 0));
    const total_remaining = toMoney(rows.reduce((s, l) => s + Number(l.remaining || 0), 0));
    const total_emi = toMoney(rows.filter(l => l.is_active !== false).reduce((s, l) => s + Number(l.emi_amount || 0), 0));
    res.json({ data: rows, summary: { total_principal, total_remaining, total_emi } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, type, principal, remaining, emi_amount, interest_rate, tenure_months, paid_months, emi_date, lender } = req.body;
    const p = toMoney(principal);
    const n = Number(tenure_months);
    const rate = Number(interest_rate || 0);
    const emi = emi_amount ? toMoney(emi_amount) : calcEMI(p, rate, n);

    const newDocRef = await db.collection('loans').add({
      user_id: req.user.id,
      name: String(name).trim(),
      type: type || 'personal',
      principal: p,
      remaining: remaining != null ? toMoney(remaining) : p,
      emi_amount: emi,
      interest_rate: rate,
      tenure_months: n,
      paid_months: Number(paid_months || 0),
      emi_date: Number(emi_date || 1),
      lender: lender || null,
      is_active: true,
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
    const { remaining, paid_months, is_active, name, interest_rate, tenure_months, emi_amount, lender, emi_date } = req.body;

    const docRef = db.collection('loans').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    const updates = { updated_at: new Date() };
    if (remaining !== undefined) updates.remaining = toMoney(remaining);
    if (paid_months !== undefined) updates.paid_months = Number(paid_months);
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (name) updates.name = String(name).trim();
    if (interest_rate !== undefined) updates.interest_rate = Number(interest_rate);
    if (tenure_months !== undefined) updates.tenure_months = Number(tenure_months);
    if (emi_amount !== undefined) updates.emi_amount = toMoney(emi_amount);
    if (lender !== undefined) updates.lender = lender || null;
    if (emi_date !== undefined) updates.emi_date = Number(emi_date);

    await docRef.update(updates);
    const updatedDoc = await docRef.get();
    res.json({ data: enrich({ id: updatedDoc.id, ...updatedDoc.data() }) });
  } catch (err) { next(err); }
};

exports.payEmi = async (req, res, next) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('loans').doc(id);
    const result = await db.runTransaction(async (t) => {
      const snap = await t.get(docRef);
      if (!snap.exists || snap.data().user_id !== req.user.id) {
        const err = new Error('Loan not found');
        err.status = 404;
        throw err;
      }
      const loan = snap.data();
      const paidMonths = Number(loan.paid_months || 0) + 1;
      const schedule = amortizationPaid(loan.principal, loan.interest_rate, loan.tenure_months, paidMonths);
      const done = paidMonths >= Number(loan.tenure_months) || schedule.remaining <= 0;
      t.update(docRef, {
        paid_months: paidMonths,
        remaining: schedule.remaining,
        is_active: !done,
        updated_at: new Date(),
      });
      return { ...loan, paid_months: paidMonths, remaining: schedule.remaining, is_active: !done };
    });
    res.json({ data: enrich({ id, ...result }) });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('loans').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    await docRef.delete();
    res.json({ success: true });
  } catch (err) { next(err); }
};

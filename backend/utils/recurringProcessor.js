const db = require('../config/db');
const { toMoney } = require('./money');

function nextRunAfter(current, frequency) {
  const d = new Date(`${current}T00:00:00Z`);
  switch (frequency) {
    case 'daily':   d.setUTCDate(d.getUTCDate() + 1); break;
    case 'weekly':  d.setUTCDate(d.getUTCDate() + 7); break;
    case 'monthly': d.setUTCMonth(d.getUTCMonth() + 1); break;
    case 'yearly':  d.setUTCFullYear(d.getUTCFullYear() + 1); break;
    default:        d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return d.toISOString().split('T')[0];
}

async function processRecurringTransactions() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const snapshot = await db.collection('recurring_transactions')
      .where('is_active', '==', true)
      .get();

    const due = snapshot.docs.filter(doc => {
      const rt = doc.data();
      return rt.next_run && rt.next_run <= today && (!rt.end_date || rt.end_date >= today);
    });

    for (const doc of due) {
      await db.runTransaction(async (t) => {
        const fresh = await t.get(doc.ref);
        if (!fresh.exists) return;
        const rt = fresh.data();
        if (!rt.is_active || !rt.next_run || rt.next_run > today) return;
        if (rt.end_date && rt.end_date < today) return;

        const txRef = db.collection('transactions').doc();
        t.set(txRef, {
          user_id:      rt.user_id,
          account_id:   rt.account_id,
          category_id:  rt.category_id || null,
          type:         rt.type,
          amount:       toMoney(rt.amount),
          title:        rt.title,
          note:         'Generated from recurring',
          date:         rt.next_run,
          is_recurring: true,
          recurring_id: doc.id,
          created_at:   new Date(),
          updated_at:   new Date(),
        });
        t.update(doc.ref, {
          next_run: nextRunAfter(rt.next_run, rt.frequency),
          last_generated: rt.next_run,
          updated_at: new Date(),
        });
      });
    }
  } catch (error) {
    console.error('Error processing recurring transactions:', error.message);
  }
}

module.exports = processRecurringTransactions;

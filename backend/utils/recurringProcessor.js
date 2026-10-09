const db = require('../config/db');

function nextRunAfter(current, frequency) {
  const d = new Date(`${current}T00:00:00Z`);
  switch (frequency) {
    case 'daily':   d.setUTCDate(d.getUTCDate() + 1); break;
    case 'weekly':  d.setUTCDate(d.getUTCDate() + 7); break;
    case 'monthly': d.setUTCMonth(d.getUTCMonth() + 1); break;
    case 'yearly':  d.setUTCFullYear(d.getUTCFullYear() + 1); break;
  }
  return d.toISOString().split('T')[0];
}

async function processRecurringTransactions() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Single-field query; the due/end-date checks run in memory so no composite index is needed.
    const snapshot = await db.collection('recurring_transactions')
      .where('is_active', '==', true)
      .get();

    const due = snapshot.docs.filter(doc => {
      const rt = doc.data();
      return rt.next_run && rt.next_run <= today && (!rt.end_date || rt.end_date >= today);
    });

    for (const doc of due) {
      const rt = doc.data();

      // Create the transaction and advance next_run atomically
      const batch = db.batch();
      batch.set(db.collection('transactions').doc(), {
        user_id:      rt.user_id,
        account_id:   rt.account_id,
        category_id:  rt.category_id || null,
        type:         rt.type,
        amount:       Number(rt.amount),
        title:        rt.title,
        note:         'Generated from recurring',
        date:         rt.next_run,
        is_recurring: true,
        created_at:   new Date(),
        updated_at:   new Date(),
      });
      batch.update(doc.ref, { next_run: nextRunAfter(rt.next_run, rt.frequency), updated_at: new Date() });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
  }
}

module.exports = processRecurringTransactions;

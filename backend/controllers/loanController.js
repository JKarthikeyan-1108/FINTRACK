const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const snapshot = await db.collection('loans').where('user_id', '==', req.user.id).get();
    const rows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    rows.sort((a, b) => {
      const tA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
      const tB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
      return tB - tA;
    });

    // Compute summary and enrich loans
    const enrichedRows = rows.map(loan => {
      const p = Number(loan.principal);
      const r = Number(loan.interest_rate) / 100 / 12;
      const n = Number(loan.tenure_months);
      
      let emi = Number(loan.emi_amount);
      if (!emi && r > 0 && n > 0) {
        emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
      }

      const totalPayable = emi * n;
      const totalInterest = totalPayable - p;
      const paidMonths = Number(loan.paid_months || 0);
      const remainingTenure = n - paidMonths;
      
      let interestPaid = 0;
      let principalPaid = 0;
      let remainingBalance = p;
      
      for (let i = 0; i < paidMonths; i++) {
        let interestForMonth = remainingBalance * r;
        let principalForMonth = emi - interestForMonth;
        interestPaid += interestForMonth;
        principalPaid += principalForMonth;
        remainingBalance -= principalForMonth;
      }
      
      const now = new Date();
      let nextEmiDate = new Date(now.getFullYear(), now.getMonth(), loan.emi_date || 1);
      if (nextEmiDate < now) {
        nextEmiDate.setMonth(nextEmiDate.getMonth() + 1);
      }

      return {
        ...loan,
        emi_amount: emi,
        total_payable: totalPayable,
        total_interest: totalInterest,
        interest_paid: interestPaid,
        principal_paid: principalPaid,
        remaining_tenure: remainingTenure,
        calculated_remaining: remainingBalance > 0 ? remainingBalance : 0,
        next_emi_date: nextEmiDate.toISOString().split('T')[0]
      };
    });

    const total_principal = enrichedRows.reduce((s,l)=>s+Number(l.principal),0);
    const total_remaining = enrichedRows.reduce((s,l)=>s+Number(l.remaining),0);
    const total_emi       = enrichedRows.filter(l=>l.is_active).reduce((s,l)=>s+Number(l.emi_amount),0);
    res.json({ data: enrichedRows, summary: { total_principal, total_remaining, total_emi } });
  } catch(err){ next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const { name, type, principal, remaining, emi_amount, interest_rate, tenure_months, paid_months, emi_date, lender } = req.body;
    
    const newDocRef = await db.collection('loans').add({
      user_id: req.user.id,
      name,
      type: type || 'personal',
      principal: Number(principal),
      remaining: Number(remaining || principal),
      emi_amount: Number(emi_amount || 0),
      interest_rate: Number(interest_rate || 0),
      tenure_months: Number(tenure_months || 0),
      paid_months: Number(paid_months || 0),
      emi_date: Number(emi_date || 1),
      lender: lender || null,
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
    const { remaining, paid_months, is_active } = req.body;
    
    const docRef = db.collection('loans').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    await docRef.update({
      remaining: Number(remaining),
      paid_months: Number(paid_months),
      is_active: is_active,
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
    
    const docRef = db.collection('loans').doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data().user_id !== req.user.id) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    
    await docRef.delete();
    res.json({ success: true });
  } catch(err){ next(err); }
};

/**
 * FinTrack Minimum Cash Flow & Debt Simplification Algorithm
 * Reduces an N-person shared expense graph of O(N^2) debts down to at most N-1 simplified transfers.
 */

function toMoney(num) {
  return Math.round((Number(num) || 0) * 100) / 100;
}

/**
 * Compute equal, exact, or percentage splits among members
 */
function calculateSplits(totalAmount, splitType = 'equal', members = [], customValues = {}) {
  const total = toMoney(totalAmount);
  if (total <= 0 || !members.length) return [];

  if (splitType === 'equal') {
    const n = members.length;
    const baseShare = Math.floor((total / n) * 100) / 100;
    let remainder = Math.round((total - baseShare * n) * 100); // in cents/paise

    return members.map(m => {
      let share = baseShare;
      if (remainder > 0) {
        share = toMoney(share + 0.01);
        remainder -= 1;
      }
      return { memberId: m.id, amount: share, percentage: toMoney((share / total) * 100) };
    });
  }

  if (splitType === 'percentage') {
    return members.map(m => {
      const pct = Number(customValues[m.id] || 0);
      const share = toMoney((total * pct) / 100);
      return { memberId: m.id, amount: share, percentage: pct };
    });
  }

  // Exact split
  return members.map(m => {
    const share = toMoney(customValues[m.id] || 0);
    return { memberId: m.id, amount: share, percentage: total > 0 ? toMoney((share / total) * 100) : 0 };
  });
}

/**
 * Greedily solves Minimum Cash Flow to simplify debts
 */
function simplifyDebts(members = [], expenses = [], settlements = [], currentUserId = 'm1') {
  // 1. Initialize net balances: balance[memberId] = amount
  const balances = {};
  const memberMap = {};

  members.forEach(m => {
    balances[m.id] = 0;
    memberMap[m.id] = m;
  });

  let totalGroupSpend = 0;

  // 2. Accumulate expenses
  expenses.forEach(exp => {
    const amt = toMoney(exp.amount);
    totalGroupSpend += amt;

    // Payer is credited the full amount
    if (balances[exp.paidBy] !== undefined) {
      balances[exp.paidBy] += amt;
    }

    // Split participants are debited their share
    const splits = exp.splits || calculateSplits(amt, exp.splitType || 'equal', members);
    splits.forEach(s => {
      if (balances[s.memberId] !== undefined) {
        balances[s.memberId] -= toMoney(s.amount);
      }
    });
  });

  // 3. Accumulate settlements (direct payments between members)
  settlements.forEach(set => {
    const amt = toMoney(set.amount);
    if (balances[set.fromMemberId] !== undefined) {
      balances[set.fromMemberId] += amt; // paid debt
    }
    if (balances[set.toMemberId] !== undefined) {
      balances[set.toMemberId] -= amt; // received payment
    }
  });

  // Clean rounding discrepancies
  Object.keys(balances).forEach(id => {
    balances[id] = toMoney(balances[id]);
  });

  // 4. Greedy Minimum Cash Flow Algorithm
  // Separate into debtors (net negative) and creditors (net positive)
  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([id, bal]) => {
    if (bal < -0.01) {
      debtors.push({ id, amount: Math.abs(bal) });
    } else if (bal > 0.01) {
      creditors.push({ id, amount: bal });
    }
  });

  // Sort debtors descending by amount owed, creditors descending by amount to receive
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const simplifiedDebts = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settled = Math.min(debtor.amount, creditor.amount);
    const settledMoney = toMoney(settled);

    if (settledMoney > 0.01) {
      simplifiedDebts.push({
        from: debtor.id,
        fromName: memberMap[debtor.id]?.name || debtor.id,
        to: creditor.id,
        toName: memberMap[creditor.id]?.name || creditor.id,
        amount: settledMoney,
      });
    }

    debtor.amount = toMoney(debtor.amount - settled);
    creditor.amount = toMoney(creditor.amount - settled);

    if (debtor.amount <= 0.01) dIdx++;
    if (creditor.amount <= 0.01) cIdx++;
  }

  const myNetBalance = balances[currentUserId] || 0;

  return {
    balances,
    simplifiedDebts,
    totalGroupSpend: toMoney(totalGroupSpend),
    myNetBalance: toMoney(myNetBalance),
  };
}

module.exports = {
  toMoney,
  calculateSplits,
  simplifyDebts,
};

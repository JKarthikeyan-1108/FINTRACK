// controllers/dashboardController.js
const db = require('../config/db');
const { getVisibleCategoryDocs } = require('../utils/firestoreHelpers');

exports.overview = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const uid = req.user.id;
    const now  = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();

    // Fetch accounts
    const accQuery = await db.collection('accounts').where('user_id', '==', uid).get();
    const accountsData = accQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch all transactions (needed for net_worth, trends, etc. - in a real prod app with millions of txs, 
    // you would aggregate this via a Cloud Function, but for this migration we fetch and compute)
    const txQuery = await db.collection('transactions').where('user_id', '==', uid).get();
    const transactionsData = txQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort transactions newest first
    transactionsData.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      const tA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
      const tB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
      return tB - tA;
    });

    // Fetch categories for JOINs on recentTxns
    const catDocs = await getVisibleCategoryDocs(uid);
    const categoriesMap = {};
    catDocs.forEach(d => categoriesMap[d.id] = d.data());

    // Fetch investments
    const invQuery = await db.collection('investments').where('user_id', '==', uid).get();
    const portfolio = invQuery.docs.reduce((sum, doc) => sum + Number(doc.data().current_value || 0), 0);

    // Calculate Accounts & Net Worth
    let accountsTotal = 0;
    const mappedAccounts = accountsData.map(a => {
      const acctTx = transactionsData.filter(t => t.account_id === a.id);
      const txSum = acctTx.reduce((sum, t) => {
        if (t.type === 'income') return sum + Number(t.amount || 0);
        if (t.type === 'expense') return sum - Number(t.amount || 0);
        return sum;
      }, 0);
      
      const current_balance = Number(a.balance || 0) + txSum;
      accountsTotal += current_balance;

      return {
        ...a,
        balance: current_balance,
        opening_balance: Number(a.balance || 0)
      };
    });

    mappedAccounts.sort((a, b) => {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
      const tA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
      const tB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
      return tA - tB;
    });

    const netWorth = accountsTotal;

    // Calculate Monthly Income/Expenses
    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    const paddedMonth = String(month).padStart(2, '0');
    
    transactionsData.forEach(t => {
      if (t.date && t.date.startsWith(`${year}-${paddedMonth}`)) {
        if (t.type === 'income') monthlyIncome += Number(t.amount || 0);
        if (t.type === 'expense') monthlyExpenses += Number(t.amount || 0);
      }
    });

    // Top 8 Recent Transactions
    const recentTxns = transactionsData.slice(0, 8).map(t => ({
      ...t,
      category_name: categoriesMap[t.category_id]?.name || null,
      category_icon: categoriesMap[t.category_id]?.icon || null
    }));

    const savings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? ((savings / monthlyIncome) * 100).toFixed(1) : 0;

    res.json({
      net_worth:    netWorth,
      income:       monthlyIncome,
      expenses:     monthlyExpenses,
      savings:      savings,
      savings_rate: Number(savingsRate),
      portfolio:    portfolio,
      recent_transactions: recentTxns,
      accounts:     mappedAccounts,
    });
  } catch (err) { next(err); }
};

exports.trends = async (req, res, next) => {
  try {
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    const uid = req.user.id;
    
    // Fetch last 6 months of transactions
    const now = new Date();
    now.setMonth(now.getMonth() - 5);
    now.setDate(1); // First day of 6 months ago
    const startStr = now.toISOString().split('T')[0];
    
    const txQuery = await db.collection('transactions')
      .where('user_id', '==', uid)
      .get();
      
    const grouped = {};
    txQuery.docs.filter(doc => doc.data().date >= startStr).forEach(doc => {
      const data = doc.data();
      if (!data.date) return;
      const monthStr = data.date.substring(0, 7); // YYYY-MM
      
      if (!grouped[monthStr]) {
        grouped[monthStr] = { month: monthStr, income: 0, expenses: 0 };
      }
      
      if (data.type === 'income') {
        grouped[monthStr].income += Number(data.amount || 0);
      } else if (data.type === 'expense') {
        grouped[monthStr].expenses += Number(data.amount || 0);
      }
    });

    // Ensure last 6 months exist even if empty
    let iter = new Date();
    for (let i = 0; i < 6; i++) {
      const mStr = iter.toISOString().substring(0, 7);
      if (!grouped[mStr]) {
        grouped[mStr] = { month: mStr, income: 0, expenses: 0 };
      }
      iter.setMonth(iter.getMonth() - 1);
    }

    const rows = Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
    // Limit to exactly the last 6 months if there are extras
    const finalRows = rows.slice(-6);

    res.json({ data: finalRows });
  } catch (err) { next(err); }
};

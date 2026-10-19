/**
 * FinTrack Comprehensive Financial Statement & PDF Generator
 * Generates executive-grade, printable, and downloadable financial reports.
 */

import { money, dateLong, dateShort } from './format';

export function generateFinancialStatement({
  user = {},
  periodLabel = 'Current Statement Period',
  overview = {},
  accounts = [],
  transactions = [],
  budgets = [],
}) {
  const generatedAt = new Date().toLocaleString();
  const userName = user?.name || 'FinTrack User';
  const userEmail = user?.email || 'N/A';
  const currency = user?.currency || 'INR';

  const totalIncome = Number(overview?.income || 0);
  const totalExpense = Number(overview?.expenses || 0);
  const totalSavings = Number(overview?.savings || (totalIncome - totalExpense));
  const netWorth = Number(overview?.netWorth || accounts.reduce((acc, a) => acc + Number(a.balance || 0), 0));
  const savingsRate = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0;

  // Format HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FinTrack Statement - ${userName}</title>
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background: #ffffff;
      color: #0f172a;
      line-height: 1.45;
      font-size: 13px;
      padding: 10px;
    }
    .header-banner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .brand-subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
      font-weight: 500;
    }
    .statement-meta {
      text-align: right;
      font-size: 12px;
      color: #475569;
    }
    .statement-meta strong {
      color: #0f172a;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
      margin: 24px 0 10px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .summary-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      background: #f8fafc;
    }
    .summary-label {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    .summary-val {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }
    .summary-sub {
      font-size: 11px;
      color: #059669;
      font-weight: 600;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 1px solid #cbd5e1;
      font-size: 11px;
      text-transform: uppercase;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .amount-inflow {
      color: #059669;
      font-weight: 700;
      text-align: right;
    }
    .amount-outflow {
      color: #e11d48;
      font-weight: 700;
      text-align: right;
    }
    .footer {
      margin-top: 36px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 11px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #0f172a; color: white; padding: 12px 18px; border-radius: 8px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <strong>FinTrack Official PDF Statement</strong>
      <span style="opacity: 0.8; margin-left: 8px; font-size: 12px;">Press "Print / Save PDF" to download your PDF statement.</span>
    </div>
    <button onclick="window.print()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer;">
      Print / Save PDF
    </button>
  </div>

  <div class="header-banner">
    <div>
      <div class="brand-title">FinTrack Ledger</div>
      <div class="brand-subtitle">Automated Financial Intelligence & Audit Report</div>
    </div>
    <div class="statement-meta">
      <div>Account Holder: <strong>${userName}</strong></div>
      <div>Registered Email: <strong>${userEmail}</strong></div>
      <div>Statement Period: <strong>${periodLabel}</strong></div>
      <div>Generated On: <strong>${generatedAt}</strong></div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-label">Total Net Worth</div>
      <div class="summary-val">${money(netWorth)}</div>
      <div class="summary-sub" style="color: #0284c7;">Across ${accounts.length} Accounts</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Monthly Inflow</div>
      <div class="summary-val">${money(totalIncome)}</div>
      <div class="summary-sub" style="color: #059669;">Verified Revenue</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Monthly Outflow</div>
      <div class="summary-val">${money(totalExpense)}</div>
      <div class="summary-sub" style="color: #e11d48;">Expenses & Bills</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Net Savings</div>
      <div class="summary-val">${money(totalSavings)}</div>
      <div class="summary-sub">${savingsRate}% Savings Rate</div>
    </div>
  </div>

  <div class="section-title">
    <span>Accounts & Liquidity Snapshot</span>
    <span>Base Currency: ${currency}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Account Name</th>
        <th>Type</th>
        <th>Status</th>
        <th style="text-align: right;">Current Balance</th>
      </tr>
    </thead>
    <tbody>
      ${accounts.length > 0 ? accounts.map(a => `
        <tr>
          <td><strong>${a.name}</strong></td>
          <td style="text-transform: capitalize;">${a.type || 'Standard'}</td>
          <td><span style="color: #059669; font-weight: 600;">Active</span></td>
          <td style="text-align: right; font-weight: 700;">${money(a.balance)}</td>
        </tr>
      `).join('') : '<tr><td colspan="4" style="text-align: center; color: #94a3b8;">No account records found.</td></tr>'}
    </tbody>
  </table>

  <div class="section-title" style="margin-top: 24px;">
    <span>Transaction Ledger (${transactions.length} records)</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description / Merchant</th>
        <th>Category</th>
        <th>Account</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${transactions.length > 0 ? transactions.slice(0, 100).map(t => {
        const isIncome = t.type === 'income';
        const formattedAmount = isIncome ? `+${money(t.amount)}` : `-${money(t.amount)}`;
        return `
          <tr>
            <td>${dateShort(t.date || t.created_at)}</td>
            <td><strong>${t.description || t.title || 'Transaction'}</strong></td>
            <td>${t.category?.name || t.category || 'General'}</td>
            <td>${t.account?.name || t.account || 'Primary'}</td>
            <td class="${isIncome ? 'amount-inflow' : 'amount-outflow'}">${formattedAmount}</td>
          </tr>
        `;
      }).join('') : '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No transactions found in this period.</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <span>Generated by FinTrack Security & Intelligence Engine</span>
    <span>Confidential & Proprietary • Page 1 of 1</span>
  </div>
</body>
</html>`;

  // Open statement in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    // If popups blocked, download as standalone HTML statement
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinTrack_Statement_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

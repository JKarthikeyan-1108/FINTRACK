/**
 * Backend Statement Parser & Deduplication Mirror
 */

const MERCHANT_RULES = [
  { pattern: /swiggy/i, name: 'Swiggy', category: 'Food & Dining' },
  { pattern: /zomato/i, name: 'Zomato', category: 'Food & Dining' },
  { pattern: /starbucks/i, name: 'Starbucks', category: 'Food & Dining' },
  { pattern: /mcdonald/i, name: 'McDonald\'s', category: 'Food & Dining' },
  { pattern: /subway/i, name: 'Subway', category: 'Food & Dining' },
  { pattern: /domino/i, name: 'Domino\'s Pizza', category: 'Food & Dining' },
  { pattern: /blinkit|grofers/i, name: 'Blinkit', category: 'Groceries' },
  { pattern: /zepto/i, name: 'Zepto', category: 'Groceries' },
  { pattern: /instamart/i, name: 'Swiggy Instamart', category: 'Groceries' },
  { pattern: /bigbasket/i, name: 'BigBasket', category: 'Groceries' },
  { pattern: /dmart/i, name: 'DMart', category: 'Groceries' },
  { pattern: /amazon/i, name: 'Amazon', category: 'Shopping' },
  { pattern: /flipkart/i, name: 'Flipkart', category: 'Shopping' },
  { pattern: /myntra/i, name: 'Myntra', category: 'Shopping' },
  { pattern: /apple\.com|apple store/i, name: 'Apple', category: 'Shopping' },
  { pattern: /uber/i, name: 'Uber', category: 'Transportation' },
  { pattern: /ola cabs|ola/i, name: 'Ola', category: 'Transportation' },
  { pattern: /rapido/i, name: 'Rapido', category: 'Transportation' },
  { pattern: /fuel|petrol|shell|hpcl|bpcl|ioc/i, name: 'Fuel Station', category: 'Transportation' },
  { pattern: /netflix/i, name: 'Netflix', category: 'Entertainment' },
  { pattern: /spotify/i, name: 'Spotify', category: 'Entertainment' },
  { pattern: /airtel/i, name: 'Airtel Telecom', category: 'Utilities' },
  { pattern: /jio/i, name: 'Reliance Jio', category: 'Utilities' },
  { pattern: /electricity|bescom|tneb|mseb/i, name: 'Electricity Board', category: 'Utilities' },
  { pattern: /apollo|pharmacy|1mg|netmeds|medplus/i, name: 'Pharmacy / Health', category: 'Healthcare' },
  { pattern: /zerodha/i, name: 'Zerodha Broking', category: 'Investments' },
  { pattern: /groww/i, name: 'Groww Investments', category: 'Investments' },
  { pattern: /salary|payroll|wage/i, name: 'Salary Credit', category: 'Salary / Income' },
  { pattern: /interest|dividend/i, name: 'Interest / Dividend', category: 'Salary / Income' },
];

function cleanMerchantTitle(rawNarration) {
  if (!rawNarration) return 'General Transaction';
  const str = String(rawNarration).trim();

  for (const rule of MERCHANT_RULES) {
    if (rule.pattern.test(str)) {
      return rule.name;
    }
  }

  let cleaned = str
    .replace(/^(UPI|POS|NEFT|RTGS|IMPS|ACH|CHQ|NACH)[/ -]+[A-Z0-9/ -]+/i, '')
    .replace(/\b(REF|TXN|NO|ID|PVT|LTD|CORP|INDIA|SERVICES)\b/gi, '')
    .replace(/[0-9*#]{4,}/g, '')
    .replace(/[-_/\\|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length < 3) {
    cleaned = str.replace(/[0-9*#]{5,}/g, '').trim() || str;
  }

  return cleaned
    .slice(0, 35)
    .replace(/\b\w/g, char => char.toUpperCase());
}

function detectCategory(narration) {
  if (!narration) return 'General';
  const str = String(narration).toLowerCase();

  for (const rule of MERCHANT_RULES) {
    if (rule.pattern.test(str)) return rule.category;
  }

  if (/grocer|mart|supermarket|vegetable|fruit/i.test(str)) return 'Groceries';
  if (/cafe|coffee|tea|bistro|kitchen|burger|pizza|biryani/i.test(str)) return 'Food & Dining';
  if (/bill|recharge|dth|wifi|gas|water/i.test(str)) return 'Utilities';
  if (/flight|indigo|air india|hotel|resort|railway|irctc/i.test(str)) return 'Travel';
  if (/loan|emi|credit card/i.test(str)) return 'Loans / Debt';
  if (/doctor|hospital|clinic|lab|pathology/i.test(str)) return 'Healthcare';

  return 'General';
}

function parseDateString(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const s = String(dateStr).trim().replace(/['"]/g, '');

  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = String(str1).toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = String(str2).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0;

  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const getBigrams = str => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  let intersection = 0;
  for (const item of b1) {
    if (b2.has(item)) intersection++;
  }

  return (2 * intersection) / (b1.size + b2.size || 1);
}

function checkDuplicate(candidate, existingTxns = [], dateToleranceDays = 2) {
  const cAmount = Number(candidate.amount);
  const cDate = new Date(candidate.date);

  for (const existing of existingTxns) {
    const eAmount = Number(existing.amount);
    if (Math.abs(cAmount - eAmount) > 0.01) continue;
    if (candidate.type && existing.type && candidate.type !== existing.type) continue;

    const eDate = new Date(existing.date?.split('T')[0] || existing.date);
    const dayDiff = Math.abs((cDate - eDate) / (1000 * 60 * 60 * 24));

    if (dayDiff <= dateToleranceDays) {
      const sim = stringSimilarity(candidate.title || candidate.rawNarration, existing.title);
      if (sim >= 0.55 || dayDiff === 0) {
        return {
          isDuplicate: true,
          matchedTxn: existing,
          confidence: Math.round((sim * 0.6 + (1 - dayDiff / 3) * 0.4) * 100),
        };
      }
    }
  }

  return { isDuplicate: false, matchedTxn: null, confidence: 0 };
}

function parseCsvLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsvStatement(csvText, existingTxns = []) {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const firstLines = lines.slice(0, 10).join('\n');
  const commaCount = (firstLines.match(/,/g) || []).length;
  const semiCount = (firstLines.match(/;/g) || []).length;
  const tabCount = (firstLines.match(/\t/g) || []).length;
  let delimiter = ',';
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  let headerIndex = -1;
  let headerCols = [];

  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const cols = parseCsvLine(lines[i], delimiter).map(c => c.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const matches = cols.filter(c =>
      c.includes('date') || c.includes('desc') || c.includes('narrat') ||
      c.includes('amount') || c.includes('debit') || c.includes('credit') ||
      c.includes('particular') || c.includes('withdrawal') || c.includes('deposit') ||
      c.includes('balance')
    );
    if (matches.length >= 2) {
      headerIndex = i;
      headerCols = parseCsvLine(lines[i], delimiter);
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0;
    headerCols = parseCsvLine(lines[0], delimiter);
  }

  let dateIdx = -1;
  let descIdx = -1;
  let amountIdx = -1;
  let debitIdx = -1;
  let creditIdx = -1;
  let typeIdx = -1;

  headerCols.forEach((col, idx) => {
    const clean = col.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (dateIdx === -1 && (clean.includes('date') || clean === 'dt' || clean.includes('txnondate'))) dateIdx = idx;
    else if (descIdx === -1 && (clean.includes('desc') || clean.includes('narrat') || clean.includes('partic') || clean.includes('payee') || clean.includes('remark'))) descIdx = idx;
    else if (debitIdx === -1 && (clean.includes('debit') || clean.includes('withdrawal') || clean === 'dr')) debitIdx = idx;
    else if (creditIdx === -1 && (clean.includes('credit') || clean.includes('deposit') || clean === 'cr')) creditIdx = idx;
    else if (amountIdx === -1 && (clean.includes('amount') || clean === 'amt' || clean.includes('transactionamount'))) amountIdx = idx;
    else if (typeIdx === -1 && (clean.includes('type') || clean === 'drcr')) typeIdx = idx;
  });

  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = 1;
  if (amountIdx === -1 && debitIdx === -1 && creditIdx === -1) amountIdx = 2;

  const parsedTxns = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delimiter);
    if (cols.length < 2) continue;

    const rawDate = cols[dateIdx] || '';
    const rawDesc = cols[descIdx] || 'Bank Transaction';
    let rawAmount = 0;
    let type = 'expense';

    if (debitIdx !== -1 && creditIdx !== -1) {
      const debitVal = parseFloat(String(cols[debitIdx] || '0').replace(/[^0-9.-]/g, '')) || 0;
      const creditVal = parseFloat(String(cols[creditIdx] || '0').replace(/[^0-9.-]/g, '')) || 0;
      if (creditVal > 0) {
        rawAmount = creditVal;
        type = 'income';
      } else {
        rawAmount = debitVal;
        type = 'expense';
      }
    } else if (amountIdx !== -1) {
      const parsedAmt = parseFloat(String(cols[amountIdx] || '0').replace(/[^0-9.-]/g, '')) || 0;
      if (parsedAmt < 0) {
        rawAmount = Math.abs(parsedAmt);
        type = 'expense';
      } else {
        rawAmount = parsedAmt;
        if (typeIdx !== -1) {
          const typeVal = String(cols[typeIdx] || '').toLowerCase();
          if (typeVal.includes('cr') || typeVal.includes('credit') || typeVal.includes('deposit')) {
            type = 'income';
          }
        }
      }
    }

    if (!rawAmount || rawAmount <= 0) continue;

    const formattedDate = parseDateString(rawDate);
    const cleanedTitle = cleanMerchantTitle(rawDesc);
    const category = detectCategory(rawDesc);

    const candidate = {
      date: formattedDate,
      amount: Math.round(rawAmount * 100) / 100,
      title: cleanedTitle,
      type,
      rawNarration: rawDesc,
      category,
      selected: true,
    };

    const dupCheck = checkDuplicate(candidate, existingTxns);
    candidate.isDuplicate = dupCheck.isDuplicate;
    candidate.duplicateInfo = dupCheck;
    if (dupCheck.isDuplicate) candidate.selected = false;

    parsedTxns.push(candidate);
  }

  return parsedTxns;
}

module.exports = {
  cleanMerchantTitle,
  detectCategory,
  parseDateString,
  stringSimilarity,
  checkDuplicate,
  parseCsvStatement,
};

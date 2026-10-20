/**
 * FinTrack Universal Bank Statement & Transaction Importer Engine
 * Supports: CSV, OFX (Open Financial Exchange), QIF (Quicken Interchange Format)
 * Features: Preamble auto-detection, split debit/credit column handling,
 * merchant string cleanup, auto-categorization, and fuzzy deduplication.
 */

// Common merchant signature rules for auto-cleaning & auto-categorization
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
  { pattern: /prime video|amazon prime/i, name: 'Amazon Prime', category: 'Entertainment' },
  { pattern: /hotstar|disney/i, name: 'Disney+ Hotstar', category: 'Entertainment' },
  { pattern: /bookmyshow|pvr|inox/i, name: 'Cinema Tickets', category: 'Entertainment' },
  { pattern: /airtel/i, name: 'Airtel Telecom', category: 'Utilities' },
  { pattern: /jio/i, name: 'Reliance Jio', category: 'Utilities' },
  { pattern: /electricity|bescom|tneb|mseb/i, name: 'Electricity Board', category: 'Utilities' },
  { pattern: /apollo|pharmacy|1mg|netmeds|medplus/i, name: 'Pharmacy / Health', category: 'Healthcare' },
  { pattern: /zerodha/i, name: 'Zerodha Broking', category: 'Investments' },
  { pattern: /groww/i, name: 'Groww Investments', category: 'Investments' },
  { pattern: /salary|payroll|wage/i, name: 'Salary Credit', category: 'Salary / Income' },
  { pattern: /interest|dividend/i, name: 'Interest / Dividend', category: 'Salary / Income' },
  { pattern: /atm wdl|atm cash/i, name: 'ATM Cash Withdrawal', category: 'Cash' },
];

/**
 * Clean raw bank narration into a readable title
 */
export function cleanMerchantTitle(rawNarration) {
  if (!rawNarration) return 'General Transaction';
  const str = String(rawNarration).trim();

  for (const rule of MERCHANT_RULES) {
    if (rule.pattern.test(str)) {
      return rule.name;
    }
  }

  // Remove common banking prefixes like UPI/CR/1234..., POS 481029..., NEFT-..., RTGS-...
  let cleaned = str
    .replace(/^(UPI|POS|NEFT|RTGS|IMPS|ACH|CHQ|NACH)[/ -]+[A-Z0-9/ -]+/i, '')
    .replace(/\b(REF|TXN|NO|ID|PVT|LTD|CORP|INDIA|SERVICES)\b/gi, '')
    .replace(/[0-9*#]{4,}/g, '') // strip sequences of numbers/asterisks
    .replace(/[-_/\\|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length < 3) {
    cleaned = str.replace(/[0-9*#]{5,}/g, '').trim() || str;
  }

  // Capitalize words
  return cleaned
    .slice(0, 35)
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Predict category from narration or merchant
 */
export function detectCategory(narration) {
  if (!narration) return 'General';
  const str = String(narration).toLowerCase();

  for (const rule of MERCHANT_RULES) {
    if (rule.pattern.test(str)) {
      return rule.category;
    }
  }

  if (/grocer|mart|supermarket|vegetable|fruit/i.test(str)) return 'Groceries';
  if (/cafe|coffee|tea|bistro|kitchen|burger|pizza|biryani/i.test(str)) return 'Food & Dining';
  if (/bill|recharge|dth|wifi|gas|water/i.test(str)) return 'Utilities';
  if (/flight|indigo|air india|hotel|resort|railway|irctc/i.test(str)) return 'Travel';
  if (/loan|emi|credit card/i.test(str)) return 'Loans / Debt';
  if (/doctor|hospital|clinic|lab|pathology/i.test(str)) return 'Healthcare';

  return 'General';
}

/**
 * Standardize various date formats into YYYY-MM-DD
 */
export function parseDateString(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const s = String(dateStr).trim().replace(/['"]/g, '');

  // 1. ISO format: 2026-10-20 or 2026/10/20
  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 3. DD-MMM-YYYY (e.g. 15-Jan-2026 or 15 Oct 2026)
  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const mmmMatch = s.match(/^(\d{1,2})[-/\s]([A-Za-z]{3,9})[-/\s](\d{4})/);
  if (mmmMatch) {
    const d = mmmMatch[1].padStart(2, '0');
    const monStr = mmmMatch[2].slice(0, 3).toLowerCase();
    const m = monthMap[monStr] || '01';
    const y = mmmMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Fallback to JS Date
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Fuzzy similarity score between two strings (0.0 to 1.0)
 */
export function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = String(str1).toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = String(str2).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0;

  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  // Bigram Dice coefficient
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

/**
 * Deduplication detector: checks if candidate transaction exists in current txns
 */
export function checkDuplicate(candidate, existingTxns = [], dateToleranceDays = 2) {
  const cAmount = Number(candidate.amount);
  const cDate = new Date(candidate.date);

  for (const existing of existingTxns) {
    const eAmount = Number(existing.amount);
    if (Math.abs(cAmount - eAmount) > 0.01) continue;

    // Type must match (income vs expense)
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
          reason: `Matches existing txn "${existing.title}" on ${existing.date?.split('T')[0]}`,
        };
      }
    }
  }

  return { isDuplicate: false, matchedTxn: null, confidence: 0 };
}

/**
 * Robust CSV line splitter that respects quoted strings
 */
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

/**
 * Universal CSV Statement Parser
 */
export function parseCsvStatement(csvText, existingTxns = []) {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  // Detect delimiter
  const firstLines = lines.slice(0, 10).join('\n');
  const commaCount = (firstLines.match(/,/g) || []).length;
  const semiCount = (firstLines.match(/;/g) || []).length;
  const tabCount = (firstLines.match(/\t/g) || []).length;
  let delimiter = ',';
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  // Find header row (skip bank statement preambles)
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
    // Treat first row as header if no match
    headerIndex = 0;
    headerCols = parseCsvLine(lines[0], delimiter);
  }

  // Identify column indices
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

  // Fallbacks if columns weren't identified
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

    // Parse amount from debit/credit or single amount col
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
    if (dupCheck.isDuplicate) {
      candidate.selected = false; // Deselect duplicate by default
    }

    parsedTxns.push(candidate);
  }

  return parsedTxns;
}

/**
 * OFX (Open Financial Exchange) Statement Parser
 */
export function parseOfxStatement(ofxText, existingTxns = []) {
  const transactions = [];
  const stmtRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmtRegex.exec(ofxText)) !== null) {
    const block = match[1];
    const getTag = tag => {
      const regex = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i');
      const res = block.match(regex);
      return res ? res[1].trim() : '';
    };

    const trnType = getTag('TRNTYPE').toUpperCase();
    const dtPosted = getTag('DTPOSTED');
    const trnAmt = parseFloat(getTag('TRNAMT') || '0');
    const name = getTag('NAME') || getTag('MEMO') || 'OFX Transaction';
    const memo = getTag('MEMO');

    let date = new Date().toISOString().split('T')[0];
    if (dtPosted && dtPosted.length >= 8) {
      const y = dtPosted.slice(0, 4);
      const m = dtPosted.slice(4, 6);
      const d = dtPosted.slice(6, 8);
      date = `${y}-${m}-${d}`;
    }

    const type = trnAmt > 0 || trnType === 'CREDIT' ? 'income' : 'expense';
    const absAmount = Math.abs(trnAmt);
    if (!absAmount) continue;

    const fullNarration = memo ? `${name} - ${memo}` : name;
    const cleanedTitle = cleanMerchantTitle(fullNarration);
    const category = detectCategory(fullNarration);

    const candidate = {
      date,
      amount: Math.round(absAmount * 100) / 100,
      title: cleanedTitle,
      type,
      rawNarration: fullNarration,
      category,
      selected: true,
    };

    const dupCheck = checkDuplicate(candidate, existingTxns);
    candidate.isDuplicate = dupCheck.isDuplicate;
    candidate.duplicateInfo = dupCheck;
    if (dupCheck.isDuplicate) candidate.selected = false;

    transactions.push(candidate);
  }

  return transactions;
}

/**
 * QIF (Quicken Interchange Format) Statement Parser
 */
export function parseQifStatement(qifText, existingTxns = []) {
  const transactions = [];
  const records = qifText.split('^');

  for (const record of records) {
    const lines = record.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    let date = '';
    let amount = 0;
    let payee = '';
    let memo = '';
    let category = '';

    for (const line of lines) {
      const code = line[0];
      const val = line.slice(1).trim();

      if (code === 'D') date = parseDateString(val);
      else if (code === 'T') amount = parseFloat(val.replace(/,/g, '')) || 0;
      else if (code === 'P') payee = val;
      else if (code === 'M') memo = val;
      else if (code === 'L') category = val;
    }

    if (!amount) continue;

    const type = amount > 0 ? 'income' : 'expense';
    const absAmount = Math.abs(amount);
    const fullNarration = memo ? `${payee} ${memo}` : payee || 'QIF Transaction';
    const cleanedTitle = cleanMerchantTitle(fullNarration);
    const assignedCategory = category || detectCategory(fullNarration);

    const candidate = {
      date: date || new Date().toISOString().split('T')[0],
      amount: Math.round(absAmount * 100) / 100,
      title: cleanedTitle,
      type,
      rawNarration: fullNarration,
      category: assignedCategory,
      selected: true,
    };

    const dupCheck = checkDuplicate(candidate, existingTxns);
    candidate.isDuplicate = dupCheck.isDuplicate;
    candidate.duplicateInfo = dupCheck;
    if (dupCheck.isDuplicate) candidate.selected = false;

    transactions.push(candidate);
  }

  return transactions;
}

/**
 * Master parser dispatch: detects file type and parses accordingly
 */
export function parseBankStatement(fileContent, fileName = '', existingTxns = []) {
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith('.ofx') || fileContent.includes('<OFX>') || fileContent.includes('<STMTTRN>')) {
    return parseOfxStatement(fileContent, existingTxns);
  }

  if (lowerName.endsWith('.qif') || fileContent.startsWith('!Type:')) {
    return parseQifStatement(fileContent, existingTxns);
  }

  // Default to CSV
  return parseCsvStatement(fileContent, existingTxns);
}

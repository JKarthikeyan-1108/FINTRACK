/**
 * FinTrack Offline-First Synchronization Engine
 * Manages an IndexedDB offline queue for transactions and ledger edits
 * created without network connectivity, automatically syncing when online.
 */

const DB_NAME = 'fintrack_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_transactions';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'offline_id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a transaction to the offline IndexedDB queue
 */
export async function queueOfflineTransaction(transaction) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record = {
      ...transaction,
      offline_id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      queued_at: new Date().toISOString(),
    };

    await new Promise((resolve, reject) => {
      const req = store.put(record);
      req.onsuccess = resolve;
      req.onerror = reject;
    });

    return record;
  } catch (err) {
    // Fallback to localStorage
    const existing = JSON.parse(localStorage.getItem('fintrack_offline_txs') || '[]');
    const record = {
      ...transaction,
      offline_id: `offline_${Date.now()}`,
      queued_at: new Date().toISOString(),
    };
    existing.push(record);
    localStorage.setItem('fintrack_offline_txs', JSON.stringify(existing));
    return record;
  }
}

/**
 * Retrieves all pending offline transactions
 */
export async function getPendingOfflineTransactions() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return JSON.parse(localStorage.getItem('fintrack_offline_txs') || '[]');
  }
}

/**
 * Deletes a synced transaction from the offline queue
 */
export async function removeOfflineTransaction(offlineId) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    await new Promise((resolve) => {
      const req = store.delete(offlineId);
      req.onsuccess = resolve;
      req.onerror = resolve;
    });
  } catch {
    const existing = JSON.parse(localStorage.getItem('fintrack_offline_txs') || '[]');
    const filtered = existing.filter(t => t.offline_id !== offlineId);
    localStorage.setItem('fintrack_offline_txs', JSON.stringify(filtered));
  }
}

/**
 * Flushes all pending transactions to the backend
 */
export async function flushOfflineQueue(apiSyncFn) {
  const pending = await getPendingOfflineTransactions();
  if (!pending || pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const { offline_id, queued_at, ...payload } = item;
      await apiSyncFn(payload);
      await removeOfflineTransaction(offline_id);
      synced++;
    } catch (err) {
      failed++;
    }
  }

  return { synced, failed };
}

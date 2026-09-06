import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Bill } from '../../types';

interface SplitBillDB extends DBSchema {
  bills: {
    key: string;
    value: Bill;
    indexes: {
      'by-created': number;
      'by-updated': number;
      'by-permanent': number;
    };
  };
}

const DB_NAME = 'splitbill_local_db';
const DB_VERSION = 1;
const EXPIRY_DAYS = 7;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

let dbPromise: Promise<IDBPDatabase<SplitBillDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SplitBillDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SplitBillDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('bills')) {
          const store = db.createObjectStore('bills', { keyPath: 'id' });
          store.createIndex('by-created', 'createdAt');
          store.createIndex('by-updated', 'updatedAt');
          store.createIndex('by-permanent', 'isPermanent');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Automatically prunes temporary bills that are older than 7 days.
 * Permanently saved bills are never automatically deleted.
 */
export async function cleanExpiredBills(): Promise<number> {
  try {
    const db = await getDB();
    const now = Date.now();
    const allBills = await db.getAll('bills');
    let deletedCount = 0;

    for (const bill of allBills) {
      if (!bill.isPermanent && now - bill.createdAt > EXPIRY_MS) {
        await db.delete('bills', bill.id);
        deletedCount++;
      }
    }
    return deletedCount;
  } catch (err) {
    console.warn('Auto-clean expired bills failed:', err);
    return 0;
  }
}

/**
 * Save or update a bill in IndexedDB.
 */
export async function saveBill(bill: Bill): Promise<void> {
  const db = await getDB();
  const updatedBill: Bill = {
    ...bill,
    updatedAt: Date.now(),
  };
  await db.put('bills', updatedBill);
}

/**
 * Retrieve a bill by ID.
 */
export async function getBill(id: string): Promise<Bill | undefined> {
  const db = await getDB();
  return db.get('bills', id);
}

/**
 * List all saved bills, sorted from newest to oldest.
 */
export async function listRecentBills(): Promise<Bill[]> {
  await cleanExpiredBills();
  const db = await getDB();
  const bills = await db.getAllFromIndex('bills', 'by-updated');
  return bills.reverse();
}

/**
 * Delete a bill by ID.
 */
export async function deleteBill(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bills', id);
}

/**
 * Toggle whether a bill is permanently pinned.
 */
export async function toggleKeepPermanently(id: string): Promise<boolean> {
  const db = await getDB();
  const bill = await db.get('bills', id);
  if (!bill) return false;

  bill.isPermanent = !bill.isPermanent;
  bill.updatedAt = Date.now();
  await db.put('bills', bill);
  return !!bill.isPermanent;
}

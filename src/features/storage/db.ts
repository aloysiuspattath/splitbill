import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Bill, Group } from '../../types';

interface SplitBillDB extends DBSchema {
  bills: {
    key: string;
    value: Bill;
    indexes: {
      'by-created': number;
      'by-updated': number;
      'by-permanent': number;
      'by-group': string;
    };
  };
  groups: {
    key: string;
    value: Group;
    indexes: {
      'by-updated': number;
    };
  };
}

const DB_NAME = 'splitbill_local_db';
const DB_VERSION = 2;
const EXPIRY_DAYS = 7;
const EXPIRY_MS = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

let dbPromise: Promise<IDBPDatabase<SplitBillDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<SplitBillDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SplitBillDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _, tx) {
        if (oldVersion < 1 || !db.objectStoreNames.contains('bills')) {
          const store = db.createObjectStore('bills', { keyPath: 'id' });
          store.createIndex('by-created', 'createdAt');
          store.createIndex('by-updated', 'updatedAt');
          store.createIndex('by-permanent', 'isPermanent');
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('groups')) {
            const groupStore = db.createObjectStore('groups', { keyPath: 'id' });
            groupStore.createIndex('by-updated', 'updatedAt');
          }
          // Add by-group index to existing bills store if not exists
          const billStore = tx.objectStore('bills');
          if (!billStore.indexNames.contains('by-group')) {
            billStore.createIndex('by-group', 'groupId');
          }
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

/**
 * Retrieve all bills for a specific group.
 */
export async function getGroupBills(groupId: string): Promise<Bill[]> {
  const db = await getDB();
  const bills = await db.getAllFromIndex('bills', 'by-group', groupId);
  // Sort descending by updated
  return bills.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Save or update a group.
 */
export async function saveGroup(group: Group): Promise<void> {
  const db = await getDB();
  const updatedGroup: Group = {
    ...group,
    updatedAt: Date.now(),
  };
  await db.put('groups', updatedGroup);
}

/**
 * Get a group by ID.
 */
export async function getGroup(id: string): Promise<Group | undefined> {
  const db = await getDB();
  return db.get('groups', id);
}

/**
 * List all groups, sorted by recently updated.
 */
export async function listGroups(): Promise<Group[]> {
  const db = await getDB();
  const groups = await db.getAllFromIndex('groups', 'by-updated');
  return groups.reverse();
}

/**
 * Delete a group and all its bills.
 */
export async function deleteGroup(id: string): Promise<void> {
  const db = await getDB();
  
  // Delete all bills in this group
  const bills = await db.getAllFromIndex('bills', 'by-group', id);
  const tx = db.transaction(['groups', 'bills'], 'readwrite');
  await tx.objectStore('groups').delete(id);
  const billStore = tx.objectStore('bills');
  for (const bill of bills) {
    await billStore.delete(bill.id);
  }
  await tx.done;
}

/**
 * Completely clears all local data from IndexedDB and storage.
 */
export async function clearAllLocalData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['groups', 'bills'], 'readwrite');
  await tx.objectStore('groups').clear();
  await tx.objectStore('bills').clear();
  await tx.done;

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (err) {
    console.warn('Storage clear error:', err);
  }
}


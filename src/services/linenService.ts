import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  runTransaction 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { LinenItem, LinenTransaction, LinenStatusLevel, TransactionType } from '../types/linen';

const ITEMS_COLLECTION = 'linen_items';
const TRANSACTIONS_COLLECTION = 'linen_transactions';

export const getLinenStatusLevel = (
  clean: number,
  minStock: number,
  criticalStock: number
): LinenStatusLevel => {
  if (clean <= criticalStock) return 'CRITICAL';
  if (clean < minStock) return 'WARNING';
  return 'SAFE';
};

/**
 * Seed initial data for IGD if collection is empty or items don't exist.
 * Default:
 * - Selimut: 39 pcs (Clean: 39, Min: 10, Kritis: 5)
 * - Perlak: 10 pcs (Clean: 10, Min: 3, Kritis: 2)
 */
export const seedInitialIgdLinen = async (unitId: string = 'igd') => {
  try {
    const q = query(collection(db, ITEMS_COLLECTION), where('unitId', '==', unitId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const defaultItems: Omit<LinenItem, 'updatedAt'>[] = [
        {
          id: `${unitId}_selimut`,
          unitId,
          name: 'Selimut',
          unitLabel: 'pcs',
          icon: 'bed',
          totalOwned: 39,
          minStock: 10,
          criticalStock: 5,
          clean: 39,
          used: 0,
          dirty: 0,
          laundry: 0
        },
        {
          id: `${unitId}_perlak`,
          unitId,
          name: 'Perlak',
          unitLabel: 'pcs',
          icon: 'layer',
          totalOwned: 10,
          minStock: 3,
          criticalStock: 2,
          clean: 10,
          used: 0,
          dirty: 0,
          laundry: 0
        }
      ];

      for (const item of defaultItems) {
        await setDoc(doc(db, ITEMS_COLLECTION, item.id), {
          ...item,
          updatedAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error seeding initial linen items:', error);
  }
};

/**
 * Subscribe to real-time linen items by unit
 */
export const subscribeLinenItems = (
  unitId: string,
  onUpdate: (items: LinenItem[]) => void
) => {
  const q = query(
    collection(db, ITEMS_COLLECTION),
    where('unitId', '==', unitId)
  );

  return onSnapshot(q, (snapshot) => {
    const items: LinenItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as LinenItem);
    });
    // Sort so Selimut comes first, then Perlak
    items.sort((a, b) => a.name.localeCompare(b.name));
    onUpdate(items);
  }, (err) => {
    console.error('Error subscribing to linen items:', err);
  });
};

/**
 * Execute atomic state transition in circulation:
 * - TAKE: Clean -> Used
 * - TO_DIRTY: Used -> Dirty
 * - LAUNDRY_PICKUP: Dirty -> Laundry
 * - LAUNDRY_RETURN: Laundry -> Clean
 * - DIRECT_DIRTY: Clean -> Dirty
 */
export const executeLinenTransition = async (params: {
  itemId: string;
  type: TransactionType;
  quantity: number;
  actor: string;
  actorName?: string;
  notes?: string;
}) => {
  const { itemId, type, quantity, actor, actorName, notes } = params;
  if (quantity <= 0) throw new Error('Jumlah harus lebih dari 0');

  const itemRef = doc(db, ITEMS_COLLECTION, itemId);
  const txRef = doc(collection(db, TRANSACTIONS_COLLECTION));

  return await runTransaction(db, async (transaction) => {
    const itemDoc = await transaction.get(itemRef);
    if (!itemDoc.exists()) {
      throw new Error('Data linen tidak ditemukan');
    }

    const current = itemDoc.data() as LinenItem;
    let clean = current.clean || 0;
    let used = current.used || 0;
    let dirty = current.dirty || 0;
    let laundry = current.laundry || 0;

    let sourceStatus: 'clean' | 'used' | 'dirty' | 'laundry' = 'clean';
    let targetStatus: 'clean' | 'used' | 'dirty' | 'laundry' = 'used';

    switch (type) {
      case 'TAKE':
        sourceStatus = 'clean';
        targetStatus = 'used';
        if (clean < quantity) {
          throw new Error(`Stok bersih tidak mencukupi (Tersisa: ${clean}, Diminta: ${quantity})`);
        }
        clean -= quantity;
        used += quantity;
        break;

      case 'TO_DIRTY':
        sourceStatus = 'used';
        targetStatus = 'dirty';
        // If used is less than requested, allow transition but cap used at 0 and add to dirty
        used = Math.max(0, used - quantity);
        dirty += quantity;
        break;

      case 'LAUNDRY_PICKUP':
        sourceStatus = 'dirty';
        targetStatus = 'laundry';
        if (dirty < quantity) {
          throw new Error(`Jumlah linen kotor tidak mencukupi (Tercatat kotor: ${dirty}, Diambil: ${quantity})`);
        }
        dirty -= quantity;
        laundry += quantity;
        break;

      case 'LAUNDRY_RETURN':
        sourceStatus = 'laundry';
        targetStatus = 'clean';
        laundry = Math.max(0, laundry - quantity);
        clean += quantity;
        break;

      case 'DIRECT_DIRTY':
        sourceStatus = 'clean';
        targetStatus = 'dirty';
        if (clean < quantity) {
          throw new Error(`Stok bersih tidak mencukupi (Tersisa: ${clean})`);
        }
        clean -= quantity;
        dirty += quantity;
        break;

      default:
        throw new Error('Tipe transaksi tidak valid');
    }

    // Update item document
    transaction.update(itemRef, {
      clean,
      used,
      dirty,
      laundry,
      updatedAt: serverTimestamp()
    });

    // Record audit log transaction
    const logData: LinenTransaction = {
      id: txRef.id,
      unitId: current.unitId,
      itemId: current.id,
      itemName: current.name,
      type,
      quantity,
      sourceStatus,
      targetStatus,
      actor,
      actorName: actorName || '',
      notes: notes || '',
      timestamp: serverTimestamp()
    };

    transaction.set(txRef, logData);

    return { clean, used, dirty, laundry };
  });
};

/**
 * Update master specifications (Total Owned, Min, Critical) for an item
 */
export const updateLinenMaster = async (itemId: string, updates: {
  totalOwned?: number;
  minStock?: number;
  criticalStock?: number;
  name?: string;
  notes?: string;
  actor?: string;
}) => {
  const itemRef = doc(db, ITEMS_COLLECTION, itemId);
  const txRef = doc(collection(db, TRANSACTIONS_COLLECTION));

  return await runTransaction(db, async (transaction) => {
    const itemDoc = await transaction.get(itemRef);
    if (!itemDoc.exists()) {
      throw new Error('Item tidak ditemukan');
    }

    const current = itemDoc.data() as LinenItem;
    const oldTotal = current.totalOwned;
    const newTotal = updates.totalOwned !== undefined ? updates.totalOwned : oldTotal;

    // If total owned increases/decreases, adjust clean stock proportionally
    let newClean = current.clean;
    if (updates.totalOwned !== undefined && updates.totalOwned !== oldTotal) {
      const diff = updates.totalOwned - oldTotal;
      newClean = Math.max(0, newClean + diff);
    }

    const payload: Partial<LinenItem> = {
      ...updates,
      clean: newClean,
      updatedAt: serverTimestamp()
    };

    transaction.update(itemRef, payload);

    // Record master adjustment in log
    const logData: LinenTransaction = {
      id: txRef.id,
      unitId: current.unitId,
      itemId: current.id,
      itemName: current.name,
      type: 'ADJUST_STOCK',
      quantity: Math.abs((updates.totalOwned || oldTotal) - oldTotal),
      sourceStatus: 'system',
      targetStatus: 'clean',
      actor: updates.actor || 'Koordinator IGD',
      notes: updates.notes || `Penyesuaian master: Total ${oldTotal} -> ${newTotal}`,
      timestamp: serverTimestamp()
    };

    transaction.set(txRef, logData);
  });
};

/**
 * Subscribe to recent transactions for a unit
 */
export const subscribeRecentTransactions = (
  unitId: string,
  onUpdate: (txs: LinenTransaction[]) => void,
  limitCount: number = 25
) => {
  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('unitId', '==', unitId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const txs: LinenTransaction[] = [];
    snapshot.forEach((docSnap) => {
      txs.push({ ...docSnap.data(), id: docSnap.id } as LinenTransaction);
    });
    onUpdate(txs);
  }, (err) => {
    console.error('Error fetching transactions:', err);
  });
};

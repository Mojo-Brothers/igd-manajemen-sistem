import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
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
    let inTransitDirty = current.inTransitDirty || 0;
    let laundry = current.laundry || 0;
    let inTransitClean = current.inTransitClean || 0;

    let sourceStatus: LinenTransaction['sourceStatus'] = 'clean';
    let targetStatus: LinenTransaction['targetStatus'] = 'used';

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
        used = Math.max(0, used - quantity);
        dirty += quantity;
        break;

      case 'IGD_DISPATCH_DIRTY':
        // IGD Serah Kotor: dirty -> inTransitDirty (Sedang Dikirim ke Laundry)
        sourceStatus = 'dirty';
        targetStatus = 'inTransitDirty';
        {
          const fromDirty = Math.min(dirty, quantity);
          const remainingNeeded = quantity - fromDirty;
          if (clean < remainingNeeded) {
            throw new Error(`Stok linen di IGD tidak mencukupi (Tersedia kotor: ${dirty}, bersih: ${clean}, diserahkan: ${quantity})`);
          }
          dirty -= fromDirty;
          clean -= remainingNeeded;
          inTransitDirty += quantity;
        }
        break;

      case 'LAUNDRY_RECEIVE_DIRTY':
        // Laundry Terima Kotor: inTransitDirty (atau dirty fallback) -> laundry (Sedang Dikerjakan)
        sourceStatus = 'inTransitDirty';
        targetStatus = 'laundry';
        {
          const fromTransit = Math.min(inTransitDirty, quantity);
          const remaining = quantity - fromTransit;
          const fromDirty = Math.min(dirty, remaining);
          const stillRemaining = remaining - fromDirty;
          if (clean < stillRemaining) {
            throw new Error(`Stok linen kotor tidak mencukupi untuk diterima laundry`);
          }
          inTransitDirty -= fromTransit;
          dirty -= fromDirty;
          clean -= stillRemaining;
          laundry += quantity;
        }
        break;

      case 'LAUNDRY_DISPATCH_CLEAN':
        // Laundry Kirim Bersih: laundry (Sedang Dikerjakan) -> inTransitClean (Sedang Dikirim ke IGD)
        sourceStatus = 'laundry';
        targetStatus = 'inTransitClean';
        if (laundry < quantity) {
          throw new Error(`Jumlah linen di laundry tidak mencukupi untuk dikirim (Tersedia: ${laundry}, Diminta: ${quantity})`);
        }
        laundry -= quantity;
        inTransitClean += quantity;
        break;

      case 'IGD_RECEIVE_CLEAN':
        // IGD Terima Bersih: inTransitClean (atau laundry fallback) -> clean (Kembali ke Lemari)
        sourceStatus = 'inTransitClean';
        targetStatus = 'clean';
        {
          const fromTransit = Math.min(inTransitClean, quantity);
          const remaining = quantity - fromTransit;
          const fromLaundry = Math.min(laundry, remaining);
          inTransitClean -= fromTransit;
          laundry -= fromLaundry;
          clean += quantity;
        }
        break;

      case 'LAUNDRY_PICKUP':
        // Legacy alias / direct:
        if (actor?.includes('Perawat') || actor?.includes('IGD')) {
          sourceStatus = 'dirty';
          targetStatus = 'inTransitDirty';
          const fromDirty = Math.min(dirty, quantity);
          const remainingNeeded = quantity - fromDirty;
          if (clean < remainingNeeded) {
            throw new Error(`Stok linen di IGD tidak mencukupi (Tersedia kotor: ${dirty}, bersih: ${clean}, diserahkan: ${quantity})`);
          }
          dirty -= fromDirty;
          clean -= remainingNeeded;
          inTransitDirty += quantity;
        } else {
          sourceStatus = 'inTransitDirty';
          targetStatus = 'laundry';
          const fromTransit = Math.min(inTransitDirty, quantity);
          const remaining = quantity - fromTransit;
          const fromDirty = Math.min(dirty, remaining);
          const stillRemaining = remaining - fromDirty;
          if (clean < stillRemaining) {
            throw new Error(`Stok linen kotor tidak mencukupi untuk diterima laundry`);
          }
          inTransitDirty -= fromTransit;
          dirty -= fromDirty;
          clean -= stillRemaining;
          laundry += quantity;
        }
        break;

      case 'LAUNDRY_RETURN':
        // Legacy alias / direct:
        if (actor?.includes('Laundry')) {
          sourceStatus = 'laundry';
          targetStatus = 'inTransitClean';
          const fromLaundry = Math.min(laundry, quantity);
          laundry -= fromLaundry;
          inTransitClean += quantity;
        } else {
          sourceStatus = 'inTransitClean';
          targetStatus = 'clean';
          const fromTransit = Math.min(inTransitClean, quantity);
          const fromLaundry = Math.min(laundry, quantity - fromTransit);
          inTransitClean -= fromTransit;
          laundry -= fromLaundry;
          clean += quantity;
        }
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
      inTransitDirty,
      laundry,
      inTransitClean,
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
 * Directly adjust clean stock in closet (Koreksi stok fisik lemari / Stock Opname)
 */
export const adjustCleanStock = async (params: {
  itemId: string;
  newClean: number;
  actor?: string;
  notes?: string;
}) => {
  const { itemId, newClean, actor, notes } = params;
  if (newClean < 0) throw new Error('Stok bersih tidak boleh kurang dari 0');

  const itemRef = doc(db, ITEMS_COLLECTION, itemId);
  const txRef = doc(collection(db, TRANSACTIONS_COLLECTION));

  return await runTransaction(db, async (transaction) => {
    const itemDoc = await transaction.get(itemRef);
    if (!itemDoc.exists()) throw new Error('Data linen tidak ditemukan');

    const current = itemDoc.data() as LinenItem;
    const oldClean = current.clean || 0;
    const diff = newClean - oldClean;

    // Update total owned if clean increases/decreases so total matches circulation
    const newTotalOwned = Math.max(
      newClean + (current.used || 0) + (current.dirty || 0) + (current.inTransitDirty || 0) + (current.laundry || 0) + (current.inTransitClean || 0),
      current.totalOwned + diff
    );

    transaction.update(itemRef, {
      clean: newClean,
      totalOwned: newTotalOwned,
      updatedAt: serverTimestamp()
    });

    const logData: LinenTransaction = {
      id: txRef.id,
      unitId: current.unitId,
      itemId: current.id,
      itemName: current.name,
      type: 'ADJUST_STOCK',
      quantity: Math.abs(diff),
      sourceStatus: diff >= 0 ? 'system' : 'clean',
      targetStatus: diff >= 0 ? 'clean' : 'system',
      actor: actor || 'Perawat IGD',
      notes: notes || `Koreksi stok bersih lemari: ${oldClean} -> ${newClean} (${diff >= 0 ? '+' : ''}${diff})`,
      timestamp: serverTimestamp()
    };

    transaction.set(txRef, logData);
    return { oldClean, newClean, diff };
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
  resetToClean?: boolean;
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

    // If resetToClean is true (Pemutihan / Selaraskan ke 100% Lemari Bersih)
    let newClean = current.clean;
    let newUsed = current.used || 0;
    let newDirty = current.dirty || 0;
    let newLaundry = current.laundry || 0;

    if (updates.resetToClean) {
      newClean = newTotal;
      newUsed = 0;
      newDirty = 0;
      newLaundry = 0;
    } else if (updates.totalOwned !== undefined && updates.totalOwned !== oldTotal) {
      const diff = updates.totalOwned - oldTotal;
      newClean = Math.max(0, newClean + diff);
    }

    const payload: Partial<LinenItem> = {
      ...updates,
      clean: newClean,
      used: newUsed,
      dirty: newDirty,
      inTransitDirty: updates.resetToClean ? 0 : (current.inTransitDirty || 0),
      laundry: newLaundry,
      inTransitClean: updates.resetToClean ? 0 : (current.inTransitClean || 0),
      totalOwned: newTotal,
      updatedAt: serverTimestamp()
    };

    delete (payload as any).resetToClean;

    transaction.update(itemRef, payload);

    // Record master adjustment in log
    const logData: LinenTransaction = {
      id: txRef.id,
      unitId: current.unitId,
      itemId: current.id,
      itemName: current.name,
      type: 'ADJUST_STOCK',
      quantity: updates.resetToClean ? newTotal : Math.abs(newTotal - oldTotal),
      sourceStatus: 'system',
      targetStatus: 'clean',
      actor: updates.actor || 'Administrator IGD',
      notes: updates.resetToClean 
        ? `Pemutihan Master: Selaraskan seluruh kepemilikan (${newTotal} pcs) ke lemari bersih` 
        : (updates.notes || `Penyesuaian master: Total ${oldTotal} -> ${newTotal}`),
      timestamp: serverTimestamp()
    };

    transaction.set(txRef, logData);
  });
};

/**
 * Subscribe to recent transactions for a unit
 * Queries collection directly to avoid Firebase composite index errors (where + orderBy)
 * and sorts/filters client-side reliably.
 */
export const subscribeRecentTransactions = (
  unitId: string,
  onUpdate: (txs: LinenTransaction[]) => void,
  limitCount: number = 300
) => {
  const normalizedUnit = (unitId || 'igd').toLowerCase();
  const colRef = collection(db, TRANSACTIONS_COLLECTION);

  return onSnapshot(colRef, (snapshot) => {
    const txs: LinenTransaction[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as LinenTransaction;
      const txUnit = (data.unitId || '').toLowerCase();
      // Match unit or accept all if unit matches IGD/Laundry
      if (!txUnit || txUnit === normalizedUnit || normalizedUnit === 'all' || txUnit.includes(normalizedUnit) || normalizedUnit.includes(txUnit)) {
        txs.push({ ...data, id: docSnap.id });
      }
    });

    // Client-side sort by timestamp descending safely
    txs.sort((a, b) => {
      const getMillis = (ts: any) => {
        if (!ts) return Date.now();
        if (typeof ts === 'number') return ts;
        if (ts.toMillis) return ts.toMillis();
        if (ts.toDate) return ts.toDate().getTime();
        if (ts.seconds) return ts.seconds * 1000 + (ts.nanoseconds ? ts.nanoseconds / 1000000 : 0);
        const parsed = new Date(ts).getTime();
        return isNaN(parsed) ? Date.now() : parsed;
      };
      return getMillis(b.timestamp) - getMillis(a.timestamp);
    });

    onUpdate(txs.slice(0, limitCount));
  }, (err) => {
    console.error('Error fetching transactions:', err);
  });
};

/**
 * Mengambil seluruh data transaksi mutasi pada rentang waktu tertentu untuk pembuatan laporan (Harian / Bulanan)
 */
export const fetchLinenTransactionsByRange = async (
  unitId: string = 'igd',
  startDate?: Date,
  endDate?: Date
): Promise<LinenTransaction[]> => {
  try {
    const colRef = collection(db, TRANSACTIONS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const allTxs: LinenTransaction[] = [];
    const normalizedUnit = (unitId || 'igd').toLowerCase();
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as LinenTransaction;
      const txUnit = (data.unitId || '').toLowerCase();
      if (!txUnit || txUnit === normalizedUnit || normalizedUnit === 'all' || txUnit.includes(normalizedUnit)) {
        allTxs.push({ ...data, id: docSnap.id });
      }
    });

    // Sort descending
    allTxs.sort((a, b) => {
      const getMillis = (ts: any) => {
        if (!ts) return Date.now();
        if (typeof ts === 'number') return ts;
        if (ts.toMillis) return ts.toMillis();
        if (ts.toDate) return ts.toDate().getTime();
        if (ts.seconds) return ts.seconds * 1000;
        const parsed = new Date(ts).getTime();
        return isNaN(parsed) ? Date.now() : parsed;
      };
      return getMillis(b.timestamp) - getMillis(a.timestamp);
    });

    if (!startDate && !endDate) {
      return allTxs;
    }

    return allTxs.filter((tx) => {
      if (!tx.timestamp) return true;
      const txDate = tx.timestamp.toDate ? tx.timestamp.toDate() : new Date(tx.timestamp);
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;
      return true;
    });
  } catch (error) {
    console.error('Error fetching transactions by range:', error);
    return [];
  }
};


/**
 * Pemutihan / Penyelarasan Total Kepemilikan ke 100% Lemari Bersih
 * Mereset dirty = 0, used = 0, laundry = 0, dan clean = totalOwned
 */
export const reconcileAndWhitewashStock = async (
  unitId: string = 'igd',
  actor: string = 'Administrator IGD (Pemutihan)',
  notes: string = 'Pemutihan / Penyelarasan stok 100% lemari bersih'
) => {
  const q = query(collection(db, ITEMS_COLLECTION), where('unitId', '==', unitId));
  const snapshot = await getDocs(q);

  for (const itemDoc of snapshot.docs) {
    const item = itemDoc.data() as LinenItem;
    const total = item.totalOwned || (item.clean + (item.dirty || 0) + (item.used || 0) + (item.inTransitDirty || 0) + (item.laundry || 0) + (item.inTransitClean || 0));

    const itemRef = doc(db, ITEMS_COLLECTION, itemDoc.id);
    const txRef = doc(collection(db, TRANSACTIONS_COLLECTION));

    await runTransaction(db, async (transaction) => {
      transaction.update(itemRef, {
        clean: total,
        used: 0,
        dirty: 0,
        inTransitDirty: 0,
        laundry: 0,
        inTransitClean: 0,
        totalOwned: total,
        updatedAt: serverTimestamp()
      });

      const logData: LinenTransaction = {
        id: txRef.id,
        unitId,
        itemId: item.id,
        itemName: item.name,
        type: 'ADJUST_STOCK',
        quantity: total,
        sourceStatus: 'system',
        targetStatus: 'clean',
        actor,
        notes: `${notes}: ${total} ${item.unitLabel || 'pcs'} ${item.name}`,
        timestamp: serverTimestamp()
      };

      transaction.set(txRef, logData);
    });
  }
};


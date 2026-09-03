import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  orderBy, 
  limit, 
  where, 
  runTransaction, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  LinenStock, 
  LinenTransaction, 
  LinenSettings, 
  LinenItemType, 
  UserRole,
  LinenStockSnapshot
} from '../types/linen';
import { 
  DEFAULT_LINEN_SETTINGS, 
  getJakartaDateInfo, 
  getCurrentShift, 
  evaluateLinenStatus 
} from '../utils/linenUtils';

const COLLECTION_STOCK = 'linenStock';
const COLLECTION_TRANSACTIONS = 'linenTransactions';
const COLLECTION_SETTINGS = 'linenSettings';

/**
 * Inisialisasi data awal stok (Selimut=39, Perlak=10) & pengaturan jika belum ada di Firestore
 */
export const initializeLinenStockIfNeeded = async (): Promise<void> => {
  try {
    // 1. Cek & Seed Selimut
    const selimutRef = doc(db, COLLECTION_STOCK, 'selimut');
    const selimutSnap = await getDoc(selimutRef);
    if (!selimutSnap.exists()) {
      await setDoc(selimutRef, {
        id: 'selimut',
        name: 'Selimut',
        totalAsset: 39,
        clean: 39,
        used: 0,
        dirty: 0,
        laundry: 0,
        status: 'AMAN',
        lastUpdated: serverTimestamp(),
        lastUpdatedBy: 'Sistem (Inisialisasi)',
        lastUpdateAction: 'Inisialisasi aset awal 39 Selimut',
      });
    }

    // 2. Cek & Seed Perlak
    const perlakRef = doc(db, COLLECTION_STOCK, 'perlak');
    const perlakSnap = await getDoc(perlakRef);
    if (!perlakSnap.exists()) {
      await setDoc(perlakRef, {
        id: 'perlak',
        name: 'Perlak',
        totalAsset: 10,
        clean: 10,
        used: 0,
        dirty: 0,
        laundry: 0,
        status: 'AMAN',
        lastUpdated: serverTimestamp(),
        lastUpdatedBy: 'Sistem (Inisialisasi)',
        lastUpdateAction: 'Inisialisasi aset awal 10 Perlak',
      });
    }

    // 3. Cek & Seed Settings
    const settingsRef = doc(db, COLLECTION_SETTINGS, 'global');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, DEFAULT_LINEN_SETTINGS);
    }
  } catch (error) {
    console.error('Error saat inisialisasi linen stock:', error);
  }
};

/**
 * Listener real-time untuk data stok linen (hanya membaca 2 dokumen: selimut & perlak)
 */
export const subscribeLinenStock = (callback: (stocks: LinenStock[]) => void) => {
  const stockCol = collection(db, COLLECTION_STOCK);
  return onSnapshot(stockCol, (snapshot) => {
    const items = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    } as LinenStock));
    // Urutkan selimut dulu, lalu perlak
    items.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }) * -1);
    callback(items);
  }, (error) => {
    console.error('Gagal mengambil real-time stok linen:', error);
  });
};

/**
 * Listener real-time untuk pengaturan linen
 */
export const subscribeLinenSettings = (callback: (settings: LinenSettings) => void) => {
  const settingsRef = doc(db, COLLECTION_SETTINGS, 'global');
  return onSnapshot(settingsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as LinenSettings);
    } else {
      callback(DEFAULT_LINEN_SETTINGS);
    }
  }, (error) => {
    console.error('Gagal mengambil pengaturan linen:', error);
    callback(DEFAULT_LINEN_SETTINGS);
  });
};

/**
 * Simpan perubahan pengaturan threshold dan shift
 */
export const updateLinenSettings = async (settings: Partial<LinenSettings>): Promise<void> => {
  const settingsRef = doc(db, COLLECTION_SETTINGS, 'global');
  await setDoc(settingsRef, settings, { merge: true });
};

/**
 * TRANSAKSI ATOMIC: Perawat mengambil linen bersih
 * Operasi: clean -> used
 */
export const recordNursePickup = async (params: {
  itemType: LinenItemType;
  quantity: number;
  userId: string;
  userName: string;
  userRole: UserRole;
  notes?: string;
  settings?: LinenSettings;
}): Promise<{ previousClean: number; resultingClean: number; itemName: string }> => {
  const { itemType, quantity, userId, userName, userRole, notes, settings } = params;

  if (quantity <= 0) {
    throw new Error('Jumlah pengambilan harus lebih besar dari 0.');
  }

  const { dateString, timeString } = getJakartaDateInfo();
  const shift = getCurrentShift(settings?.shifts);
  const thresholds = settings?.thresholds || DEFAULT_LINEN_SETTINGS.thresholds;

  return await runTransaction(db, async (transaction) => {
    const stockRef = doc(db, COLLECTION_STOCK, itemType);
    const stockSnap = await transaction.get(stockRef);

    if (!stockSnap.exists()) {
      throw new Error(`Data stok ${itemType} tidak ditemukan di database.`);
    }

    const currentStock = stockSnap.data() as LinenStock;
    const currentClean = currentStock.clean || 0;

    if (currentClean < quantity) {
      throw new Error(`Stok ${currentStock.name} tidak mencukupi. Stok bersih tersedia: ${currentClean}`);
    }

    const newClean = currentClean - quantity;
    const newUsed = (currentStock.used || 0) + quantity;
    const newStatus = evaluateLinenStatus(newClean, itemType, thresholds);

    const previousSnapshot: LinenStockSnapshot = {
      clean: currentClean,
      used: currentStock.used || 0,
      dirty: currentStock.dirty || 0,
      laundry: currentStock.laundry || 0,
    };

    const resultingSnapshot: LinenStockSnapshot = {
      clean: newClean,
      used: newUsed,
      dirty: currentStock.dirty || 0,
      laundry: currentStock.laundry || 0,
    };

    // Update dokumen stok secara atomic
    transaction.update(stockRef, {
      clean: newClean,
      used: newUsed,
      status: newStatus,
      lastUpdated: serverTimestamp(),
      lastUpdatedBy: userName,
      lastUpdateAction: `${userName} mengambil ${quantity} ${currentStock.name}`,
    });

    // Catat ke ledger transaksi immutable
    const trxCol = collection(db, COLLECTION_TRANSACTIONS);
    const newTrxRef = doc(trxCol);
    transaction.set(newTrxRef, {
      id: newTrxRef.id,
      itemType,
      transactionType: 'NURSE_PICKUP',
      quantity,
      previousStock: previousSnapshot,
      resultingStock: resultingSnapshot,
      userId,
      userName,
      userRole,
      shift,
      timestamp: serverTimestamp(),
      date: dateString,
      notes: notes || `Pengambilan ${quantity} ${currentStock.name} pada jam ${timeString}`,
    });

    return {
      previousClean: currentClean,
      resultingClean: newClean,
      itemName: currentStock.name,
    };
  });
};

/**
 * TRANSAKSI ATOMIC: Petugas Laundry mengambil linen kotor
 * Operasi: kotor (atau yang selesai digunakan di IGD) dipindahkan ke laundry
 */
export const recordDirtyCollection = async (params: {
  items: Array<{ itemType: LinenItemType; quantity: number }>;
  userId: string;
  userName: string;
  userRole: UserRole;
  notes?: string;
  settings?: LinenSettings;
}): Promise<void> => {
  const { items, userId, userName, userRole, notes, settings } = params;
  const validItems = items.filter(i => i.quantity > 0);

  if (validItems.length === 0) {
    throw new Error('Masukkan setidaknya satu jumlah linen kotor.');
  }

  const { dateString, timeString } = getJakartaDateInfo();
  const shift = getCurrentShift(settings?.shifts);
  const thresholds = settings?.thresholds || DEFAULT_LINEN_SETTINGS.thresholds;

  await runTransaction(db, async (transaction) => {
    // 1. Baca semua stok terlebih dahulu (Firestore rule: all reads before writes)
    const stockSnapshots: Record<string, { ref: any; data: LinenStock }> = {};
    for (const item of validItems) {
      const stockRef = doc(db, COLLECTION_STOCK, item.itemType);
      const stockSnap = await transaction.get(stockRef);
      if (!stockSnap.exists()) {
        throw new Error(`Data stok ${item.itemType} tidak ditemukan.`);
      }
      stockSnapshots[item.itemType] = {
        ref: stockRef,
        data: stockSnap.data() as LinenStock,
      };
    }

    // 2. Lakukan kalkulasi dan atomic writes
    for (const item of validItems) {
      const { ref, data } = stockSnapshots[item.itemType];
      const qty = item.quantity;
      const currentDirty = data.dirty || 0;
      const currentUsed = data.used || 0;

      // Di IGD, linen kotor diambil dari ruang kotor (dirty) atau dari unit pemakaian (used)
      let newDirty = currentDirty;
      let newUsed = currentUsed;

      if (currentDirty >= qty) {
        newDirty = currentDirty - qty;
      } else {
        const deficit = qty - currentDirty;
        newDirty = 0;
        newUsed = Math.max(0, currentUsed - deficit);
      }

      const newLaundry = (data.laundry || 0) + qty;
      const newStatus = evaluateLinenStatus(data.clean || 0, item.itemType, thresholds);

      const previousSnapshot: LinenStockSnapshot = {
        clean: data.clean || 0,
        used: currentUsed,
        dirty: currentDirty,
        laundry: data.laundry || 0,
      };

      const resultingSnapshot: LinenStockSnapshot = {
        clean: data.clean || 0,
        used: newUsed,
        dirty: newDirty,
        laundry: newLaundry,
      };

      transaction.update(ref, {
        dirty: newDirty,
        used: newUsed,
        laundry: newLaundry,
        status: newStatus,
        lastUpdated: serverTimestamp(),
        lastUpdatedBy: userName,
        lastUpdateAction: `Laundry mengambil ${qty} ${data.name} kotor`,
      });

      const newTrxRef = doc(collection(db, COLLECTION_TRANSACTIONS));
      transaction.set(newTrxRef, {
        id: newTrxRef.id,
        itemType: item.itemType,
        transactionType: 'DIRTY_COLLECTION',
        quantity: qty,
        previousStock: previousSnapshot,
        resultingStock: resultingSnapshot,
        userId,
        userName,
        userRole,
        shift,
        timestamp: serverTimestamp(),
        date: dateString,
        notes: notes || `Petugas laundry mengambil ${qty} ${data.name} kotor jam ${timeString}`,
      });
    }
  });
};

/**
 * TRANSAKSI ATOMIC: Pengembalian linen bersih dari Laundry
 * Operasi: laundry -> clean
 */
export const recordLaundryReturn = async (params: {
  items: Array<{ itemType: LinenItemType; quantity: number }>;
  userId: string;
  userName: string;
  userRole: UserRole;
  notes?: string;
  settings?: LinenSettings;
}): Promise<void> => {
  const { items, userId, userName, userRole, notes, settings } = params;
  const validItems = items.filter(i => i.quantity > 0);

  if (validItems.length === 0) {
    throw new Error('Masukkan setidaknya satu jumlah linen yang kembali dari laundry.');
  }

  const { dateString, timeString } = getJakartaDateInfo();
  const shift = getCurrentShift(settings?.shifts);
  const thresholds = settings?.thresholds || DEFAULT_LINEN_SETTINGS.thresholds;

  await runTransaction(db, async (transaction) => {
    // 1. Reads
    const stockSnapshots: Record<string, { ref: any; data: LinenStock }> = {};
    for (const item of validItems) {
      const stockRef = doc(db, COLLECTION_STOCK, item.itemType);
      const stockSnap = await transaction.get(stockRef);
      if (!stockSnap.exists()) {
        throw new Error(`Data stok ${item.itemType} tidak ditemukan.`);
      }
      stockSnapshots[item.itemType] = {
        ref: stockRef,
        data: stockSnap.data() as LinenStock,
      };
    }

    // 2. Writes
    for (const item of validItems) {
      const { ref, data } = stockSnapshots[item.itemType];
      const qty = item.quantity;
      const currentLaundry = data.laundry || 0;
      const currentClean = data.clean || 0;

      const newLaundry = Math.max(0, currentLaundry - qty);
      const newClean = currentClean + qty;
      const newStatus = evaluateLinenStatus(newClean, item.itemType, thresholds);

      const previousSnapshot: LinenStockSnapshot = {
        clean: currentClean,
        used: data.used || 0,
        dirty: data.dirty || 0,
        laundry: currentLaundry,
      };

      const resultingSnapshot: LinenStockSnapshot = {
        clean: newClean,
        used: data.used || 0,
        dirty: data.dirty || 0,
        laundry: newLaundry,
      };

      transaction.update(ref, {
        clean: newClean,
        laundry: newLaundry,
        status: newStatus,
        lastUpdated: serverTimestamp(),
        lastUpdatedBy: userName,
        lastUpdateAction: `${qty} ${data.name} bersih kembali dari laundry`,
      });

      const newTrxRef = doc(collection(db, COLLECTION_TRANSACTIONS));
      transaction.set(newTrxRef, {
        id: newTrxRef.id,
        itemType: item.itemType,
        transactionType: 'LAUNDRY_RETURN',
        quantity: qty,
        previousStock: previousSnapshot,
        resultingStock: resultingSnapshot,
        userId,
        userName,
        userRole,
        shift,
        timestamp: serverTimestamp(),
        date: dateString,
        notes: notes || `Pengembalian ${qty} ${data.name} bersih dari laundry jam ${timeString}`,
      });
    }
  });
};

/**
 * TRANSAKSI ATOMIC: Koreksi / Rekonsiliasi Stok Manual oleh Koordinator / Admin
 */
export const recordStockCorrection = async (params: {
  itemType: LinenItemType;
  clean: number;
  used: number;
  dirty: number;
  laundry: number;
  reason: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  settings?: LinenSettings;
}): Promise<void> => {
  const { itemType, clean, used, dirty, laundry, reason, userId, userName, userRole, settings } = params;

  if (!reason.trim()) {
    throw new Error('Alasan koreksi stok wajib diisi untuk audit trail.');
  }

  const { dateString, timeString } = getJakartaDateInfo();
  const shift = getCurrentShift(settings?.shifts);
  const thresholds = settings?.thresholds || DEFAULT_LINEN_SETTINGS.thresholds;

  await runTransaction(db, async (transaction) => {
    const stockRef = doc(db, COLLECTION_STOCK, itemType);
    const stockSnap = await transaction.get(stockRef);
    if (!stockSnap.exists()) {
      throw new Error(`Data stok ${itemType} tidak ditemukan.`);
    }

    const currentData = stockSnap.data() as LinenStock;
    const newStatus = evaluateLinenStatus(clean, itemType, thresholds);

    const previousSnapshot: LinenStockSnapshot = {
      clean: currentData.clean || 0,
      used: currentData.used || 0,
      dirty: currentData.dirty || 0,
      laundry: currentData.laundry || 0,
    };

    const resultingSnapshot: LinenStockSnapshot = {
      clean,
      used,
      dirty,
      laundry,
    };

    transaction.update(stockRef, {
      clean,
      used,
      dirty,
      laundry,
      status: newStatus,
      lastUpdated: serverTimestamp(),
      lastUpdatedBy: userName,
      lastUpdateAction: `Koreksi stok ${currentData.name}: ${reason}`,
    });

    const newTrxRef = doc(collection(db, COLLECTION_TRANSACTIONS));
    transaction.set(newTrxRef, {
      id: newTrxRef.id,
      itemType,
      transactionType: 'STOCK_CORRECTION',
      quantity: 0,
      previousStock: previousSnapshot,
      resultingStock: resultingSnapshot,
      userId,
      userName,
      userRole,
      shift,
      timestamp: serverTimestamp(),
      date: dateString,
      notes: `KOREKSI MANUAL: ${reason} (jam ${timeString})`,
    });
  });
};

/**
 * Mengambil transaksi terbaru untuk Activity Feed (default 15 transaksi terakhir)
 */
export const subscribeRecentTransactions = (
  callback: (transactions: LinenTransaction[]) => void,
  limitCount: number = 15
) => {
  const q = query(
    collection(db, COLLECTION_TRANSACTIONS),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const trxs = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    } as LinenTransaction));
    callback(trxs);
  }, (error) => {
    console.error('Gagal mengambil transaksi terbaru:', error);
  });
};

/**
 * Mengambil transaksi berdasarkan rentang tanggal untuk laporan
 */
export const getTransactionsForReport = async (startDate: string, endDate: string): Promise<LinenTransaction[]> => {
  const q = query(
    collection(db, COLLECTION_TRANSACTIONS),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc'),
    orderBy('timestamp', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
  } as LinenTransaction));
};

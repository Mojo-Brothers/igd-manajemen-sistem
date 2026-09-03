import { Timestamp } from 'firebase/firestore';

export type LinenItemType = 'selimut' | 'perlak';

export type LinenStockStatus = 'AMAN' | 'MENIPIS' | 'KRITIS';

export type UserRole = 'ADMIN' | 'KOORDINATOR' | 'PERAWAT' | 'LAUNDRY';

export type ShiftType = 'Pagi' | 'Sore' | 'Malam';

export interface LinenStock {
  id: LinenItemType;
  name: string;
  totalAsset: number;
  clean: number;      // Bersih di lemari linen
  used: number;       // Sedang digunakan oleh pasien IGD
  dirty: number;      // Berada di ruang linen kotor
  laundry: number;    // Sedang dalam proses di laundry
  status: LinenStockStatus;
  lastUpdated: Timestamp | null;
  lastUpdatedBy: string;
  lastUpdateAction: string;
}

export type LinenTransactionType = 
  | 'NURSE_PICKUP'       // Perawat ambil linen bersih (clean -> used)
  | 'MOVE_TO_DIRTY'     // Linen selesai pakai masuk kotor (used -> dirty)
  | 'DIRTY_COLLECTION'  // Laundry ambil linen kotor (dirty -> laundry)
  | 'LAUNDRY_RETURN'    // Laundry kembalikan linen bersih (laundry -> clean)
  | 'STOCK_CORRECTION'; // Koreksi/Rekonsiliasi stok oleh Koordinator/Admin

export interface LinenStockSnapshot {
  clean: number;
  used: number;
  dirty: number;
  laundry: number;
}

export interface LinenTransaction {
  id: string;
  itemType: LinenItemType;
  transactionType: LinenTransactionType;
  quantity: number;
  previousStock: LinenStockSnapshot;
  resultingStock: LinenStockSnapshot;
  userId: string;
  userName: string;
  userRole: UserRole;
  shift: ShiftType;
  timestamp: Timestamp | null;
  date: string; // Format: YYYY-MM-DD (Asia/Jakarta)
  notes?: string;
}

export interface ItemThreshold {
  safe: number;
  warning: number;
}

export interface ShiftConfig {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface LinenSettings {
  thresholds: {
    selimut: ItemThreshold;
    perlak: ItemThreshold;
  };
  shifts: {
    pagi: ShiftConfig;
    sore: ShiftConfig;
    malam: ShiftConfig;
  };
  timezone: string;
}

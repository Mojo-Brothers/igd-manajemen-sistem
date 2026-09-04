export type LinenStatusLevel = 'SAFE' | 'WARNING' | 'CRITICAL';

export interface LinenUnit {
  id: string; // e.g. 'igd'
  name: string; // 'Instalasi Gawat Darurat'
  code: string; // 'IGD'
  isActive: boolean;
}

export interface LinenItem {
  id: string; // e.g. 'igd_selimut', 'igd_perlak'
  unitId: string;
  name: string; // 'Selimut', 'Perlak'
  unitLabel: string; // 'pcs', 'lbr'
  icon: 'bed' | 'layer' | 'cube';
  
  // Total stok kepemilikan unit (Single Source of Truth target)
  totalOwned: number; // e.g. 39 untuk selimut, 10 untuk perlak
  minStock: number; // e.g. 10
  criticalStock: number; // e.g. 5
  
  // Status Sirkulasi Real-time
  clean: number; // Bersih di lemari
  used: number; // Sedang digunakan pada pasien/bed
  dirty: number; // Berada di ruang/keranjang linen kotor IGD
  inTransitDirty?: number; // Linen kotor sedang dikirim ke laundry
  laundry: number; // Sedang diproses/dikerjakan di laundry
  inTransitClean?: number; // Linen bersih sedang dikirim ke IGD
  
  updatedAt?: any;
}

export type TransactionType = 
  | 'TAKE'                  // Clean -> Used (Perawat ambil dari lemari)
  | 'TO_DIRTY'              // Used -> Dirty (Linen selesai digunakan, masuk kotor)
  | 'IGD_DISPATCH_DIRTY'    // Dirty -> inTransitDirty (IGD serah kotor)
  | 'LAUNDRY_RECEIVE_DIRTY' // inTransitDirty -> Laundry (Laundry terima kotor)
  | 'LAUNDRY_DISPATCH_CLEAN'// Laundry -> inTransitClean (Laundry kirim bersih)
  | 'IGD_RECEIVE_CLEAN'     // inTransitClean -> Clean (IGD terima bersih)
  | 'LAUNDRY_PICKUP'        // Legacy alias / direct Dirty -> Laundry
  | 'LAUNDRY_RETURN'        // Legacy alias / direct Laundry -> Clean
  | 'DIRECT_DIRTY'          // Clean -> Dirty (Misal kena tumpahan sebelum dipakai)
  | 'ADJUST_STOCK';         // Penyesuaian / Koreksi oleh Administrator

export interface LinenTransaction {
  id: string;
  unitId: string;
  itemId: string;
  itemName: string;
  type: TransactionType;
  quantity: number;
  sourceStatus: 'clean' | 'used' | 'dirty' | 'inTransitDirty' | 'laundry' | 'inTransitClean' | 'system';
  targetStatus: 'clean' | 'used' | 'dirty' | 'inTransitDirty' | 'laundry' | 'inTransitClean' | 'system';
  actor: string; // e.g. 'Perawat IGD', 'Petugas Laundry', 'Administrator'
  actorName?: string;
  notes?: string;
  timestamp: any;
}

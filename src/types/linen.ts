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
  
  // 4 Status Sirkulasi Real-time
  clean: number; // Bersih di lemari
  used: number; // Sedang digunakan pada pasien/bed
  dirty: number; // Berada di ruang/keranjang linen kotor
  laundry: number; // Sedang diproses oleh petugas laundry
  
  updatedAt?: any;
}

export type TransactionType = 
  | 'TAKE'           // Clean -> Used (Perawat ambil dari lemari)
  | 'TO_DIRTY'       // Used -> Dirty (Linen selesai digunakan, masuk kotor)
  | 'LAUNDRY_PICKUP' // Dirty -> Laundry (Petugas laundry ambil kotor)
  | 'LAUNDRY_RETURN' // Laundry -> Clean (Petugas antar linen bersih kembali)
  | 'DIRECT_DIRTY'   // Clean -> Dirty (Misal kena tumpahan sebelum dipakai)
  | 'ADJUST_STOCK';  // Penyesuaian / Koreksi oleh Koordinator

export interface LinenTransaction {
  id: string;
  unitId: string;
  itemId: string;
  itemName: string;
  type: TransactionType;
  quantity: number;
  sourceStatus: 'clean' | 'used' | 'dirty' | 'laundry' | 'system';
  targetStatus: 'clean' | 'used' | 'dirty' | 'laundry' | 'system';
  actor: string; // e.g. 'Perawat IGD', 'Petugas Laundry', 'Koordinator'
  actorName?: string;
  notes?: string;
  timestamp: any;
}

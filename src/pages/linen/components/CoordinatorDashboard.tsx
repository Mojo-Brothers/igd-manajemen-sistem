import React, { useState, useEffect } from 'react';
import { LinenItem, LinenTransaction } from '../../../types/linen';
import { 
  getLinenStatusLevel, 
  updateLinenMaster, 
  subscribeRecentTransactions 
} from '../../../services/linenService';
import toast from 'react-hot-toast';
import { 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaEdit, 
  FaHistory, 
  FaSlidersH,
  FaTimes,
  FaSave
} from 'react-icons/fa';

interface CoordinatorDashboardProps {
  items: LinenItem[];
  unitId: string;
  unitName: string;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({
  items,
  unitId,
  unitName
}) => {
  const [transactions, setTransactions] = useState<LinenTransaction[]>([]);
  const [editingItem, setEditingItem] = useState<LinenItem | null>(null);
  const [editTotal, setEditTotal] = useState<number>(0);
  const [editMin, setEditMin] = useState<number>(0);
  const [editCritical, setEditCritical] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeRecentTransactions(unitId, (txs) => {
      setTransactions(txs);
    }, 25);
    return () => unsub();
  }, [unitId]);

  const handleOpenEdit = (item: LinenItem) => {
    setEditingItem(item);
    setEditTotal(item.totalOwned);
    setEditMin(item.minStock);
    setEditCritical(item.criticalStock);
    setEditNotes('');
  };

  const handleSaveMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (editTotal <= 0 || editMin < 0 || editCritical < 0) {
      toast.error('Nilai stok tidak valid');
      return;
    }

    setSaving(true);
    try {
      await updateLinenMaster(editingItem.id, {
        totalOwned: editTotal,
        minStock: editMin,
        criticalStock: editCritical,
        notes: editNotes || `Penyesuaian master oleh Koordinator: Total ${editTotal}`
      });
      toast.success(`Master ${editingItem.name} berhasil diperbarui!`);
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui master data');
    } finally {
      setSaving(false);
    }
  };

  // Check overall discrepancies
  const itemsWithDiscrepancy = items.filter((item) => {
    const currentSum = (item.clean || 0) + (item.used || 0) + (item.dirty || 0) + (item.laundry || 0);
    return currentSum !== item.totalOwned;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Alert Banner for Discrepancy */}
      {itemsWithDiscrepancy.length > 0 ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs">
          <FaExclamationTriangle className="text-amber-600 shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-bold text-sm">Peringatan Selisih Fisik (Discrepancy Detected)</h4>
            <p className="text-xs text-amber-800 mt-1">
              Jumlah sirkulasi (Bersih + Digunakan + Kotor + Laundry) tidak sama dengan target kepemilikan unit pada:{' '}
              <strong>{itemsWithDiscrepancy.map(i => i.name).join(', ')}</strong>. Lakukan pengecekan fisik di lemari atau riwayat mutasi di bawah.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 shadow-xs">
          <FaCheckCircle className="text-emerald-600 shrink-0" size={20} />
          <div>
            <h4 className="font-bold text-sm">Status Inventaris Sinkron (Single Source of Truth)</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Seluruh siklus linen {unitName} lengkap dan tepat berjumlah sesuai master kepemilikan.
            </p>
          </div>
        </div>
      )}

      {/* 4 Status Circulation Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaSlidersH className="text-blue-400" />
            <h3 className="font-bold text-base">Matriks Sirkulasi 4 Status ({unitName})</h3>
          </div>
          <span className="text-xs text-slate-300">
            Total Kepemilikan & Distribusi Aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Jenis Linen</th>
                <th className="py-3.5 px-3 text-center bg-emerald-50/70 text-emerald-900">🟢 Bersih</th>
                <th className="py-3.5 px-3 text-center bg-amber-50/70 text-amber-900">🟡 Digunakan</th>
                <th className="py-3.5 px-3 text-center bg-rose-50/70 text-rose-900">🔴 Kotor</th>
                <th className="py-3.5 px-3 text-center bg-blue-50/70 text-blue-900">🔵 Laundry</th>
                <th className="py-3.5 px-3 text-center font-black">Total Fisik</th>
                <th className="py-3.5 px-3 text-center">Master Milik</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const clean = item.clean || 0;
                const used = item.used || 0;
                const dirty = item.dirty || 0;
                const laundry = item.laundry || 0;
                const totalCalculated = clean + used + dirty + laundry;
                const isDiscrepant = totalCalculated !== item.totalOwned;
                const statusLevel = getLinenStatusLevel(clean, item.minStock, item.criticalStock);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div>{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        Min: {item.minStock} • Kritis: {item.criticalStock}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center font-bold text-emerald-700 bg-emerald-50/30 text-base">
                      {clean}
                    </td>
                    <td className="py-4 px-3 text-center font-bold text-amber-700 bg-amber-50/30 text-base">
                      {used}
                    </td>
                    <td className="py-4 px-3 text-center font-bold text-rose-700 bg-rose-50/30 text-base">
                      {dirty}
                    </td>
                    <td className="py-4 px-3 text-center font-bold text-blue-700 bg-blue-50/30 text-base">
                      {laundry}
                    </td>
                    <td className="py-4 px-3 text-center font-black text-slate-900 text-base">
                      {totalCalculated}
                      {isDiscrepant && (
                        <div className="text-[10px] text-rose-600 font-bold">
                          Selisih {totalCalculated - item.totalOwned > 0 ? `+${totalCalculated - item.totalOwned}` : totalCalculated - item.totalOwned}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-3 text-center font-semibold text-slate-600">
                      {item.totalOwned} {item.unitLabel}
                    </td>
                    <td className="py-4 px-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        statusLevel === 'SAFE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : statusLevel === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {statusLevel === 'SAFE' ? '🟢 AMAN' : statusLevel === 'WARNING' ? '🟡 MENIPIS' : '🔴 KRITIS'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
                      >
                        <FaEdit size={12} />
                        <span>Master</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History Log */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaHistory className="text-slate-600" />
            <h3 className="font-bold text-base text-slate-900">Riwayat Mutasi & Sirkulasi Terakhir</h3>
          </div>
          <span className="text-xs text-slate-500">
            {transactions.length} transaksi terakhir
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Belum ada catatan mutasi transaksi hari ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const dateStr = tx.timestamp?.toDate 
                ? tx.timestamp.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Baru saja';

              const getBadgeConfig = () => {
                switch (tx.type) {
                  case 'TAKE':
                    return { label: 'AMBIL LINEN', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
                  case 'TO_DIRTY':
                    return { label: 'LINEN KOTOR', color: 'bg-amber-100 text-amber-800 border-amber-200' };
                  case 'LAUNDRY_PICKUP':
                    return { label: 'LAUNDRY AMBIL', color: 'bg-blue-100 text-blue-800 border-blue-200' };
                  case 'LAUNDRY_RETURN':
                    return { label: 'LAUNDRY ANTAR', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
                  case 'ADJUST_STOCK':
                    return { label: 'PENYESUAIAN MASTER', color: 'bg-purple-100 text-purple-800 border-purple-200' };
                  default:
                    return { label: tx.type, color: 'bg-slate-100 text-slate-800 border-slate-200' };
                }
              };

              const badge = getBadgeConfig();

              return (
                <div key={tx.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                      {dateStr}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                        <strong className="text-sm text-slate-800">{tx.itemName}</strong>
                        <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {tx.quantity} pcs
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Oleh: <span className="font-semibold text-slate-700">{tx.actor || 'Staf IGD'}</span>
                        {tx.notes && <span className="text-slate-400"> — {tx.notes}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400 hidden sm:block">
                    {tx.sourceStatus} &rarr; {tx.targetStatus}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Master Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-300 font-bold uppercase tracking-wider">
                  Pengaturan Master
                </span>
                <h3 className="text-lg font-bold">Edit Master {editingItem.name}</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-white/70 hover:text-white p-2"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMaster} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">
                  Total Kepemilikan Stok ({editingItem.unitLabel})
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Jika IGD mendapat tambahan linen baru (misal dari 39 menjadi 44), ubah angka di sini.
                </p>
                <input
                  type="number"
                  min={1}
                  required
                  value={editTotal}
                  onChange={(e) => setEditTotal(parseInt(e.target.value) || 0)}
                  className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-blue-600 font-bold text-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">
                    Batas Minimum (Aman)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editMin}
                    onChange={(e) => setEditMin(parseInt(e.target.value) || 0)}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 font-bold text-base outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">
                    Batas Kritis
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editCritical}
                    onChange={(e) => setEditCritical(parseInt(e.target.value) || 0)}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 font-bold text-base outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">
                  Catatan Penyesuaian (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Tambahan 5 selimut dari Pengadaan RS"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-600 text-sm outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <FaSave />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

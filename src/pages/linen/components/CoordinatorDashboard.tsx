import React, { useState, useEffect } from 'react';
import { LinenItem, LinenTransaction } from '../../../types/linen';
import { 
  getLinenStatusLevel, 
  updateLinenMaster, 
  subscribeRecentTransactions,
  reconcileAndWhitewashStock
} from '../../../services/linenService';
import { AdjustCleanModal } from './AdjustCleanModal';
import toast from 'react-hot-toast';
import { 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaEdit, 
  FaHistory, 
  FaSlidersH,
  FaTimes,
  FaSave,
  FaClipboardCheck,
  FaBroom
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
  const [adjustingItem, setAdjustingItem] = useState<LinenItem | null>(null);
  const [baseOldStock, setBaseOldStock] = useState<number>(0);
  const [editTotal, setEditTotal] = useState<number>(0);
  const [addStock, setAddStock] = useState<number>(0);
  const [editMin, setEditMin] = useState<number>(0);
  const [editCritical, setEditCritical] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [resetToClean, setResetToClean] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeRecentTransactions(unitId, (txs) => {
      setTransactions(txs);
    }, 25);
    return () => unsub();
  }, [unitId]);

  const handleOpenEdit = (item: LinenItem) => {
    setEditingItem(item);
    setBaseOldStock(item.totalOwned);
    setEditTotal(item.totalOwned);
    setAddStock(0);
    setEditMin(item.minStock);
    setEditCritical(item.criticalStock);
    setEditNotes('');
    setResetToClean(true);
  };

  const handleBaseOldStockChange = (val: number) => {
    setBaseOldStock(val);
    setEditTotal(Math.max(1, val + addStock));
  };

  const handleAddStockChange = (val: number) => {
    setAddStock(val);
    setEditTotal(Math.max(1, baseOldStock + val));
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
        notes: editNotes || `Penyesuaian master oleh Koordinator: Total ${editTotal}`,
        resetToClean: resetToClean
      });
      toast.success(
        resetToClean 
          ? `Master ${editingItem.name} berhasil diperbarui & diselaraskan ke 100% lemari bersih!` 
          : `Master ${editingItem.name} berhasil diperbarui!`
      );
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui master data');
    } finally {
      setSaving(false);
    }
  };

  const [whitewashing, setWhitewashing] = useState<boolean>(false);

  const handleWhitewash = async () => {
    if (!window.confirm(`Lakukan pemutihan stok linen ${unitName}? Seluruh linen (Perlak & Selimut) akan diselaraskan menjadi 100% Bersih di Lemari (kotor = 0, laundry = 0, digunakan = 0).`)) {
      return;
    }
    setWhitewashing(true);
    try {
      await reconcileAndWhitewashStock(unitId, `Koordinator ${unitName} (Pemutihan)`);
      toast.success(`Pemutihan berhasil! Seluruh linen ${unitName} kini 100% selaras di lemari bersih.`);
    } catch (err: any) {
      toast.error(err.message || 'Gagal melakukan pemutihan stok');
    } finally {
      setWhitewashing(false);
    }
  };

  // Check overall discrepancies
  const itemsWithDiscrepancy = items.filter((item) => {
    const currentSum = 
      (item.clean || 0) + 
      (item.used || 0) + 
      (item.dirty || 0) + 
      (item.inTransitDirty || 0) + 
      (item.laundry || 0) + 
      (item.inTransitClean || 0);
    return currentSum !== item.totalOwned;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Alert Banner for Discrepancy */}
      {itemsWithDiscrepancy.length > 0 ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-amber-600 shrink-0 mt-1" size={20} />
            <div>
              <h4 className="font-bold text-sm">Peringatan Selisih Fisik (Discrepancy Detected)</h4>
              <p className="text-xs text-amber-800 mt-1">
                Jumlah sirkulasi tidak sama dengan target kepemilikan unit pada:{' '}
                <strong>{itemsWithDiscrepancy.map(i => i.name).join(', ')}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={handleWhitewash}
            disabled={whitewashing}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <FaBroom size={13} />
            <span>{whitewashing ? 'Memutihkan...' : 'Pemutihan / Selaraskan'}</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <FaCheckCircle className="text-emerald-600 shrink-0" size={20} />
            <div>
              <h4 className="font-bold text-sm">Status Inventaris Sinkron (Single Source of Truth)</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Seluruh siklus linen {unitName} lengkap dan tepat berjumlah sesuai master kepemilikan.
              </p>
            </div>
          </div>
          <button
            onClick={handleWhitewash}
            disabled={whitewashing}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <FaBroom size={13} />
            <span>{whitewashing ? 'Memutihkan...' : 'Pemutihan / Selaraskan Stok'}</span>
          </button>
        </div>
      )}

      {/* 4 Status Circulation Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaSlidersH className="text-blue-400" />
            <h3 className="font-bold text-base">Matriks Sirkulasi 4 Status ({unitName})</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleWhitewash}
              disabled={whitewashing}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              title="Selaraskan semua status menjadi 100% bersih di lemari"
            >
              <FaBroom size={12} />
              <span>{whitewashing ? 'Memutihkan...' : 'Pemutihan Stok'}</span>
            </button>
            <span className="text-xs text-slate-300 hidden sm:inline">
              Total Kepemilikan & Distribusi Aktif
            </span>
          </div>
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
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setAdjustingItem(item)}
                          className="py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                          title="Koreksi / Input stok baru bersih lemari"
                        >
                          <FaClipboardCheck size={12} />
                          <span>Koreksi Lemari</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                          title="Edit total kepemilikan master & batas aman"
                        >
                          <FaEdit size={12} />
                          <span>Master</span>
                        </button>
                      </div>
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
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

            <form onSubmit={handleSaveMaster} className="p-6 space-y-4 overflow-y-auto">
              {/* Dual Stock Inputs: Stok Lama & Tambah Stok Baru */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Stok Awal / Basis (Bisa di-adjust / dikoreksi) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Stok Awal (Basis)
                      </span>
                      <span className="text-[9px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                        Koreksi
                      </span>
                    </div>
                    <div>
                      <input
                        type="number"
                        min={0}
                        value={baseOldStock}
                        onChange={(e) => handleBaseOldStockChange(parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-2xl font-black text-slate-800 outline-none text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1.5 text-center block">
                      Tercatat: {editingItem.totalOwned} {editingItem.unitLabel}
                    </span>
                  </div>

                  {/* Tambah Stok Baru Input */}
                  <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                        + Tambah Baru
                      </span>
                      <span className="text-[9px] bg-blue-200/80 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                        Unit Baru
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-black text-blue-500 pl-1">+</span>
                      <input
                        type="number"
                        min={0}
                        value={addStock === 0 ? '' : addStock}
                        onChange={(e) => handleAddStockChange(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-white border border-blue-300 rounded-xl px-2 py-1.5 text-2xl font-black text-blue-900 outline-none text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-blue-600/70 mt-1.5 text-center block">
                      Jumlah penambahan
                    </span>
                  </div>
                </div>

                {/* Quick Add / Minus Chips */}
                <div className="flex items-center gap-1.5">
                  {[-5, -1, 1, 5, 10].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleAddStockChange(addStock + chip)}
                      className={`flex-1 py-1.5 font-bold text-xs rounded-xl transition-all active:scale-95 border ${
                        chip < 0
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                      }`}
                    >
                      {chip > 0 ? `+${chip}` : chip}
                    </button>
                  ))}
                  {(addStock !== 0 || baseOldStock !== editingItem.totalOwned) && (
                    <button
                      type="button"
                      onClick={() => {
                        setBaseOldStock(editingItem.totalOwned);
                        handleAddStockChange(0);
                      }}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors border border-slate-200"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Total Akhir yang Dihasilkan (Non-Editable Display) */}
                <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 block">
                        Total Kepemilikan Baru:
                      </span>
                      <span className="text-xs text-emerald-700 font-medium">
                        {baseOldStock} (awal) {addStock >= 0 ? `+ ${addStock}` : `- ${Math.abs(addStock)}`} = <strong>{editTotal} {editingItem.unitLabel}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="min-w-[85px] bg-white border-2 border-emerald-400 rounded-xl px-3 py-1.5 text-2xl font-black text-emerald-900 text-center shadow-xs select-none">
                        {editTotal}
                      </div>
                      <span className="text-xs font-bold text-emerald-800 uppercase">{editingItem.unitLabel}</span>
                    </div>
                  </div>
                </div>
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

              {/* Opsi Pemutihan / Rekonsiliasi ke Lemari Bersih */}
              <div 
                onClick={() => setResetToClean(!resetToClean)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                  resetToClean 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="resetToCleanCheckbox"
                    checked={resetToClean}
                    onChange={(e) => setResetToClean(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="resetToCleanCheckbox" className="text-xs font-black uppercase tracking-wide cursor-pointer block text-emerald-900">
                      Pemutihan / Selaraskan ke Lemari Bersih
                    </label>
                    <span className="text-[11px] text-emerald-700 block mt-0.5">
                      Reset status kotor (0) & laundry (0). Total {editTotal} {editingItem.unitLabel} menjadi bersih di lemari.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 shrink-0">
                  {resetToClean ? 'Aktif' : 'Nonaktif'}
                </span>
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

      {/* Direct Clean Stock Adjustment Modal */}
      <AdjustCleanModal
        isOpen={!!adjustingItem}
        onClose={() => setAdjustingItem(null)}
        item={adjustingItem}
      />
    </div>
  );
};

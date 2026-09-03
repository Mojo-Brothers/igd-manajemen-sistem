import React, { useState } from 'react';
import { LinenStock, UserRole, LinenSettings } from '../../../types/linen';
import { evaluateDiscrepancy } from '../../../utils/linenUtils';
import { recordStockCorrection } from '../../../services/linenService';
import toast from 'react-hot-toast';
import { FaBalanceScale, FaCheckCircle, FaExclamationTriangle, FaEdit, FaTimes } from 'react-icons/fa';

interface ReconciliationCardProps {
  stocks: LinenStock[];
  userId: string;
  userName: string;
  userRole: UserRole;
  settings?: LinenSettings;
  canCorrect: boolean; // Koordinator / Admin only
}

export const ReconciliationCard: React.FC<ReconciliationCardProps> = ({
  stocks,
  userId,
  userName,
  userRole,
  settings,
  canCorrect,
}) => {
  const [editingItem, setEditingItem] = useState<LinenStock | null>(null);
  const [cleanVal, setCleanVal] = useState<number>(0);
  const [usedVal, setUsedVal] = useState<number>(0);
  const [dirtyVal, setDirtyVal] = useState<number>(0);
  const [laundryVal, setLaundryVal] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const startEdit = (stock: LinenStock) => {
    setEditingItem(stock);
    setCleanVal(stock.clean || 0);
    setUsedVal(stock.used || 0);
    setDirtyVal(stock.dirty || 0);
    setLaundryVal(stock.laundry || 0);
    setReason('');
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || loading) return;

    if (!reason.trim()) {
      toast.error('Alasan koreksi stok wajib diisi untuk audit trail.');
      return;
    }

    setLoading(true);
    try {
      await recordStockCorrection({
        itemType: editingItem.id,
        clean: cleanVal,
        used: usedVal,
        dirty: dirtyVal,
        laundry: laundryVal,
        reason: reason.trim(),
        userId,
        userName,
        userRole,
        settings,
      });

      toast.success(`Koreksi stok ${editingItem.name} berhasil disimpan.`, {
        icon: '📝',
        duration: 4000,
      });

      setEditingItem(null);
    } catch (error: any) {
      console.error('Correction failed:', error);
      toast.error(error.message || 'Gagal menyimpan koreksi stok.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FaBalanceScale size={18} />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-gray-800">Rekonsiliasi & Audit Stok</h3>
            <p className="text-xs text-gray-400">Verifikasi konsistensi matematis (Bersih + Digunakan + Kotor + Laundry = Total Aset)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stocks.map((stock) => {
          const evalResult = evaluateDiscrepancy(stock);
          const isBalanced = evalResult.isBalanced;

          return (
            <div
              key={stock.id}
              className={`p-4 rounded-2xl border transition-all ${
                isBalanced
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-rose-50/70 border-rose-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-gray-800 text-base">{stock.name}</span>
                  <span className="text-xs text-gray-400">({stock.totalAsset} pcs aset)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                      isBalanced ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'
                    }`}
                  >
                    {isBalanced ? <FaCheckCircle size={12} /> : <FaExclamationTriangle size={12} />}
                    <span>{isBalanced ? 'BALANCE' : 'STOCK DISCREPANCY'}</span>
                  </span>

                  {canCorrect && (
                    <button
                      type="button"
                      onClick={() => startEdit(stock)}
                      title="Koreksi / Rekonsiliasi Stok"
                      className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-gray-600 hover:text-primary transition-all border border-gray-200 cursor-pointer shadow-2xs text-xs flex items-center gap-1"
                    >
                      <FaEdit size={12} />
                      <span className="hidden sm:inline font-medium">Koreksi</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Formula View */}
              <div className="bg-white/80 rounded-xl p-3 border border-gray-100 text-xs text-gray-700 flex flex-wrap items-center justify-between gap-2 font-mono">
                <div>
                  <span className="text-blue-600 font-bold">{stock.clean}</span>
                  <span className="text-gray-400"> (B)</span> +{' '}
                  <span className="text-indigo-600 font-bold">{stock.used}</span>
                  <span className="text-gray-400"> (D)</span> +{' '}
                  <span className="text-amber-600 font-bold">{stock.dirty}</span>
                  <span className="text-gray-400"> (K)</span> +{' '}
                  <span className="text-blue-500 font-bold">{stock.laundry}</span>
                  <span className="text-gray-400"> (L)</span>
                </div>
                <div className="font-sans">
                  = <strong className="text-gray-900">{evalResult.currentSum}</strong> / {stock.totalAsset} pcs
                </div>
              </div>

              {!isBalanced && (
                <div className="mt-2.5 text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                  <FaExclamationTriangle size={13} className="shrink-0" />
                  <span>
                    Selisih: {evalResult.discrepancy > 0 ? `+${evalResult.discrepancy}` : evalResult.discrepancy} {stock.name}{' '}
                    (Aset tidak sesuai fisik!)
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Correction Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-indigo-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaEdit size={20} />
                <div>
                  <h3 className="font-bold text-base leading-tight">Koreksi Stok: {editingItem.name}</h3>
                  <p className="text-xs text-indigo-200">Audit & Penyesuaian Fisik IGD</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">Bersih (Lemari)</label>
                  <input
                    type="number"
                    min="0"
                    value={cleanVal}
                    onChange={(e) => setCleanVal(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-sm font-bold px-3 py-2 border border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">Digunakan (Pasien)</label>
                  <input
                    type="number"
                    min="0"
                    value={usedVal}
                    onChange={(e) => setUsedVal(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-sm font-bold px-3 py-2 border border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">Kotor (IGD)</label>
                  <input
                    type="number"
                    min="0"
                    value={dirtyVal}
                    onChange={(e) => setDirtyVal(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-sm font-bold px-3 py-2 border border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">Laundry (Proses)</label>
                  <input
                    type="number"
                    min="0"
                    value={laundryVal}
                    onChange={(e) => setLaundryVal(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-sm font-bold px-3 py-2 border border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-600 flex justify-between">
                <span>Total Baru: <strong>{cleanVal + usedVal + dirtyVal + laundryVal}</strong> pcs</span>
                <span>Aset Resmi: <strong>{editingItem.totalAsset}</strong> pcs</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Alasan Koreksi <span className="text-rose-500">*</span> (Wajib diisi untuk Audit Trail)
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Ditemukan 1 selimut di ruang observasi saat sterilisasi ruangan."
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !reason.trim()}
                  className="flex-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Koreksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

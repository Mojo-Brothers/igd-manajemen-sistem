import React, { useState, useEffect } from 'react';
import { LinenItem, TransactionType } from '../../../types/linen';
import { executeLinenTransition } from '../../../services/linenService';
import toast from 'react-hot-toast';
import { 
  FaTimes, 
  FaCheck, 
  FaMinus, 
  FaPlus, 
  FaTruckLoading, 
  FaCheckDouble, 
  FaBed, 
  FaLayerGroup,
  FaHospital,
  FaInfoCircle
} from 'react-icons/fa';

interface LinenActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LinenItem[];
  defaultType?: TransactionType;
  defaultItemId?: string;
  defaultRole?: 'IGD' | 'LAUNDRY';
}

interface ItemRowState {
  item: LinenItem;
  quantity: number;
  maxAvailable: number;
  included: boolean;
}

export const LinenActionModal: React.FC<LinenActionModalProps> = ({
  isOpen,
  onClose,
  items,
  defaultType = 'LAUNDRY_PICKUP',
  defaultItemId,
  defaultRole = 'IGD'
}) => {
  const role = defaultRole;
  const isIgd = role === 'IGD';
  
  // Normalize transaction type
  const isReceiveClean = defaultType === 'LAUNDRY_RETURN' && isIgd;
  const isDispatchDirty = defaultType === 'LAUNDRY_PICKUP' && isIgd;
  const isReceiveDirty = defaultType === 'LAUNDRY_PICKUP' && !isIgd;
  const isDispatchClean = defaultType === 'LAUNDRY_RETURN' && !isIgd;

  const [rowStates, setRowStates] = useState<Record<string, ItemRowState>>({});
  const [actorName, setActorName] = useState<string>(() => {
    return localStorage.getItem('linenflow_actor_name') || '';
  });
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize row states based on transaction type and items
  useEffect(() => {
    if (!isOpen) return;

    const initialRows: Record<string, ItemRowState> = {};

    items.forEach((item) => {
      let max = 0;
      let defaultQty = 0;
      let shouldInclude = true;

      if (isReceiveClean) {
        // IGD Terima Bersih: Sumber dari linen yang sedang dikirim ke IGD
        max = item.inTransitClean || 0;
        defaultQty = max;
        // Hanya sertakan jika ada stok sedang dikirim, kecuali jika spesifik dipilih lewat defaultItemId
        shouldInclude = defaultItemId ? item.id === defaultItemId : max > 0;
      } else if (isDispatchDirty) {
        // IGD Serah Kotor: Sumber dari kotor di IGD (atau stok lemari jika kotor 0)
        const dirtyStock = item.dirty || 0;
        max = dirtyStock > 0 ? dirtyStock : (item.clean || 0);
        defaultQty = dirtyStock > 0 ? dirtyStock : (defaultItemId === item.id ? 1 : 0);
        shouldInclude = defaultItemId ? item.id === defaultItemId : dirtyStock > 0;
      } else if (isReceiveDirty) {
        // Laundry Terima Kotor: Sumber dari kirim kotor IGD
        const transitDirty = item.inTransitDirty || 0;
        max = transitDirty > 0 ? transitDirty : (item.dirty || 0);
        defaultQty = max;
        shouldInclude = defaultItemId ? item.id === defaultItemId : max > 0;
      } else if (isDispatchClean) {
        // Laundry Kirim Bersih: Sumber dari cucian selesai di gudang laundry
        max = item.laundry || 0;
        defaultQty = max;
        shouldInclude = defaultItemId ? item.id === defaultItemId : max > 0;
      }

      initialRows[item.id] = {
        item,
        quantity: defaultQty,
        maxAvailable: max,
        included: shouldInclude
      };
    });

    setRowStates(initialRows);
    setNotes('');
  }, [isOpen, defaultType, defaultItemId, defaultRole, items, isReceiveClean, isDispatchDirty, isReceiveDirty, isDispatchClean]);

  if (!isOpen) return null;

  // Header configuration
  const getHeaderConfig = () => {
    if (isReceiveClean) {
      return {
        title: 'Penerimaan Linen Bersih dari Laundry',
        subtitle: 'Konfirmasi penerimaan cucian bersih yang telah dikirim oleh petugas laundry masuk kembali ke lemari IGD.',
        badge: 'Laundry → Lemari IGD',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        headerGradient: 'from-emerald-600 to-indigo-700',
        icon: <FaCheckDouble size={22} className="text-white" />,
        submitText: 'Terima Linen ke Lemari',
        submitColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
      };
    } else if (isDispatchDirty) {
      return {
        title: 'Serah Linen Kotor ke Laundry',
        subtitle: 'Serahkan linen kotor dari IGD kepada petugas runner laundry untuk dicuci & disanitasi.',
        badge: 'Lemari / Bin IGD → Laundry',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
        headerGradient: 'from-rose-600 to-pink-700',
        icon: <FaTruckLoading size={22} className="text-white" />,
        submitText: 'Serahkan Kotor ke Laundry',
        submitColor: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
      };
    } else if (isReceiveDirty) {
      return {
        title: 'Penerimaan Linen Kotor dari IGD',
        subtitle: 'Petugas laundry mengonfirmasi penerimaan kiriman linen kotor dari IGD untuk segera dicuci.',
        badge: 'IGD → Gudang Laundry',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        headerGradient: 'from-amber-600 to-orange-700',
        icon: <FaTruckLoading size={22} className="text-white" />,
        submitText: 'Terima Kotor di Gudang',
        submitColor: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
      };
    } else {
      return {
        title: 'Pengiriman Linen Bersih ke IGD',
        subtitle: 'Kirim linen bersih hasil cuci & setrika dari gudang laundry ke stasiun lemari IGD.',
        badge: 'Gudang Laundry → Lemari IGD',
        badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
        headerGradient: 'from-teal-600 to-cyan-700',
        icon: <FaCheckDouble size={22} className="text-white" />,
        submitText: 'Kirim Bersih ke IGD',
        submitColor: 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
      };
    }
  };

  const config = getHeaderConfig();

  // Helper functions for adjusting row quantities
  const handleQuantityChange = (itemId: string, val: number) => {
    setRowStates((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      const newQty = Math.max(0, Math.min(val, current.maxAvailable > 0 ? current.maxAvailable : 999));
      return {
        ...prev,
        [itemId]: {
          ...current,
          quantity: newQty,
          included: newQty > 0
        }
      };
    });
  };

  const handleToggleInclude = (itemId: string) => {
    setRowStates((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      const nextIncluded = !current.included;
      return {
        ...prev,
        [itemId]: {
          ...current,
          included: nextIncluded,
          quantity: nextIncluded ? (current.quantity > 0 ? current.quantity : (current.maxAvailable > 0 ? current.maxAvailable : 1)) : 0
        }
      };
    });
  };

  const handleSetMax = (itemId: string) => {
    setRowStates((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      const maxVal = current.maxAvailable > 0 ? current.maxAvailable : 1;
      return {
        ...prev,
        [itemId]: {
          ...current,
          quantity: maxVal,
          included: true
        }
      };
    });
  };

  // Active items being processed
  const activeItemsToProcess = Object.values(rowStates).filter((r) => r.included && r.quantity > 0);
  const totalQuantity = activeItemsToProcess.reduce((sum, r) => sum + r.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeItemsToProcess.length === 0 || totalQuantity <= 0) {
      toast.error('Pilih setidaknya satu item linen dengan jumlah lebih dari 0.');
      return;
    }

    if (actorName) {
      localStorage.setItem('linenflow_actor_name', actorName);
    }

    let transitionType: TransactionType;
    let actorRole = '';

    if (isReceiveClean) {
      transitionType = 'IGD_RECEIVE_CLEAN';
      actorRole = actorName ? `Perawat IGD (${actorName})` : 'Perawat IGD';
    } else if (isDispatchDirty) {
      transitionType = 'IGD_DISPATCH_DIRTY';
      actorRole = actorName ? `Petugas IGD (${actorName})` : 'Petugas IGD';
    } else if (isReceiveDirty) {
      transitionType = 'LAUNDRY_RECEIVE_DIRTY';
      actorRole = actorName ? `Petugas Laundry (${actorName})` : 'Petugas Laundry';
    } else {
      transitionType = 'LAUNDRY_DISPATCH_CLEAN';
      actorRole = actorName ? `Petugas Laundry (${actorName})` : 'Petugas Laundry';
    }

    setLoading(true);
    try {
      for (const row of activeItemsToProcess) {
        await executeLinenTransition({
          itemId: row.item.id,
          type: transitionType,
          quantity: row.quantity,
          actor: actorRole,
          actorName,
          notes: notes || undefined
        });
      }

      const itemSummary = activeItemsToProcess
        .map((r) => `${r.quantity} ${r.item.unitLabel || 'pcs'} ${r.item.name}`)
        .join(', ');

      toast.success(`${config.title} berhasil! (${itemSummary})`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses transaksi linen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 my-auto flex flex-col max-h-[92vh] border border-slate-100">
        
        {/* Modern Hospital-Grade Modal Header */}
        <div className={`p-5 sm:p-6 bg-gradient-to-r ${config.headerGradient} text-white shrink-0 relative`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
                {config.icon}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                    {config.badge}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/20 text-white/90 font-bold">
                    {isIgd ? 'Stasiun IGD' : 'Gudang Laundry'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black mt-1 leading-tight text-white drop-shadow-xs">
                  {config.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors shrink-0"
              title="Tutup Modal"
            >
              <FaTimes size={18} />
            </button>
          </div>

          <p className="text-xs text-white/90 mt-2 font-medium leading-relaxed">
            {config.subtitle}
          </p>
        </div>

        {/* Modal Body / Items Manifest */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Section: Daftar Item Linen yang Diproses */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>Daftar Linen & Jumlah</span>
                <span className="text-[10px] font-normal text-slate-400">
                  ({items.length} jenis item)
                </span>
              </label>

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const allIncluded = Object.values(rowStates).every((r) => r.included && r.quantity > 0);
                    setRowStates((prev) => {
                      const next = { ...prev };
                      Object.keys(next).forEach((k) => {
                        const maxVal = next[k].maxAvailable > 0 ? next[k].maxAvailable : 1;
                        next[k] = {
                          ...next[k],
                          included: !allIncluded,
                          quantity: !allIncluded ? maxVal : 0
                        };
                      });
                      return next;
                    });
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {Object.values(rowStates).every((r) => r.included && r.quantity > 0)
                    ? 'Batal Pilih Semua'
                    : 'Pilih Semua Item'}
                </button>
              )}
            </div>

            {/* List of Item Cards */}
            <div className="space-y-2.5">
              {items.map((item) => {
                const row = rowStates[item.id] || {
                  item,
                  quantity: 0,
                  maxAvailable: 0,
                  included: false
                };
                const isSelimut = item.name.toLowerCase().includes('selimut');

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      row.included && row.quantity > 0
                        ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/10 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Item Checkbox, Icon, & Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={row.included && row.quantity > 0}
                          onChange={() => handleToggleInclude(item.id)}
                          className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                        />

                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          row.included && row.quantity > 0
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isSelimut ? <FaBed size={15} /> : <FaLayerGroup size={15} />}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {item.name}
                          </h4>
                          
                          {/* Contextual stock indicator */}
                          <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            {isReceiveClean && (
                              <>
                                <span>Sedang Dikirim: <strong className="text-emerald-700 font-black">{item.inTransitClean || 0} {item.unitLabel}</strong></span>
                                <span>• Lemari: <strong className="text-slate-700">{item.clean || 0}</strong></span>
                              </>
                            )}

                            {isDispatchDirty && (
                              <>
                                <span>Kotor di IGD: <strong className="text-rose-700 font-black">{item.dirty || 0} {item.unitLabel}</strong></span>
                                <span>• Lemari: <strong className="text-slate-700">{item.clean || 0}</strong></span>
                              </>
                            )}

                            {isReceiveDirty && (
                              <>
                                <span>Dikirim dari IGD: <strong className="text-amber-700 font-black">{item.inTransitDirty || 0} {item.unitLabel}</strong></span>
                                <span>• Di Gudang: <strong className="text-slate-700">{item.laundry || 0}</strong></span>
                              </>
                            )}

                            {isDispatchClean && (
                              <>
                                <span>Siap di Gudang: <strong className="text-teal-700 font-black">{item.laundry || 0} {item.unitLabel}</strong></span>
                                <span>• Kirim ke IGD: <strong className="text-slate-700">{item.inTransitClean || 0}</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quantity Stepper */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, row.quantity - 1)}
                          disabled={row.quantity <= 0}
                          className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-700 flex items-center justify-center border border-slate-300 font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                          title="Kurangi 1"
                        >
                          <FaMinus size={11} />
                        </button>

                        <input
                          type="number"
                          min={0}
                          max={row.maxAvailable > 0 ? row.maxAvailable : 999}
                          value={row.quantity}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-12 h-8 text-center text-sm font-black rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
                        />

                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, row.quantity + 1)}
                          disabled={row.maxAvailable > 0 && row.quantity >= row.maxAvailable}
                          className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white text-slate-700 flex items-center justify-center border border-slate-300 font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                          title="Tambah 1"
                        >
                          <FaPlus size={11} />
                        </button>

                        {row.maxAvailable > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetMax(item.id)}
                            className="text-[10px] font-bold px-2 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 transition-colors"
                            title={`Pilih semua (${row.maxAvailable})`}
                          >
                            Semua ({row.maxAvailable})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clean Balanced Status Overview Bar (Never wraps unevenly) */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <FaHospital className="text-blue-600 shrink-0" size={16} />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Total Linen yang Diproses
                </span>
                <span className="text-[11px] text-slate-500">
                  {activeItemsToProcess.length} jenis linen dipilih
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-2xl font-black text-slate-900 leading-none">
                {totalQuantity}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">
                pcs Total
              </span>
            </div>
          </div>

          {/* Petugas / Runner Name Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Nama Petugas / Perawat (Opsional)
            </label>
            <input
              type="text"
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              placeholder={isIgd ? 'Contoh: Ns. Rina / Perawat IGD' : 'Contoh: Mas Joko / Runner Laundry'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm outline-none transition-all"
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Catatan Transaksi (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Kiriman shift pagi / Linen kamar isolasi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm outline-none transition-all"
            />
          </div>

          {/* Alert if no items are ready */}
          {Object.values(rowStates).every((r) => r.maxAvailable === 0) && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
              <FaInfoCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
              <div>
                <strong className="block font-black">Tidak Ada Antrean Stok</strong>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  {isReceiveClean
                    ? 'Belum ada linen bersih yang dikirim oleh laundry saat ini.'
                    : isDispatchClean
                    ? 'Tidak ada linen bersih yang siap dikirim di gudang laundry.'
                    : isReceiveDirty
                    ? 'Belum ada linen kotor yang dikirim dari IGD.'
                    : 'Tidak ada catatan linen kotor yang siap diserahkan.'}
                </p>
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading || totalQuantity <= 0}
              className={`flex-1 py-3.5 px-5 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer ${config.submitColor} disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FaCheck size={14} />
                  <span>
                    {config.submitText} ({totalQuantity} pcs)
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

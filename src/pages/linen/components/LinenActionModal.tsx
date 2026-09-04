import React, { useState } from 'react';
import { LinenItem, TransactionType } from '../../../types/linen';
import { executeLinenTransition } from '../../../services/linenService';
import toast from 'react-hot-toast';
import { FaTimes, FaCheck, FaMinus, FaPlus, FaTruckLoading, FaCheckDouble, FaBed, FaLayerGroup } from 'react-icons/fa';

interface LinenActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LinenItem[];
  defaultType?: TransactionType;
  defaultItemId?: string;
  defaultRole?: 'IGD' | 'LAUNDRY';
}

export const LinenActionModal: React.FC<LinenActionModalProps> = ({
  isOpen,
  onClose,
  items,
  defaultType = 'LAUNDRY_PICKUP',
  defaultItemId,
  defaultRole = 'IGD'
}) => {
  const [role, setRole] = useState<'IGD' | 'LAUNDRY'>(defaultRole);
  const [activeType, setActiveType] = useState<TransactionType>(defaultType);
  const [selectedItemId, setSelectedItemId] = useState<string>(
    defaultItemId || (items[0]?.id || '')
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [actorName, setActorName] = useState<string>(() => {
    return localStorage.getItem('linenflow_actor_name') || '';
  });
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Sync when modal opens with props
  React.useEffect(() => {
    if (isOpen) {
      setRole(defaultRole);
      let initialType: TransactionType = defaultType;
      if (defaultType === 'TAKE' || defaultType === 'TO_DIRTY' || defaultType === 'IGD_DISPATCH_DIRTY' || defaultType === 'LAUNDRY_RECEIVE_DIRTY') {
        initialType = 'LAUNDRY_PICKUP';
      } else if (defaultType === 'IGD_RECEIVE_CLEAN' || defaultType === 'LAUNDRY_DISPATCH_CLEAN') {
        initialType = 'LAUNDRY_RETURN';
      }
      setActiveType(initialType);
      if (defaultItemId) {
        setSelectedItemId(defaultItemId);
      } else if (items.length > 0 && !selectedItemId) {
        setSelectedItemId(items[0].id);
      }
      setQuantity(1);
      setNotes('');
    }
  }, [isOpen, defaultType, defaultItemId, defaultRole, items]);

  if (!isOpen) return null;

  const currentItem = items.find((i) => i.id === selectedItemId) || items[0];

  // Title and helper info based on type and role
  const getActionConfig = () => {
    if (role === 'LAUNDRY') {
      // Peran Petugas Laundry: Terima Kotor & Kirim Bersih
      if (activeType === 'LAUNDRY_PICKUP' || activeType === 'LAUNDRY_RECEIVE_DIRTY') {
        const waitingFromIgd = (currentItem?.inTransitDirty || 0) > 0 
          ? (currentItem?.inTransitDirty || 0) 
          : (currentItem?.dirty || 0);
        return {
          title: 'Terima Linen Kotor dari IGD',
          description: waitingFromIgd > 0
            ? 'Petugas laundry mengonfirmasi penerimaan linen kotor yang dikirim dari IGD ke gudang.'
            : 'Belum ada linen kotor yang dikirim dari IGD.',
          sourceName: (currentItem?.inTransitDirty || 0) > 0 ? 'Sedang Dikirim dari IGD' : 'Linen Kotor IGD',
          available: waitingFromIgd,
          buttonText: 'Simpan Terima Kotor',
          buttonColor: 'bg-amber-600 hover:bg-amber-700',
          badge: 'Gudang Laundry ← IGD (Terima Kotor)'
        };
      } else {
        const readyToDispatch = currentItem?.laundry || 0;
        return {
          title: 'Kirim Linen Bersih ke IGD',
          description: readyToDispatch > 0 
            ? 'Petugas laundry mengirim dan menyerahkan linen bersih hasil cuci dari gudang ke lemari IGD.'
            : (currentItem?.inTransitClean || 0) > 0
            ? 'Linen sudah dikirim ke IGD (sedang dalam perjalanan menunggu konfirmasi perawat IGD).'
            : 'Tidak ada linen yang siap dikirim di gudang.',
          sourceName: 'Stok di Gudang Laundry',
          available: readyToDispatch,
          buttonText: 'Simpan Kirim Bersih',
          buttonColor: 'bg-teal-600 hover:bg-teal-700',
          badge: 'Gudang Laundry → IGD (Kirim Bersih)'
        };
      }
    } else {
      // Peran Petugas IGD: Serah Kotor & Terima Bersih
      if (activeType === 'LAUNDRY_PICKUP' || activeType === 'IGD_DISPATCH_DIRTY') {
        const dirtyCount = currentItem?.dirty || 0;
        const inTransitDirtyCount = currentItem?.inTransitDirty || 0;
        const cleanCount = currentItem?.clean || 0;

        // Sumber serah kotor: utamakan kotor di IGD jika ada, atau serah langsung dari stok lemari
        const totalCanDispatch = dirtyCount > 0 ? dirtyCount : cleanCount;
        const sourceTitle = dirtyCount > 0 ? 'Linen Kotor Siap Serah' : 'Stok Bersih Lemari (Siap Serah)';

        return {
          title: 'Serah Linen Kotor ke Laundry',
          description: inTransitDirtyCount > 0
            ? `Saat ini sudah ada ${inTransitDirtyCount} ${currentItem?.unitLabel || 'pcs'} sedang dalam pengiriman ke laundry. Pilih di bawah jika ingin menyerahkan linen kotor tambahan.`
            : 'Petugas IGD menyerahkan linen kotor ke petugas laundry untuk dicuci.',
          sourceName: sourceTitle,
          available: totalCanDispatch,
          buttonText: 'Simpan Serah Kotor',
          buttonColor: 'bg-rose-600 hover:bg-rose-700',
          badge: 'IGD → Laundry (Serah Kotor)'
        };
      } else {
        const waitingClean = currentItem?.inTransitClean || 0;
        const diLaundry = currentItem?.laundry || 0;
        return {
          title: 'Terima Linen Bersih dari Laundry',
          description: waitingClean > 0
            ? 'Petugas IGD menerima linen bersih dari laundry kembali ke lemari bersih.'
            : diLaundry > 0
            ? 'Linen masih sedang dikerjakan di laundry. Belum dikirim oleh laundry.'
            : (currentItem?.inTransitDirty || 0) > 0
            ? 'Linen masih sedang dikirim ke laundry.'
            : 'Tidak ada linen bersih yang sedang dikirim dari laundry.',
          sourceName: waitingClean > 0 ? 'Sedang Dikirim ke IGD (Siap Diterima)' : diLaundry > 0 ? 'Sedang di Laundry (Belum Dikirim)' : 'Semua Bersih di Lemari',
          available: waitingClean,
          buttonText: 'Simpan Terima Bersih',
          buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
          badge: 'Laundry → Lemari IGD (Terima Bersih)'
        };
      }
    }
  };

  const config = getActionConfig();

  const handleQuickAdd = (amount: number) => {
    setQuantity((prev) => Math.max(1, prev + amount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) return;

    if (quantity <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    // Role labeling
    let actorRole = role === 'LAUNDRY' 
      ? (actorName ? `Petugas Laundry (${actorName})` : 'Petugas Laundry')
      : (actorName ? `Petugas IGD (${actorName})` : 'Petugas IGD');

    if (actorName) {
      localStorage.setItem('linenflow_actor_name', actorName);
    }

    let transitionType: TransactionType = activeType;
    if (role === 'LAUNDRY') {
      if (activeType === 'LAUNDRY_PICKUP' || activeType === 'LAUNDRY_RECEIVE_DIRTY') {
        transitionType = 'LAUNDRY_RECEIVE_DIRTY';
      } else {
        transitionType = 'LAUNDRY_DISPATCH_CLEAN';
      }
    } else {
      if (activeType === 'LAUNDRY_PICKUP' || activeType === 'IGD_DISPATCH_DIRTY') {
        transitionType = 'IGD_DISPATCH_DIRTY';
      } else {
        transitionType = 'IGD_RECEIVE_CLEAN';
      }
    }

    setLoading(true);
    try {
      await executeLinenTransition({
        itemId: currentItem.id,
        type: transitionType,
        quantity,
        actor: actorRole,
        actorName,
        notes
      });

      toast.success(`${config.title} berhasil! (${quantity} ${currentItem.unitLabel || 'pcs'} ${currentItem.name})`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses transaksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
        
        {/* Modal Header with Role Tag */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-medium">
                {config.badge}
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-300 font-bold">
                Mode: {role === 'IGD' ? 'Petugas IGD' : 'Petugas Laundry'}
              </span>
            </div>
            <h3 className="text-lg font-bold mt-1">{config.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Action Type Selector Tabs (Hanya 2 Tab Sesuai Peran) */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 border-b border-slate-200 text-xs font-bold shrink-0">
          {role === 'IGD' ? (
            <>
              <button
                type="button"
                onClick={() => { setActiveType('LAUNDRY_PICKUP'); setQuantity(1); }}
                className={`py-2.5 px-3 rounded-xl text-center transition-all flex items-center justify-center gap-2 ${
                  activeType === 'LAUNDRY_PICKUP'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FaTruckLoading size={14} />
                <span>Serah Kotor</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveType('LAUNDRY_RETURN'); setQuantity(1); }}
                className={`py-2.5 px-3 rounded-xl text-center transition-all flex items-center justify-center gap-2 ${
                  activeType === 'LAUNDRY_RETURN'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FaCheckDouble size={14} />
                <span>Terima Bersih</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setActiveType('LAUNDRY_PICKUP'); setQuantity(1); }}
                className={`py-2.5 px-3 rounded-xl text-center transition-all flex items-center justify-center gap-2 ${
                  activeType === 'LAUNDRY_PICKUP'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FaTruckLoading size={14} />
                <span>Terima Kotor</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveType('LAUNDRY_RETURN'); setQuantity(1); }}
                className={`py-2.5 px-3 rounded-xl text-center transition-all flex items-center justify-center gap-2 ${
                  activeType === 'LAUNDRY_RETURN'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FaCheckDouble size={14} />
                <span>Serah Bersih</span>
              </button>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Item Selector: Modern Segmented Pill / Button Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                Pilih Jenis Linen
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                1-Klik Pilih ({items.length} Jenis Tersedia)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              {items.map((item) => {
                const isSelected = item.id === selectedItemId;
                const isSelimut = item.name.toLowerCase().includes('selimut');

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setQuantity(1);
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl transition-all flex items-center justify-between gap-2 text-left cursor-pointer border ${
                      isSelected
                        ? 'bg-white text-slate-900 border-blue-500/50 shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-transparent text-slate-600 border-transparent hover:bg-white/60 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-200/90 text-slate-600'
                      }`}>
                        {isSelimut ? <FaBed size={14} /> : <FaLayerGroup size={14} />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-xs sm:text-sm truncate">
                          {item.name}
                        </div>
                        {role === 'LAUNDRY' ? (
                          activeType === 'LAUNDRY_PICKUP' ? (
                            <div className="text-[10px] text-slate-400 truncate" title={`Stok dikirim dari IGD: ${item.inTransitDirty || 0} ${item.unitLabel}`}>
                              Gudang: <strong className={isSelected ? 'text-amber-700 font-bold' : ((item.inTransitDirty || 0) > 0 ? 'text-amber-600 font-bold' : 'text-slate-600 font-semibold')}>
                                {item.inTransitDirty || 0} {item.unitLabel}
                              </strong>
                              {(item.inTransitDirty || 0) > 0 && (
                                <span className="text-[9px] text-amber-600 ml-1 font-semibold">(Kirim)</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 truncate" title={`Stok siap di gudang laundry: ${item.laundry || 0} ${item.unitLabel}`}>
                              Gudang: <strong className={isSelected ? 'text-teal-700 font-bold' : 'text-slate-600 font-semibold'}>
                                {item.laundry || 0} {item.unitLabel}
                              </strong>
                              {(item.inTransitClean || 0) > 0 && (
                                <span className="text-[9px] text-teal-600 ml-1 font-semibold">({item.inTransitClean} dikirim)</span>
                              )}
                            </div>
                          )
                        ) : (
                          <div className="text-[10px] text-slate-400 truncate" title={`Stok bersih di lemari IGD: ${item.clean || 0} ${item.unitLabel}`}>
                            Lemari: <strong className={isSelected ? 'text-emerald-700 font-bold' : 'text-slate-600 font-semibold'}>
                              {item.clean || 0} {item.unitLabel}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] shadow-2xs">
                          <FaCheck size={9} />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold px-1.5 py-0.5 rounded bg-slate-200/60">
                          Pilih
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick stock status card for selected item */}
            {currentItem && (
              <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="text-sm font-black">{currentItem.name}</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Total Milik: <strong className="text-slate-700">{currentItem.totalOwned} {currentItem.unitLabel}</strong>
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 text-[11px]">
                  {role === 'LAUNDRY' ? (
                    <>
                      <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                        <span className="text-[10px] text-blue-700 block font-semibold flex items-center gap-1">
                          <span>🏬</span>
                          <span>Gudang Laundry</span>
                        </span>
                        <strong className="text-sm text-blue-900 font-black">{currentItem.laundry || 0} {currentItem.unitLabel}</strong>
                      </div>

                      <div className={`p-2 rounded-xl border ${
                        (currentItem.inTransitDirty || 0) > 0
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-slate-100/70 border-slate-200 text-slate-600'
                      }`}>
                        <span className="text-[10px] block font-semibold flex items-center gap-1">
                          <span>🚚</span>
                          <span>Dikirim dari IGD</span>
                        </span>
                        <strong className="text-sm font-black">{currentItem.inTransitDirty || 0} {currentItem.unitLabel}</strong>
                      </div>

                      {(currentItem.inTransitClean || 0) > 0 ? (
                        <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 col-span-2 sm:col-span-1">
                          <span className="text-[10px] block font-semibold flex items-center gap-1">
                            <span>🚚</span>
                            <span>Dikirim ke IGD</span>
                          </span>
                          <strong className="text-sm font-black text-teal-700">{currentItem.inTransitClean} {currentItem.unitLabel}</strong>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-emerald-700 block font-semibold">Lemari IGD (Bersih)</span>
                          <strong className="text-sm text-emerald-900 font-black">{currentItem.clean || 0} {currentItem.unitLabel}</strong>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="text-[10px] text-emerald-700 block font-semibold">Lemari Bersih</span>
                        <strong className="text-sm text-emerald-900 font-black">{currentItem.clean || 0} {currentItem.unitLabel}</strong>
                      </div>

                      <div className={`p-2 rounded-xl border ${
                        (currentItem.dirty || 0) > 0
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-slate-100/70 border-slate-200 text-slate-600'
                      }`}>
                        <span className="text-[10px] block font-semibold">Kotor di IGD</span>
                        <strong className="text-sm font-black">{currentItem.dirty || 0} {currentItem.unitLabel}</strong>
                      </div>

                      {(currentItem.inTransitDirty || 0) > 0 && (
                        <div className="p-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 col-span-2 sm:col-span-1">
                          <span className="text-[10px] block font-semibold flex items-center gap-1">
                            <span>🚚</span>
                            <span>Kirim Laundry</span>
                          </span>
                          <strong className="text-sm font-black text-orange-700">{currentItem.inTransitDirty} {currentItem.unitLabel}</strong>
                        </div>
                      )}

                      {(currentItem.laundry || 0) > 0 && (
                        <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 col-span-2 sm:col-span-1">
                          <span className="text-[10px] block font-semibold flex items-center gap-1">
                            <span>⚙️</span>
                            <span>Di Laundry</span>
                          </span>
                          <strong className="text-sm font-black text-blue-700">{currentItem.laundry} {currentItem.unitLabel}</strong>
                        </div>
                      )}

                      {(currentItem.inTransitClean || 0) > 0 && (
                        <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 col-span-2 sm:col-span-1">
                          <span className="text-[10px] block font-semibold flex items-center gap-1">
                            <span>🚚</span>
                            <span>Kirim ke IGD</span>
                          </span>
                          <strong className="text-sm font-black text-teal-700">{currentItem.inTransitClean} {currentItem.unitLabel}</strong>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quantity Selector with Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Jumlah ({currentItem?.unitLabel || 'pcs'})
              </label>
              <span className="text-xs text-slate-500 font-medium">
                {config.sourceName}: <strong className="text-slate-800 font-bold">{config.available} {currentItem?.unitLabel}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="flex-1 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-800 font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
                title="Kurangi 1"
              >
                <FaMinus size={18} />
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 sm:w-28 h-14 text-center text-3xl font-black rounded-2xl border-2 border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none bg-white shadow-inner shrink-0"
              />
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="flex-1 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-800 font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
                title="Tambah 1"
              >
                <FaPlus size={18} />
              </button>
            </div>

            {/* Quick amount chips */}
            <div className="flex gap-2 mt-3">
              {[+1, +2, +5, +10].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleQuickAdd(chip)}
                  className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  +{chip}
                </button>
              ))}
              {config.available > 0 && (
                <button
                  type="button"
                  onClick={() => setQuantity(config.available)}
                  className="py-1.5 px-3 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold rounded-xl transition-colors"
                >
                  {role === 'IGD' && activeType === 'LAUNDRY_PICKUP' && (currentItem?.dirty || 0) > 0
                    ? `Semua Kotor (${config.available})`
                    : `Semua (${config.available})`}
                </button>
              )}
            </div>
          </div>

          {/* Optional Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Nama Petugas / Perawat (Opsional)
            </label>
            <input
              type="text"
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              placeholder="Contoh: Ns. Rina / Mas Joko Laundry"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm outline-none transition-all"
            />
          </div>

          {/* Empty stock alert when available is 0 */}
          {config.available === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <div>
                <strong>Tidak Ada Stok Tersedia</strong>
                <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                  {role === 'IGD' && activeType === 'LAUNDRY_RETURN'
                    ? ((currentItem?.laundry || 0) > 0
                      ? 'Linen masih sedang dikerjakan di laundry. Tombol terima baru bisa digunakan setelah laundry mengirim linen bersih.'
                      : (currentItem?.inTransitDirty || 0) > 0
                      ? 'Linen kotor masih dalam perjalanan ke laundry.'
                      : 'Semua linen bersih sudah berada di lemari IGD.')
                    : role === 'LAUNDRY' && activeType === 'LAUNDRY_RETURN'
                    ? ((currentItem?.inTransitClean || 0) > 0
                      ? 'Linen bersih sudah dikirim ke IGD. Menunggu konfirmasi penerimaan perawat IGD.'
                      : 'Tidak ada linen yang sedang dikerjakan di laundry untuk dikirim.')
                    : 'Belum ada linen kotor yang diserahkan dari IGD.'}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (config.available === 0 && (activeType === 'LAUNDRY_RETURN' || (role === 'LAUNDRY' && activeType === 'LAUNDRY_PICKUP')))}
            className={`w-full py-4 px-6 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base ${config.buttonColor} disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none`}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <FaCheck />
                <span>{config.buttonText}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

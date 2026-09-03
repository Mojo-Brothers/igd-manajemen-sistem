import React, { useState } from 'react';
import { LinenItem, TransactionType } from '../../../types/linen';
import { executeLinenTransition } from '../../../services/linenService';
import toast from 'react-hot-toast';
import { FaTimes, FaCheck, FaMinus, FaPlus } from 'react-icons/fa';

interface LinenActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LinenItem[];
  defaultType?: TransactionType;
  defaultItemId?: string;
}

export const LinenActionModal: React.FC<LinenActionModalProps> = ({
  isOpen,
  onClose,
  items,
  defaultType = 'TAKE',
  defaultItemId
}) => {
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
      setActiveType(defaultType);
      if (defaultItemId) {
        setSelectedItemId(defaultItemId);
      } else if (items.length > 0 && !selectedItemId) {
        setSelectedItemId(items[0].id);
      }
      setQuantity(1);
      setNotes('');
    }
  }, [isOpen, defaultType, defaultItemId, items]);

  if (!isOpen) return null;

  const currentItem = items.find((i) => i.id === selectedItemId) || items[0];

  // Title and helper info based on type
  const getActionConfig = () => {
    switch (activeType) {
      case 'TAKE':
        return {
          title: 'Ambil Linen Bersih',
          description: 'Linen diambil dari lemari untuk digunakan pada pasien/bed.',
          sourceName: 'Lemari Bersih',
          available: currentItem?.clean || 0,
          buttonText: 'Simpan Pengambilan',
          buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
          badge: 'Bersih -> Digunakan'
        };
      case 'TO_DIRTY':
        return {
          title: 'Kembalikan / Linen Jadi Kotor',
          description: 'Linen yang selesai digunakan dimasukkan ke keranjang kotor.',
          sourceName: 'Sedang Digunakan',
          available: currentItem?.used || 0,
          buttonText: 'Catat Linen Kotor',
          buttonColor: 'bg-amber-600 hover:bg-amber-700',
          badge: 'Digunakan -> Kotor'
        };
      case 'LAUNDRY_PICKUP':
        return {
          title: 'Konfirmasi Pengambilan Laundry',
          description: 'Petugas laundry mengambil linen kotor dari ruang IGD.',
          sourceName: 'Linen Kotor Siap Diambil',
          available: currentItem?.dirty || 0,
          buttonText: 'Konfirmasi Laundry Ambil',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          badge: 'Kotor -> Laundry'
        };
      case 'LAUNDRY_RETURN':
        return {
          title: 'Terima Linen Bersih dari Laundry',
          description: 'Linen yang selesai dicuci laundry diantar kembali ke lemari bersih.',
          sourceName: 'Sedang di Laundry',
          available: currentItem?.laundry || 0,
          buttonText: 'Simpan ke Lemari Bersih',
          buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
          badge: 'Laundry -> Bersih'
        };
      default:
        return {
          title: 'Transaksi Linen',
          description: '',
          sourceName: 'Tersedia',
          available: 0,
          buttonText: 'Simpan',
          buttonColor: 'bg-primary hover:bg-blue-800',
          badge: ''
        };
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
    let actorRole = 'Staf IGD';
    if (activeType === 'TAKE' || activeType === 'TO_DIRTY') {
      actorRole = actorName ? `Perawat (${actorName})` : 'Perawat IGD';
    } else if (activeType === 'LAUNDRY_PICKUP' || activeType === 'LAUNDRY_RETURN') {
      actorRole = actorName ? `Laundry (${actorName})` : 'Petugas Laundry';
    }

    if (actorName) {
      localStorage.setItem('linenflow_actor_name', actorName);
    }

    setLoading(true);
    try {
      await executeLinenTransition({
        itemId: currentItem.id,
        type: activeType,
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 font-medium">
                {config.badge}
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

        {/* Action Type Selector Tabs */}
        <div className="grid grid-cols-3 bg-slate-100 p-1 border-b border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveType('TAKE'); setQuantity(1); }}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeType === 'TAKE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ambil Bersih
          </button>
          <button
            type="button"
            onClick={() => { setActiveType('TO_DIRTY'); setQuantity(1); }}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeType === 'TO_DIRTY'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Linen Kotor
          </button>
          <button
            type="button"
            onClick={() => { setActiveType('LAUNDRY_RETURN'); setQuantity(1); }}
            className={`py-2 px-1 rounded-xl text-center transition-all ${
              activeType === 'LAUNDRY_RETURN'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Terima Bersih
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Item Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Pilih Jenis Linen
            </label>
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => {
                const isSelected = item.id === selectedItemId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setQuantity(1);
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{item.name}</span>
                      {isSelected && <FaCheck className="text-blue-600" size={14} />}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Tersedia: <span className="font-semibold text-slate-700">
                        {activeType === 'TAKE' ? item.clean : activeType === 'TO_DIRTY' ? item.used : activeType === 'LAUNDRY_PICKUP' ? item.dirty : item.laundry}
                      </span> {item.unitLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector with Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Jumlah ({currentItem?.unitLabel || 'pcs'})
              </label>
              <span className="text-xs text-slate-500 font-medium">
                {config.sourceName}: <strong className="text-slate-800">{config.available}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 font-bold transition-all text-lg"
              >
                <FaMinus size={14} />
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-12 text-center text-2xl font-black rounded-2xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center text-slate-700 font-bold transition-all text-lg"
              >
                <FaPlus size={14} />
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
                  Semua ({config.available})
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base ${config.buttonColor} disabled:opacity-50`}
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

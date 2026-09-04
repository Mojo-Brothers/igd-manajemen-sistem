import React, { useState } from 'react';
import { LinenItem, TransactionType } from '../../../types/linen';
import { executeLinenTransition } from '../../../services/linenService';
import toast from 'react-hot-toast';
import { FaTimes, FaCheck, FaMinus, FaPlus, FaTruckLoading, FaCheckDouble } from 'react-icons/fa';

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
      const initialType = (defaultType === 'TAKE' || defaultType === 'TO_DIRTY') ? 'LAUNDRY_PICKUP' : defaultType;
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
      // Peran Petugas Laundry: Terima Kotor & Serah Bersih
      if (activeType === 'LAUNDRY_PICKUP') {
        return {
          title: 'Terima Linen Kotor dari IGD',
          description: 'Petugas laundry menerima linen kotor dari IGD untuk dibawa dan dicuci.',
          sourceName: 'Linen Kotor di IGD',
          available: (currentItem?.dirty || 0) + (currentItem?.clean || 0),
          buttonText: 'Simpan Terima Kotor',
          buttonColor: 'bg-amber-600 hover:bg-amber-700',
          badge: 'Laundry ← IGD (Kotor)'
        };
      } else {
        return {
          title: 'Kirim Linen Bersih ke IGD',
          description: 'Petugas laundry mengirim dan menyerahkan linen bersih hasil cuci ke lemari IGD.',
          sourceName: 'Selesai Cuci di Laundry',
          available: currentItem?.laundry || 0,
          buttonText: 'Simpan Kirim Bersih',
          buttonColor: 'bg-teal-600 hover:bg-teal-700',
          badge: 'Laundry → IGD (Kirim Bersih)'
        };
      }
    } else {
      // Peran Petugas IGD: Serah Kotor & Terima Bersih
      if (activeType === 'LAUNDRY_PICKUP') {
        return {
          title: 'Serah Linen Kotor ke Laundry',
          description: 'Petugas IGD menyerahkan linen kotor ke petugas laundry untuk dicuci.',
          sourceName: 'Linen Kotor di IGD',
          available: (currentItem?.dirty || 0) + (currentItem?.clean || 0),
          buttonText: 'Simpan Serah Kotor',
          buttonColor: 'bg-rose-600 hover:bg-rose-700',
          badge: 'IGD → Laundry (Kotor)'
        };
      } else {
        return {
          title: 'Terima Linen Bersih dari Laundry',
          description: 'Petugas IGD menerima linen bersih dari laundry kembali ke lemari bersih.',
          sourceName: 'Sedang di Laundry',
          available: currentItem?.laundry || 0,
          buttonText: 'Simpan Terima Bersih',
          buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
          badge: 'Laundry → Lemari IGD (Bersih)'
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
                      {activeType === 'LAUNDRY_PICKUP' ? (
                        <span>Tersedia di IGD: <strong className="text-rose-700">{(item.dirty || 0) + (item.clean || 0)}</strong> {item.unitLabel}</span>
                      ) : (
                        <span>Sedang di Laundry: <strong className="text-indigo-700">{item.laundry || 0}</strong> {item.unitLabel}</span>
                      )}
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

import React, { useState, useEffect } from 'react';
import { LinenStock, UserRole, LinenSettings } from '../../../types/linen';
import { recordNursePickup } from '../../../services/linenService';
import toast from 'react-hot-toast';
import { FaTimes, FaPlus, FaMinus, FaHandHoldingHeart } from 'react-icons/fa';

interface NursePickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: LinenStock | null;
  userId: string;
  userName: string;
  userRole: UserRole;
  settings?: LinenSettings;
  onSuccess?: () => void;
}

export const NursePickupModal: React.FC<NursePickupModalProps> = ({
  isOpen,
  onClose,
  stock,
  userId,
  userName,
  userRole,
  settings,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setNotes('');
      setLoading(false);
    }
  }, [isOpen, stock]);

  if (!isOpen || !stock) return null;

  const maxAvailable = stock.clean || 0;
  const resultingClean = Math.max(0, maxAvailable - quantity);

  const handleIncrement = () => {
    if (quantity < maxAvailable) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handlePresetAdd = (amount: number) => {
    setQuantity(prev => {
      const next = prev + amount;
      return next > maxAvailable ? maxAvailable : next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Double submit protection

    if (quantity <= 0) {
      toast.error('Jumlah pengambilan minimal 1 pcs.');
      return;
    }

    if (quantity > maxAvailable) {
      toast.error(`Stok ${stock.name} tidak mencukupi.`);
      return;
    }

    setLoading(true);
    try {
      const res = await recordNursePickup({
        itemType: stock.id,
        quantity,
        userId,
        userName,
        userRole,
        notes,
        settings,
      });

      toast.success(`${quantity} ${res.itemName} berhasil diambil.`, {
        duration: 4000,
        icon: '✅',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Pickup failed:', error);
      toast.error(error.message || 'Data belum berhasil disimpan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-primary text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FaHandHoldingHeart size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Ambil {stock.name}</h3>
              <p className="text-xs text-blue-200">Perawat IGD • Lemari Bersih</p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Real-time stock display */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-medium block">Stok Bersih Saat Ini</span>
              <span className="text-2xl font-black text-gray-800">{stock.clean} <span className="text-xs font-normal text-gray-400">pcs</span></span>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 font-medium block">Setelah Diambil</span>
              <span className={`text-2xl font-black ${resultingClean < 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {resultingClean} <span className="text-xs font-normal text-gray-400">pcs</span>
              </span>
            </div>
          </div>

          {/* Stepper Counter: Big Touch Friendly */}
          <div className="text-center space-y-2">
            <label className="text-xs uppercase tracking-wider font-semibold text-gray-500">
              Jumlah Yang Diambil
            </label>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1 || loading}
                className="w-14 h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-gray-700 text-xl font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <FaMinus size={18} />
              </button>

              <div className="w-24 h-16 rounded-2xl bg-primary/5 border-2 border-primary/20 flex items-center justify-center">
                <span className="text-3xl font-black text-primary">{quantity}</span>
              </div>

              <button
                type="button"
                onClick={handleIncrement}
                disabled={quantity >= maxAvailable || loading}
                className="w-14 h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-gray-700 text-xl font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <FaPlus size={18} />
              </button>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-gray-400 block text-center">Tambah Cepat:</span>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 5, 10].map(amt => (
                <button
                  key={amt}
                  type="button"
                  disabled={loading || quantity + amt > maxAvailable}
                  onClick={() => handlePresetAdd(amt)}
                  className="py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 font-bold text-xs active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <input
              type="text"
              placeholder="Catatan opsional (misal: Ruang Bedah, Kamar 3)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Submit Button with Double-Submit Guard */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-sm transition-all cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading || quantity <= 0 || quantity > maxAvailable}
              className="flex-2 py-3 px-4 rounded-2xl bg-primary hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FaHandHoldingHeart size={16} />
                  <span>SIMPAN ({quantity} {stock.name})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

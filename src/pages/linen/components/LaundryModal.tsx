import React, { useState, useEffect } from 'react';
import { LinenStock, UserRole, LinenSettings } from '../../../types/linen';
import { recordDirtyCollection, recordLaundryReturn } from '../../../services/linenService';
import toast from 'react-hot-toast';
import { FaTimes, FaPlus, FaMinus, FaTruckLoading, FaHandsWash, FaCheckCircle } from 'react-icons/fa';

interface LaundryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: LinenStock[];
  userId: string;
  userName: string;
  userRole: UserRole;
  settings?: LinenSettings;
  initialTab?: 'DIRTY' | 'RETURN';
  onSuccess?: () => void;
}

export const LaundryModal: React.FC<LaundryModalProps> = ({
  isOpen,
  onClose,
  stocks,
  userId,
  userName,
  userRole,
  settings,
  initialTab = 'DIRTY',
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'DIRTY' | 'RETURN'>(initialTab);
  const [selimutQty, setSelimutQty] = useState<number>(0);
  const [perlakQty, setPerlakQty] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSelimutQty(0);
      setPerlakQty(0);
      setNotes('');
      setLoading(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const selimutStock = stocks.find(s => s.id === 'selimut');
  const perlakStock = stocks.find(s => s.id === 'perlak');

  // Max bounds depending on mode
  const selimutMax = activeTab === 'DIRTY'
    ? (selimutStock ? (selimutStock.dirty || 0) + (selimutStock.used || 0) : 0)
    : (selimutStock?.laundry || 0);

  const perlakMax = activeTab === 'DIRTY'
    ? (perlakStock ? (perlakStock.dirty || 0) + (perlakStock.used || 0) : 0)
    : (perlakStock?.laundry || 0);

  const totalSelected = selimutQty + perlakQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (totalSelected <= 0) {
      toast.error('Masukkan jumlah Selimut atau Perlak minimal 1 pcs.');
      return;
    }

    setLoading(true);
    try {
      const itemsToProcess = [
        { itemType: 'selimut' as const, quantity: selimutQty },
        { itemType: 'perlak' as const, quantity: perlakQty },
      ].filter(i => i.quantity > 0);

      if (activeTab === 'DIRTY') {
        await recordDirtyCollection({
          items: itemsToProcess,
          userId,
          userName,
          userRole,
          notes,
          settings,
        });
        toast.success('Pengambilan linen kotor berhasil dicatat.', {
          icon: '🧺',
          duration: 4000,
        });
      } else {
        await recordLaundryReturn({
          items: itemsToProcess,
          userId,
          userName,
          userRole,
          notes,
          settings,
        });
        toast.success('Linen bersih dari laundry berhasil dicatat & masuk lemari.', {
          icon: '✨',
          duration: 4000,
        });
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Laundry action failed:', error);
      toast.error(error.message || 'Data belum berhasil disimpan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Tabs */}
        <div className="bg-gray-100 p-2 flex items-center gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => { setActiveTab('DIRTY'); setSelimutQty(0); setPerlakQty(0); }}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'DIRTY'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <FaHandsWash size={16} />
            <span>1. Linen Kotor (Pickup)</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('RETURN'); setSelimutQty(0); setPerlakQty(0); }}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'RETURN'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <FaTruckLoading size={16} />
            <span>2. Linen Kembali (Bersih)</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors cursor-pointer ml-1"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Modal Banner */}
        <div className={`p-5 text-white ${activeTab === 'DIRTY' ? 'bg-gradient-to-r from-amber-600 to-orange-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600'}`}>
          <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
            {activeTab === 'DIRTY' ? <FaHandsWash size={20} /> : <FaTruckLoading size={20} />}
            <span>{activeTab === 'DIRTY' ? 'Petugas Laundry: Ambil Linen Kotor' : 'Petugas Laundry: Pengembalian Linen Bersih'}</span>
          </h3>
          <p className="text-xs text-white/80 mt-1">
            {activeTab === 'DIRTY' 
              ? 'Mencatat jumlah selimut dan perlak kotor yang diambil dari IGD untuk dicuci.'
              : 'Mencatat linen yang telah selesai dicuci dan kembali menjadi stok bersih lemari IGD.'}
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Row 1: Selimut */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-extrabold text-gray-800 text-base block">Selimut</span>
              <span className="text-xs text-gray-500">
                {activeTab === 'DIRTY' 
                  ? `Tersedia di IGD (kotor/dipakai): ${selimutMax} pcs`
                  : `Sedang proses laundry: ${selimutMax} pcs`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelimutQty(prev => Math.max(0, prev - 1))}
                disabled={selimutQty <= 0 || loading}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-40 cursor-pointer shadow-xs"
              >
                <FaMinus size={13} />
              </button>
              <span className="w-12 text-center text-2xl font-black text-gray-800">{selimutQty}</span>
              <button
                type="button"
                onClick={() => setSelimutQty(prev => prev + 1)}
                disabled={loading}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-40 cursor-pointer shadow-xs"
              >
                <FaPlus size={13} />
              </button>

              <button
                type="button"
                onClick={() => setSelimutQty(selimutMax)}
                disabled={selimutMax <= 0 || loading}
                className="text-xs font-bold text-primary hover:underline px-2 py-1 rounded cursor-pointer"
              >
                Semua
              </button>
            </div>
          </div>

          {/* Row 2: Perlak */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-extrabold text-gray-800 text-base block">Perlak</span>
              <span className="text-xs text-gray-500">
                {activeTab === 'DIRTY' 
                  ? `Tersedia di IGD (kotor/dipakai): ${perlakMax} pcs`
                  : `Sedang proses laundry: ${perlakMax} pcs`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPerlakQty(prev => Math.max(0, prev - 1))}
                disabled={perlakQty <= 0 || loading}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-40 cursor-pointer shadow-xs"
              >
                <FaMinus size={13} />
              </button>
              <span className="w-12 text-center text-2xl font-black text-gray-800">{perlakQty}</span>
              <button
                type="button"
                onClick={() => setPerlakQty(prev => prev + 1)}
                disabled={loading}
                className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-40 cursor-pointer shadow-xs"
              >
                <FaPlus size={13} />
              </button>

              <button
                type="button"
                onClick={() => setPerlakQty(perlakMax)}
                disabled={perlakMax <= 0 || loading}
                className="text-xs font-bold text-primary hover:underline px-2 py-1 rounded cursor-pointer"
              >
                Semua
              </button>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <input
              type="text"
              placeholder="Catatan (misal: Serah terima petugas Mas Budi laundry)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Buttons */}
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
              disabled={loading || totalSelected <= 0}
              className={`flex-2 py-3 px-4 rounded-2xl text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === 'DIRTY'
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FaCheckCircle size={16} />
                  <span>
                    {activeTab === 'DIRTY' ? 'KONFIRMASI PENGAMBILAN KOTOR' : 'KONFIRMASI KEMBALI BERSIH'}
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

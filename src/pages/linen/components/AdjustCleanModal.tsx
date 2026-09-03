import React, { useState, useEffect } from 'react';
import { LinenItem } from '../../../types/linen';
import { adjustCleanStock } from '../../../services/linenService';
import { FaTimes, FaSave, FaClipboardCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface AdjustCleanModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: LinenItem | null;
}

export const AdjustCleanModal: React.FC<AdjustCleanModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  const [baseOldStock, setBaseOldStock] = useState<number>(0);
  const [newStock, setNewStock] = useState<number>(0);
  const [actorName, setActorName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setBaseOldStock(item.clean);
      setNewStock(item.clean);
      setNotes('');
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const diff = newStock - baseOldStock;

  const handleQuickAdd = (delta: number) => {
    setNewStock((prev) => Math.max(0, prev + delta));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStock < 0) {
      toast.error('Stok tidak boleh bernilai negatif');
      return;
    }

    setSaving(true);
    try {
      await adjustCleanStock({
        itemId: item.id,
        newClean: newStock,
        actor: actorName.trim() || 'Perawat IGD',
        notes: notes.trim() || (diff === 0 ? 'Verifikasi stok fisik lemari' : `Penyesuaian stok bersih lemari: ${baseOldStock} -> ${newStock} (${diff >= 0 ? '+' : ''}${diff})`)
      });

      toast.success(`Stok bersih ${item.name} berhasil disesuaikan menjadi ${newStock} ${item.unitLabel}`);
      onClose();
    } catch (error: any) {
      toast.error('Gagal menyesuaikan stok: ' + (error.message || error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <FaClipboardCheck size={20} />
            </div>
            <div>
              <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider block">
                Hitung Fisik / Koreksi Lemari
              </span>
              <h3 className="text-lg font-bold text-white leading-tight">
                Penyesuaian Stok {item.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Dual Inputs: Stok Lama (Yang Sedang Tampil) & Input Stok Baru */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              {/* Box 1: Stok Lama di Lemari (Yang sudah tampil) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Stok Tampil
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
                    onChange={(e) => setBaseOldStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-2xl font-black text-slate-800 outline-none text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5 text-center block">
                  Di Lemari: {item.clean} {item.unitLabel}
                </span>
              </div>

              {/* Box 2: Input Stok Baru di Lemari */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                    Fisik Baru
                  </span>
                  <span className="text-[9px] bg-blue-200/80 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                    Hasil Hitung
                  </span>
                </div>
                <div>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border-2 border-blue-500 rounded-xl px-2 py-1.5 text-2xl font-black text-blue-900 outline-none text-center focus:ring-2 focus:ring-blue-200 transition-all"
                    autoFocus
                  />
                </div>
                <span className="text-[10px] text-blue-600/70 mt-1.5 text-center block">
                  Hitungan lemari saat ini
                </span>
              </div>
            </div>

            {/* Quick Adjustment Chips */}
            <div className="flex items-center gap-1.5 pt-1">
              {[-5, -1, 1, 5, 10].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleQuickAdd(delta)}
                  className={`flex-1 py-1.5 font-bold text-xs rounded-xl transition-all active:scale-95 border ${
                    delta < 0
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setBaseOldStock(item.clean);
                  setNewStock(item.clean);
                }}
                className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-colors border border-slate-200"
              >
                Reset
              </button>
            </div>

            {/* Status & Perubahan Selisih */}
            <div className={`rounded-2xl p-3.5 border transition-all ${
              diff === 0
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : diff > 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider block">
                    {diff === 0 ? 'Tidak Ada Perubahan' : diff > 0 ? 'Penambahan Fisik Lemari' : 'Pengurangan Fisik Lemari'}
                  </span>
                  <span className="text-xs">
                    {baseOldStock} &rarr; <strong>{newStock} {item.unitLabel}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold block uppercase text-slate-500">Selisih:</span>
                  <span className={`text-base font-black ${
                    diff === 0 ? 'text-slate-600' : diff > 0 ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {diff > 0 ? `+${diff}` : diff} {item.unitLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields: Petugas & Catatan */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">
                Nama Petugas / Perawat
              </label>
              <input
                type="text"
                placeholder="Contoh: Ns. Siti / Bidan Rina"
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase">
                Catatan / Alasan Penyesuaian
              </label>
              <input
                type="text"
                placeholder="Contoh: Hitung fisik pagi / Penyesuaian serah terima shift"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 text-sm outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FaSave />
                  <span>Simpan Stok Baru</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

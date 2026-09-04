import React, { useState } from 'react';
import { createLinenItem, CreateLinenItemParams } from '../../../services/linenService';
import { 
  FaTimes, 
  FaPlus, 
  FaBed, 
  FaLayerGroup, 
  FaBoxes, 
  FaCheckCircle,
  FaShieldAlt
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface CreateLinenModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitId: string;
  unitName: string;
}

interface ItemPreset {
  name: string;
  unit: string;
  icon: 'bed' | 'layer' | 'cube';
  total: number;
  min: number;
  critical: number;
}

const PRESET_SUGGESTIONS: ItemPreset[] = [
  { name: 'Sprei Bed Pasien', unit: 'pcs', icon: 'bed', total: 30, min: 8, critical: 4 },
  { name: 'Sarung Bantal', unit: 'pcs', icon: 'layer', total: 40, min: 10, critical: 5 },
  { name: 'Baju Pasien IGD', unit: 'pcs', icon: 'cube', total: 25, min: 6, critical: 3 },
  { name: 'Duk Operasi / Tirai', unit: 'pcs', icon: 'layer', total: 15, min: 4, critical: 2 },
  { name: 'Handuk Pasien', unit: 'pcs', icon: 'layer', total: 20, min: 5, critical: 2 },
  { name: 'Sarung Guling', unit: 'pcs', icon: 'layer', total: 15, min: 4, critical: 2 }
];

export const CreateLinenModal: React.FC<CreateLinenModalProps> = ({
  isOpen,
  onClose,
  unitId,
  unitName
}) => {
  const [name, setName] = useState<string>('');
  const [unitLabel, setUnitLabel] = useState<string>('pcs');
  const [icon, setIcon] = useState<'bed' | 'layer' | 'cube'>('bed');
  const [totalOwned, setTotalOwned] = useState<number>(20);
  const [minStock, setMinStock] = useState<number>(5);
  const [criticalStock, setCriticalStock] = useState<number>(2);
  const [notes, setNotes] = useState<string>('');
  const [actorName, setActorName] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: ItemPreset) => {
    setName(preset.name);
    setUnitLabel(preset.unit);
    setIcon(preset.icon);
    setTotalOwned(preset.total);
    setMinStock(preset.min);
    setCriticalStock(preset.critical);
    setNotes(`Pengadaan awal item baru ${preset.name}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama jenis linen wajib diisi');
      return;
    }

    if (totalOwned <= 0) {
      toast.error('Jumlah total kepemilikan minimal 1 pcs');
      return;
    }

    if (minStock < 0 || criticalStock < 0) {
      toast.error('Batas ambang stok tidak boleh bernilai negatif');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateLinenItemParams = {
        name: name.trim(),
        unitLabel: unitLabel.trim() || 'pcs',
        icon,
        totalOwned,
        minStock,
        criticalStock,
        notes: notes.trim() || `Penambahan item baru: ${name.trim()} (${totalOwned} ${unitLabel})`,
        actor: actorName.trim() || `Administrator ${unitName}`
      };

      await createLinenItem(unitId, payload);
      toast.success(`Jenis linen "${name.trim()}" berhasil ditambahkan ke inventaris!`);
      
      // Reset form
      setName('');
      setUnitLabel('pcs');
      setIcon('bed');
      setTotalOwned(20);
      setMinStock(5);
      setCriticalStock(2);
      setNotes('');
      setActorName('');
      
      onClose();
    } catch (error: any) {
      console.error('Gagal menambahkan item linen:', error);
      toast.error(error.message || 'Gagal menambahkan jenis linen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FaPlus size={16} />
            </div>
            <div>
              <span className="text-[10px] text-blue-300 font-black uppercase tracking-wider block">
                Master Inventaris • Unit {unitName}
              </span>
              <h3 className="text-base sm:text-lg font-black leading-tight">
                Tambah Jenis Linen Baru
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          
          {/* Quick Preset Suggestions */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">
              Template Rekomendasi Cepat:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SUGGESTIONS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-all text-left flex items-center gap-1 active:scale-95 cursor-pointer"
                >
                  <span>+</span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nama Linen & Satuan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Jenis Linen <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Misal: Sprei Pasien / Sarung Bantal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-600 font-bold text-sm outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Satuan
              </label>
              <select
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-600 font-bold text-sm outline-none bg-white transition-colors cursor-pointer"
              >
                <option value="pcs">pcs</option>
                <option value="lbr">lbr (lembar)</option>
                <option value="set">set</option>
                <option value="roll">roll</option>
              </select>
            </div>
          </div>

          {/* Pilihan Ikon */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ikon Tampilan:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setIcon('bed')}
                className={`p-2.5 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  icon === 'bed'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FaBed size={15} />
                <span>Tempat Tidur</span>
              </button>

              <button
                type="button"
                onClick={() => setIcon('layer')}
                className={`p-2.5 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  icon === 'layer'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FaLayerGroup size={15} />
                <span>Lapisan / Perlak</span>
              </button>

              <button
                type="button"
                onClick={() => setIcon('cube')}
                className={`p-2.5 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  icon === 'cube'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FaBoxes size={15} />
                <span>Paket / Baju</span>
              </button>
            </div>
          </div>

          {/* Jumlah Kepemilikan & Ambang Batas */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Target Kepemilikan (Total Milik) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                  {totalOwned} {unitLabel}
                </span>
              </div>
              <input
                type="number"
                min={1}
                required
                value={totalOwned}
                onChange={(e) => setTotalOwned(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-600 font-black text-lg text-slate-900 bg-white outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Stok awal akan otomatis dimasukkan 100% sebagai stok <strong>Bersih di Lemari</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                  <FaShieldAlt size={11} className="text-amber-600" />
                  <span>Batas Aman (Min)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={minStock}
                  onChange={(e) => setMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-amber-500 font-bold text-sm bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-800 mb-1 flex items-center gap-1">
                  <FaShieldAlt size={11} className="text-rose-600" />
                  <span>Batas Kritis</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={criticalStock}
                  onChange={(e) => setCriticalStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 focus:border-rose-500 font-bold text-sm bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Petugas & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Petugas Penanggung Jawab
              </label>
              <input
                type="text"
                placeholder={`Administrator ${unitName}`}
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-600 text-xs font-semibold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Pengadaan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Pengadaan Baru RS"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-600 text-xs font-semibold outline-none"
              />
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
            <FaCheckCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Sinkronisasi Otomatis</span>
              <span className="text-[11px] text-emerald-800">
                Item baru ini akan langsung muncul di Layar Operasional Lemari IGD, Monitoring Laundry, Laporan Harian/Bulanan, serta Kode QR.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all cursor-pointer"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FaPlus size={12} />
                  <span>Tambahkan Jenis Linen</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { LinenSettings } from '../../../types/linen';
import { updateLinenSettings } from '../../../services/linenService';
import toast from 'react-hot-toast';
import { FaCog, FaTimes, FaSave, FaSlidersH, FaClock } from 'react-icons/fa';

interface LinenSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LinenSettings;
  onSuccess?: () => void;
}

export const LinenSettingsModal: React.FC<LinenSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<LinenSettings>(settings);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
      setLoading(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateLinenSettings(formData);
      toast.success('Pengaturan threshold & shift berhasil disimpan!', {
        icon: '⚙️',
        duration: 3000,
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      toast.error('Gagal menyimpan pengaturan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-primary text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FaCog size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Pengaturan Linen IGD</h3>
              <p className="text-xs text-blue-200">Konfigurasi Batas Stok & Jam Shift Kerja</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Threshold Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-gray-700 uppercase tracking-wider">
              <FaSlidersH />
              <span>Batas Status Stok (Threshold)</span>
            </div>

            {/* Selimut */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
              <span className="font-bold text-sm text-gray-800 block">Selimut (Total Aset 39)</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-gray-500 font-semibold block mb-1">Batas AMAN (&gt;= pcs)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.thresholds.selimut.safe}
                    onChange={(e) => setFormData({
                      ...formData,
                      thresholds: {
                        ...formData.thresholds,
                        selimut: { ...formData.thresholds.selimut, safe: parseInt(e.target.value, 10) || 0 },
                      },
                    })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="text-gray-500 font-semibold block mb-1">Batas MENIPIS (&gt;= pcs)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.thresholds.selimut.warning}
                    onChange={(e) => setFormData({
                      ...formData,
                      thresholds: {
                        ...formData.thresholds,
                        selimut: { ...formData.thresholds.selimut, warning: parseInt(e.target.value, 10) || 0 },
                      },
                    })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-amber-700"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400">Di bawah batas menipis otomatis berstatus <strong>KRITIS (Merah)</strong>.</p>
            </div>

            {/* Perlak */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
              <span className="font-bold text-sm text-gray-800 block">Perlak (Total Aset 10)</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-gray-500 font-semibold block mb-1">Batas AMAN (&gt;= pcs)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.thresholds.perlak.safe}
                    onChange={(e) => setFormData({
                      ...formData,
                      thresholds: {
                        ...formData.thresholds,
                        perlak: { ...formData.thresholds.perlak, safe: parseInt(e.target.value, 10) || 0 },
                      },
                    })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="text-gray-500 font-semibold block mb-1">Batas MENIPIS (&gt;= pcs)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.thresholds.perlak.warning}
                    onChange={(e) => setFormData({
                      ...formData,
                      thresholds: {
                        ...formData.thresholds,
                        perlak: { ...formData.thresholds.perlak, warning: parseInt(e.target.value, 10) || 0 },
                      },
                    })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-amber-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Shift Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-gray-700 uppercase tracking-wider">
              <FaClock />
              <span>Jam Pergantian Shift (WIB - Asia/Jakarta)</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-primary block mb-2">Shift Pagi</span>
                <input
                  type="time"
                  value={formData.shifts.pagi.start}
                  onChange={(e) => setFormData({
                    ...formData,
                    shifts: { ...formData.shifts, pagi: { ...formData.shifts.pagi, start: e.target.value } },
                  })}
                  className="w-full text-center text-xs p-1 bg-white border border-gray-200 rounded-lg mb-1"
                />
                <span className="text-[10px] text-gray-400 block text-center">s/d</span>
                <input
                  type="time"
                  value={formData.shifts.pagi.end}
                  onChange={(e) => setFormData({
                    ...formData,
                    shifts: { ...formData.shifts, pagi: { ...formData.shifts.pagi, end: e.target.value } },
                  })}
                  className="w-full text-center text-xs p-1 bg-white border border-gray-200 rounded-lg mt-1"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-amber-600 block mb-2">Shift Sore</span>
                <input
                  type="time"
                  value={formData.shifts.sore.start}
                  onChange={(e) => setFormData({
                    ...formData,
                    shifts: { ...formData.shifts, sore: { ...formData.shifts.sore, start: e.target.value } },
                  })}
                  className="w-full text-center text-xs p-1 bg-white border border-gray-200 rounded-lg mb-1"
                />
                <span className="text-[10px] text-gray-400 block text-center">s/d</span>
                <input
                  type="time"
                  value={formData.shifts.sore.end}
                  onChange={(e) => setFormData({
                    ...formData,
                    shifts: { ...formData.shifts, sore: { ...formData.shifts.sore, end: e.target.value } },
                  })}
                  className="w-full text-center text-xs p-1 bg-white border border-gray-200 rounded-lg mt-1"
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-bold text-indigo-700 block mb-2">Shift Malam</span>
                <input
                  type="time"
                  value={formData.shifts.malam.start}
                  onChange={(e) => setFormData({
                    ...formData,
                    shifts: { ...formData.shifts, malam: { ...formData.shifts.malam, start: e.target.value } },
                  })}
                  className="w-full text-center text-xs p-1 bg-white border border-gray-200 rounded-lg mb-1"
                />
                <span className="text-[10px] text-gray-400 block text-center">s/d</span>
                <input
                  type="time"
                  value={formData.shifts.malam.end}
                  onChange={(e) => setFormData({
                    ...formData,
                    shifts: { ...formData.shifts, malam: { ...formData.shifts.malam, end: e.target.value } },
                  })}
                  className="w-full text-center text-xs p-1 bg-white border border-gray-200 rounded-lg mt-1"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-sm cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 py-3 px-4 rounded-2xl bg-primary hover:bg-blue-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <FaSave size={16} />
              <span>{loading ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

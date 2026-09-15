import React, { useState, useMemo } from 'react';
import {
  FaTimes,
  FaFileExcel,
  FaFilePdf,
  FaDownload,
  FaCalendarAlt,
  FaCheckCircle,
  FaInfoCircle,
  FaRoute,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { AmbulanceExpedition } from '../../types/ambulance';
import {
  INDONESIAN_MONTHS,
  filterMonthlyExpeditions,
  generateAmbulanceMonthlyExcel,
  generateAmbulanceMonthlyPdf,
} from '../../services/ambulanceReportGenerator';

interface AmbulanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expeditions: AmbulanceExpedition[];
}

export const AmbulanceReportModal: React.FC<AmbulanceReportModalProps> = ({
  isOpen,
  onClose,
  expeditions,
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [formatType, setFormatType] = useState<'XLSX' | 'PDF'>('XLSX');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter kegiatan pada bulan terpilih
  const monthlyData = useMemo(() => {
    return filterMonthlyExpeditions(expeditions, selectedMonth, selectedYear);
  }, [expeditions, selectedMonth, selectedYear]);

  const totalKm = useMemo(() => {
    return monthlyData.reduce((acc, c) => acc + (Number(c.distanceKm) || 0), 0);
  }, [monthlyData]);

  const monthLabel = INDONESIAN_MONTHS.find((m) => m.value === selectedMonth)?.label || String(selectedMonth);

  // List tahun (2 tahun ke belakang dan 2 tahun ke depan)
  const yearOptions = useMemo(() => {
    const currentY = currentDate.getFullYear();
    return [currentY - 2, currentY - 1, currentY, currentY + 1, currentY + 2];
  }, []);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setIsGenerating(true);

      const params = {
        expeditions,
        month: selectedMonth,
        year: selectedYear,
        hospitalName: 'PRIMAYA HOSPITAL',
        unitName: 'INSTALASI GAWAT DARURAT (IGD)',
        printedBy: 'Petugas Admin Ambulance IGD',
      };

      if (formatType === 'XLSX') {
        generateAmbulanceMonthlyExcel(params);
        toast.success(`Laporan Excel (.xlsx) periode ${monthLabel} ${selectedYear} berhasil diunduh!`);
      } else {
        generateAmbulanceMonthlyPdf(params);
        toast.success(`Laporan PDF resmi periode ${monthLabel} ${selectedYear} berhasil diunduh!`);
      }

      onClose();
    } catch (error) {
      console.error('Failed to generate monthly ambulance report:', error);
      toast.error('Gagal mengunduh laporan bulanan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col my-8 animate-scaleUp">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-primary text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <FaDownload size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Unduh Laporan Bulanan</h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Pilih periode bulan dan format dokumen (Excel / PDF)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* 1. Pemilihan Periode Bulan & Tahun */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <FaCalendarAlt className="text-primary" size={12} />
              <span>1. Pilih Periode Bulan & Tahun</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-gray-500 font-semibold mb-1 block">Bulan</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full h-10 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer font-semibold text-gray-800"
                >
                  {INDONESIAN_MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[11px] text-gray-500 font-semibold mb-1 block">Tahun</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full h-10 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer font-semibold text-gray-800"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Preview Ringkasan Data Periode Terpilih */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Data Periode: {monthLabel} {selectedYear}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-base font-extrabold text-slate-800">
                  {monthlyData.length} Kegiatan
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                  <FaRoute size={10} />
                  {totalKm} KM Total
                </span>
              </div>
            </div>
            {monthlyData.length > 0 ? (
              <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-1">
                <FaCheckCircle size={11} /> Siap Diunduh
              </span>
            ) : (
              <span className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
                Data Kosong
              </span>
            )}
          </div>

          {/* 3. Pilihan Format File */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              2. Pilih Format Dokumen
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Card Excel */}
              <button
                type="button"
                onClick={() => setFormatType('XLSX')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  formatType === 'XLSX'
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <FaFileExcel size={20} />
                  </div>
                  {formatType === 'XLSX' && (
                    <FaCheckCircle className="text-emerald-600" size={16} />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Excel (.xlsx)</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    13 Kolom + Lembar Panduan Pengisian resmi
                  </p>
                </div>
              </button>

              {/* Card PDF */}
              <button
                type="button"
                onClick={() => setFormatType('PDF')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  formatType === 'PDF'
                    ? 'border-red-500 bg-red-50/60 shadow-xs ring-2 ring-red-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                    <FaFilePdf size={20} />
                  </div>
                  {formatType === 'PDF' && (
                    <FaCheckCircle className="text-red-600" size={16} />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">PDF (.pdf)</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Landscape A4, Kop Surat RS & Kolom Pengesahan
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 4. Info 13 Kolom Sesuai Spesifikasi */}
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
            <FaInfoCircle className="text-primary mt-0.5 shrink-0" size={13} />
            <p className="text-[11px]">
              Laporan memuat <strong>13 kolom resmi</strong>: No, Tanggal, Jenis Kegiatan, Identitas Pasien, Status Awal, Status Akhir, Ambulans yang Digunakan, Waktu Mulai, Waktu Selesai, Durasi, Jarak Tempuh (Km), Driver, dan Keterangan Tambahan.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 ${
              formatType === 'XLSX'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <FaDownload size={12} />
            <span>
              {isGenerating
                ? 'Sedang Memproses...'
                : `Unduh ${formatType} (${monthLabel} ${selectedYear})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

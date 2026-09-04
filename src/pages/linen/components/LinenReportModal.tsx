import React, { useState } from 'react';
import { LinenItem } from '../../../types/linen';
import { fetchLinenTransactionsByRange } from '../../../services/linenService';
import { generateLinenExcelReport, generateLinenPdfReport } from '../../../services/linenReportGenerator';
import { FaTimes, FaFilePdf, FaFileExcel, FaDownload, FaCalendarDay, FaCalendarAlt, FaCalendarWeek, FaCheckCircle, FaHospital } from 'react-icons/fa';
import { format, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface LinenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LinenItem[];
  unitId?: string;
  unitName?: string;
}

export const LinenReportModal: React.FC<LinenReportModalProps> = ({
  isOpen,
  onClose,
  items,
  unitId = 'igd',
  unitName = 'Instalasi Gawat Darurat (IGD)'
}) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentMonthStr = format(new Date(), 'yyyy-MM');

  const [formatType, setFormatType] = useState<'PDF' | 'XLSX'>('PDF');
  const [periodType, setPeriodType] = useState<'DAILY' | 'MONTHLY' | 'CUSTOM'>('DAILY');
  
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [customStartDate, setCustomStartDate] = useState<string>(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [printedByName, setPrintedByName] = useState<string>('Administrator Linen IGD');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  // Shortcut setters
  const setQuickDay = (day: 'TODAY' | 'YESTERDAY') => {
    if (day === 'TODAY') {
      setSelectedDate(todayStr);
    } else {
      setSelectedDate(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
    }
  };

  const setQuickMonth = (month: 'CURRENT' | 'PREVIOUS') => {
    if (month === 'CURRENT') {
      setSelectedMonth(currentMonthStr);
    } else {
      setSelectedMonth(format(subMonths(new Date(), 1), 'yyyy-MM'));
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;
      let periodLabel = '';

      if (periodType === 'DAILY') {
        const [year, month, day] = selectedDate.split('-').map(Number);
        startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        periodLabel = format(startDate, 'd MMMM yyyy', { locale: id });
      } else if (periodType === 'MONTHLY') {
        const [year, month] = selectedMonth.split('-').map(Number);
        const refDate = new Date(year, month - 1, 1);
        startDate = startOfMonth(refDate);
        endDate = endOfMonth(refDate);
        endDate.setHours(23, 59, 59, 999);
        periodLabel = format(refDate, 'MMMM yyyy', { locale: id });
      } else {
        const [sy, sm, sd] = customStartDate.split('-').map(Number);
        const [ey, em, ed] = customEndDate.split('-').map(Number);
        startDate = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        endDate = new Date(ey, em - 1, ed, 23, 59, 59, 999);
        periodLabel = `${format(startDate, 'd MMM yyyy', { locale: id })} - ${format(endDate, 'd MMM yyyy', { locale: id })}`;
      }

      // Fetch all transactions in date range
      const transactions = await fetchLinenTransactionsByRange(unitId, startDate, endDate);

      const params = {
        periodType,
        periodLabel,
        startDate,
        endDate,
        unitName,
        hospitalName: 'PRIMAYA HOSPITAL',
        printedBy: printedByName.trim() || 'Administrator Linen IGD',
        items,
        transactions,
        includeSignatures
      };

      if (formatType === 'PDF') {
        generateLinenPdfReport(params);
        toast.success(`Laporan PDF (${periodLabel}) berhasil diunduh!`);
      } else {
        generateLinenExcelReport(params);
        toast.success(`Laporan Excel XLSX (${periodLabel}) berhasil diunduh!`);
      }

      onClose();
    } catch (err: any) {
      console.error('Error generating report:', err);
      toast.error('Gagal mengunduh laporan: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-200 max-h-[92vh] flex flex-col">
        
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <FaHospital size={20} />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-300 font-bold block w-fit">
                Standar Pelaporan Rumah Sakit
              </span>
              <h3 className="text-lg font-bold text-white leading-tight mt-0.5">
                Unduh Laporan Mutasi Linen
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">

          {/* 1. Pilih Format Laporan (PDF vs Excel) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              1. Pilih Format File
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormatType('PDF')}
                className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                  formatType === 'PDF'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  formatType === 'PDF' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-600'
                }`}>
                  <FaFilePdf size={20} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm leading-tight">Dokumen PDF</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Kop Resmi & Siap Cetak</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormatType('XLSX')}
                className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all cursor-pointer ${
                  formatType === 'XLSX'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  formatType === 'XLSX' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <FaFileExcel size={20} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm leading-tight">Excel (.xlsx)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Multi-Sheet & Tabular</div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Pilih Periode Laporan (Harian / Bulanan / Rentang) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              2. Pilih Periode Laporan
            </label>
            <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold gap-1 mb-3">
              <button
                type="button"
                onClick={() => setPeriodType('DAILY')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  periodType === 'DAILY'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FaCalendarDay size={13} />
                <span>Harian</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('MONTHLY')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  periodType === 'MONTHLY'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FaCalendarAlt size={13} />
                <span>Bulanan</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('CUSTOM')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  periodType === 'CUSTOM'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FaCalendarWeek size={13} />
                <span>Kustom</span>
              </button>
            </div>

            {/* Input sesuai Periode */}
            {periodType === 'DAILY' && (
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="input-date" className="text-xs font-bold text-slate-600">
                    Pilih Tanggal:
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuickDay('TODAY')}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-slate-700"
                    >
                      Hari Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDay('YESTERDAY')}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-slate-700"
                    >
                      Kemarin
                    </button>
                  </div>
                </div>
                <input
                  id="input-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>
            )}

            {periodType === 'MONTHLY' && (
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="input-month" className="text-xs font-bold text-slate-600">
                    Pilih Bulan & Tahun:
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuickMonth('CURRENT')}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-slate-700"
                    >
                      Bulan Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickMonth('PREVIOUS')}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-200 hover:bg-blue-50 text-slate-700"
                    >
                      Bulan Lalu
                    </button>
                  </div>
                </div>
                <input
                  id="input-month"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>
            )}

            {periodType === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label htmlFor="input-start-date" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Dari Tanggal:
                  </label>
                  <input
                    id="input-start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:border-blue-600 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="input-end-date" className="block text-[11px] font-bold text-slate-600 mb-1">
                    Sampai Tanggal:
                  </label>
                  <input
                    id="input-end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Pengaturan Tambahan */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div>
              <label htmlFor="input-printed-by" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Nama Petugas Pencetak
              </label>
              <input
                id="input-printed-by"
                type="text"
                value={printedByName}
                onChange={(e) => setPrintedByName(e.target.value)}
                placeholder="Contoh: Administrator Linen IGD"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-xs font-semibold outline-none"
              />
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">Sertakan Lembar Tanda Tangan & Pengesahan</span>
                <span className="text-[11px] text-slate-500">
                  Mencakup kolom tanda tangan PJ Linen IGD, Kepala Ruangan IGD, dan PJ Laundry.
                </span>
              </div>
            </label>
          </div>

          {/* Report Overview Box */}
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FaCheckCircle className="text-blue-600 text-base shrink-0" />
              <div>
                <div className="font-bold">Standar Laporan Siap Unduh</div>
                <div className="text-[11px] text-blue-700">
                  Mencakup rekapitulasi {items.length} jenis linen & seluruh riwayat mutasi.
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-white rounded-lg border border-blue-200 font-bold text-[11px] text-blue-800">
              {formatType}
            </span>
          </div>

        </div>

        {/* Action Buttons Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 ${
              formatType === 'PDF'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Menyiapkan Laporan...</span>
              </>
            ) : (
              <>
                <FaDownload size={13} />
                <span>Unduh Laporan ({formatType})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

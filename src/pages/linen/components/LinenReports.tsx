import React, { useState, useEffect } from 'react';
import { LinenTransaction, LinenItemType } from '../../../types/linen';
import { getTransactionsForReport } from '../../../services/linenService';
import { getJakartaDateInfo } from '../../../utils/linenUtils';
import toast from 'react-hot-toast';
import { FaFileDownload, FaCalendarDay, FaCalendarAlt } from 'react-icons/fa';

export const LinenReports: React.FC = () => {
  const [reportType, setReportType] = useState<'DAILY' | 'MONTHLY'>('DAILY');
  const [selectedDate, setSelectedDate] = useState<string>(getJakartaDateInfo().dateString);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const { dateString } = getJakartaDateInfo();
    return dateString.substring(0, 7); // YYYY-MM
  });

  // Filters
  const [filterShift, setFilterShift] = useState<string>('ALL');
  const [filterItem, setFilterItem] = useState<string>('ALL');
  const [filterUser, setFilterUser] = useState<string>('');

  const [transactions, setTransactions] = useState<LinenTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch report data when date / month changes
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        let start = '';
        let end = '';

        if (reportType === 'DAILY') {
          start = selectedDate;
          end = selectedDate;
        } else {
          start = `${selectedMonth}-01`;
          end = `${selectedMonth}-31`;
        }

        const data = await getTransactionsForReport(start, end);
        setTransactions(data);
      } catch (error) {
        console.error('Failed to load report transactions:', error);
        toast.error('Gagal mengambil data laporan.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportType, selectedDate, selectedMonth]);

  // Apply in-memory filters for daily
  const filteredTransactions = transactions.filter(t => {
    if (filterShift !== 'ALL' && t.shift !== filterShift) return false;
    if (filterItem !== 'ALL' && t.itemType !== filterItem) return false;
    if (filterUser.trim() && !t.userName.toLowerCase().includes(filterUser.toLowerCase())) return false;
    return true;
  });

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = ['ID Transaksi', 'Tanggal', 'Jam (WIB)', 'Shift', 'Jenis Linen', 'Tipe Transaksi', 'Jumlah (pcs)', 'Petugas', 'Role', 'Catatan'];
    
    const rows = filteredTransactions.map(t => {
      const timeStr = t.timestamp && (t.timestamp as any).toDate 
        ? new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }).format((t.timestamp as any).toDate())
        : '--:--';

      return [
        `"${t.id}"`,
        `"${t.date}"`,
        `"${timeStr}"`,
        `"${t.shift}"`,
        `"${t.itemType.toUpperCase()}"`,
        `"${t.transactionType}"`,
        t.quantity,
        `"${t.userName}"`,
        `"${t.userRole}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Linen_${reportType === 'DAILY' ? selectedDate : selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('File CSV berhasil diunduh!');
  };

  // Monthly Matrix calculation (Days 1 to 31)
  const daysInMonth = 31;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getMonthlyAggregate = (item: LinenItemType, day: number, type: 'OUT' | 'DIRTY' | 'RETURN') => {
    const dayStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
    const dayTrxs = transactions.filter(t => t.date === dayStr && t.itemType === item);

    if (type === 'OUT') {
      return dayTrxs.filter(t => t.transactionType === 'NURSE_PICKUP').reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    } else if (type === 'DIRTY') {
      return dayTrxs.filter(t => t.transactionType === 'DIRTY_COLLECTION').reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    } else {
      return dayTrxs.filter(t => t.transactionType === 'LAUNDRY_RETURN').reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-800">Laporan & Audit Linen IGD</h3>
          <p className="text-xs text-gray-400">Rekapitulasi mutasi harian dan matriks bulanan</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="bg-gray-100 p-1 rounded-2xl flex gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setReportType('DAILY')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                reportType === 'DAILY' ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaCalendarDay size={13} />
              <span>Harian</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('MONTHLY')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                reportType === 'MONTHLY' ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaCalendarAlt size={13} />
              <span>Bulanan</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <FaFileDownload size={13} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 flex flex-wrap items-center gap-3 text-xs">
        {reportType === 'DAILY' ? (
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1">Pilih Tanggal</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium"
            />
          </div>
        ) : (
          <div>
            <label className="block text-[10px] font-bold text-gray-500 mb-1">Pilih Bulan</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium"
            />
          </div>
        )}

        {reportType === 'DAILY' && (
          <>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">Shift</label>
              <select
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium"
              >
                <option value="ALL">Semua Shift</option>
                <option value="Pagi">Pagi</option>
                <option value="Sore">Sore</option>
                <option value="Malam">Malam</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1">Jenis Linen</label>
              <select
                value={filterItem}
                onChange={(e) => setFilterItem(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary font-medium"
              >
                <option value="ALL">Semua Linen</option>
                <option value="selimut">Selimut</option>
                <option value="perlak">Perlak</option>
              </select>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-bold text-gray-500 mb-1">Cari Petugas</label>
              <input
                type="text"
                placeholder="Nama petugas..."
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
          </>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400 animate-pulse">Menyiapkan laporan...</div>
      ) : reportType === 'DAILY' ? (
        /* DAILY VIEW */
        filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            Tidak ada transaksi pada filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/70 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-3">Jam (WIB)</th>
                  <th className="py-3 px-3">Shift</th>
                  <th className="py-3 px-3">Petugas</th>
                  <th className="py-3 px-3">Jenis Linen</th>
                  <th className="py-3 px-3">Aktivitas</th>
                  <th className="py-3 px-3 text-right">Jumlah</th>
                  <th className="py-3 px-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((t) => {
                  const time = t.timestamp && (t.timestamp as any).toDate
                    ? new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }).format((t.timestamp as any).toDate())
                    : '--:--';

                  return (
                    <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-gray-700">{time}</td>
                      <td className="py-3 px-3 font-semibold">{t.shift}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-gray-800 block">{t.userName}</span>
                        <span className="text-[10px] text-gray-400">{t.userRole}</span>
                      </td>
                      <td className="py-3 px-3 font-bold uppercase">{t.itemType}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          t.transactionType === 'NURSE_PICKUP' ? 'bg-blue-100 text-blue-700' :
                          t.transactionType === 'DIRTY_COLLECTION' ? 'bg-amber-100 text-amber-700' :
                          t.transactionType === 'LAUNDRY_RETURN' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {t.transactionType === 'NURSE_PICKUP' ? 'Ambil Bersih' :
                           t.transactionType === 'DIRTY_COLLECTION' ? 'Pickup Kotor' :
                           t.transactionType === 'LAUNDRY_RETURN' ? 'Kembali Laundry' : 'Koreksi Stok'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-sm text-gray-800">
                        {t.quantity} pcs
                      </td>
                      <td className="py-3 px-3 text-gray-500 max-w-xs truncate">{t.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* MONTHLY VIEW (Horizontal Matrix 1..31) */
        <div className="space-y-4">
          <p className="text-xs text-gray-500 font-medium">
            Matriks pergerakan barang bulan <span className="font-bold text-gray-800">{selectedMonth}</span> (K: Keluar Bersih, T: Kotor Diambil, B: Bersih Kembali):
          </p>

          <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-xs">
            <table className="w-full text-center text-[11px] whitespace-nowrap">
              <thead className="bg-primary text-white font-bold">
                <tr>
                  <th className="py-3 px-4 text-left sticky left-0 bg-primary z-10">Item & Indikator</th>
                  {daysArray.map((day) => (
                    <th key={day} className="py-3 px-2 min-w-[34px] border-l border-white/10">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {/* Selimut Rows */}
                <tr className="bg-blue-50/50 font-bold">
                  <td className="py-2.5 px-4 text-left text-primary sticky left-0 bg-blue-50 z-10">SELIMUT - Keluar Bersih</td>
                  {daysArray.map((day) => {
                    const val = getMonthlyAggregate('selimut', day, 'OUT');
                    return (
                      <td key={day} className={`py-2 px-1 border-l border-gray-100 ${val > 0 ? 'font-black text-blue-700 bg-blue-100/40' : 'text-gray-300'}`}>
                        {val || '-'}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="py-2.5 px-4 text-left text-amber-700 font-medium sticky left-0 bg-white z-10">SELIMUT - Kotor Diambil</td>
                  {daysArray.map((day) => {
                    const val = getMonthlyAggregate('selimut', day, 'DIRTY');
                    return (
                      <td key={day} className={`py-2 px-1 border-l border-gray-100 ${val > 0 ? 'font-black text-amber-700 bg-amber-50' : 'text-gray-300'}`}>
                        {val || '-'}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="py-2.5 px-4 text-left text-emerald-700 font-medium sticky left-0 bg-white z-10">SELIMUT - Kembali Laundry</td>
                  {daysArray.map((day) => {
                    const val = getMonthlyAggregate('selimut', day, 'RETURN');
                    return (
                      <td key={day} className={`py-2 px-1 border-l border-gray-100 ${val > 0 ? 'font-black text-emerald-700 bg-emerald-50' : 'text-gray-300'}`}>
                        {val || '-'}
                      </td>
                    );
                  })}
                </tr>

                {/* Perlak Rows */}
                <tr className="bg-indigo-50/50 font-bold border-t-2 border-gray-300">
                  <td className="py-2.5 px-4 text-left text-indigo-800 sticky left-0 bg-indigo-50 z-10">PERLAK - Keluar Bersih</td>
                  {daysArray.map((day) => {
                    const val = getMonthlyAggregate('perlak', day, 'OUT');
                    return (
                      <td key={day} className={`py-2 px-1 border-l border-gray-100 ${val > 0 ? 'font-black text-indigo-700 bg-indigo-100/40' : 'text-gray-300'}`}>
                        {val || '-'}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="py-2.5 px-4 text-left text-amber-700 font-medium sticky left-0 bg-white z-10">PERLAK - Kotor Diambil</td>
                  {daysArray.map((day) => {
                    const val = getMonthlyAggregate('perlak', day, 'DIRTY');
                    return (
                      <td key={day} className={`py-2 px-1 border-l border-gray-100 ${val > 0 ? 'font-black text-amber-700 bg-amber-50' : 'text-gray-300'}`}>
                        {val || '-'}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="py-2.5 px-4 text-left text-emerald-700 font-medium sticky left-0 bg-white z-10">PERLAK - Kembali Laundry</td>
                  {daysArray.map((day) => {
                    const val = getMonthlyAggregate('perlak', day, 'RETURN');
                    return (
                      <td key={day} className={`py-2 px-1 border-l border-gray-100 ${val > 0 ? 'font-black text-emerald-700 bg-emerald-50' : 'text-gray-300'}`}>
                        {val || '-'}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

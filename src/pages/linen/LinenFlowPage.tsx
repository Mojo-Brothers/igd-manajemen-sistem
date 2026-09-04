import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { LinenItem, LinenTransaction, TransactionType } from '../../types/linen';
import { 
  seedInitialIgdLinen, 
  subscribeLinenItems, 
  getLinenStatusLevel,
  executeLinenTransition,
  subscribeRecentTransactions
} from '../../services/linenService';
import { LinenActionModal } from './components/LinenActionModal';
import { CoordinatorDashboard } from './components/CoordinatorDashboard';
import { LinenQrModal } from './components/LinenQrModal';
import { AdjustCleanModal } from './components/AdjustCleanModal';
import toast from 'react-hot-toast';
import { 
  FaHospital, 
  FaQrcode, 
  FaTruckLoading, 
  FaCheckDouble,
  FaBed,
  FaLayerGroup,
  FaArrowLeft,
  FaEdit,
  FaBroom,
  FaHistory
} from 'react-icons/fa';

interface LinenFlowPageProps {
  initialRole?: 'IGD' | 'LAUNDRY';
}

export const LinenFlowPage: React.FC<LinenFlowPageProps> = ({ initialRole }) => {
  const location = useLocation();
  const isInsideAdmin = location.pathname.startsWith('/admin');
  const [searchParams] = useSearchParams();
  const unitParam = (searchParams.get('unit') || 'IGD').toUpperCase();
  const tabParam = searchParams.get('tab');
  const activeTab: 'OPERATIONAL' | 'COORDINATOR' = tabParam === 'coordinator' ? 'COORDINATOR' : 'OPERATIONAL';

  // Determine if this is the dedicated Laundry page or IGD page
  const isLaundry = Boolean(
    initialRole === 'LAUNDRY' ||
    location.pathname.includes('/laundry') ||
    searchParams.get('role')?.toUpperCase() === 'LAUNDRY'
  );

  const operationalRole: 'IGD' | 'LAUNDRY' = isLaundry ? 'LAUNDRY' : 'IGD';
  const activeUnit = unitParam;
  const [items, setItems] = useState<LinenItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionModalRole, setActionModalRole] = useState<'IGD' | 'LAUNDRY'>('IGD');
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [actionModalType, setActionModalType] = useState<TransactionType>('LAUNDRY_PICKUP');
  const [actionModalItemId, setActionModalItemId] = useState<string | undefined>();
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [adjustingItem, setAdjustingItem] = useState<LinenItem | null>(null);

  // Laundry batch confirmation loading
  const [laundryReturning, setLaundryReturning] = useState<boolean>(false);
  const [recentTransactions, setRecentTransactions] = useState<LinenTransaction[]>([]);

  const unitId = activeUnit.toLowerCase();

  useEffect(() => {
    // Seed initial IGD data if not present
    seedInitialIgdLinen(unitId);

    // Subscribe to real-time updates
    const unsubItems = subscribeLinenItems(unitId, (updatedItems) => {
      setItems(updatedItems);
      setLoading(false);
    });

    // Subscribe to recent user activity logs
    const unsubTx = subscribeRecentTransactions(unitId, (txs) => {
      setRecentTransactions(txs);
    }, 15);

    return () => {
      unsubItems();
      unsubTx();
    };
  }, [unitId]);

  // Determine overall status across all items
  const overallStatus = React.useMemo(() => {
    if (items.length === 0) return 'SAFE';
    const hasCritical = items.some(
      (i) => getLinenStatusLevel(i.clean, i.minStock, i.criticalStock) === 'CRITICAL'
    );
    if (hasCritical) return 'CRITICAL';

    const hasWarning = items.some(
      (i) => getLinenStatusLevel(i.clean, i.minStock, i.criticalStock) === 'WARNING'
    );
    if (hasWarning) return 'WARNING';

    return 'SAFE';
  }, [items]);

  // Open modal with specific action and role
  const handleOpenAction = (type: TransactionType, itemId?: string, role?: 'IGD' | 'LAUNDRY') => {
    setActionModalType(type);
    setActionModalItemId(itemId);
    setActionModalRole(role || operationalRole);
    setIsActionModalOpen(true);
  };


  // Batch confirm all clean linen (Terima Bersih in IGD / Kirim Bersih in Laundry)
  const handleConfirmAllLaundryReturn = async () => {
    const laundryItems = items.filter((i) => (i.laundry || 0) > 0);
    if (laundryItems.length === 0) {
      toast.error(
        operationalRole === 'LAUNDRY'
          ? 'Tidak ada linen yang siap dikirim di laundry.'
          : 'Tidak ada linen bersih dari laundry yang menunggu diterima.'
      );
      return;
    }

    setLaundryReturning(true);
    try {
      for (const item of laundryItems) {
        await executeLinenTransition({
          itemId: item.id,
          type: 'LAUNDRY_RETURN',
          quantity: item.laundry,
          actor: operationalRole === 'LAUNDRY' ? 'Petugas Laundry' : 'Perawat IGD',
          notes: operationalRole === 'LAUNDRY'
            ? 'Pengiriman serentak seluruh linen bersih dari laundry ke IGD'
            : 'Penerimaan serentak seluruh linen bersih dari laundry ke lemari IGD'
        });
      }
      toast.success(
        operationalRole === 'LAUNDRY'
          ? 'Seluruh linen bersih berhasil dikirim & diserahkan ke IGD!'
          : 'Seluruh linen bersih berhasil diterima kembali ke lemari IGD!'
      );
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses transaksi');
    } finally {
      setLaundryReturning(false);
    }
  };

  const totalLaundryItems = items.reduce((acc, curr) => acc + (curr.laundry || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">
      
      {/* Top Header Bar */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
              <FaHospital size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg tracking-tight leading-tight">
                  {operationalRole === 'IGD' ? 'LINENFLOW IGD' : 'LINENFLOW LAUNDRY'}
                </h1>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  operationalRole === 'IGD' ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                }`}>
                  {operationalRole === 'IGD' ? 'Khusus IGD' : 'Khusus Laundry'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Primaya Hospital • {operationalRole === 'IGD' ? 'Stasiun Lemari & Perawat IGD' : 'Stasiun Serah Terima Laundry IGD'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/10"
              title="Cetak Barcode/QR Lemari"
            >
              <FaQrcode size={16} />
              <span className="hidden sm:inline">QR Lemari</span>
            </button>
            {!isInsideAdmin && (
              <Link
                to="/admin"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors border border-white/10"
                title="Kembali ke Admin Panel"
              >
                <FaArrowLeft size={14} />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-xs border border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-slate-500">Memuat inventaris linen {activeUnit}...</p>
          </div>
        ) : activeTab === 'COORDINATOR' ? (
          /* TAB 2: COORDINATOR DASHBOARD */
          <CoordinatorDashboard 
            items={items} 
            unitId={unitId} 
            unitName={activeUnit} 
          />
        ) : (
          /* TAB 1: OPERATIONAL (3-CLICK UI) */
          <>
            {/* Global Status Banner */}
            <div className={`p-4 rounded-3xl border flex items-center justify-between gap-3 shadow-xs ${
              overallStatus === 'SAFE'
                ? 'bg-emerald-500/10 border-emerald-300 text-emerald-900'
                : overallStatus === 'WARNING'
                ? 'bg-amber-500/10 border-amber-300 text-amber-900'
                : 'bg-rose-500/10 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {overallStatus === 'SAFE' ? '🟢' : overallStatus === 'WARNING' ? '🟡' : '🔴'}
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black tracking-tight">
                    {overallStatus === 'SAFE' && 'STATUS LEMARI: AMAN'}
                    {overallStatus === 'WARNING' && 'STATUS LEMARI: MENIPIS'}
                    {overallStatus === 'CRITICAL' && 'STATUS LEMARI: KRITIS!'}
                  </h2>
                  <p className="text-xs opacity-80">
                    {overallStatus === 'SAFE' && 'Ketersediaan stok bersih di lemari IGD berada di atas batas aman.'}
                    {overallStatus === 'WARNING' && 'Ada stok linen bersih yang mendekati batas minimum.'}
                    {overallStatus === 'CRITICAL' && 'Stok bersih sangat sedikit! Segera minta drop dari laundry.'}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono font-bold bg-white/80 px-2.5 py-1 rounded-full shadow-2xs">
                  {items.length} Jenis Linen
                </span>
              </div>
            </div>

            {/* Section 1: STOK LINEN BERSIH DI LEMARI IGD */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Stok Bersih di Lemari IGD
                </h3>
                <span className="text-xs text-slate-400">
                  Real-time Sync
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item) => {
                  const statusLevel = getLinenStatusLevel(item.clean, item.minStock, item.criticalStock);
                  const percent = Math.min(100, Math.round(((item.clean || 0) / (item.totalOwned || 1)) * 100));

                  return (
                    <div 
                      key={item.id}
                      className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Top status indicator */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            {item.name.toLowerCase().includes('selimut') ? <FaBed size={16} /> : <FaLayerGroup size={16} />}
                          </div>
                          <div>
                            <h4 className="font-black text-base text-slate-900">{item.name}</h4>
                            <span className="text-[11px] text-slate-400">Total Milik: {item.totalOwned} {item.unitLabel}</span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                          statusLevel === 'SAFE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : statusLevel === 'WARNING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {statusLevel === 'SAFE' ? '🟢 AMAN' : statusLevel === 'WARNING' ? '🟡 MENIPIS' : '🔴 KRITIS'}
                        </span>
                      </div>

                      {/* Giant Number & Quick Adjust Button */}
                      <div className="my-2 flex items-center justify-between">
                        <div>
                          <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
                            {item.clean}
                          </span>
                          <span className="ml-2 text-sm font-bold text-slate-400 uppercase">
                            {item.unitLabel} Bersih
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setAdjustingItem(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold border border-slate-200 transition-all hover:border-blue-300 active:scale-95 shadow-2xs"
                          title={`Koreksi / Input Stok Baru ${item.name}`}
                        >
                          <FaEdit size={13} className="text-blue-600" />
                          <span>Koreksi Stok</span>
                        </button>
                      </div>

                      {/* Mini Distribution Bar */}
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                        <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                          <span>Distribusi Status:</span>
                          <span>{percent}% di Lemari</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div style={{ width: `${(item.clean / item.totalOwned) * 100}%` }} className="bg-emerald-500 h-full" title={`Bersih: ${item.clean}`} />
                          <div style={{ width: `${((item.used || 0) / item.totalOwned) * 100}%` }} className="bg-amber-400 h-full" title={`Digunakan: ${item.used}`} />
                          <div style={{ width: `${((item.dirty || 0) / item.totalOwned) * 100}%` }} className="bg-rose-400 h-full" title={`Kotor: ${item.dirty}`} />
                          <div style={{ width: `${((item.laundry || 0) / item.totalOwned) * 100}%` }} className="bg-blue-400 h-full" title={`Laundry: ${item.laundry}`} />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                          <span className="text-amber-600 font-medium">Dipakai: {item.used || 0}</span>
                          <span className="text-rose-600 font-medium">Kotor: {item.dirty || 0}</span>
                          <span className="text-blue-600 font-medium">Laundry: {item.laundry || 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 2: DUA TOMBOL AKSI OPERASIONAL */}
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    {operationalRole === 'IGD' ? 'Aksi Petugas IGD (2 Klik Selesai)' : 'Aksi Petugas Laundry (2 Klik Selesai)'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {operationalRole === 'IGD' 
                      ? 'Khusus meja perawat & lemari IGD: serahkan kotor atau terima bersih' 
                      : 'Khusus petugas runner laundry: terima kotor atau serahkan bersih ke IGD'}
                  </p>
                </div>

                <div className="self-start sm:self-auto">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 shadow-2xs border ${
                    operationalRole === 'IGD' 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    <span>{operationalRole === 'IGD' ? '🏥 Halaman Khusus IGD' : '🧺 Halaman Khusus Laundry'}</span>
                  </span>
                </div>
              </div>

              {operationalRole === 'IGD' ? (
                /* Mode IGD: Hanya Serah Kotor & Terima Bersih */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Serah Kotor */}
                  <button
                    onClick={() => handleOpenAction('LAUNDRY_PICKUP', undefined, 'IGD')}
                    className="p-5 rounded-3xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg transition-all text-left flex items-center gap-4 min-h-[100px]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                      <FaTruckLoading size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">IGD</span>
                      <h4 className="font-black text-lg sm:text-xl leading-tight mt-1">SERAH KOTOR</h4>
                      <p className="text-xs text-rose-100 mt-0.5 font-medium">
                        Serahkan linen kotor IGD ke petugas laundry
                      </p>
                    </div>
                  </button>

                  {/* 2. Terima Bersih */}
                  <button
                    onClick={() => handleOpenAction('LAUNDRY_RETURN', undefined, 'IGD')}
                    className="p-5 rounded-3xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg transition-all text-left flex items-center gap-4 min-h-[100px]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                      <FaCheckDouble size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">IGD</span>
                      <h4 className="font-black text-lg sm:text-xl leading-tight mt-1">TERIMA BERSIH</h4>
                      <p className="text-xs text-indigo-100 mt-0.5 font-medium">
                        Terima linen bersih dari laundry masuk lemari
                      </p>
                    </div>
                  </button>
                </div>
              ) : (
                /* Mode Laundry: Hanya Terima Kotor & Serah Bersih */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Terima Kotor */}
                  <button
                    onClick={() => handleOpenAction('LAUNDRY_PICKUP', undefined, 'LAUNDRY')}
                    className="p-5 rounded-3xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg transition-all text-left flex items-center gap-4 min-h-[100px]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                      <FaTruckLoading size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Laundry</span>
                      <h4 className="font-black text-lg sm:text-xl leading-tight mt-1">TERIMA KOTOR</h4>
                      <p className="text-xs text-amber-100 mt-0.5 font-medium">
                        Petugas laundry menerima linen kotor dari IGD
                      </p>
                    </div>
                  </button>

                  {/* 2. Kirim Bersih */}
                  <button
                    onClick={() => handleOpenAction('LAUNDRY_RETURN', undefined, 'LAUNDRY')}
                    className="p-5 rounded-3xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg transition-all text-left flex items-center gap-4 min-h-[100px]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                      <FaCheckDouble size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Laundry</span>
                      <h4 className="font-black text-lg sm:text-xl leading-tight mt-1">KIRIM BERSIH</h4>
                      <p className="text-xs text-teal-100 mt-0.5 font-medium">
                        Petugas laundry mengirim linen bersih ke IGD
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </section>

            {/* Section 3: PANEL ROLE-SPESIFIK (IGD: TERIMA BERSIH | LAUNDRY: KIRIM BERSIH) */}
            {operationalRole === 'IGD' ? (
              /* ================== KHUSUS HALAMAN IGD: HANYA CARD TERIMA BERSIH ================== */
              <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-indigo-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                      <FaCheckDouble className="text-indigo-600" />
                      <span>Penerimaan Linen Bersih (Terima Bersih)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Konfirmasi dan catat penerimaan linen bersih dari laundry yang masuk kembali ke lemari IGD.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full self-start sm:self-auto">
                    Khusus Meja Perawat IGD
                  </span>
                </div>

                {/* CARD TUNGGAL: TERIMA BERSIH */}
                <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-full bg-indigo-500 shrink-0"></span>
                        <h4 className="text-xs sm:text-sm font-black text-indigo-950 uppercase tracking-wider truncate">
                          Linen Bersih Siap Diterima ke Lemari
                        </h4>
                      </div>
                      <span className={`text-xs font-black px-3 py-1 rounded-full border shrink-0 ${
                        totalLaundryItems > 0 
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {totalLaundryItems > 0 
                          ? `${totalLaundryItems} pcs (Menunggu Diterima Bersih)` 
                          : '0 pcs (Semua Bersih di Lemari)'}
                      </span>
                    </div>

                    {/* Breakdown Items */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 my-3">
                      {items.map((i) => (
                        <div key={i.id} className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs flex flex-col justify-between">
                          <div className="text-xs text-slate-500 font-medium">{i.name}</div>
                          <div className="text-xl font-black text-indigo-700 mt-1">
                            {i.laundry || 0} <span className="text-xs font-normal text-slate-400">{i.unitLabel}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Bersih di lemari: {i.clean || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleConfirmAllLaundryReturn}
                      disabled={laundryReturning || totalLaundryItems === 0}
                      className="flex-1 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-xs transition-all text-xs sm:text-sm flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {laundryReturning ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <FaCheckDouble size={16} />
                          <span>Terima Semua Bersih ke Lemari ({totalLaundryItems})</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenAction('LAUNDRY_RETURN', undefined, 'IGD')}
                      disabled={totalLaundryItems === 0}
                      className="py-3.5 px-5 bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-700 font-bold rounded-xl text-xs sm:text-sm transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                      title="Terima sebagian atau pilih jumlah spesifik"
                    >
                      Pilih Parsial
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              /* ================== KHUSUS HALAMAN LAUNDRY: HANYA CARD KIRIM BERSIH ================== */
              <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-teal-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                      <FaTruckLoading className="text-teal-600" />
                      <span>Pengiriman Linen Bersih (Kirim Bersih)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Konfirmasi pengiriman linen bersih hasil cuci untuk diserahkan kembali ke IGD.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full self-start sm:self-auto">
                    Khusus Petugas Laundry
                  </span>
                </div>

                {/* CARD TUNGGAL: KIRIM BERSIH */}
                <div className="p-4 sm:p-5 rounded-2xl border border-teal-200 bg-teal-50/40 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-full bg-teal-500 shrink-0"></span>
                        <h4 className="text-xs sm:text-sm font-black text-teal-950 uppercase tracking-wider truncate">
                          Linen Bersih Selesai Cuci (Siap Kirim ke IGD)
                        </h4>
                      </div>
                      <span className={`text-xs font-black px-3 py-1 rounded-full border shrink-0 ${
                        totalLaundryItems > 0 
                          ? 'bg-teal-100 text-teal-800 border-teal-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {totalLaundryItems > 0 
                          ? `${totalLaundryItems} pcs (Siap Kirim ke IGD)` 
                          : '0 pcs (Tidak Ada Antrean Siap Kirim)'}
                      </span>
                    </div>

                    {/* Breakdown Items */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 my-3">
                      {items.map((i) => (
                        <div key={i.id} className="bg-white p-3.5 rounded-xl border border-teal-100 shadow-2xs flex flex-col justify-between">
                          <div className="text-xs text-slate-500 font-medium">{i.name}</div>
                          <div className="text-xl font-black text-teal-700 mt-1">
                            {i.laundry || 0} <span className="text-xs font-normal text-slate-400">{i.unitLabel}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Siap dikirim ke IGD
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleConfirmAllLaundryReturn}
                      disabled={laundryReturning || totalLaundryItems === 0}
                      className="flex-1 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-xs transition-all text-xs sm:text-sm flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {laundryReturning ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <FaCheckDouble size={16} />
                          <span>Kirim Semua Bersih ke IGD ({totalLaundryItems})</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenAction('LAUNDRY_RETURN', undefined, 'LAUNDRY')}
                      disabled={totalLaundryItems === 0}
                      className="py-3.5 px-5 bg-white hover:bg-teal-50 border border-teal-300 text-teal-800 font-bold rounded-xl text-xs sm:text-sm transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                      title="Kirim sebagian atau pilih jumlah spesifik"
                    >
                      Pilih Parsial
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Section 4: LOG ACTIVITY USER (RIWAYAT AKTIVITAS PENGGUNA) */}
            <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FaHistory size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      Log Activity User
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Riwayat sirkulasi & serah terima linen real-time
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Sync
                  </span>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    {recentTransactions.length} aktivitas terakhir
                  </span>
                </div>
              </div>

              {/* Daftar Log Aktivitas */}
              {recentTransactions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs sm:text-sm">
                  Belum ada aktivitas mutasi linen tercatat hari ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                  {recentTransactions.map((tx) => {
                    const dateStr = tx.timestamp?.toDate 
                      ? tx.timestamp.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : 'Baru saja';

                    const getBadge = () => {
                      const actorLower = (tx.actor || '').toLowerCase();
                      const isIgd = actorLower.includes('igd');

                      switch (tx.type) {
                        case 'LAUNDRY_PICKUP':
                          if (isIgd) {
                            return { 
                              label: 'SERAH KOTOR', 
                              color: 'bg-rose-50 text-rose-700 border-rose-200', 
                              icon: <FaTruckLoading size={12} /> 
                            };
                          }
                          return { 
                            label: 'TERIMA KOTOR', 
                            color: 'bg-amber-50 text-amber-700 border-amber-200', 
                            icon: <FaTruckLoading size={12} /> 
                          };
                        case 'LAUNDRY_RETURN':
                          if (isIgd) {
                            return { 
                              label: 'TERIMA BERSIH', 
                              color: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
                              icon: <FaCheckDouble size={12} /> 
                            };
                          }
                          return { 
                            label: 'SERAH BERSIH', 
                            color: 'bg-teal-50 text-teal-700 border-teal-200', 
                            icon: <FaCheckDouble size={12} /> 
                          };
                        case 'ADJUST_STOCK':
                          return { 
                            label: 'PEMUTIHAN / KOREKSI', 
                            color: 'bg-purple-50 text-purple-700 border-purple-200', 
                            icon: <FaBroom size={12} /> 
                          };
                        default:
                          return { 
                            label: tx.type, 
                            color: 'bg-slate-50 text-slate-700 border-slate-200', 
                            icon: <FaHistory size={12} /> 
                          };
                      }
                    };

                    const badge = getBadge();

                    return (
                      <div key={tx.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-md border ${badge.color}`}>
                              {badge.icon}
                              <span>{badge.label}</span>
                            </span>
                            <span className="font-bold text-slate-800">
                              {tx.itemName} ({tx.quantity} pcs)
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Oleh: <strong className="text-slate-700">{tx.actor || 'Petugas'}</strong>
                            {tx.notes && <span className="text-slate-400"> • {tx.notes}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {dateStr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Transaction Action Modal */}
      <LinenActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        items={items}
        defaultType={actionModalType}
        defaultItemId={actionModalItemId}
        defaultRole={actionModalRole}
      />

      {/* QR Code Printable Modal */}
      <LinenQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        unitCode={activeUnit}
        unitName="Instalasi Gawat Darurat (IGD)"
      />

      {/* Direct Clean Stock Adjustment Modal */}
      <AdjustCleanModal
        isOpen={!!adjustingItem}
        onClose={() => setAdjustingItem(null)}
        item={adjustingItem}
      />
    </div>
  );
};

export default LinenFlowPage;

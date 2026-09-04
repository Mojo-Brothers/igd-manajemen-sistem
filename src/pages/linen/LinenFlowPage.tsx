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
  FaHistory,
  FaThLarge,
  FaTh,
  FaList,
  FaDownload
} from 'react-icons/fa';
import { LinenReportModal } from './components/LinenReportModal';

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
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [adjustingItem, setAdjustingItem] = useState<LinenItem | null>(null);

  // View mode switcher: card, grid, list
  const [viewMode, setViewMode] = useState<'card' | 'grid' | 'list'>(() => {
    return (localStorage.getItem('linen_view_mode') as 'card' | 'grid' | 'list') || 'card';
  });

  const handleViewModeChange = (mode: 'card' | 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('linen_view_mode', mode);
  };

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


  // Real-time stock counts across flow stages
  const totalDirtyItems = items.reduce((acc, curr) => acc + (curr.dirty || 0), 0);
  const totalInTransitDirty = items.reduce((acc, curr) => acc + (curr.inTransitDirty || 0), 0);
  const totalInLaundry = items.reduce((acc, curr) => acc + (curr.laundry || 0), 0);
  const totalInTransitClean = items.reduce((acc, curr) => acc + (curr.inTransitClean || 0), 0);

  // Batch confirm all clean linen (Terima Bersih in IGD / Kirim Bersih in Laundry)
  const handleConfirmAllLaundryReturn = async () => {
    if (operationalRole === 'LAUNDRY') {
      const laundryItems = items.filter((i) => (i.laundry || 0) > 0);
      if (laundryItems.length === 0) {
        toast.error('Tidak ada linen yang sedang dikerjakan di laundry untuk dikirim.');
        return;
      }

      setLaundryReturning(true);
      try {
        for (const item of laundryItems) {
          await executeLinenTransition({
            itemId: item.id,
            type: 'LAUNDRY_DISPATCH_CLEAN',
            quantity: item.laundry,
            actor: 'Petugas Laundry',
            notes: 'Pengiriman serentak seluruh linen bersih dari laundry ke IGD (Sedang Dikirim)'
          });
        }
        toast.success('Seluruh linen bersih berhasil dikirim ke IGD! Status berubah menjadi sedang dikirim.');
      } catch (err: any) {
        toast.error(err.message || 'Gagal memproses pengiriman bersih');
      } finally {
        setLaundryReturning(false);
      }
    } else {
      // Role IGD: Terima Bersih
      const cleanInTransitItems = items.filter((i) => (i.inTransitClean || 0) > 0);
      if (cleanInTransitItems.length === 0) {
        if (totalInLaundry > 0) {
          toast.error('Linen masih sedang dikerjakan di laundry. Belum dikirim ke IGD.');
        } else if (totalInTransitDirty > 0) {
          toast.error('Linen kotor masih dalam perjalanan ke laundry.');
        } else {
          toast.error('Tidak ada linen bersih dari laundry yang menunggu diterima.');
        }
        return;
      }

      setLaundryReturning(true);
      try {
        for (const item of cleanInTransitItems) {
          await executeLinenTransition({
            itemId: item.id,
            type: 'IGD_RECEIVE_CLEAN',
            quantity: item.inTransitClean || 0,
            actor: 'Perawat IGD',
            notes: 'Penerimaan serentak seluruh linen bersih dari laundry ke lemari IGD'
          });
        }
        toast.success('Seluruh linen bersih berhasil diterima kembali ke lemari IGD!');
      } catch (err: any) {
        toast.error(err.message || 'Gagal memproses penerimaan bersih');
      } finally {
        setLaundryReturning(false);
      }
    }
  };

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
                  {operationalRole === 'IGD' ? 'Stasiun Kerja IGD' : 'Stasiun Kerja Laundry'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Primaya Hospital • {operationalRole === 'IGD' ? 'Stasiun Lemari & Perawat IGD' : 'Stasiun Serah Terima Laundry IGD'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-blue-500 shadow-xs active:scale-95 cursor-pointer"
              title="Unduh Laporan Harian / Bulanan (PDF & Excel)"
            >
              <FaDownload size={14} />
              <span className="hidden sm:inline">Unduh Laporan</span>
            </button>
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

            {/* Section 1: STOK LINEN BERSIH DI LEMARI IGD DENGAN PILIHAN TAMPILAN (CARD, GRID, LIST) */}
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Stok Bersih di Lemari IGD
                  </h3>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">• Real-time Sync</span>
                </div>

                {/* View Switcher Controls */}
                <div className="inline-flex items-center p-1 bg-slate-200/80 rounded-2xl border border-slate-300 shadow-2xs self-start sm:self-auto gap-1">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('card')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      viewMode === 'card'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Tampilan Card Detail"
                  >
                    <FaThLarge size={12} />
                    <span>Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('grid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Tampilan Grid Kompak"
                  >
                    <FaTh size={12} />
                    <span>Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('list')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      viewMode === 'list'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Tampilan List / Tabel"
                  >
                    <FaList size={12} />
                    <span>List</span>
                  </button>
                </div>
              </div>

              {/* TAMPILAN 1: CARD VIEW */}
              {viewMode === 'card' && (
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
                            <div style={{ width: `${(item.clean / item.totalOwned) * 100}%` }} className="bg-emerald-500 h-full" title={`Bersih di Lemari: ${item.clean}`} />
                            <div style={{ width: `${((item.used || 0) / item.totalOwned) * 100}%` }} className="bg-amber-400 h-full" title={`Digunakan: ${item.used || 0}`} />
                            <div style={{ width: `${((item.dirty || 0) / item.totalOwned) * 100}%` }} className="bg-rose-400 h-full" title={`Kotor di IGD: ${item.dirty || 0}`} />
                            <div style={{ width: `${((item.inTransitDirty || 0) / item.totalOwned) * 100}%` }} className="bg-orange-400 h-full" title={`Kirim ke Laundry: ${item.inTransitDirty || 0}`} />
                            <div style={{ width: `${((item.laundry || 0) / item.totalOwned) * 100}%` }} className="bg-blue-400 h-full" title={`Dikerjakan di Laundry: ${item.laundry || 0}`} />
                            <div style={{ width: `${((item.inTransitClean || 0) / item.totalOwned) * 100}%` }} className="bg-teal-400 h-full" title={`Kirim ke IGD: ${item.inTransitClean || 0}`} />
                          </div>
                          <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] text-slate-400 pt-0.5">
                            <span className="text-amber-600 font-medium">Dipakai: {item.used || 0}</span>
                            <span className="text-rose-600 font-medium">Kotor: {item.dirty || 0}</span>
                            {(item.inTransitDirty || 0) > 0 && (
                              <span className="text-orange-600 font-bold">Kirim Laundry: {item.inTransitDirty}</span>
                            )}
                            <span className="text-blue-600 font-medium">Di Laundry: {item.laundry || 0}</span>
                            {(item.inTransitClean || 0) > 0 && (
                              <span className="text-teal-600 font-bold">Kirim IGD: {item.inTransitClean}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAMPILAN 2: GRID VIEW KOMPAK */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((item) => {
                    const statusLevel = getLinenStatusLevel(item.clean, item.minStock, item.criticalStock);
                    const percent = Math.min(100, Math.round(((item.clean || 0) / (item.totalOwned || 1)) * 100));

                    return (
                      <div 
                        key={item.id}
                        className="bg-white rounded-3xl p-4 shadow-xs border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
                      >
                        <div>
                          {/* Header */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                {item.name.toLowerCase().includes('selimut') ? <FaBed size={13} /> : <FaLayerGroup size={13} />}
                              </div>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate" title={item.name}>
                                {item.name}
                              </h4>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                              statusLevel === 'SAFE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : statusLevel === 'WARNING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {statusLevel === 'SAFE' ? '🟢 AMAN' : statusLevel === 'WARNING' ? '🟡 MENIPIS' : '🔴 KRITIS'}
                            </span>
                          </div>

                          {/* Giant Number Center */}
                          <div className="my-2 text-center py-2.5 bg-slate-50/80 rounded-2xl border border-slate-100">
                            <span className="text-3xl sm:text-4xl font-black text-slate-900 leading-none">
                              {item.clean}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 block uppercase mt-0.5">
                              {item.unitLabel} Bersih
                            </span>
                          </div>

                          {/* Mini Progress */}
                          <div className="space-y-1 my-2">
                            <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                              <span>Di Lemari</span>
                              <span className="font-bold text-slate-700">{percent}% ({item.clean}/{item.totalOwned})</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                              <div style={{ width: `${(item.clean / item.totalOwned) * 100}%` }} className="bg-emerald-500 h-full" />
                              <div style={{ width: `${((item.used || 0) / item.totalOwned) * 100}%` }} className="bg-amber-400 h-full" />
                              <div style={{ width: `${((item.dirty || 0) / item.totalOwned) * 100}%` }} className="bg-rose-400 h-full" />
                              <div style={{ width: `${((item.inTransitDirty || 0) / item.totalOwned) * 100}%` }} className="bg-orange-400 h-full" />
                              <div style={{ width: `${((item.laundry || 0) / item.totalOwned) * 100}%` }} className="bg-blue-400 h-full" />
                              <div style={{ width: `${((item.inTransitClean || 0) / item.totalOwned) * 100}%` }} className="bg-teal-400 h-full" />
                            </div>
                          </div>

                          {/* Circulation Badges */}
                          <div className="flex flex-wrap gap-1 text-[9px] pt-1">
                            {(item.dirty || 0) > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                                Kotor: {item.dirty}
                              </span>
                            )}
                            {(item.inTransitDirty || 0) > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 font-semibold">
                                Kirim: {item.inTransitDirty}
                              </span>
                            )}
                            {(item.laundry || 0) > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                                Cuci: {item.laundry}
                              </span>
                            )}
                            {(item.inTransitClean || 0) > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                                Bersih Kirim: {item.inTransitClean}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Adjust Button */}
                        <button
                          type="button"
                          onClick={() => setAdjustingItem(item)}
                          className="w-full mt-3 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                          title={`Koreksi Stok ${item.name}`}
                        >
                          <FaEdit size={12} className="text-blue-600" />
                          <span>Koreksi</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAMPILAN 3: LIST / TABEL VIEW */}
              {viewMode === 'list' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                          <th className="py-3.5 px-4">Jenis Linen</th>
                          <th className="py-3.5 px-4 text-center">Stok Bersih</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 hidden md:table-cell">Proporsi Lemari</th>
                          <th className="py-3.5 px-4 hidden sm:table-cell">Sirkulasi</th>
                          <th className="py-3.5 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {items.map((item) => {
                          const statusLevel = getLinenStatusLevel(item.clean, item.minStock, item.criticalStock);
                          const percent = Math.min(100, Math.round(((item.clean || 0) / (item.totalOwned || 1)) * 100));

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    {item.name.toLowerCase().includes('selimut') ? <FaBed size={14} /> : <FaLayerGroup size={14} />}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                                    <div className="text-[11px] text-slate-400">Total Milik: {item.totalOwned} {item.unitLabel}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="text-2xl font-black text-slate-900 leading-none">{item.clean}</span>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">{item.unitLabel}</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-block whitespace-nowrap ${
                                  statusLevel === 'SAFE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : statusLevel === 'WARNING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {statusLevel === 'SAFE' ? '🟢 AMAN' : statusLevel === 'WARNING' ? '🟡 MENIPIS' : '🔴 KRITIS'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 hidden md:table-cell min-w-[140px]">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                    <span>{percent}% di Lemari</span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                    <div style={{ width: `${(item.clean / item.totalOwned) * 100}%` }} className="bg-emerald-500 h-full" />
                                    <div style={{ width: `${((item.used || 0) / item.totalOwned) * 100}%` }} className="bg-amber-400 h-full" />
                                    <div style={{ width: `${((item.dirty || 0) / item.totalOwned) * 100}%` }} className="bg-rose-400 h-full" />
                                    <div style={{ width: `${((item.inTransitDirty || 0) / item.totalOwned) * 100}%` }} className="bg-orange-400 h-full" />
                                    <div style={{ width: `${((item.laundry || 0) / item.totalOwned) * 100}%` }} className="bg-blue-400 h-full" />
                                    <div style={{ width: `${((item.inTransitClean || 0) / item.totalOwned) * 100}%` }} className="bg-teal-400 h-full" />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 hidden sm:table-cell">
                                <div className="flex flex-wrap gap-1.5 text-[10px]">
                                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                    Dipakai: {item.used || 0}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                                    Kotor: {item.dirty || 0}
                                  </span>
                                  {(item.inTransitDirty || 0) > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 font-bold">
                                      Kirim Laundry: {item.inTransitDirty}
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                    Laundry: {item.laundry || 0}
                                  </span>
                                  {(item.inTransitClean || 0) > 0 && (
                                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                                      Kirim IGD: {item.inTransitClean}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setAdjustingItem(item)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold border border-slate-200 transition-all inline-flex items-center gap-1.5 shadow-2xs active:scale-95"
                                >
                                  <FaEdit size={12} className="text-blue-600" />
                                  <span>Koreksi</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                      ? 'Stasiun perawat & lemari IGD: serahkan kotor atau terima bersih' 
                      : 'Stasiun runner laundry: terima kotor atau serahkan bersih ke IGD'}
                  </p>
                </div>

                <div className="self-start sm:self-auto">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 shadow-2xs border ${
                    operationalRole === 'IGD' 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    <span>{operationalRole === 'IGD' ? '🏥 Stasiun Kerja IGD' : '🧺 Stasiun Kerja Laundry'}</span>
                  </span>
                </div>
              </div>

              {operationalRole === 'IGD' ? (
                /* Mode IGD: Serah Kotor & Terima Bersih */
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
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">IGD</span>
                        {totalDirtyItems > 0 ? (
                          <span className="text-[10px] bg-white text-rose-800 font-bold px-2 py-0.5 rounded-full">
                            {totalDirtyItems} pcs Kotor di IGD
                          </span>
                        ) : totalInTransitDirty > 0 ? (
                          <span className="text-[10px] bg-orange-400 text-orange-950 font-black px-2 py-0.5 rounded-full animate-pulse">
                            {totalInTransitDirty} pcs Sedang Dikirim ke Laundry
                          </span>
                        ) : null}
                      </div>
                      <h4 className="font-black text-lg sm:text-xl leading-tight mt-1">SERAH KOTOR</h4>
                      <p className="text-xs text-rose-100 mt-0.5 font-medium">
                        {totalInTransitDirty > 0
                          ? `${totalInTransitDirty} pcs dalam pengiriman ke laundry • Serahkan kotor baru`
                          : 'Serahkan linen kotor IGD ke petugas laundry'}
                      </p>
                    </div>
                  </button>

                  {/* 2. Terima Bersih: Hanya aktif jika totalInTransitClean > 0 */}
                  <button
                    onClick={() => {
                      if (totalInTransitClean === 0) {
                        if (totalInLaundry > 0) {
                          toast.error('Linen masih sedang dikerjakan di laundry. Belum ada linen bersih yang dikirim ke IGD.');
                        } else if (totalInTransitDirty > 0) {
                          toast.error('Linen kotor masih dalam perjalanan ke laundry.');
                        } else {
                          toast.error('Tidak ada linen bersih yang menunggu diterima.');
                        }
                        return;
                      }
                      handleOpenAction('LAUNDRY_RETURN', undefined, 'IGD');
                    }}
                    disabled={totalInTransitClean === 0}
                    className={`p-5 rounded-3xl text-left flex items-center gap-4 min-h-[100px] transition-all ${
                      totalInTransitClean > 0
                        ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      totalInTransitClean > 0 ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-500'
                    }`}>
                      <FaCheckDouble size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          totalInTransitClean > 0 ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-600'
                        }`}>
                          IGD
                        </span>
                        {totalInTransitClean > 0 && (
                          <span className="text-[10px] bg-emerald-400 text-emerald-950 font-black px-2 py-0.5 rounded-full animate-pulse">
                            {totalInTransitClean} pcs Siap Diterima
                          </span>
                        )}
                      </div>
                      <h4 className="font-black text-lg sm:text-xl leading-tight mt-1">TERIMA BERSIH</h4>
                      <p className={`text-xs mt-0.5 font-medium ${totalInTransitClean > 0 ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {totalInTransitClean > 0
                          ? `Terima ${totalInTransitClean} pcs linen bersih masuk lemari IGD`
                          : totalInLaundry > 0
                          ? `Nonaktif: Masih dikerjakan di laundry (${totalInLaundry} pcs)`
                          : totalInTransitDirty > 0
                          ? `Nonaktif: Sedang dikirim ke laundry (${totalInTransitDirty} pcs)`
                          : 'Nonaktif: Semua linen bersih di lemari'}
                      </p>
                    </div>
                  </button>
                </div>
              ) : (
                /* Mode Laundry: Terima Kotor & Kirim Bersih */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Terima Kotor */}
                  {(() => {
                    const waitingDirty = totalInTransitDirty > 0 ? totalInTransitDirty : totalDirtyItems;
                    return (
                      <button
                        onClick={() => {
                          if (waitingDirty === 0) {
                            toast.error('Belum ada linen kotor yang dikirim dari IGD.');
                            return;
                          }
                          handleOpenAction('LAUNDRY_PICKUP', undefined, 'LAUNDRY');
                        }}
                        disabled={waitingDirty === 0}
                        className={`p-5 rounded-3xl text-left flex items-center gap-4 min-h-[100px] transition-all ${
                          waitingDirty > 0
                            ? 'bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                          waitingDirty > 0 ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-500'
                        }`}>
                          <FaTruckLoading size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              waitingDirty > 0 ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-600'
                            }`}>
                              Laundry
                            </span>
                            {waitingDirty > 0 && (
                              <span className="text-[10px] bg-rose-400 text-rose-950 font-black px-2 py-0.5 rounded-full animate-pulse">
                                {waitingDirty} pcs Kotor Menunggu
                              </span>
                            )}
                          </div>
                          <h4 className="font-black text-lg sm:text-xl leading-tight mt-1">TERIMA KOTOR</h4>
                          <p className={`text-xs mt-0.5 font-medium ${waitingDirty > 0 ? 'text-amber-100' : 'text-slate-500'}`}>
                            {waitingDirty > 0
                              ? `Terima ${waitingDirty} pcs linen kotor untuk dicuci`
                              : 'Nonaktif: Belum ada linen kotor dikirim dari IGD'}
                          </p>
                        </div>
                      </button>
                    );
                  })()}

                  {/* 2. Kirim Bersih: Hanya aktif jika totalInLaundry > 0 */}
                  <button
                    onClick={() => {
                      if (totalInLaundry === 0) {
                        if (totalInTransitClean > 0) {
                          toast.error('Linen bersih sedang dalam perjalanan ke IGD, menunggu konfirmasi perawat.');
                        } else {
                          toast.error('Tidak ada cucian yang sedang dikerjakan untuk dikirim.');
                        }
                        return;
                      }
                      handleOpenAction('LAUNDRY_RETURN', undefined, 'LAUNDRY');
                    }}
                    disabled={totalInLaundry === 0}
                    className={`p-5 rounded-3xl text-left flex items-center gap-4 min-h-[100px] transition-all ${
                      totalInLaundry > 0
                        ? 'bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      totalInLaundry > 0 ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-500'
                    }`}>
                      <FaCheckDouble size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          totalInLaundry > 0 ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-600'
                        }`}>
                          Laundry
                        </span>
                        {totalInLaundry > 0 ? (
                          <span className="text-[10px] bg-emerald-400 text-emerald-950 font-black px-2 py-0.5 rounded-full">
                            {totalInLaundry} pcs Siap Kirim
                          </span>
                        ) : totalInTransitClean > 0 ? (
                          <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full animate-pulse">
                            {totalInTransitClean} pcs Sedang Dikirim
                          </span>
                        ) : null}
                      </div>
                      <h4 className="font-black text-lg sm:text-xl leading-tight mt-1">KIRIM BERSIH</h4>
                      <p className={`text-xs mt-0.5 font-medium ${totalInLaundry > 0 ? 'text-teal-100' : 'text-slate-500'}`}>
                        {totalInLaundry > 0
                          ? `Kirim ${totalInLaundry} pcs linen bersih hasil cuci ke IGD`
                          : totalInTransitClean > 0
                          ? 'Nonaktif: Sedang dikirim ke IGD (menunggu konfirmasi perawat)'
                          : 'Nonaktif: Tidak ada antrean cucian'}
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </section>

            {/* Section 3: PANEL ROLE-SPESIFIK (IGD: TERIMA BERSIH | LAUNDRY: KIRIM BERSIH) */}
            {operationalRole === 'IGD' ? (
              /* ================== KHUSUS HALAMAN IGD: CARD TERIMA BERSIH REALTIME ================== */
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
                    Stasiun Kerja IGD
                  </span>
                </div>

                {/* CARD TUNGGAL: TERIMA BERSIH SESUAI STATUS REAL-TIME */}
                {totalInTransitClean > 0 ? (
                  /* KONDISI 1: Linen Bersih Sedang Dikirim ke IGD -> TOMBOL AKTIF */
                  <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                          <h4 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wider truncate">
                            Linen Bersih Sedang Dikirim ke Lemari (Siap Diterima)
                          </h4>
                        </div>
                        <span className="text-xs font-black px-3 py-1 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-300 shrink-0 animate-pulse">
                          {totalInTransitClean} pcs (Siap Diterima Bersih)
                        </span>
                      </div>

                      {/* Alert Info */}
                      <div className="bg-emerald-100/70 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2.5 mb-3">
                        <span className="text-base shrink-0">🚚</span>
                        <div>
                          <strong>Linen Bersih Sedang Dikirim dari Laundry!</strong>
                          <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                            Petugas laundry telah mengirim cucian bersih. Silakan periksa fisik cucian dan tekan tombol <strong>"Terima Semua Bersih ke Lemari"</strong> di bawah untuk memasukkan ke stok lemari IGD.
                          </p>
                        </div>
                      </div>

                      {/* Breakdown Items */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 my-3">
                        {items.map((i) => (
                          <div key={i.id} className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs flex flex-col justify-between">
                            <div className="text-xs text-slate-500 font-medium">{i.name}</div>
                            <div className="text-2xl font-black text-emerald-700 mt-1">
                              {i.inTransitClean || 0} <span className="text-xs font-normal text-slate-400">{i.unitLabel}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Bersih di lemari: <strong className="text-slate-600">{i.clean || 0}</strong>
                            </div>
                            {(i.laundry || 0) > 0 && (
                              <div className="text-[10px] text-blue-600 font-medium mt-0.5">
                                ({i.laundry} pcs masih di laundry)
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons: ENABLED */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleConfirmAllLaundryReturn}
                        disabled={laundryReturning}
                        className="flex-1 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                      >
                        {laundryReturning ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <FaCheckDouble size={16} />
                            <span>Terima Semua Bersih ke Lemari ({totalInTransitClean})</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenAction('LAUNDRY_RETURN', undefined, 'IGD')}
                        className="py-3.5 px-5 bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-700 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-2xs active:scale-[0.98]"
                        title="Terima sebagian atau pilih jumlah spesifik"
                      >
                        Pilih Parsial
                      </button>
                    </div>
                  </div>
                ) : totalInLaundry > 0 ? (
                  /* KONDISI 2: Sedang Dikerjakan di Laundry -> TOMBOL NONAKTIF */
                  <div className="p-4 sm:p-5 rounded-2xl border border-blue-200 bg-blue-50/40 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
                          <h4 className="text-xs sm:text-sm font-black text-blue-950 uppercase tracking-wider truncate">
                            Linen Sedang Dikerjakan di Laundry
                          </h4>
                        </div>
                        <span className="text-xs font-black px-3 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-200 shrink-0">
                          {totalInLaundry} pcs (Sedang Dikerjakan di Laundry)
                        </span>
                      </div>

                      {/* Alert Info: NONAKTIF */}
                      <div className="bg-blue-100/70 border border-blue-300 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2.5 mb-3">
                        <span className="text-base shrink-0">⚙️</span>
                        <div>
                          <strong>Linen Sedang Diproses di Laundry (Cuci & Setrika)</strong>
                          <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                            Linen kotor telah diterima petugas laundry dan sedang dikerjakan. <strong>Tombol terima bersih belum aktif/nonaktif</strong> pada status ini. Tombol akan otomatis aktif setelah laundry menekan <strong>"Kirim Bersih"</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Breakdown Items */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 my-3">
                        {items.map((i) => (
                          <div key={i.id} className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs flex flex-col justify-between">
                            <div className="text-xs text-slate-500 font-medium">{i.name}</div>
                            <div className="text-2xl font-black text-blue-700 mt-1">
                              {i.laundry || 0} <span className="text-xs font-normal text-slate-400">{i.unitLabel}</span>
                            </div>
                            <div className="text-[10px] text-blue-600 font-medium mt-1">
                              Sedang diproses laundry
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Bersih di lemari: {i.clean || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons: DISABLED */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        disabled={true}
                        className="flex-1 py-3.5 px-4 bg-slate-200 text-slate-400 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed shadow-none border border-slate-300"
                        title="Tombol nonaktif: Cucian masih sedang dikerjakan di laundry"
                      >
                        <FaCheckDouble size={16} />
                        <span>Terima Semua Bersih (Nonaktif: Sedang Dikerjakan di Laundry)</span>
                      </button>

                      <button
                        disabled={true}
                        className="py-3.5 px-5 bg-slate-100 text-slate-400 border border-slate-200 font-bold rounded-xl text-xs sm:text-sm cursor-not-allowed"
                        title="Tombol nonaktif: Cucian masih sedang dikerjakan di laundry"
                      >
                        Pilih Parsial
                      </button>
                    </div>
                  </div>
                ) : totalInTransitDirty > 0 ? (
                  /* KONDISI 3: Sedang Dikirim ke Laundry -> TOMBOL NONAKTIF */
                  <div className="p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                          <h4 className="text-xs sm:text-sm font-black text-rose-950 uppercase tracking-wider truncate">
                            Linen Kotor Sedang Dikirim ke Laundry
                          </h4>
                        </div>
                        <span className="text-xs font-black px-3 py-1 rounded-full border bg-rose-100 text-rose-800 border-rose-200 shrink-0">
                          {totalInTransitDirty} pcs (Sedang Dikirim ke Laundry)
                        </span>
                      </div>

                      {/* Alert Info: NONAKTIF */}
                      <div className="bg-rose-100/70 border border-rose-300 rounded-xl p-3 text-xs text-rose-900 flex items-start gap-2.5 mb-3">
                        <span className="text-base shrink-0">🚚</span>
                        <div>
                          <strong>Linen Kotor Dalam Perjalanan ke Laundry</strong>
                          <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                            Linen kotor baru diserahkan oleh IGD. <strong>Tombol terima bersih belum aktif/nonaktif</strong> hingga cucian selesai diproses dan dikirim kembali oleh laundry.
                          </p>
                        </div>
                      </div>

                      {/* Breakdown Items */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 my-3">
                        {items.map((i) => (
                          <div key={i.id} className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs flex flex-col justify-between">
                            <div className="text-xs text-slate-500 font-medium">{i.name}</div>
                            <div className="text-2xl font-black text-rose-700 mt-1">
                              {i.inTransitDirty || 0} <span className="text-xs font-normal text-slate-400">{i.unitLabel}</span>
                            </div>
                            <div className="text-[10px] text-rose-600 font-medium mt-1">
                              Sedang dikirim ke laundry
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Bersih di lemari: {i.clean || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons: DISABLED */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        disabled={true}
                        className="flex-1 py-3.5 px-4 bg-slate-200 text-slate-400 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed shadow-none border border-slate-300"
                        title="Tombol nonaktif: Linen masih sedang dikirim ke laundry"
                      >
                        <FaCheckDouble size={16} />
                        <span>Terima Semua Bersih (Nonaktif: Sedang Dikirim ke Laundry)</span>
                      </button>

                      <button
                        disabled={true}
                        className="py-3.5 px-5 bg-slate-100 text-slate-400 border border-slate-200 font-bold rounded-xl text-xs sm:text-sm cursor-not-allowed"
                      >
                        Pilih Parsial
                      </button>
                    </div>
                  </div>
                ) : (
                  /* KONDISI 4: Semua Bersih di Lemari */
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider truncate">
                            Semua Linen Bersih di Lemari
                          </h4>
                        </div>
                        <span className="text-xs font-black px-3 py-1 rounded-full border bg-slate-100 text-slate-600 border-slate-200 shrink-0">
                          0 pcs (Semua Bersih di Lemari)
                        </span>
                      </div>

                      {/* Alert Info */}
                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex items-start gap-2.5 mb-3">
                        <span className="text-base shrink-0">✨</span>
                        <div>
                          <strong>Lemari Bersih Terisi Penuh</strong>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Tidak ada antrean cucian linen yang sedang dikerjakan di laundry maupun yang sedang dalam perjalanan.
                          </p>
                        </div>
                      </div>

                      {/* Breakdown Items */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 my-3">
                        {items.map((i) => (
                          <div key={i.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                            <div className="text-xs text-slate-500 font-medium">{i.name}</div>
                            <div className="text-2xl font-black text-slate-400 mt-1">
                              0 <span className="text-xs font-normal text-slate-400">{i.unitLabel}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Bersih di lemari: <strong className="text-slate-700">{i.clean || 0}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons: DISABLED */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        disabled={true}
                        className="flex-1 py-3.5 px-4 bg-slate-200 text-slate-400 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed shadow-none border border-slate-300"
                      >
                        <FaCheckDouble size={16} />
                        <span>Terima Semua Bersih ke Lemari (0)</span>
                      </button>

                      <button
                        disabled={true}
                        className="py-3.5 px-5 bg-slate-100 text-slate-400 border border-slate-200 font-bold rounded-xl text-xs sm:text-sm cursor-not-allowed"
                      >
                        Pilih Parsial
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              /* ================== KHUSUS HALAMAN LAUNDRY: CARD KIRIM BERSIH REALTIME ================== */
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
                    Stasiun Kerja Laundry
                  </span>
                </div>

                {/* CARD TUNGGAL: KIRIM BERSIH SESUAI STATUS REAL-TIME */}
                {totalInLaundry > 0 ? (
                  /* KONDISI 1: Linen Sedang Dikerjakan di Laundry -> SIAP KIRIM BERSIH (TOMBOL AKTIF) */
                  <div className="p-4 sm:p-5 rounded-2xl border-2 border-teal-300 bg-teal-50/40 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-full bg-teal-500 animate-pulse shrink-0"></span>
                          <h4 className="text-xs sm:text-sm font-black text-teal-950 uppercase tracking-wider truncate">
                            Linen Sedang Dikerjakan (Siap Kirim Bersih ke IGD)
                          </h4>
                        </div>
                        <span className="text-xs font-black px-3 py-1 rounded-full border bg-teal-100 text-teal-800 border-teal-300 shrink-0 font-bold">
                          {totalInLaundry} pcs (Siap Kirim ke IGD)
                        </span>
                      </div>

                      {/* Alert Info: SIAP KIRIM */}
                      <div className="bg-teal-100/70 border border-teal-300 rounded-xl p-3 text-xs text-teal-900 flex items-start gap-2.5 mb-3">
                        <span className="text-base shrink-0">🧺</span>
                        <div>
                          <strong>Linen Bersih Siap Dikirim ke IGD</strong>
                          <p className="text-[11px] text-teal-800 mt-0.5 leading-relaxed">
                            Linen hasil cuci siap diserahkan ke IGD. Tekan tombol <strong>"Kirim Semua Bersih ke IGD"</strong> di bawah untuk mengirim linen. Status akan otomatis berubah menjadi <strong>"Sedang Dikirim"</strong> di IGD dan tombol terima perawat akan aktif.
                          </p>
                        </div>
                      </div>

                      {/* Breakdown Items */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 my-3">
                        {items.map((i) => (
                          <div key={i.id} className="bg-white p-3.5 rounded-xl border border-teal-200 shadow-2xs flex flex-col justify-between">
                            <div className="text-xs text-slate-500 font-medium">{i.name}</div>
                            <div className="text-2xl font-black text-teal-700 mt-1">
                              {i.laundry || 0} <span className="text-xs font-normal text-slate-400">{i.unitLabel}</span>
                            </div>
                            <div className="text-[10px] text-teal-600 font-medium mt-1">
                              Siap dikirim ke IGD
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons: ENABLED */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleConfirmAllLaundryReturn}
                        disabled={laundryReturning}
                        className="flex-1 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                      >
                        {laundryReturning ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <FaCheckDouble size={16} />
                            <span>Kirim Semua Bersih ke IGD ({totalInLaundry})</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenAction('LAUNDRY_RETURN', undefined, 'LAUNDRY')}
                        className="py-3.5 px-5 bg-white hover:bg-teal-50 border border-teal-300 text-teal-800 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-2xs active:scale-[0.98]"
                        title="Kirim sebagian atau pilih jumlah spesifik"
                      >
                        Pilih Parsial
                      </button>
                    </div>
                  </div>
                ) : totalInTransitClean > 0 ? (
                  /* KONDISI 2: Linen Bersih Sudah Dikirim ke IGD -> TOMBOL NONAKTIF (MENUNGGU KONFIRMASI) */
                  <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                          <h4 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wider truncate">
                            Linen Bersih Sedang Dikirim ke IGD
                          </h4>
                        </div>
                        <span className="text-xs font-black px-3 py-1 rounded-full border bg-amber-100 text-amber-800 border-amber-200 shrink-0">
                          {totalInTransitClean} pcs (Sedang Dikirim ke IGD)
                        </span>
                      </div>

                      {/* Alert Info: NONAKTIF */}
                      <div className="bg-amber-100/70 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5 mb-3">
                        <span className="text-base shrink-0">🚚</span>
                        <div>
                          <strong>Linen Bersih Sedang Dalam Perjalanan ke Lemari IGD</strong>
                          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                            Linen bersih telah dikirim dari laundry dan saat ini dalam perjalanan menuju IGD. <strong>Tombol kirim bersih nonaktif</strong> hingga perawat IGD menekan tombol "Terima Bersih" untuk memasukkan linen ke lemari IGD.
                          </p>
                        </div>
                      </div>

                      {/* Breakdown Items */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 my-3">
                        {items.map((i) => (
                          <div key={i.id} className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs flex flex-col justify-between">
                            <div className="text-xs text-slate-500 font-medium">{i.name}</div>
                            <div className="text-2xl font-black text-amber-700 mt-1">
                              {i.inTransitClean || 0} <span className="text-xs font-normal text-slate-400">{i.unitLabel}</span>
                            </div>
                            <div className="text-[10px] text-amber-600 font-medium mt-1">
                              Menunggu konfirmasi perawat IGD
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons: DISABLED */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        disabled={true}
                        className="flex-1 py-3.5 px-4 bg-slate-200 text-slate-400 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed shadow-none border border-slate-300"
                        title="Tombol nonaktif: Linen sudah dikirim dan menunggu konfirmasi perawat IGD"
                      >
                        <FaCheckDouble size={16} />
                        <span>Kirim Semua Bersih (Nonaktif: Sedang Dikirim ke IGD)</span>
                      </button>

                      <button
                        disabled={true}
                        className="py-3.5 px-5 bg-slate-100 text-slate-400 border border-slate-200 font-bold rounded-xl text-xs sm:text-sm cursor-not-allowed"
                      >
                        Pilih Parsial
                      </button>
                    </div>
                  </div>
                ) : totalInTransitDirty > 0 ? (
                  /* KONDISI 3: Linen Kotor Sedang Dikirim dari IGD -> Minta Terima Kotor dulu */
                  <div className="p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                          <h4 className="text-xs sm:text-sm font-black text-rose-950 uppercase tracking-wider truncate">
                            Linen Kotor Sedang Dikirim dari IGD
                          </h4>
                        </div>
                        <span className="text-xs font-black px-3 py-1 rounded-full border bg-rose-100 text-rose-800 border-rose-200 shrink-0">
                          {totalInTransitDirty} pcs (Menunggu Diterima Laundry)
                        </span>
                      </div>

                      {/* Alert Info */}
                      <div className="bg-rose-100/70 border border-rose-300 rounded-xl p-3 text-xs text-rose-900 flex items-start gap-2.5 mb-3">
                        <span className="text-base shrink-0">📥</span>
                        <div>
                          <strong>Ada Linen Kotor Dikirim dari IGD</strong>
                          <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                            Perawat IGD telah menyerahkan {totalInTransitDirty} pcs linen kotor. Silakan klik tombol <strong>"TERIMA KOTOR"</strong> pada menu aksi di atas untuk mengonfirmasi penerimaan ke pencucian laundry.
                          </p>
                        </div>
                      </div>

                      {/* Breakdown Items */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 my-3">
                        {items.map((i) => (
                          <div key={i.id} className="bg-white p-3.5 rounded-xl border border-rose-100 shadow-2xs flex flex-col justify-between">
                            <div className="text-xs text-slate-500 font-medium">{i.name}</div>
                            <div className="text-2xl font-black text-rose-700 mt-1">
                              {i.inTransitDirty || 0} <span className="text-xs font-normal text-slate-400">{i.unitLabel}</span>
                            </div>
                            <div className="text-[10px] text-rose-600 font-medium mt-1">
                              Menunggu diterima laundry
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons: DISABLED */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        disabled={true}
                        className="flex-1 py-3.5 px-4 bg-slate-200 text-slate-400 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed shadow-none border border-slate-300"
                      >
                        <FaCheckDouble size={16} />
                        <span>Kirim Semua Bersih ke IGD (0)</span>
                      </button>

                      <button
                        disabled={true}
                        className="py-3.5 px-5 bg-slate-100 text-slate-400 border border-slate-200 font-bold rounded-xl text-xs sm:text-sm cursor-not-allowed"
                      >
                        Pilih Parsial
                      </button>
                    </div>
                  </div>
                ) : (
                  /* KONDISI 4: Tidak Ada Antrean Cucian */
                  <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0"></span>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider truncate">
                            Tidak Ada Antrean Siap Kirim
                          </h4>
                        </div>
                        <span className="text-xs font-black px-3 py-1 rounded-full border bg-slate-100 text-slate-600 border-slate-200 shrink-0">
                          0 pcs (Tidak Ada Antrean Siap Kirim)
                        </span>
                      </div>

                      {/* Alert Info */}
                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex items-start gap-2.5 mb-3">
                        <span className="text-base shrink-0">✨</span>
                        <div>
                          <strong>Tidak Ada Cucian Menunggu Dikirim</strong>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            Semua linen saat ini berada di IGD atau belum ada kiriman linen kotor yang masuk.
                          </p>
                        </div>
                      </div>

                      {/* Breakdown Items */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 my-3">
                        {items.map((i) => (
                          <div key={i.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                            <div className="text-xs text-slate-500 font-medium">{i.name}</div>
                            <div className="text-2xl font-black text-slate-400 mt-1">
                              0 <span className="text-xs font-normal text-slate-400">{i.unitLabel}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Tidak ada antrean
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons: DISABLED */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        disabled={true}
                        className="flex-1 py-3.5 px-4 bg-slate-200 text-slate-400 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed shadow-none border border-slate-300"
                      >
                        <FaCheckDouble size={16} />
                        <span>Kirim Semua Bersih ke IGD (0)</span>
                      </button>

                      <button
                        disabled={true}
                        className="py-3.5 px-5 bg-slate-100 text-slate-400 border border-slate-200 font-bold rounded-xl text-xs sm:text-sm cursor-not-allowed"
                      >
                        Pilih Parsial
                      </button>
                    </div>
                  </div>
                )}
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
                      const isIgd = actorLower.includes('igd') || actorLower.includes('perawat');

                      switch (tx.type) {
                        case 'IGD_DISPATCH_DIRTY':
                          return { 
                            label: 'SERAH KOTOR (DIKIRIM)', 
                            color: 'bg-rose-50 text-rose-700 border-rose-200', 
                            icon: <FaTruckLoading size={12} /> 
                          };
                        case 'LAUNDRY_RECEIVE_DIRTY':
                          return { 
                            label: 'TERIMA KOTOR (DIKERJAKAN)', 
                            color: 'bg-amber-50 text-amber-700 border-amber-200', 
                            icon: <FaTruckLoading size={12} /> 
                          };
                        case 'LAUNDRY_DISPATCH_CLEAN':
                          return { 
                            label: 'KIRIM BERSIH (DIKIRIM)', 
                            color: 'bg-teal-50 text-teal-700 border-teal-200', 
                            icon: <FaTruckLoading size={12} /> 
                          };
                        case 'IGD_RECEIVE_CLEAN':
                          return { 
                            label: 'TERIMA BERSIH (LEMARI)', 
                            color: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
                            icon: <FaCheckDouble size={12} /> 
                          };
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

      {/* Linen Report Download Modal (PDF & Excel) */}
      <LinenReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        items={items}
        unitId={unitId}
        unitName={activeUnit}
      />
    </div>
  );
};

export default LinenFlowPage;

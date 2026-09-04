import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { LinenItem, LinenTransaction, TransactionType } from '../../types/linen';
import { 
  seedInitialIgdLinen, 
  subscribeLinenItems, 
  getLinenStatusLevel,
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
  FaDownload,
  FaSlidersH
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



  return (
    <div className={`font-sans pb-16 ${isInsideAdmin ? 'w-full' : 'min-h-screen bg-slate-100 text-slate-900'}`}>
      
      {/* Top Header Bar: Rendered only in Standalone Mode (outside AdminLayout) */}
      {!isInsideAdmin && (
        <header className="bg-slate-900 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3">
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
                  Primaya Hospital • {operationalRole === 'IGD' ? 'Stasiun Lemari & Perawat IGD' : 'Stasiun Gudang & Pelayanan Laundry'}
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
                title={operationalRole === 'IGD' ? "Cetak Barcode/QR Lemari IGD" : "Cetak Barcode/QR Gudang Laundry"}
              >
                <FaQrcode size={16} />
                <span className="hidden sm:inline">{operationalRole === 'IGD' ? 'QR Lemari' : 'QR Gudang'}</span>
              </button>
              <Link
                to="/admin"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors border border-white/10"
                title="Kembali ke Admin Panel"
              >
                <FaArrowLeft size={14} />
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-6">
        
        {/* Admin In-Page Navigation Hero Card (Only inside AdminLayout) */}
        {isInsideAdmin && (
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 font-black text-lg">
                <FaHospital size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {activeTab === 'COORDINATOR' ? 'Dashboard Koordinator Linen' : 'Mode Operasional Stasiun Kerja'}
                  </h2>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    {unitParam}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Primaya Hospital • Sistem Inventaris & Manajemen Sirkulasi Linen IGD ⟷ Laundry
                </p>
              </div>
            </div>

            {/* In-Page Navigation Switcher (Coordinator vs Operational) */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-2xs">
                <Link
                  to="/admin/linen?tab=coordinator"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === 'COORDINATOR'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FaSlidersH size={12} />
                  <span>Matriks Koordinator</span>
                </Link>
                <Link
                  to="/admin/linen"
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    activeTab === 'OPERATIONAL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FaThLarge size={12} />
                  <span>Operasional Stasiun</span>
                </Link>
              </div>

              <button
                onClick={() => setIsQrModalOpen(true)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
                title={operationalRole === 'IGD' ? "Cetak Barcode/QR Lemari IGD" : "Cetak Barcode/QR Gudang Laundry"}
              >
                <FaQrcode size={15} />
                <span className="hidden md:inline">QR Stasiun</span>
              </button>
            </div>
          </div>
        )}
        
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
                    {operationalRole === 'IGD' ? 'Stok Bersih di Lemari IGD' : 'Monitoring Stok Lemari IGD & Gudang Laundry'}
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
                      : 'Stasiun gudang & runner laundry: terima kotor dari IGD atau kirim bersih ke IGD'}
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
                          toast.error('Linen masih sedang dikerjakan di gudang laundry. Belum ada linen bersih yang dikirim ke IGD.');
                        } else if (totalInTransitDirty > 0) {
                          toast.error('Linen kotor masih dalam perjalanan ke gudang laundry.');
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
                          ? `Nonaktif: Masih dikerjakan di gudang laundry (${totalInLaundry} pcs)`
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
                          } else {
                            handleOpenAction('LAUNDRY_PICKUP', undefined, 'LAUNDRY');
                          }
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
                              Gudang
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
                              ? `Terima ${waitingDirty} pcs linen kotor untuk diproses di gudang`
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
                          toast.error('Tidak ada cucian yang siap dikirim di gudang.');
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
                          Gudang
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
                          ? `Kirim ${totalInLaundry} pcs linen bersih dari gudang laundry ke IGD`
                          : totalInTransitClean > 0
                          ? 'Nonaktif: Sedang dikirim ke IGD (menunggu konfirmasi perawat)'
                          : 'Nonaktif: Tidak ada stok siap di gudang'}
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </section>

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

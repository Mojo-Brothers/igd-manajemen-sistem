import React, { useState, useEffect } from 'react';
import { LinenStock, LinenTransaction, LinenSettings, UserRole } from '../../types/linen';
import { 
  initializeLinenStockIfNeeded, 
  subscribeLinenStock, 
  subscribeLinenSettings, 
  subscribeRecentTransactions 
} from '../../services/linenService';
import { getCurrentShift, getJakartaDateInfo, DEFAULT_LINEN_SETTINGS } from '../../utils/linenUtils';
import { useAuth } from '../../contexts/AuthContext';
import { StockCard } from './components/StockCard';
import { NursePickupModal } from './components/NursePickupModal';
import { LaundryModal } from './components/LaundryModal';
import { ReconciliationCard } from './components/ReconciliationCard';
import { DailyActivityList } from './components/DailyActivityList';
import { LinenReports } from './components/LinenReports';
import { LinenSettingsModal } from './components/LinenSettingsModal';
import { 
  FaBoxes, 
  FaHandsWash, 
  FaTruckLoading, 
  FaCog, 
  FaClock, 
  FaUserTag, 
  FaFileAlt
} from 'react-icons/fa';

const LinenManagement: React.FC = () => {
  const { currentUser } = useAuth();

  // State data
  const [stocks, setStocks] = useState<LinenStock[]>([]);
  const [settings, setSettings] = useState<LinenSettings>(DEFAULT_LINEN_SETTINGS);
  const [recentTransactions, setRecentTransactions] = useState<LinenTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Role and Name (for easy staff switching in IGD)
  const [activeRole, setActiveRole] = useState<UserRole>('ADMIN');
  const [staffName, setStaffName] = useState<string>(() => {
    return currentUser?.email?.split('@')[0] || 'Admin IGD';
  });

  // Active Modals
  const [selectedStockForPickup, setSelectedStockForPickup] = useState<LinenStock | null>(null);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState<boolean>(false);
  const [isLaundryModalOpen, setIsLaundryModalOpen] = useState<boolean>(false);
  const [laundryInitialTab, setLaundryInitialTab] = useState<'DIRTY' | 'RETURN'>('DIRTY');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Active Tab View: 'DASHBOARD' | 'REPORTS'
  const [mainView, setMainView] = useState<'DASHBOARD' | 'REPORTS'>('DASHBOARD');

  // Real-time Clock in Asia/Jakarta
  const [currentTime, setCurrentTime] = useState(getJakartaDateInfo());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getJakartaDateInfo());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Initialize and Subscribe
  useEffect(() => {
    let unsubscribeStock: (() => void) | undefined;
    let unsubscribeSettings: (() => void) | undefined;
    let unsubscribeTransactions: (() => void) | undefined;

    const init = async () => {
      setLoading(true);
      await initializeLinenStockIfNeeded();

      unsubscribeStock = subscribeLinenStock((stockItems) => {
        setStocks(stockItems);
        setLoading(false);
      });

      unsubscribeSettings = subscribeLinenSettings((newSettings) => {
        setSettings(newSettings);
      });

      unsubscribeTransactions = subscribeRecentTransactions((trxs) => {
        setRecentTransactions(trxs);
      }, 15);
    };

    init();

    return () => {
      unsubscribeStock?.();
      unsubscribeSettings?.();
      unsubscribeTransactions?.();
    };
  }, []);

  const currentShift = getCurrentShift(settings.shifts);

  // Handler for nurse pickup click
  const handleOpenPickup = (stock: LinenStock) => {
    setSelectedStockForPickup(stock);
    setIsPickupModalOpen(true);
  };

  // Handler for laundry modal
  const handleOpenLaundry = (tab: 'DIRTY' | 'RETURN') => {
    setLaundryInitialTab(tab);
    setIsLaundryModalOpen(true);
  };

  // Permission helpers
  const canPickup = activeRole === 'ADMIN' || activeRole === 'KOORDINATOR' || activeRole === 'PERAWAT';
  const canLaundry = activeRole === 'ADMIN' || activeRole === 'KOORDINATOR' || activeRole === 'LAUNDRY';
  const canReconcile = activeRole === 'ADMIN' || activeRole === 'KOORDINATOR';
  const canManageSettings = activeRole === 'ADMIN' || activeRole === 'KOORDINATOR';

  // Last update info
  const lastUpdateStock = stocks[0]?.lastUpdated 
    ? stocks[0] 
    : (stocks[1]?.lastUpdated ? stocks[1] : null);

  const formatLastUpdatedTime = () => {
    if (!lastUpdateStock?.lastUpdated) return 'Belum ada aktivitas';
    try {
      const d = (lastUpdateStock.lastUpdated as any).toDate 
        ? (lastUpdateStock.lastUpdated as any).toDate() 
        : new Date((lastUpdateStock.lastUpdated as any).seconds * 1000);
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d) + ' WIB';
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Hospital Context & Role Switcher */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-extrabold uppercase tracking-wider">
              Modul Operasional IGD
            </span>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center gap-1">
              <FaClock size={11} />
              Shift {currentShift} • {currentTime.timeString} WIB
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight">
            Linen Management IGD
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Pelacakan akurat siklus Selimut & Perlak: Lemari Bersih ➔ Pasien ➔ Kotor ➔ Laundry.
          </p>
        </div>

        {/* Operational Staff Switcher */}
        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FaUserTag className="text-primary shrink-0" size={14} />
            <span className="font-semibold">Petugas:</span>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:outline-none focus:border-primary w-32"
              placeholder="Nama Anda"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] font-medium text-gray-400">Role:</span>
            <div className="flex bg-white p-1 rounded-xl border border-gray-200 w-full sm:w-auto overflow-x-auto">
              {(['ADMIN', 'KOORDINATOR', 'PERAWAT', 'LAUNDRY'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveRole(role)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                    activeRole === role
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMainView('DASHBOARD')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              mainView === 'DASHBOARD'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <FaBoxes size={15} />
            <span>Dashboard Stok & Operasional</span>
          </button>

          <button
            type="button"
            onClick={() => setMainView('REPORTS')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              mainView === 'REPORTS'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <FaFileAlt size={14} />
            <span>Laporan & Rekapitulasi</span>
          </button>
        </div>

        {canManageSettings && (
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <FaCog size={13} className="text-gray-500" />
            <span className="hidden sm:inline">Pengaturan Threshold & Shift</span>
          </button>
        )}
      </div>

      {mainView === 'DASHBOARD' ? (
        <>
          {/* Quick Action Buttons Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {canPickup && (
              <button
                type="button"
                onClick={() => {
                  const s = stocks.find(i => i.id === 'selimut') || stocks[0];
                  if (s) handleOpenPickup(s);
                }}
                className="p-4 bg-gradient-to-r from-blue-600 to-primary text-white rounded-2xl shadow-md hover:shadow-lg flex items-center justify-between gap-3 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                    <FaBoxes size={20} />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-sm block leading-tight">Perawat: Ambil Linen Bersih</span>
                    <span className="text-[11px] text-blue-100">Ambil Selimut / Perlak dari lemari</span>
                  </div>
                </div>
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg font-bold">Buka ➔</span>
              </button>
            )}

            {canLaundry && (
              <button
                type="button"
                onClick={() => handleOpenLaundry('DIRTY')}
                className="p-4 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-2xl shadow-md hover:shadow-lg flex items-center justify-between gap-3 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                    <FaHandsWash size={20} />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-sm block leading-tight">Laundry: Ambil Linen Kotor</span>
                    <span className="text-[11px] text-amber-100">Catat penyerahan linen kotor IGD</span>
                  </div>
                </div>
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg font-bold">Catat ➔</span>
              </button>
            )}

            {canLaundry && (
              <button
                type="button"
                onClick={() => handleOpenLaundry('RETURN')}
                className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-md hover:shadow-lg flex items-center justify-between gap-3 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                    <FaTruckLoading size={20} />
                  </div>
                  <div className="text-left">
                    <span className="font-extrabold text-sm block leading-tight">Laundry: Kembali Bersih</span>
                    <span className="text-[11px] text-emerald-100">Linen selesai cuci masuk lemari</span>
                  </div>
                </div>
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-lg font-bold">Masuk ➔</span>
              </button>
            )}
          </div>

          {/* Real-time Stock Cards (SELIMUT & PERLAK) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 py-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-100">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold">Memuat stok real-time linen IGD...</p>
              </div>
            ) : (
              stocks.map((stock) => (
                <StockCard
                  key={stock.id}
                  stock={stock}
                  onPickupClick={handleOpenPickup}
                  canPickup={canPickup}
                />
              ))
            )}
          </div>

          {/* Last Update Status Card */}
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-gray-500">
              <FaClock className="text-primary" />
              <span>Update Terakhir:</span>
              <strong className="text-gray-800">{formatLastUpdatedTime()}</strong>
              {lastUpdateStock?.lastUpdatedBy && (
                <span className="text-gray-400">• Oleh <span className="font-semibold text-gray-700">{lastUpdateStock.lastUpdatedBy}</span></span>
              )}
            </div>
            {lastUpdateStock?.lastUpdateAction && (
              <span className="text-gray-500 italic max-w-md truncate">
                "{lastUpdateStock.lastUpdateAction}"
              </span>
            )}
          </div>

          {/* Reconciliation Section */}
          <ReconciliationCard
            stocks={stocks}
            userId={currentUser?.uid || 'user-anon'}
            userName={staffName}
            userRole={activeRole}
            settings={settings}
            canCorrect={canReconcile}
          />

          {/* Daily Activity Feed */}
          <DailyActivityList
            transactions={recentTransactions}
            loading={loading}
          />
        </>
      ) : (
        /* REPORTS VIEW */
        <LinenReports />
      )}

      {/* Modals */}
      <NursePickupModal
        isOpen={isPickupModalOpen}
        onClose={() => setIsPickupModalOpen(false)}
        stock={selectedStockForPickup}
        userId={currentUser?.uid || 'user-anon'}
        userName={staffName}
        userRole={activeRole}
        settings={settings}
      />

      <LaundryModal
        isOpen={isLaundryModalOpen}
        onClose={() => setIsLaundryModalOpen(false)}
        stocks={stocks}
        userId={currentUser?.uid || 'user-anon'}
        userName={staffName}
        userRole={activeRole}
        settings={settings}
        initialTab={laundryInitialTab}
      />

      <LinenSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
      />
    </div>
  );
};

export default LinenManagement;

import { useState, useEffect, useMemo } from 'react';
import {
  FaAmbulance,
  FaPlus,
  FaLock,
  FaRoute,
  FaTrash,
  FaExclamationTriangle,
  FaList,
  FaIdCard,
  FaThLarge,
  FaDownload,
  FaMobileAlt,
  FaDesktop,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAmbulanceMobileFriendly } from '../hooks/useAmbulanceMobileFriendly';
import {
  AmbulanceExpedition as IAmbulanceExpedition,
  AmbulanceExpeditionFormData,
  AmbulanceFilterState,
} from '../types/ambulance';
import {
  subscribeAmbulanceExpeditions,
  createAmbulanceExpedition,
  updateAmbulanceExpedition,
  deleteAmbulanceExpedition,
  subscribeAmbulanceDrivers,
  addAmbulanceDriver,
  subscribeAmbulanceFleets,
  addAmbulanceFleet,
} from '../services/ambulanceService';
import { AmbulancePinGate } from '../components/ambulance/AmbulancePinGate';
import { AmbulanceStats } from '../components/ambulance/AmbulanceStats';
import { AmbulanceFilters } from '../components/ambulance/AmbulanceFilters';
import { AmbulanceTable, AmbulanceViewMode } from '../components/ambulance/AmbulanceTable';
import { AmbulanceFormModal } from '../components/ambulance/AmbulanceFormModal';
import { AmbulanceDetailModal } from '../components/ambulance/AmbulanceDetailModal';
import { AmbulanceReportModal } from '../components/ambulance/AmbulanceReportModal';
import { getTodayDateString } from '../utils/ambulanceUtils';
import { DEFAULT_DRIVERS, DEFAULT_AMBULANCE_FLEETS } from '../utils/ambulanceConstants';

const AmbulanceFrontPage = () => {
  // Check session authorization for PIN gate
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('ambulance_front_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [expeditions, setExpeditions] = useState<IAmbulanceExpedition[]>([]);
  const [drivers, setDrivers] = useState<string[]>(DEFAULT_DRIVERS);
  const [fleets, setFleets] = useState<string[]>(DEFAULT_AMBULANCE_FLEETS);
  const [loading, setLoading] = useState(true);

  // View Mode: list (default), card, grid
  const [viewMode, setViewMode] = useState<AmbulanceViewMode>(() => {
    try {
      const saved = localStorage.getItem('ambulance_view_mode') as AmbulanceViewMode;
      if (saved === 'card' || saved === 'grid' || saved === 'list') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'list'; // Default : list
  });

  const handleViewModeChange = (mode: AmbulanceViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('ambulance_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IAmbulanceExpedition | null>(null);
  const [detailItem, setDetailItem] = useState<IAmbulanceExpedition | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Delete confirmation state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<IAmbulanceExpedition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters state (Default 'today' on front operational page for instant speed)
  const [filters, setFilters] = useState<AmbulanceFilterState>({
    searchQuery: '',
    datePreset: 'today',
    startDate: '',
    endDate: '',
    activityType: '',
    ambulance: '',
    driver: '',
  });

  // Mobile Friendly vs Desktop View Mode Hook (Default mobile-friendly on smartphones)
  const {
    isMobileFriendly,
    setMobileFriendly,
    wrapperClass,
    containerClass,
  } = useAmbulanceMobileFriendly();

  // Real-time listener
  useEffect(() => {
    if (!isUnlocked) return;

    setLoading(true);
    const unsubscribeExpeditions = subscribeAmbulanceExpeditions(
      (items) => {
        setExpeditions(items);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching ambulance expeditions:', error);
        setLoading(false);
      }
    );

    const unsubscribeDrivers = subscribeAmbulanceDrivers((driverList) => {
      setDrivers(driverList);
    });

    const unsubscribeFleets = subscribeAmbulanceFleets((fleetList) => {
      setFleets(fleetList);
    });

    return () => {
      unsubscribeExpeditions();
      unsubscribeDrivers();
      unsubscribeFleets();
    };
  }, [isUnlocked]);

  // Combine driver list
  const availableDrivers = useMemo(() => {
    const list = new Set([
      ...DEFAULT_DRIVERS,
      ...drivers,
      ...expeditions.map((e) => e.driver?.trim()).filter((d): d is string => Boolean(d)),
    ]);
    return Array.from(list).sort((a, b) => a.localeCompare(b, 'id'));
  }, [drivers, expeditions]);

  // Combine ambulance fleet list
  const availableAmbulances = useMemo(() => {
    const list = new Set([
      ...DEFAULT_AMBULANCE_FLEETS,
      ...fleets,
      ...expeditions.map((e) => e.ambulance?.trim()).filter((a): a is string => Boolean(a)),
    ]);
    return Array.from(list).sort((a, b) => a.localeCompare(b, 'id'));
  }, [fleets, expeditions]);

  // Filtered expeditions
  const filteredExpeditions = useMemo(() => {
    const today = new Date();
    const todayStr = getTodayDateString();

    // Helper calculate week start
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay() || 7;
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    return expeditions.filter((item) => {
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchPatient = item.patientName?.toLowerCase().includes(query);
        const matchRM = item.medicalRecordNumber?.toLowerCase().includes(query);
        const matchActivity = item.activityType.toLowerCase().includes(query);
        const matchDriver = item.driver.toLowerCase().includes(query);
        const matchAmbulance = item.ambulance.toLowerCase().includes(query);
        const matchExpNumber = item.expeditionNumber.toLowerCase().includes(query);
        const matchNotes = item.notes?.toLowerCase().includes(query);

        if (
          !matchPatient &&
          !matchRM &&
          !matchActivity &&
          !matchDriver &&
          !matchAmbulance &&
          !matchExpNumber &&
          !matchNotes
        ) {
          return false;
        }
      }

      if (filters.datePreset === 'today') {
        if (item.date !== todayStr) return false;
      } else if (filters.datePreset === 'this_week') {
        const itemDate = new Date(item.date);
        if (itemDate < startOfWeek) return false;
      } else if (filters.datePreset === 'this_month') {
        if (!item.date.startsWith(todayStr.substring(0, 7))) return false;
      } else if (filters.datePreset === 'custom') {
        if (filters.startDate && item.date < filters.startDate) return false;
        if (filters.endDate && item.date > filters.endDate) return false;
      }

      if (filters.activityType && item.activityType !== filters.activityType) {
        return false;
      }

      if (filters.ambulance && item.ambulance !== filters.ambulance) {
        return false;
      }

      if (filters.driver && item.driver !== filters.driver) {
        return false;
      }

      return true;
    });
  }, [expeditions, filters]);

  // Lock handler
  const handleLock = () => {
    try {
      sessionStorage.removeItem('ambulance_front_auth');
      localStorage.removeItem('ambulance_front_auth');
    } catch (e) {
      console.warn(e);
    }
    setIsUnlocked(false);
    toast.success('Halaman dikunci. Masukkan PIN untuk membuka.');
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: IAmbulanceExpedition) => {
    setEditingItem(item);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData: AmbulanceExpeditionFormData) => {
    const userMeta = {
      nameOrEmail: 'Petugas Ambulance (Front)',
    };

    if (editingItem) {
      await updateAmbulanceExpedition(editingItem.id, formData, userMeta);
      toast.success('Kegiatan berhasil diperbarui');
    } else {
      await createAmbulanceExpedition(formData, userMeta);
      toast.success('Kegiatan ambulance berhasil dicatat');
    }
  };

  const handleDeleteClick = (item: IAmbulanceExpedition) => {
    setDeleteConfirmItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      setIsDeleting(true);
      await deleteAmbulanceExpedition(deleteConfirmItem.id);
      toast.success(`Kegiatan ${deleteConfirmItem.expeditionNumber} dihapus`);
      setDeleteConfirmItem(null);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menghapus kegiatan');
    } finally {
      setIsDeleting(false);
    }
  };

  // If not unlocked, render the PIN Gate
  if (!isUnlocked) {
    return <AmbulancePinGate onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className={`min-h-screen bg-slate-100 flex flex-col ${wrapperClass}`}>
      {/* Mobile-Friendly Top Navigation */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-md">
        <div className={`mx-auto px-4 py-3 flex items-center justify-between gap-2 sm:gap-3 ${containerClass}`}>
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <FaAmbulance size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="font-extrabold text-sm sm:text-lg leading-tight tracking-tight truncate">
                  Ekspedisi Ambulance
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-100 text-[10px] font-bold border border-blue-400/30">
                  Front Workstation
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-blue-100 truncate">
                Primaya Hospital • Logbook Operasional IGD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Switch Mode: Mobile-Friendly vs Desktop */}
            <div className="flex items-center bg-black/20 p-0.5 sm:p-1 rounded-xl border border-white/20">
              <button
                type="button"
                onClick={() => {
                  setMobileFriendly(true);
                  toast.success('Beralih ke Tampilan Mobile-Friendly 📱', { id: 'ambulance-view-mode' });
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isMobileFriendly
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
                title="Tampilan Mobile-Friendly (Dioptimalkan untuk Layar HP)"
              >
                <FaMobileAlt size={12} />
                <span className="text-[10px] sm:text-xs">Mobile</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileFriendly(false);
                  toast.success('Beralih ke Tampilan Desktop (PC View) 💻', { id: 'ambulance-view-mode' });
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isMobileFriendly
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
                title="Tampilan Desktop (Mode PC Monitor Penuh)"
              >
                <FaDesktop size={12} />
                <span className="text-[10px] sm:text-xs">Desktop</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleLock}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs rounded-xl border border-white/20 transition-all cursor-pointer shadow-xs shrink-0"
              title="Kunci Halaman (Kembali ke Login PIN)"
            >
              <FaLock size={12} className="text-amber-300" />
              <span className="hidden sm:inline">Kunci</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className={`flex-1 mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 ${containerClass}`}>
        {/* Mobile Quick Action Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-primary text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-white/20 rounded-md text-[10px] font-mono font-bold">
                Waktu Operasional: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                isMobileFriendly
                  ? 'bg-emerald-500/25 text-emerald-100 border-emerald-400/40'
                  : 'bg-amber-400/25 text-amber-100 border-amber-300/40'
              }`}>
                {isMobileFriendly ? <FaMobileAlt size={9} /> : <FaDesktop size={9} />}
                <span>{isMobileFriendly ? 'Mode Mobile-Friendly' : 'Mode Desktop Widescreen'}</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Logbook Operasional Ambulance IGD
            </h2>
            <p className="text-xs text-blue-100 max-w-xl">
              Catat perjalanan penjemputan, rujukan, antar pasien, atau kegiatan dinas armada EVALIA, BSI, dan PHC secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="w-full sm:w-auto px-4 py-3 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-white/20"
              title="Unduh Laporan Bulanan (Excel & PDF)"
            >
              <FaDownload size={13} />
              <span>Unduh Laporan Bulanan</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-blue-50 text-primary font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <FaPlus size={13} />
              <span>Catat Perjalanan Baru</span>
            </button>
          </div>
        </div>

        {/* Real-time Summary Metrics */}
        <AmbulanceStats
          expeditions={expeditions}
          showMonthlyFilter={false}
        />

        {/* Filters and Search */}
        <AmbulanceFilters
          filters={filters}
          onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
          onResetFilters={() =>
            setFilters({
              searchQuery: '',
              datePreset: 'today',
              startDate: '',
              endDate: '',
              activityType: '',
              ambulance: '',
              driver: '',
            })
          }
          availableDrivers={availableDrivers}
          availableAmbulances={availableAmbulances}
        />

        {/* Trip List / Cards / Table */}
        <div className="space-y-3">
          {/* Header with View Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FaRoute className="text-primary" size={14} />
                <span>Daftar Ekspedisi ({filteredExpeditions.length})</span>
              </h3>
              {filters.datePreset === 'today' && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Mode Hari Ini
                </span>
              )}
            </div>

            {/* View Mode Toggle: List, Card, Grid (Default: List) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Tampilan List (Tabel)"
              >
                <FaList size={11} />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('card')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Tampilan Card"
              >
                <FaIdCard size={12} />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Tampilan Grid (Kompak)"
              >
                <FaThLarge size={11} />
                <span>Grid</span>
              </button>
            </div>
          </div>

          {/* Render Expeditions View */}
          <AmbulanceTable
            expeditions={filteredExpeditions}
            loading={loading}
            onDetail={(item) => setDetailItem(item)}
            onEdit={(item) => handleOpenEditModal(item)}
            onDelete={(item) => handleDeleteClick(item)}
            onAddNew={handleOpenAddModal}
            viewMode={viewMode}
            isMobileFriendly={isMobileFriendly}
          />
        </div>
      </main>

      {/* Floating Action Button (FAB) on Mobile */}
      <div className="sm:hidden fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white shadow-xl flex items-center justify-center transition-all cursor-pointer"
          title="Tambah Perjalanan Baru"
        >
          <FaPlus size={20} />
        </button>
      </div>

      {/* Form Modal (Create & Edit) */}
      <AmbulanceFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        editingData={editingItem}
        drivers={availableDrivers}
        onAddDriver={addAmbulanceDriver}
        ambulances={availableAmbulances}
        onAddAmbulance={addAmbulanceFleet}
      />

      {/* Detail Modal */}
      <AmbulanceDetailModal
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        data={detailItem}
      />

      {/* Monthly Report Download Modal */}
      <AmbulanceReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        expeditions={expeditions}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-3.5 text-red-600">
              <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <FaExclamationTriangle size={20} />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-800">
                  Konfirmasi Hapus Kegiatan
                </h4>
                <p className="text-xs text-gray-500">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus log ekspedisi ini?
            </p>

            <div className="p-3.5 bg-gray-50 rounded-xl text-xs space-y-1 border border-gray-200">
              <p>
                <strong>No. Ekspedisi:</strong>{' '}
                <span className="font-mono text-primary font-bold">
                  {deleteConfirmItem.expeditionNumber}
                </span>
              </p>
              <p>
                <strong>Kegiatan:</strong> {deleteConfirmItem.activityType}
              </p>
              {deleteConfirmItem.patientName && (
                <p>
                  <strong>Pasien:</strong> {deleteConfirmItem.patientName}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FaTrash size={12} />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbulanceFrontPage;

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaAmbulance,
  FaPlus,
  FaTrash,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaRoute,
  FaList,
  FaIdCard,
  FaThLarge,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
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
import { AmbulanceStats } from '../components/ambulance/AmbulanceStats';
import { AmbulanceFilters } from '../components/ambulance/AmbulanceFilters';
import { AmbulanceTable, AmbulanceViewMode } from '../components/ambulance/AmbulanceTable';
import { AmbulanceFormModal } from '../components/ambulance/AmbulanceFormModal';
import { AmbulanceDetailModal } from '../components/ambulance/AmbulanceDetailModal';
import { getTodayDateString } from '../utils/ambulanceUtils';
import { DEFAULT_DRIVERS, DEFAULT_AMBULANCE_FLEETS } from '../utils/ambulanceConstants';

const AmbulanceExpedition = () => {
  const { currentUser } = useAuth();

  const [expeditions, setExpeditions] = useState<IAmbulanceExpedition[]>([]);
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

  // Delete confirmation state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<IAmbulanceExpedition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<AmbulanceFilterState>({
    searchQuery: '',
    datePreset: 'all',
    startDate: '',
    endDate: '',
    activityType: '',
    ambulance: '',
    driver: '',
  });

  // Real-time Firestore Subscription for Expeditions, Drivers & Fleets
  const [drivers, setDrivers] = useState<string[]>(DEFAULT_DRIVERS);
  const [fleets, setFleets] = useState<string[]>(DEFAULT_AMBULANCE_FLEETS);

  useEffect(() => {
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

    const unsubscribeDrivers = subscribeAmbulanceDrivers(
      (driverList) => {
        setDrivers(driverList);
      }
    );

    const unsubscribeFleets = subscribeAmbulanceFleets(
      (fleetList) => {
        setFleets(fleetList);
      }
    );

    return () => {
      unsubscribeExpeditions();
      unsubscribeDrivers();
      unsubscribeFleets();
    };
  }, []);

  // Extract unique driver list for filter & suggestion
  const availableDrivers = useMemo(() => {
    const list = new Set([
      ...DEFAULT_DRIVERS,
      ...drivers,
      ...expeditions.map((e) => e.driver?.trim()).filter((d): d is string => Boolean(d)),
    ]);
    return Array.from(list).sort((a, b) => a.localeCompare(b, 'id'));
  }, [drivers, expeditions]);

  // Extract unique ambulance fleet list
  const availableAmbulances = useMemo(() => {
    const list = new Set([
      ...DEFAULT_AMBULANCE_FLEETS,
      ...fleets,
      ...expeditions.map((e) => e.ambulance?.trim()).filter((a): a is string => Boolean(a)),
    ]);
    return Array.from(list).sort((a, b) => a.localeCompare(b, 'id'));
  }, [fleets, expeditions]);

  // Filter & Search Logic
  const filteredExpeditions = useMemo(() => {
    const today = new Date();
    const todayStr = getTodayDateString();

    // Helper calculate week start / month start
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay() || 7; // Monday = 1
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return expeditions.filter((item) => {
      // 1. Search Query
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

      // 2. Date Filter
      if (filters.datePreset === 'today') {
        if (item.date !== todayStr) return false;
      } else if (filters.datePreset === 'this_week') {
        const itemDate = new Date(item.date);
        if (itemDate < startOfWeek) return false;
      } else if (filters.datePreset === 'this_month') {
        const itemDate = new Date(item.date);
        if (itemDate < startOfMonth) return false;
      } else if (filters.datePreset === 'custom') {
        if (filters.startDate && item.date < filters.startDate) return false;
        if (filters.endDate && item.date > filters.endDate) return false;
      }

      // 3. Activity Type Filter
      if (filters.activityType && item.activityType !== filters.activityType) {
        return false;
      }

      // 4. Ambulance Filter
      if (filters.ambulance && item.ambulance !== filters.ambulance) {
        return false;
      }

      // 5. Driver Filter
      if (filters.driver && item.driver !== filters.driver) {
        return false;
      }

      return true;
    });
  }, [expeditions, filters]);

  // Handlers for Form
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
      uid: currentUser?.uid,
      nameOrEmail: currentUser?.displayName || currentUser?.email || 'Admin IGD',
    };

    if (editingItem) {
      await updateAmbulanceExpedition(editingItem.id, formData, userMeta);
      toast.success('Kegiatan ambulance berhasil diperbarui');
    } else {
      await createAmbulanceExpedition(formData, userMeta);
      toast.success('Kegiatan ambulance baru berhasil disimpan');
    }
  };

  // Handlers for Delete
  const handleDeleteClick = (item: IAmbulanceExpedition) => {
    setDeleteConfirmItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      setIsDeleting(true);
      await deleteAmbulanceExpedition(deleteConfirmItem.id);
      toast.success(`Data ekspedisi ${deleteConfirmItem.expeditionNumber} berhasil dihapus`);
      setDeleteConfirmItem(null);
    } catch (error) {
      console.error('Failed to delete expedition:', error);
      toast.error('Gagal menghapus data kegiatan');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FaAmbulance size={26} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">
              Ekspedisi Ambulance IGD
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Manajemen dan pencatatan kegiatan operasional Ambulance IGD.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <FaPlus size={13} />
          <span>Tambah Kegiatan</span>
        </button>
      </div>

      {/* Hyperlink Banner to Front Route */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
            <FaAmbulance size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span>Halaman Front Operasional Ambulance (Akses PIN)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-extrabold">
                Mobile-Friendly
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Workstation mobile khusus driver/perawat IGD di rute <code className="font-mono text-primary font-bold">/ambulance</code> yang diproteksi dengan 6-digit PIN tanpa memerlukan login akun email admin.
            </p>
          </div>
        </div>
        <Link
          to="/ambulance"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-4 py-2.5 bg-primary hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <span>Buka Front Ambulance</span>
          <FaExternalLinkAlt size={11} />
        </Link>
      </div>

      {/* Summary Metrics Dashboard */}
      <AmbulanceStats expeditions={expeditions} />

      {/* Filters & Search Component */}
      <AmbulanceFilters
        filters={filters}
        onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        onResetFilters={() =>
          setFilters({
            searchQuery: '',
            datePreset: 'all',
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

      {/* Main Table / List / Cards / Grid */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FaRoute className="text-primary" size={14} />
            <span>Daftar Ekspedisi ({filteredExpeditions.length})</span>
          </h3>

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

        <AmbulanceTable
          expeditions={filteredExpeditions}
          loading={loading}
          onDetail={(item) => setDetailItem(item)}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteClick}
          onAddNew={handleOpenAddModal}
          viewMode={viewMode}
        />
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
              Apakah Anda yakin ingin menghapus data kegiatan ambulance ini?
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
              <p>
                <strong>Driver & Armada:</strong> {deleteConfirmItem.driver} (
                {deleteConfirmItem.ambulance})
              </p>
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

export default AmbulanceExpedition;

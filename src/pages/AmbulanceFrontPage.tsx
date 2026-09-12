import { useState, useEffect, useMemo } from 'react';
import {
  FaAmbulance,
  FaPlus,
  FaLock,
  FaCalendarAlt,
  FaRoute,
  FaClock,
  FaEye,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
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
} from '../services/ambulanceService';
import { AmbulancePinGate } from '../components/ambulance/AmbulancePinGate';
import { AmbulanceStats } from '../components/ambulance/AmbulanceStats';
import { AmbulanceFilters } from '../components/ambulance/AmbulanceFilters';
import { AmbulanceFormModal } from '../components/ambulance/AmbulanceFormModal';
import { AmbulanceDetailModal } from '../components/ambulance/AmbulanceDetailModal';
import { getTodayDateString, formatDateIndo } from '../utils/ambulanceUtils';
import { DEFAULT_DRIVERS } from '../utils/ambulanceConstants';

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
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IAmbulanceExpedition | null>(null);
  const [detailItem, setDetailItem] = useState<IAmbulanceExpedition | null>(null);

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
        toast.error('Gagal memuat data ekspedisi');
        setLoading(false);
      }
    );

    const unsubscribeDrivers = subscribeAmbulanceDrivers((driverList) => {
      setDrivers(driverList);
    });

    return () => {
      unsubscribeExpeditions();
      unsubscribeDrivers();
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

  // Filtered expeditions
  const filteredExpeditions = useMemo(() => {
    const today = new Date();
    const todayStr = getTodayDateString();

    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay() || 7;
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

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
        const itemDate = new Date(item.date);
        if (itemDate < startOfMonth) return false;
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
    } catch (e) {
      console.warn(e);
    }
    setIsUnlocked(false);
    toast.success('Stasiun ambulance dikunci');
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Mobile-Friendly Top Navigation */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <FaAmbulance size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight">
                  Ekspedisi Ambulance
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-100 text-[10px] font-bold border border-blue-400/30">
                  Front Workstation
                </span>
              </div>
              <p className="text-[11px] text-blue-100">
                Primaya Hospital • Logbook Operasional IGD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FaPlus size={12} />
              <span className="hidden sm:inline">Tambah Kegiatan</span>
              <span className="sm:hidden">Tambah</span>
            </button>

            <button
              type="button"
              onClick={handleLock}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Kunci Halaman"
            >
              <FaLock size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Mobile Quick Action Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-primary text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-white/20 rounded-md text-[10px] font-mono font-bold">
                Waktu Operasional: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Logbook Operasional Ambulance IGD
            </h2>
            <p className="text-xs text-blue-100 max-w-xl">
              Catat perjalanan penjemputan, rujukan, antar pasien, atau kegiatan dinas armada EVALIA, BSI, dan PHC secara real-time.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-blue-50 text-primary font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <FaPlus size={13} />
            <span>Catat Perjalanan Baru</span>
          </button>
        </div>

        {/* Real-time Summary Metrics */}
        <AmbulanceStats expeditions={expeditions} />

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
        />

        {/* Trip List / Cards / Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
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

          {loading ? (
            <div className="bg-white rounded-2xl p-12 shadow-xs border border-gray-200 flex flex-col items-center justify-center gap-3 text-center">
              <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-primary"></div>
              <p className="text-xs font-semibold text-gray-600">Memuat log perjalanan ambulance...</p>
            </div>
          ) : filteredExpeditions.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 shadow-xs border border-gray-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mx-auto shadow-2xs">
                <FaAmbulance size={28} />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-800">Tidak ada data kegiatan</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Belum ada aktivitas perjalanan tercatat untuk filter ini.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-blue-800 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FaPlus size={11} />
                <span>Catat Kegiatan Pertama</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredExpeditions.map((item) => {
                const isJemput = item.activityType === 'Jemput Pasien';
                const isRujuk = item.activityType === 'Merujuk Pasien';
                const isPulang = item.activityType === 'Antar Pasien Pulang';

                const badgeBg = isJemput
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isRujuk
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : isPulang
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                  >
                    {/* Header Card */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="font-mono text-xs font-extrabold text-primary px-2 py-0.5 bg-blue-50 rounded-md border border-blue-100">
                          {item.expeditionNumber}
                        </span>
                        <p className="text-[11px] text-gray-500 font-semibold mt-1 flex items-center gap-1">
                          <FaCalendarAlt size={10} />
                          {formatDateIndo(item.date, 'long')}
                        </p>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${badgeBg}`}
                      >
                        {item.activityType}
                      </span>
                    </div>

                    {/* Body Card */}
                    <div className="space-y-2 text-xs">
                      {item.patientName && (
                        <div className="p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Pasien
                          </p>
                          <p className="font-bold text-gray-800 text-sm">
                            {item.patientName}
                          </p>
                          {item.medicalRecordNumber && (
                            <p className="text-[10px] font-mono text-gray-500">
                              No. RM: {item.medicalRecordNumber}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2 bg-blue-50/60 rounded-xl">
                          <p className="text-[10px] font-semibold text-blue-600">Armada</p>
                          <p className="font-bold text-gray-800">{item.ambulance}</p>
                        </div>
                        <div className="p-2 bg-blue-50/60 rounded-xl">
                          <p className="text-[10px] font-semibold text-blue-600">Driver</p>
                          <p className="font-bold text-gray-800 truncate">{item.driver}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-slate-50 rounded-xl">
                          <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                            <FaClock size={9} /> Jam & Durasi
                          </p>
                          <p className="font-bold text-blue-700">
                            {item.startTime} - {item.endTime}
                          </p>
                          <p className="text-[10px] text-gray-500 font-semibold">
                            {item.durationFormatted}
                          </p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl">
                          <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                            <FaRoute size={9} /> Jarak Tempuh
                          </p>
                          <p className="font-bold text-indigo-700 text-sm">
                            {item.distanceKm} KM
                          </p>
                        </div>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-gray-500 italic bg-amber-50/60 p-2 rounded-xl border border-amber-100 line-clamp-2">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDetailItem(item)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FaEye size={11} /> Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FaEdit size={11} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(item)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <FaTrash size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

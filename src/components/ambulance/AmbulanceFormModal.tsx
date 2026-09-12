import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaSave, FaClock, FaAmbulance, FaUser, FaRoute, FaClipboardList, FaPlus, FaCheck, FaChevronDown } from 'react-icons/fa';
import toast from 'react-hot-toast';
import {
  AmbulanceExpedition,
  AmbulanceExpeditionFormData,
  AmbulanceActivityType,
  AmbulanceFleetType,
} from '../../types/ambulance';
import {
  ACTIVITY_TYPES,
  PATIENT_REQUIRED_ACTIVITIES,
  INITIAL_STATUS_OPTIONS,
  FINAL_STATUS_OPTIONS,
  AMBULANCE_FLEET_OPTIONS,
  STATUS_APPLICABLE_ACTIVITIES,
  DEFAULT_DRIVERS,
} from '../../utils/ambulanceConstants';
import {
  calculateDuration,
  getTodayDateString,
  getCurrentTimeString,
} from '../../utils/ambulanceUtils';

interface AmbulanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: AmbulanceExpeditionFormData) => Promise<void>;
  editingData?: AmbulanceExpedition | null;
  drivers?: string[];
  onAddDriver?: (name: string) => Promise<string | void>;
}

export const AmbulanceFormModal: React.FC<AmbulanceFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingData,
  drivers = [],
  onAddDriver,
}) => {
  const [formData, setFormData] = useState<AmbulanceExpeditionFormData>({
    date: getTodayDateString(),
    activityType: 'Jemput Pasien',
    patientName: '',
    medicalRecordNumber: '',
    initialStatus: 'Rumah Pasien',
    finalStatus: 'Rawat Inap',
    ambulance: 'EVALIA',
    driver: '',
    startTime: '08:00',
    endTime: '09:00',
    durationMinutes: 60,
    durationFormatted: '1 Jam',
    distanceKm: 0,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [newDriverName, setNewDriverName] = useState('');
  const [isSavingDriver, setIsSavingDriver] = useState(false);

  // Populate data when editingData changes or modal opens
  useEffect(() => {
    setIsAddingDriver(false);
    setNewDriverName('');
    if (editingData) {
      setFormData({
        date: editingData.date || getTodayDateString(),
        activityType: editingData.activityType || 'Jemput Pasien',
        patientName: editingData.patientName || '',
        medicalRecordNumber: editingData.medicalRecordNumber || '',
        initialStatus: editingData.initialStatus || '',
        finalStatus: editingData.finalStatus || '',
        ambulance: editingData.ambulance || 'EVALIA',
        driver: editingData.driver || '',
        startTime: editingData.startTime || '08:00',
        endTime: editingData.endTime || '09:00',
        durationMinutes: editingData.durationMinutes || 0,
        durationFormatted: editingData.durationFormatted || '',
        distanceKm: editingData.distanceKm || 0,
        notes: editingData.notes || '',
      });
    } else {
      const nowTime = getCurrentTimeString();
      const nextHourTime = (() => {
        const [h, m] = nowTime.split(':').map(Number);
        const nextH = (h + 1) % 24;
        return `${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      })();

      const duration = calculateDuration(nowTime, nextHourTime);

      setFormData({
        date: getTodayDateString(),
        activityType: 'Jemput Pasien',
        patientName: '',
        medicalRecordNumber: '',
        initialStatus: 'Rumah Pasien',
        finalStatus: 'Rawat Inap',
        ambulance: 'EVALIA',
        driver: '',
        startTime: nowTime,
        endTime: nextHourTime,
        durationMinutes: duration.minutes,
        durationFormatted: duration.formatted,
        distanceKm: 0,
        notes: '',
      });
    }
  }, [editingData, isOpen]);

  // Recalculate duration automatically when startTime, endTime, or date changes
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const duration = calculateDuration(formData.startTime, formData.endTime, formData.date);
      setFormData((prev) => ({
        ...prev,
        durationMinutes: duration.minutes,
        durationFormatted: duration.formatted,
      }));
    }
  }, [formData.startTime, formData.endTime, formData.date]);

  const driverList = useMemo(() => {
    const list = new Set(drivers && drivers.length > 0 ? drivers : DEFAULT_DRIVERS);
    if (formData.driver && !list.has(formData.driver)) {
      list.add(formData.driver);
    }
    return Array.from(list).sort((a, b) => a.localeCompare(b, 'id'));
  }, [drivers, formData.driver]);

  const handleSaveNewDriver = async () => {
    const trimmed = newDriverName.trim();
    if (!trimmed) {
      toast.error('Nama driver tidak boleh kosong');
      return;
    }
    try {
      setIsSavingDriver(true);
      if (onAddDriver) {
        await onAddDriver(trimmed);
      }
      setFormData((prev) => ({ ...prev, driver: trimmed }));
      toast.success(`Driver "${trimmed}" berhasil ditambahkan`);
      setNewDriverName('');
      setIsAddingDriver(false);
    } catch (error) {
      console.error('Failed to add driver:', error);
      toast.error('Gagal menambahkan driver');
    } finally {
      setIsSavingDriver(false);
    }
  };

  if (!isOpen) return null;

  const isPatientRequired = PATIENT_REQUIRED_ACTIVITIES.includes(formData.activityType);
  const isStatusApplicable = STATUS_APPLICABLE_ACTIVITIES.includes(formData.activityType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Dasar
    if (!formData.date) {
      toast.error('Tanggal kegiatan wajib diisi');
      return;
    }
    if (!formData.activityType) {
      toast.error('Jenis kegiatan wajib dipilih');
      return;
    }
    if (!formData.ambulance) {
      toast.error('Ambulance yang digunakan wajib dipilih');
      return;
    }
    if (!formData.driver.trim()) {
      toast.error('Nama Driver wajib diisi');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error('Waktu mulai dan waktu selesai wajib diisi');
      return;
    }

    // Validasi Kondisional Pasien
    if (isPatientRequired && !formData.patientName?.trim()) {
      toast.error(`Nama Pasien wajib diisi untuk kegiatan "${formData.activityType}"`);
      return;
    }

    // Validasi Jarak Tempuh
    if (formData.distanceKm < 0) {
      toast.error('Jarak tempuh tidak boleh bernilai negatif');
      return;
    }

    // Validasi Keterangan Jika Memilih 'Lainnya'
    const hasLainnya =
      formData.activityType === 'Lainnya' ||
      formData.initialStatus === 'Lainnya' ||
      formData.finalStatus === 'Lainnya';

    if (hasLainnya && !formData.notes?.trim()) {
      toast.error('Keterangan Tambahan wajib diisi jika memilih opsi "Lainnya"');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Submit expedition error:', error);
      toast.error('Gagal menyimpan data ekspedisi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-primary text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FaAmbulance size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {editingData ? 'Edit Kegiatan Ambulance' : 'Tambah Kegiatan Ambulance'}
              </h3>
              <p className="text-xs text-blue-100">
                {editingData
                  ? `Memperbarui log ekspedisi ${editingData.expeditionNumber}`
                  : 'Catat aktivitas operasional ambulance IGD terkini'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: INFORMASI KEGIATAN */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
              <FaClipboardList className="text-primary" size={16} />
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                1. Informasi Kegiatan
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tanggal */}
              <div>
                <div className="h-5 flex items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Tanggal Kegiatan <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full h-10 px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Jenis Kegiatan */}
              <div>
                <div className="h-5 flex items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Jenis Kegiatan <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <select
                    required
                    value={formData.activityType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        activityType: e.target.value as AmbulanceActivityType,
                      })
                    }
                    className="w-full h-10 appearance-none pl-3.5 pr-10 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    {ACTIVITY_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
                    <FaChevronDown size={12} />
                  </div>
                </div>
              </div>

              {/* Ambulance */}
              <div>
                <div className="h-5 flex items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Ambulance yang Digunakan <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <select
                    required
                    value={formData.ambulance}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ambulance: e.target.value as AmbulanceFleetType,
                      })
                    }
                    className="w-full h-10 appearance-none pl-3.5 pr-10 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
                  >
                    {AMBULANCE_FLEET_OPTIONS.map((fleet) => (
                      <option key={fleet} value={fleet}>
                        {fleet}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
                    <FaChevronDown size={12} />
                  </div>
                </div>
              </div>

              {/* Driver */}
              <div>
                <div className="h-5 flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Driver <span className="text-red-500">*</span>
                  </label>
                  {!isAddingDriver && (
                    <button
                      type="button"
                      onClick={() => setIsAddingDriver(true)}
                      className="text-[11px] font-bold text-primary hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Tambah Nama Driver Baru"
                    >
                      <FaPlus size={9} /> Tambah Driver
                    </button>
                  )}
                </div>

                {isAddingDriver ? (
                  <div className="flex items-center gap-1.5 h-10 animate-fadeIn">
                    <input
                      type="text"
                      autoFocus
                      value={newDriverName}
                      onChange={(e) => setNewDriverName(e.target.value)}
                      placeholder="Ketik nama driver..."
                      className="flex-1 h-full px-3 py-2 text-xs bg-white border border-primary rounded-xl focus:ring-2 focus:ring-primary/30 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveNewDriver();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={isSavingDriver}
                      onClick={handleSaveNewDriver}
                      className="h-full px-3 bg-primary hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
                    >
                      <FaCheck size={11} /> {isSavingDriver ? '...' : 'Simpan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingDriver(false);
                        setNewDriverName('');
                      }}
                      className="h-full px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      <FaTimes size={11} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      required
                      value={formData.driver}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsAddingDriver(true);
                        } else {
                          setFormData({ ...formData, driver: e.target.value });
                        }
                      }}
                      className="w-full h-10 appearance-none pl-3.5 pr-10 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
                    >
                      <option value="">-- Pilih Driver --</option>
                      {driverList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                      <option value="__NEW__">+ Tambah Driver Baru...</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
                      <FaChevronDown size={12} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: INFORMASI PASIEN (Conditional) */}
          <div className="bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100 space-y-4">
            <div className="flex items-center justify-between border-b border-blue-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <FaUser className="text-blue-700" size={15} />
                <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wide">
                  2. Informasi Pasien
                </h4>
              </div>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  isPatientRequired
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {isPatientRequired ? 'Wajib Diisi' : 'Opsional'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Pasien */}
              <div>
                <div className="h-5 flex items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Nama Pasien {isPatientRequired && <span className="text-red-500">*</span>}
                  </label>
                </div>
                <input
                  type="text"
                  required={isPatientRequired}
                  value={formData.patientName || ''}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  placeholder={
                    isPatientRequired ? 'Contoh: Ny. Siti Rahma' : 'Opsional / jika ada pasien'
                  }
                  className="w-full h-10 px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Nomor Rekam Medis */}
              <div>
                <div className="h-5 flex items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Nomor Rekam Medis (No. RM) <span className="text-gray-400 font-normal text-[11px] ml-1">(Opsional)</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.medicalRecordNumber || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, medicalRecordNumber: e.target.value })
                  }
                  placeholder="Contoh: RM-0012345"
                  className="w-full h-10 px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Status Awal (Kondisional) */}
              {isStatusApplicable && (
                <div>
                  <div className="h-5 flex items-center mb-1">
                    <label className="block text-xs font-bold text-gray-700">
                      Status Awal Pasien
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      value={formData.initialStatus || ''}
                      onChange={(e) => setFormData({ ...formData, initialStatus: e.target.value })}
                      className="w-full h-10 appearance-none pl-3.5 pr-10 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
                    >
                      <option value="">-- Pilih Status Awal --</option>
                      {INITIAL_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
                      <FaChevronDown size={12} />
                    </div>
                  </div>
                </div>
              )}

              {/* Status Akhir (Kondisional) */}
              {isStatusApplicable && (
                <div>
                  <div className="h-5 flex items-center mb-1">
                    <label className="block text-xs font-bold text-gray-700">
                      Status Akhir Pasien
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      value={formData.finalStatus || ''}
                      onChange={(e) => setFormData({ ...formData, finalStatus: e.target.value })}
                      className="w-full h-10 appearance-none pl-3.5 pr-10 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer"
                    >
                      <option value="">-- Pilih Status Akhir --</option>
                      {FINAL_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
                      <FaChevronDown size={12} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: INFORMASI PERJALANAN */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
              <FaRoute className="text-primary" size={16} />
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                3. Informasi Perjalanan & Waktu
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Waktu Mulai */}
              <div>
                <div className="h-5 flex items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Waktu Mulai <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full h-10 px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono transition-all"
                  />
                </div>
              </div>

              {/* Waktu Selesai */}
              <div>
                <div className="h-5 flex items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Waktu Selesai <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full h-10 px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono transition-all"
                  />
                </div>
              </div>

              {/* Durasi (Otomatis & Read-Only) */}
              <div>
                <div className="h-5 flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700">Durasi</span>
                  <span className="text-[10px] text-blue-600 font-semibold">Otomatis</span>
                </div>
                <div className="w-full h-10 px-3.5 py-2 text-xs font-bold bg-blue-50 border border-blue-200 text-blue-800 rounded-xl flex items-center gap-2">
                  <FaClock size={13} className="text-blue-600 shrink-0" />
                  <span className="truncate">{formData.durationFormatted || '-'}</span>
                </div>
              </div>

              {/* Jarak Tempuh (KM) */}
              <div>
                <div className="h-5 flex items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Jarak Tempuh (KM)
                  </label>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.distanceKm}
                  onChange={(e) =>
                    setFormData({ ...formData, distanceKm: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.0"
                  className="w-full h-10 px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: CATATAN & KETERANGAN */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              Keterangan Tambahan
              {(formData.activityType === 'Lainnya' ||
                formData.initialStatus === 'Lainnya' ||
                formData.finalStatus === 'Lainnya') && (
                <span className="text-red-500 ml-1">
                  *(Wajib diisi untuk opsi 'Lainnya')
                </span>
              )}
            </label>
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan rincian perjalanan, alasan rujukan, lokasi penjemputan, atau keterangan jenis kegiatan lainnya..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-blue-800 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FaSave />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Kegiatan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

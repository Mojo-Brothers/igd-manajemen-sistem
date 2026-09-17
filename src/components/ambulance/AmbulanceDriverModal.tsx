import React, { useState, useEffect, useMemo } from 'react';
import {
  FaTimes,
  FaUserTie,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaExclamationTriangle,
  FaRoute,
  FaChevronDown,
  FaPhoneAlt,
  FaWhatsapp,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import {
  AmbulanceDriver,
  AmbulanceDriverStatus,
  AmbulanceExpedition,
} from '../../types/ambulance';
import {
  subscribeAmbulanceDriverDetails,
  addAmbulanceDriverDetail,
  updateAmbulanceDriver,
  deleteAmbulanceDriver,
} from '../../services/ambulanceService';

interface AmbulanceDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  expeditions?: AmbulanceExpedition[];
}

export const AmbulanceDriverModal: React.FC<AmbulanceDriverModalProps> = ({
  isOpen,
  onClose,
  expeditions = [],
}) => {
  const [drivers, setDrivers] = useState<AmbulanceDriver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [status, setStatus] = useState<AmbulanceDriverStatus>('Aktif');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Delete state
  const [deleteItem, setDeleteItem] = useState<AmbulanceDriver | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Subscribe to driver details
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const unsubscribe = subscribeAmbulanceDriverDetails(
      (items) => {
        setDrivers(items);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading drivers:', error);
        toast.error('Gagal memuat data driver');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  // Map driver usage counts from expeditions
  const usageCounts = useMemo(() => {
    const map: Record<string, number> = {};
    expeditions.forEach((exp) => {
      const driverName = exp.driver?.trim().toLowerCase();
      if (driverName) {
        map[driverName] = (map[driverName] || 0) + 1;
      }
    });
    return map;
  }, [expeditions]);

  if (!isOpen) return null;

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setPhone('');
    setStatus('Aktif');
    setNotes('');
  };

  const handleStartEdit = (item: AmbulanceDriver) => {
    setIsEditing(true);
    setEditingId(item.id);
    setName(item.name);
    setPhone(item.phone || '');
    setStatus(item.status || 'Aktif');
    setNotes(item.notes || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error('Nama driver ambulance wajib diisi');
      return;
    }

    try {
      setIsSaving(true);
      if (isEditing && editingId) {
        await updateAmbulanceDriver(editingId, {
          name: cleanName,
          phone: phone.trim(),
          status,
          notes: notes.trim(),
        });
        toast.success(`Data driver "${cleanName}" berhasil diperbarui`);
        resetForm();
      } else {
        // Check duplicate name locally first
        const exists = drivers.some(
          (d) => d.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (exists) {
          toast.error(`Driver "${cleanName}" sudah terdaftar`);
          setIsSaving(false);
          return;
        }

        await addAmbulanceDriverDetail({
          name: cleanName,
          phone: phone.trim(),
          status,
          notes: notes.trim(),
        });
        toast.success(`Driver "${cleanName}" berhasil ditambahkan`);
        resetForm();
      }
    } catch (error: any) {
      console.error('Save driver error:', error);
      toast.error(`Gagal menyimpan driver: ${error?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    try {
      setIsDeleting(true);
      await deleteAmbulanceDriver(deleteItem.id);
      toast.success(`Driver "${deleteItem.name}" berhasil dihapus`);
      if (editingId === deleteItem.id) {
        resetForm();
      }
      setDeleteItem(null);
    } catch (error: any) {
      console.error('Delete driver error:', error);
      toast.error(`Gagal menghapus driver: ${error?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (s?: AmbulanceDriverStatus) => {
    switch (s) {
      case 'Aktif':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cuti':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Nonaktif':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  // Helper format WA link
  const formatWhatsappLink = (phoneStr: string) => {
    const digitsOnly = phoneStr.replace(/\D/g, '');
    if (!digitsOnly) return null;
    const formatted = digitsOnly.startsWith('0')
      ? `62${digitsOnly.slice(1)}`
      : digitsOnly.startsWith('62')
      ? digitsOnly
      : `62${digitsOnly}`;
    return `https://wa.me/${formatted}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
        {/* Header Modal */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-indigo-700 to-primary text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl shadow-xs">
              <FaUserTie size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Kelola Driver Ambulance IGD</h3>
              <p className="text-xs text-indigo-100">
                Tambah, perbarui nama / kontak telepon / status, dan hapus pengemudi ambulance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Form Tambah / Edit Driver */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <FaEdit className="text-amber-600" size={15} />
                ) : (
                  <FaPlus className="text-primary" size={14} />
                )}
                <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                  {isEditing ? 'Edit Data Driver' : 'Tambah Driver Baru'}
                </h4>
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-gray-500 hover:text-gray-700 font-semibold cursor-pointer transition-colors"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Nama Driver */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nama Driver <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Acun, Johari"
                    className="w-full h-10 px-3.5 py-2 text-xs sm:text-sm font-bold bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>

                {/* No. Telepon / WhatsApp */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    No. HP / WhatsApp <span className="text-gray-400 font-normal text-[11px]">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full h-10 px-3.5 py-2 text-xs sm:text-sm font-mono bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>

                {/* Status Keaktifan */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Status Operasional
                  </label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as AmbulanceDriverStatus)}
                      className="w-full h-10 appearance-none pl-3.5 pr-10 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all cursor-pointer font-semibold"
                    >
                      <option value="Aktif">🟢 Aktif / Siaga</option>
                      <option value="Cuti">🟡 Cuti / Izin</option>
                      <option value="Nonaktif">🔴 Nonaktif</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
                      <FaChevronDown size={11} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Keterangan / Shift Driver */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Keterangan / Shift Driver <span className="text-gray-400 font-normal text-[11px]">(Opsional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Shift Pagi, Koordinator Driver, Khusus Siaga Malam, dll"
                    className="flex-1 h-10 px-3.5 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`h-10 px-5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0 ${
                      isEditing
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-primary hover:bg-blue-800'
                    } disabled:opacity-50`}
                  >
                    {isSaving ? (
                      <span>Menyimpan...</span>
                    ) : isEditing ? (
                      <>
                        <FaCheck size={12} />
                        <span>Simpan Perubahan</span>
                      </>
                    ) : (
                      <>
                        <FaPlus size={11} />
                        <span>Tambah Driver</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Daftar Driver */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <span>Daftar Driver Terdaftar</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                  {drivers.length} Driver
                </span>
              </h4>
              <p className="text-xs text-gray-400">
                Nama driver otomatis tersedia pada formulir ekspedisi ambulans
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-xs text-gray-500 font-semibold">Memuat data driver...</p>
              </div>
            ) : drivers.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-xs">
                Belum ada data driver terdaftar. Silakan tambahkan pada formulir di atas.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {drivers.map((driver) => {
                  const tripCount = usageCounts[driver.name.toLowerCase()] || 0;
                  const isCurrentEditing = isEditing && editingId === driver.id;
                  const waLink = driver.phone ? formatWhatsappLink(driver.phone) : null;

                  return (
                    <div
                      key={driver.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 bg-white ${
                        isCurrentEditing
                          ? 'border-amber-400 ring-2 ring-amber-200 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                            <FaUserTie size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-extrabold text-gray-900 text-base">
                                {driver.name}
                              </h5>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(
                                  driver.status
                                )}`}
                              >
                                {driver.status || 'Aktif'}
                              </span>
                            </div>
                            {driver.phone ? (
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-mono text-gray-600 flex items-center gap-1">
                                  <FaPhoneAlt size={10} className="text-gray-400" />
                                  {driver.phone}
                                </span>
                                {waLink && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                                    title="Kirim Pesan WhatsApp"
                                  >
                                    <FaWhatsapp size={12} />
                                    <span>Chat WA</span>
                                  </a>
                                )}
                              </div>
                            ) : (
                              <p className="text-[11px] text-gray-400 italic mt-0.5">
                                Kontak telepon belum diisi
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(driver)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Driver"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteItem(driver)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Driver"
                          >
                            <FaTrash size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1 font-semibold text-primary">
                          <FaRoute size={11} />
                          <span>{tripCount} Total Ekspedisi</span>
                        </div>
                        {driver.notes && (
                          <span className="text-[11px] text-gray-400 truncate max-w-[140px]" title={driver.notes}>
                            {driver.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <FaExclamationTriangle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Hapus Driver Ambulance?</h4>
                <p className="text-xs text-gray-500 mt-0.5">Konfirmasi penghapusan pengemudi</p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50/70 rounded-xl border border-red-100 text-xs text-red-900 space-y-1">
              <p>
                Anda akan menghapus pengemudi <strong>{deleteItem.name}</strong> dari sistem operasional.
              </p>
              {usageCounts[deleteItem.name.toLowerCase()] > 0 && (
                <p className="font-semibold text-red-700 pt-1">
                  ⚠️ Peringatan: Driver ini memiliki riwayat{' '}
                  {usageCounts[deleteItem.name.toLowerCase()]} kegiatan ekspedisi tercatat.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FaTrash size={11} />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Driver'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

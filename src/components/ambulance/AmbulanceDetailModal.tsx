import React from 'react';
import {
  FaTimes,
  FaAmbulance,
  FaClock,
  FaRoad,
  FaUser,
  FaIdCard,
  FaClipboardList,
  FaUserShield,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import { AmbulanceExpedition } from '../../types/ambulance';
import { formatDateIndo } from '../../utils/ambulanceUtils';

interface AmbulanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AmbulanceExpedition | null;
}

export const AmbulanceDetailModal: React.FC<AmbulanceDetailModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-primary text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <FaAmbulance size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white/20 rounded-md">
                  {data.expeditionNumber}
                </span>
                <span className="text-xs text-blue-100">
                  {formatDateIndo(data.date, 'long')}
                </span>
              </div>
              <h3 className="text-lg font-bold mt-0.5">
                Rincian Kegiatan Ambulance
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Badge Kegiatan Utama */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-blue-50/70 border border-blue-100 rounded-2xl">
            <div>
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Jenis Kegiatan
              </p>
              <h4 className="text-base font-extrabold text-blue-950 mt-0.5">
                {data.activityType}
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white text-primary text-xs font-extrabold rounded-xl border border-blue-200 shadow-2xs">
                Unit {data.ambulance}
              </span>
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-2xs">
                Driver: {data.driver}
              </span>
            </div>
          </div>

          {/* Section Pasien */}
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <FaUser className="text-primary" size={14} />
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Identitas Pasien
              </h5>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-medium">Nama Pasien</p>
                <p className="font-semibold text-gray-800">
                  {data.patientName || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Nomor Rekam Medis (No. RM)</p>
                <p className="font-semibold text-gray-800 flex items-center gap-1.5 font-mono">
                  <FaIdCard size={12} className="text-gray-400" />
                  {data.medicalRecordNumber || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Section Perjalanan & Waktu */}
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-3">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <FaClock className="text-primary" size={14} />
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Informasi Waktu & Perjalanan
              </h5>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-medium">Waktu Mulai</p>
                <p className="font-bold text-gray-800 font-mono">{data.startTime} WIB</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Waktu Selesai</p>
                <p className="font-bold text-gray-800 font-mono">{data.endTime} WIB</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Durasi</p>
                <p className="font-bold text-blue-700">{data.durationFormatted || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Jarak Tempuh</p>
                <p className="font-bold text-indigo-700 flex items-center gap-1">
                  <FaRoad size={12} className="text-indigo-400" />
                  {data.distanceKm} KM
                </p>
              </div>
            </div>
          </div>

          {/* Section Status */}
          {(data.initialStatus || data.finalStatus) && (
            <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                <FaMapMarkerAlt className="text-primary" size={14} />
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Status Pasien
                </h5>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Status Awal</p>
                  <span className="inline-block mt-0.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                    {data.initialStatus || '-'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Status Akhir</p>
                  <span className="inline-block mt-0.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {data.finalStatus || '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Catatan / Keterangan Tambahan */}
          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-2">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <FaClipboardList className="text-primary" size={14} />
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Keterangan & Catatan
              </h5>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {data.notes?.trim() || <span className="text-gray-400 italic">Tidak ada catatan tambahan</span>}
            </p>
          </div>

          {/* Audit Trail */}
          <div className="pt-2 text-[11px] text-gray-400 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <FaUserShield size={12} className="text-gray-400" />
              <span>Dicatat oleh: <strong>{data.createdByName || data.createdBy || 'Admin'}</strong></span>
            </div>
            {data.updatedBy && (
              <div>
                <span>Terakhir diubah oleh: <strong>{data.updatedBy}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

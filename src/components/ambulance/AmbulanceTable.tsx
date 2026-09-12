import React from 'react';
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaAmbulance,
  FaClock,
  FaCalendarAlt,
} from 'react-icons/fa';
import { AmbulanceExpedition } from '../../types/ambulance';
import { formatDateIndo } from '../../utils/ambulanceUtils';

interface AmbulanceTableProps {
  expeditions: AmbulanceExpedition[];
  loading: boolean;
  onDetail: (item: AmbulanceExpedition) => void;
  onEdit: (item: AmbulanceExpedition) => void;
  onDelete: (item: AmbulanceExpedition) => void;
  onAddNew: () => void;
}

export const AmbulanceTable: React.FC<AmbulanceTableProps> = ({
  expeditions,
  loading,
  onDetail,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-xs border border-gray-100 flex flex-col items-center justify-center gap-3 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-sm font-semibold text-gray-600">Memuat data ekspedisi ambulance...</p>
      </div>
    );
  }

  if (expeditions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 shadow-xs border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-primary flex items-center justify-center shadow-xs">
          <FaAmbulance size={32} />
        </div>
        <div className="max-w-md">
          <h4 className="text-lg font-bold text-gray-800">Belum ada kegiatan ambulance</h4>
          <p className="text-xs text-gray-500 mt-1">
            Belum ada aktivitas operasional ambulance yang tercatat atau sesuai dengan filter yang dipilih.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-blue-800 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <FaPlus size={13} />
          <span>Tambah Kegiatan Pertama</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
      {/* Desktop / Tablet Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1050px]">
          <thead>
            <tr className="bg-slate-50 text-gray-600 text-xs font-bold uppercase tracking-wider border-b border-gray-200/80">
              <th className="py-3.5 px-4 text-center w-12">No</th>
              <th className="py-3.5 px-4">Tanggal & No. Log</th>
              <th className="py-3.5 px-4">Jenis Kegiatan</th>
              <th className="py-3.5 px-4">Identitas Pasien</th>
              <th className="py-3.5 px-4">Status Pasien</th>
              <th className="py-3.5 px-4">Ambulance</th>
              <th className="py-3.5 px-4">Waktu & Durasi</th>
              <th className="py-3.5 px-4">Jarak</th>
              <th className="py-3.5 px-4">Driver</th>
              <th className="py-3.5 px-4 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {expeditions.map((item, index) => {
              const isJemput = item.activityType === 'Jemput Pasien';
              const isRujuk = item.activityType === 'Merujuk Pasien';
              const isPulang = item.activityType === 'Antar Pasien Pulang';

              const badgeColor = isJemput
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isRujuk
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : isPulang
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-100 text-slate-700 border-slate-200';

              return (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  {/* No */}
                  <td className="py-3.5 px-4 text-center text-xs text-gray-400 font-medium">
                    {index + 1}
                  </td>

                  {/* Tanggal & No. Ekspedisi */}
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-gray-800 whitespace-nowrap">
                      {formatDateIndo(item.date)}
                    </p>
                    <p className="font-mono text-[11px] text-primary font-semibold">
                      {item.expeditionNumber}
                    </p>
                  </td>

                  {/* Jenis Kegiatan */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeColor} whitespace-nowrap`}
                    >
                      {item.activityType}
                    </span>
                    {item.notes && item.activityType === 'Lainnya' && (
                      <p className="text-[11px] text-gray-500 italic mt-0.5 truncate max-w-[160px]">
                        {item.notes}
                      </p>
                    )}
                  </td>

                  {/* Identitas Pasien */}
                  <td className="py-3.5 px-4">
                    {item.patientName ? (
                      <div>
                        <p className="font-semibold text-gray-800">
                          {item.patientName}
                        </p>
                        {item.medicalRecordNumber && (
                          <p className="text-[11px] text-gray-500 font-mono">
                            No. RM: {item.medicalRecordNumber}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">-</span>
                    )}
                  </td>

                  {/* Status Awal / Akhir */}
                  <td className="py-3.5 px-4">
                    {item.initialStatus || item.finalStatus ? (
                      <div className="space-y-0.5 text-xs">
                        {item.initialStatus && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <span className="text-[10px] text-gray-400">Awal:</span>
                            <span className="font-medium truncate max-w-[120px]">
                              {item.initialStatus}
                            </span>
                          </div>
                        )}
                        {item.finalStatus && (
                          <div className="flex items-center gap-1 text-blue-700">
                            <span className="text-[10px] text-blue-400">Akhir:</span>
                            <span className="font-semibold truncate max-w-[120px]">
                              {item.finalStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">-</span>
                    )}
                  </td>

                  {/* Ambulance */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-gray-700 text-xs px-2.5 py-1 bg-gray-100 rounded-md border border-gray-200 whitespace-nowrap">
                      {item.ambulance}
                    </span>
                  </td>

                  {/* Waktu & Durasi */}
                  <td className="py-3.5 px-4">
                    <p className="font-mono text-xs font-semibold text-gray-800 whitespace-nowrap">
                      {item.startTime} - {item.endTime}
                    </p>
                    <p className="text-[11px] font-bold text-blue-600 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                      <FaClock size={10} />
                      <span>{item.durationFormatted}</span>
                    </p>
                  </td>

                  {/* Jarak */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-gray-800 text-xs whitespace-nowrap">
                      {item.distanceKm} KM
                    </span>
                  </td>

                  {/* Driver */}
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-gray-700 text-xs truncate max-w-[120px] block">
                      {item.driver}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onDetail(item)}
                        className="p-1.5 text-gray-500 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Detail Kegiatan"
                      >
                        <FaEye size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Data"
                      >
                        <FaEdit size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Data"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (md:hidden) */}
      <div className="md:hidden divide-y divide-gray-100">
        {expeditions.map((item) => (
          <div key={item.id} className="p-4 space-y-3 hover:bg-gray-50/60 transition-colors">
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-primary rounded-md border border-blue-100">
                  {item.expeditionNumber}
                </span>
                <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                  <FaCalendarAlt size={10} />
                  {formatDateIndo(item.date, 'long')}
                </p>
              </div>

              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-primary border border-blue-200">
                {item.activityType}
              </span>
            </div>

            {/* Patient & Vehicle info */}
            <div className="bg-gray-50 p-3 rounded-xl space-y-1.5 text-xs">
              {item.patientName && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Pasien:</span>
                  <span className="font-bold text-gray-800">
                    {item.patientName} {item.medicalRecordNumber ? `(${item.medicalRecordNumber})` : ''}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Armada:</span>
                <span className="font-semibold text-gray-800">{item.ambulance}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Driver:</span>
                <span className="font-semibold text-gray-800">{item.driver}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Waktu & Durasi:</span>
                <span className="font-bold text-blue-700">
                  {item.startTime} - {item.endTime} ({item.durationFormatted})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Jarak:</span>
                <span className="font-bold text-indigo-700">{item.distanceKm} KM</span>
              </div>
            </div>

            {/* Card Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => onDetail(item)}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <FaEye size={12} /> Detail
              </button>
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <FaEdit size={12} /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <FaTrash size={12} /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

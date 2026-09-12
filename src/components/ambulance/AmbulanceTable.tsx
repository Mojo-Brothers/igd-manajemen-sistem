import React from 'react';
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaAmbulance,
  FaClock,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaRoute,
} from 'react-icons/fa';
import { AmbulanceExpedition } from '../../types/ambulance';
import { formatDateIndo } from '../../utils/ambulanceUtils';

export type AmbulanceViewMode = 'list' | 'card' | 'grid';

interface AmbulanceTableProps {
  expeditions: AmbulanceExpedition[];
  loading: boolean;
  onDetail: (item: AmbulanceExpedition) => void;
  onEdit: (item: AmbulanceExpedition) => void;
  onDelete: (item: AmbulanceExpedition) => void;
  onAddNew: () => void;
  viewMode?: AmbulanceViewMode;
  isMobileFriendly?: boolean;
}

export const AmbulanceTable: React.FC<AmbulanceTableProps> = ({
  expeditions,
  loading,
  onDetail,
  onEdit,
  onDelete,
  onAddNew,
  viewMode = 'list',
  isMobileFriendly = true,
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

  // Helper for activity badge colors
  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'Jemput Pasien':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Merujuk Pasien':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Antar Pasien Pulang':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // 1. CARD VIEW
  if (viewMode === 'card') {
    return (
      <div className={isMobileFriendly ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid grid-cols-2 lg:grid-cols-3 gap-4"}>
        {expeditions.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4.5 shadow-xs border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between space-y-3.5 group"
          >
            {/* Header Card */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-extrabold text-primary px-2.5 py-0.5 bg-blue-50 rounded-md border border-blue-100">
                  {item.expeditionNumber}
                </span>
                <p className="text-[11px] text-gray-500 font-semibold mt-1.5 flex items-center gap-1.5">
                  <FaCalendarAlt size={10} className="text-gray-400" />
                  {formatDateIndo(item.date, 'long')}
                </p>
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap ${getActivityBadge(
                  item.activityType
                )}`}
              >
                {item.activityType}
              </span>
            </div>

            {/* Body Card */}
            <div className="space-y-2.5 text-xs">
              {/* Patient Info */}
              {item.patientName ? (
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Informasi Pasien
                  </p>
                  <p className="font-bold text-gray-900 text-sm">{item.patientName}</p>
                  {item.medicalRecordNumber && (
                    <p className="text-[11px] font-mono text-gray-500">
                      No. RM: {item.medicalRecordNumber}
                    </p>
                  )}
                  {(item.initialStatus || item.finalStatus) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      {item.initialStatus && (
                        <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-gray-600">
                          {item.initialStatus}
                        </span>
                      )}
                      {item.initialStatus && item.finalStatus && (
                        <span className="text-gray-400">→</span>
                      )}
                      {item.finalStatus && (
                        <span className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-blue-700 font-semibold">
                          {item.finalStatus}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50/60 rounded-xl text-center text-gray-400 italic text-xs">
                  Non-Pasien / Logistik Ambulance
                </div>
              )}

              {/* Fleet & Driver */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100/60">
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                    Armada
                  </p>
                  <p className="font-bold text-gray-800 text-xs mt-0.5">{item.ambulance}</p>
                </div>
                <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100/60">
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                    Driver
                  </p>
                  <p className="font-bold text-gray-800 text-xs mt-0.5 truncate">{item.driver}</p>
                </div>
              </div>

              {/* Time & Distance */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                    <FaClock size={9} className="text-gray-400" /> Jam & Durasi
                  </p>
                  <p className="font-bold text-blue-700 text-xs mt-0.5">
                    {item.startTime} - {item.endTime}
                  </p>
                  <p className="text-[10px] text-gray-500 font-semibold">
                    {item.durationFormatted}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-1">
                    <FaRoute size={9} className="text-gray-400" /> Jarak Tempuh
                  </p>
                  <p className="font-bold text-indigo-700 text-sm mt-0.5">{item.distanceKm} KM</p>
                </div>
              </div>

              {/* Destination Location */}
              {item.destination && (
                <div className="p-2.5 bg-rose-50/70 border border-rose-100 rounded-xl space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                      <FaMapMarkerAlt size={10} className="text-rose-500" />
                      Lokasi Tujuan
                    </span>
                    {item.destinationLat && item.destinationLng && (
                      <a
                        href={`https://www.google.com/maps?q=${item.destinationLat},${item.destinationLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-800 inline-flex items-center gap-1"
                        title="Buka rute di Google Maps"
                      >
                        <span>Maps</span>
                        <FaExternalLinkAlt size={8} />
                      </a>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800 text-xs line-clamp-2 mt-0.5">
                    {item.destination}
                  </p>
                </div>
              )}

              {/* Notes */}
              {item.notes && (
                <p className="text-[11px] text-gray-500 italic bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 line-clamp-2">
                  {item.notes}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => onDetail(item)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FaEye size={12} /> Detail
              </button>
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FaEdit size={12} /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="Hapus"
              >
                <FaTrash size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. GRID VIEW (Compact High-Density Tiles)
  if (viewMode === 'grid') {
    return (
      <div className={isMobileFriendly ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"}>
        {expeditions.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-2.5"
          >
            {/* Header: Log + Activity */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="font-mono text-[11px] font-bold text-primary px-2 py-0.5 bg-blue-50 rounded border border-blue-100">
                {item.expeditionNumber}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border truncate max-w-[120px] ${getActivityBadge(
                  item.activityType
                )}`}
              >
                {item.activityType}
              </span>
            </div>

            {/* Patient Name & Date */}
            <div className="space-y-0.5">
              <p className="font-bold text-gray-900 text-xs truncate" title={item.patientName || 'Non-Pasien'}>
                {item.patientName || <span className="text-gray-400 italic">Non-Pasien</span>}
              </p>
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>{formatDateIndo(item.date)}</span>
                {item.medicalRecordNumber && (
                  <span className="font-mono text-gray-400">RM: {item.medicalRecordNumber}</span>
                )}
              </div>
            </div>

            {/* Quick 2x2 Mini Stats */}
            <div className="bg-slate-50/80 rounded-lg p-2 grid grid-cols-2 gap-1.5 text-[11px] border border-slate-100">
              <div>
                <span className="text-[9px] text-gray-400 block uppercase">Ambulance</span>
                <span className="font-bold text-gray-800 truncate block">{item.ambulance}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block uppercase">Driver</span>
                <span className="font-semibold text-gray-700 truncate block">{item.driver}</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block uppercase">Waktu</span>
                <span className="font-semibold text-blue-700 block truncate">
                  {item.startTime}-{item.endTime}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block uppercase">Jarak</span>
                <span className="font-bold text-indigo-700 block">{item.distanceKm} KM</span>
              </div>
            </div>

            {/* Destination Mini Tag */}
            {item.destination && (
              <div
                className="flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50/80 px-2 py-1 rounded-md border border-rose-100 truncate"
                title={item.destination}
              >
                <FaMapMarkerAlt size={9} className="text-rose-500 shrink-0" />
                <span className="truncate">{item.destination}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold text-gray-400">
                {item.durationFormatted}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onDetail(item)}
                  className="p-1.5 text-gray-500 hover:text-primary hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                  title="Detail"
                >
                  <FaEye size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                  title="Edit"
                >
                  <FaEdit size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                  title="Hapus"
                >
                  <FaTrash size={11} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 3. LIST VIEW (Default : Table on Desktop + Card Stack on Mobile)
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
      {/* Desktop / Tablet Table View */}
      <div className={isMobileFriendly ? "hidden md:block overflow-x-auto" : "block overflow-x-auto"}>
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
              <th className="py-3.5 px-4">Jarak & Tujuan</th>
              <th className="py-3.5 px-4">Driver</th>
              <th className="py-3.5 px-4 text-center w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {expeditions.map((item, index) => {
              const badgeColor = getActivityBadge(item.activityType);

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

                  {/* Jarak & Tujuan */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-gray-800 text-xs whitespace-nowrap">
                      {item.distanceKm} KM
                    </span>
                    {item.destination && (
                      <div
                        className="flex items-center gap-1 text-[11px] text-gray-600 mt-1 max-w-[150px] truncate"
                        title={item.destination}
                      >
                        <FaMapMarkerAlt size={10} className="text-red-500 shrink-0" />
                        <span className="truncate">{item.destination}</span>
                      </div>
                    )}
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

      {/* Mobile Card View (md:hidden when mobile friendly, completely hidden in desktop mode) */}
      <div className={isMobileFriendly ? "md:hidden divide-y divide-gray-100" : "hidden"}>
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

              <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getActivityBadge(item.activityType)}`}>
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
              {item.destination && (
                <div className="flex items-start justify-between gap-2 pt-1 border-t border-gray-200/60">
                  <span className="text-gray-500 flex items-center gap-1 shrink-0">
                    <FaMapMarkerAlt size={10} className="text-red-500" />
                    Tujuan:
                  </span>
                  <span className="font-semibold text-gray-800 text-right truncate max-w-[200px]" title={item.destination}>
                    {item.destination}
                  </span>
                </div>
              )}
            </div>

            {/* Card Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => onDetail(item)}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FaEye size={12} /> Detail
              </button>
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FaEdit size={12} /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
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

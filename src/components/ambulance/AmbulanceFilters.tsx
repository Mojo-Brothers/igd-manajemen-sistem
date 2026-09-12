import React from 'react';
import { FaSearch, FaCalendarAlt, FaTimes } from 'react-icons/fa';
import { AmbulanceFilterState } from '../../types/ambulance';
import { ACTIVITY_TYPES, AMBULANCE_FLEET_OPTIONS } from '../../utils/ambulanceConstants';

interface AmbulanceFiltersProps {
  filters: AmbulanceFilterState;
  onFilterChange: (newFilters: Partial<AmbulanceFilterState>) => void;
  onResetFilters: () => void;
  availableDrivers: string[];
}

export const AmbulanceFilters: React.FC<AmbulanceFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableDrivers,
}) => {
  const isFiltered =
    filters.searchQuery !== '' ||
    filters.datePreset !== 'all' ||
    filters.activityType !== '' ||
    filters.ambulance !== '' ||
    filters.driver !== '' ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-5 space-y-4">
      {/* Search Bar & Quick Date Presets */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <FaSearch size={14} />
          </div>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Cari pasien, no. RM, kegiatan, driver, atau ambulance..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>

        {/* Date Presets Button Group */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-gray-400 mr-1 flex items-center gap-1 shrink-0">
            <FaCalendarAlt size={11} /> Periode:
          </span>
          {[
            { id: 'all', label: 'Semua' },
            { id: 'today', label: 'Hari Ini' },
            { id: 'this_week', label: 'Minggu Ini' },
            { id: 'this_month', label: 'Bulan Ini' },
            { id: 'custom', label: 'Custom' },
          ].map((preset) => {
            const isActive = filters.datePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  onFilterChange({
                    datePreset: preset.id as AmbulanceFilterState['datePreset'],
                  })
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Date Range Picker (Only shown when custom is selected) */}
      {filters.datePreset === 'custom' && (
        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex flex-wrap items-center gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Dari Tanggal:</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Sampai:</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      )}

      {/* Dropdown Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-100">
        {/* Filter Jenis Kegiatan */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Jenis Kegiatan
          </label>
          <select
            value={filters.activityType}
            onChange={(e) => onFilterChange({ activityType: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
          >
            <option value="">Semua Jenis Kegiatan</option>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Ambulance */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Ambulance
          </label>
          <select
            value={filters.ambulance}
            onChange={(e) => onFilterChange({ ambulance: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
          >
            <option value="">Semua Armada</option>
            {AMBULANCE_FLEET_OPTIONS.map((amb) => (
              <option key={amb} value={amb}>
                {amb}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Driver */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Driver
          </label>
          <select
            value={filters.driver}
            onChange={(e) => onFilterChange({ driver: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary outline-none transition-all"
          >
            <option value="">Semua Driver</option>
            {availableDrivers.map((driver) => (
              <option key={driver} value={driver}>
                {driver}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        <div className="flex items-end">
          {isFiltered ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="w-full py-2 px-3 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FaTimes size={11} /> Reset Filter
            </button>
          ) : (
            <div className="w-full py-2 px-3 text-xs text-center text-gray-400 italic">
              Filter aktif: 0
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

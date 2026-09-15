import React, { useState, useMemo } from 'react';
import {
  FaAmbulance,
  FaProcedures,
  FaHospitalAlt,
  FaRoad,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
} from 'react-icons/fa';
import { AmbulanceExpedition } from '../../types/ambulance';
import { getTodayDateString, formatMonthIndo } from '../../utils/ambulanceUtils';

interface AmbulanceStatsProps {
  expeditions: AmbulanceExpedition[];
  showMonthlyFilter?: boolean;
  onFilterTableByMonth?: (yearMonth: string) => void;
}

export const AmbulanceStats: React.FC<AmbulanceStatsProps> = ({
  expeditions,
  showMonthlyFilter = false,
  onFilterTableByMonth,
}) => {
  const todayStr = getTodayDateString();

  // 1. Bulan berjalan saat ini dalam format YYYY-MM (e.g. "2026-09")
  const currentYm = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  // Filter default adalah perbulan (bulan berjalan saat ini)
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYm);

  // Daftar bulan yang tersedia untuk filter (bulan tahun berjalan + bulan dari data ekspedisi)
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    const now = new Date();
    const currentYear = now.getFullYear();

    // Selalu sertakan bulan ini
    monthsSet.add(currentYm);

    // Sertakan seluruh 12 bulan tahun berjalan agar fleksibel
    for (let m = 1; m <= 12; m++) {
      monthsSet.add(`${currentYear}-${String(m).padStart(2, '0')}`);
    }

    // Sertakan juga bulan riwayat dari data ekspedisi
    expeditions.forEach((item) => {
      if (item.date && item.date.length >= 7) {
        monthsSet.add(item.date.substring(0, 7));
      }
    });

    // Urutkan menurun (bulan terbaru di atas)
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  }, [expeditions, currentYm]);

  // Navigasi bulan sebelumnya
  const handlePrevMonth = () => {
    if (selectedMonth === 'all') {
      setSelectedMonth(currentYm);
      return;
    }
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${prevYear}-${prevMonth}`);
  };

  // Navigasi bulan berikutnya
  const handleNextMonth = () => {
    if (selectedMonth === 'all') {
      setSelectedMonth(currentYm);
      return;
    }
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const nextYear = nextDate.getFullYear();
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${nextYear}-${nextMonth}`);
  };

  // 1. Total Kegiatan Hari Ini
  const todayExpeditions = expeditions.filter((item) => item.date === todayStr);
  const totalToday = todayExpeditions.length;

  // 2. Total Jemput Pasien (Keseluruhan)
  const totalJemput = expeditions.filter(
    (item) => item.activityType === 'Jemput Pasien'
  ).length;

  // 3. Total Rujukan Pasien (Keseluruhan)
  const totalRujukan = expeditions.filter(
    (item) => item.activityType === 'Merujuk Pasien'
  ).length;

  // 4. Jarak Akumulasi Seluruh Trip (Standar / Frontend)
  const allTimeDistance = useMemo(() => {
    const dist = expeditions.reduce(
      (acc, curr) => acc + (Number(curr.distanceKm) || 0),
      0
    );
    return dist % 1 === 0 ? dist : Number(dist.toFixed(1));
  }, [expeditions]);

  // 5. Perhitungan Akumulasi Jarak Tempuh Berdasarkan Filter Bulan (Admin Dashboard)
  const { distanceValue, tripCount } = useMemo(() => {
    let filtered = expeditions;

    if (selectedMonth !== 'all') {
      filtered = expeditions.filter(
        (item) => item.date && item.date.startsWith(selectedMonth)
      );
    }

    const dist = filtered.reduce(
      (acc, curr) => acc + (Number(curr.distanceKm) || 0),
      0
    );
    const formatted = dist % 1 === 0 ? dist : Number(dist.toFixed(1));

    return {
      distanceValue: formatted,
      tripCount: filtered.length,
    };
  }, [expeditions, selectedMonth]);

  const baseStats = [
    {
      title: 'Kegiatan Hari Ini',
      value: totalToday,
      unit: 'Trip',
      description: `Operasional per ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`,
      icon: <FaAmbulance size={22} />,
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-100',
    },
    {
      title: 'Total Jemput Pasien',
      value: totalJemput,
      unit: 'Pasien',
      description: 'Penjemputan pasien IGD',
      icon: <FaProcedures size={22} />,
      bgColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-100',
    },
    {
      title: 'Total Rujukan Pasien',
      value: totalRujukan,
      unit: 'Pasien',
      description: 'Transfer ke Rumah Sakit lain',
      icon: <FaHospitalAlt size={22} />,
      bgColor: 'bg-amber-500',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-100',
    },
  ];

  // Tampilan sederhana tanpa filter untuk Frontend
  if (!showMonthlyFilter) {
    const frontendStats = [
      ...baseStats,
      {
        title: 'Total Jarak Tempuh',
        value: allTimeDistance,
        unit: 'KM',
        description: 'Akumulasi jarak seluruh trip',
        icon: <FaRoad size={22} />,
        bgColor: 'bg-indigo-500',
        textColor: 'text-indigo-700',
        borderColor: 'border-indigo-100',
      },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {frontendStats.map((stat, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-2xl p-5 shadow-xs border ${stat.borderColor} hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {stat.title}
                </p>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-3xl font-extrabold text-gray-800 tracking-tight">
                    {stat.value}
                  </span>
                  <span className={`text-xs font-bold ${stat.textColor}`}>
                    {stat.unit}
                  </span>
                </div>
              </div>

              <div
                className={`w-11 h-11 rounded-xl ${stat.bgColor} text-white flex items-center justify-center shadow-md shrink-0`}
              >
                {stat.icon}
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    );
  }

  // Tampilan Dashboard Admin (dengan filter akumulasi jarak perbulan)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 3 Kartu Metrik Standar */}
      {baseStats.map((stat, idx) => (
        <div
          key={idx}
          className={`bg-white rounded-2xl p-5 shadow-xs border ${stat.borderColor} hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                {stat.title}
              </p>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-3xl font-extrabold text-gray-800 tracking-tight">
                  {stat.value}
                </span>
                <span className={`text-xs font-bold ${stat.textColor}`}>
                  {stat.unit}
                </span>
              </div>
            </div>

            <div
              className={`w-11 h-11 rounded-xl ${stat.bgColor} text-white flex items-center justify-center shadow-md shrink-0`}
            >
              {stat.icon}
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-2">
            {stat.description}
          </p>
        </div>
      ))}

      {/* 4. Total Jarak Tempuh (Khusus Dashboard Admin: Filter Interaktif Perbulan) */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-indigo-100 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group">
        <div>
          {/* Header Kartu: Judul + Ikon */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Jarak Tempuh
              </p>
              <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md mt-0.5">
                Perhitungan Perbulan
              </span>
            </div>

            <div className="w-11 h-11 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md shrink-0">
              <FaRoad size={20} />
            </div>
          </div>

          {/* Filter Dropdown Bulan */}
          <div className="mt-2.5 mb-1.5">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-indigo-500">
                <FaCalendarAlt size={10} />
              </div>
              <select
                id="distance-month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full appearance-none pl-7 pr-7 py-1 text-xs font-bold bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-900 border border-indigo-200/90 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400 transition-all cursor-pointer truncate"
                title="Pilih Bulan untuk Akumulasi Jarak Tempuh"
              >
                <optgroup label="Pilihan Utama">
                  <option value={currentYm}>
                    {formatMonthIndo(currentYm, 'long')} (Bulan Ini)
                  </option>
                  <option value="all">
                    Semua Waktu (Total Keseluruhan)
                  </option>
                </optgroup>
                <optgroup label="Bulan Lainnya">
                  {availableMonths
                    .filter((m) => m !== currentYm)
                    .map((m) => (
                      <option key={m} value={m}>
                        {formatMonthIndo(m, 'long')}
                      </option>
                    ))}
                </optgroup>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-indigo-500">
                <FaChevronDown size={8} />
              </div>
            </div>
          </div>

          {/* Nilai Metrik Jarak */}
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-3xl font-extrabold text-gray-800 tracking-tight">
              {distanceValue}
            </span>
            <span className="text-xs font-bold text-indigo-700">KM</span>
          </div>

          {/* Deskripsi Dinamis Sesuai Bulan yang Dipilih */}
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {selectedMonth === 'all'
              ? `Akumulasi seluruh trip (${tripCount} trip)`
              : selectedMonth === currentYm
              ? `Akumulasi bulan ini (${tripCount} trip)`
              : `Akumulasi ${formatMonthIndo(selectedMonth, 'short')} (${tripCount} trip)`}
          </p>
        </div>

        {/* Footer Kartu: Navigasi Bulan Cepat & Tombol Filter Tabel */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-indigo-50/80 text-[11px]">
          {onFilterTableByMonth ? (
            <button
              type="button"
              onClick={() => onFilterTableByMonth(selectedMonth)}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
              title="Terapkan filter bulan ini ke daftar ekspedisi di bawah"
            >
              <FaFilter size={8} />
              <span>Filter Tabel</span>
            </button>
          ) : (
            <span className="text-[10px] text-gray-400 font-semibold">
              {selectedMonth === 'all' ? 'Semua Trip' : formatMonthIndo(selectedMonth, 'short')}
            </span>
          )}

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={selectedMonth === 'all'}
              className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
              title="Bulan Sebelumnya"
            >
              <FaChevronLeft size={10} />
            </button>
            {selectedMonth !== currentYm && (
              <button
                type="button"
                onClick={() => setSelectedMonth(currentYm)}
                className="px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                title="Kembali ke Bulan Ini"
              >
                Bulan Ini
              </button>
            )}
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={selectedMonth === 'all'}
              className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:pointer-events-none rounded transition-colors"
              title="Bulan Berikutnya"
            >
              <FaChevronRight size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

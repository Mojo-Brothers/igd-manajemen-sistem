import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FaChartLine,
  FaChartPie,
  FaAmbulance,
  FaRoute,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaTrophy,
} from 'react-icons/fa';
import { AmbulanceExpedition } from '../../types/ambulance';
import { getTodayDateString } from '../../utils/ambulanceUtils';

interface AmbulanceAnalyticsDashboardProps {
  expeditions: AmbulanceExpedition[];
}

type PeriodFilter = 'all' | 'this_month' | 'last_30_days' | 'last_7_days';

// Distinct modern color palette for pie slices & bars
const ACTIVITY_COLORS = [
  '#2563eb', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#64748b', // Slate
  '#14b8a6', // Teal
];

export const AmbulanceAnalyticsDashboard: React.FC<AmbulanceAnalyticsDashboardProps> = ({
  expeditions = [],
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [period, setPeriod] = useState<PeriodFilter>('this_month');
  const [activeChartTab, setActiveChartTab] = useState<'daily' | 'fleet' | 'driver'>('daily');

  // Filter expeditions by selected period
  const filteredData = useMemo(() => {
    if (period === 'all') return expeditions;

    const today = new Date();
    const todayStr = getTodayDateString();

    if (period === 'this_month') {
      const currentYearMonth = todayStr.substring(0, 7); // YYYY-MM
      return expeditions.filter((exp) => exp.date && exp.date.startsWith(currentYearMonth));
    }

    if (period === 'last_7_days') {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 7);
      const pastStr = pastDate.toISOString().split('T')[0];
      return expeditions.filter((exp) => exp.date && exp.date >= pastStr && exp.date <= todayStr);
    }

    if (period === 'last_30_days') {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - 30);
      const pastStr = pastDate.toISOString().split('T')[0];
      return expeditions.filter((exp) => exp.date && exp.date >= pastStr && exp.date <= todayStr);
    }

    return expeditions;
  }, [expeditions, period]);

  // 1. Daily Trend Data (Sorted chronological)
  const dailyTrendData = useMemo(() => {
    const map: Record<string, { date: string; displayDate: string; trips: number; totalKm: number }> = {};

    filteredData.forEach((exp) => {
      if (!exp.date) return;
      if (!map[exp.date]) {
        const parts = exp.date.split('-');
        const day = parts[2] || '';
        const month = parts[1] || '';
        map[exp.date] = {
          date: exp.date,
          displayDate: `${day}/${month}`,
          trips: 0,
          totalKm: 0,
        };
      }
      map[exp.date].trips += 1;
      map[exp.date].totalKm += Number(exp.distanceKm) || 0;
    });

    const list = Object.values(map);
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [filteredData]);

  // 2. Activity Type Breakdown (Donut chart data)
  const activityData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach((exp) => {
      const type = exp.activityType || 'Lainnya';
      map[type] = (map[type] || 0) + 1;
    });

    const list = Object.entries(map).map(([name, value]) => ({
      name,
      value,
    }));
    list.sort((a, b) => b.value - a.value);
    return list;
  }, [filteredData]);

  // 3. Fleet Utilization Data (Bar chart)
  const fleetData = useMemo(() => {
    const map: Record<string, { fleet: string; trips: number; totalKm: number }> = {};
    filteredData.forEach((exp) => {
      const fleet = (exp.ambulance || 'TIDAK DIKETAHUI').trim().toUpperCase();
      if (!map[fleet]) {
        map[fleet] = { fleet, trips: 0, totalKm: 0 };
      }
      map[fleet].trips += 1;
      map[fleet].totalKm += Number(exp.distanceKm) || 0;
    });

    const list = Object.values(map);
    list.sort((a, b) => b.trips - a.trips);
    return list;
  }, [filteredData]);

  // 4. Driver Performance Data
  const driverData = useMemo(() => {
    const map: Record<string, { driver: string; trips: number; totalKm: number }> = {};
    filteredData.forEach((exp) => {
      const driver = (exp.driver || 'Tidak Terisi').trim();
      if (!map[driver]) {
        map[driver] = { driver, trips: 0, totalKm: 0 };
      }
      map[driver].trips += 1;
      map[driver].totalKm += Number(exp.distanceKm) || 0;
    });

    const list = Object.values(map);
    list.sort((a, b) => b.trips - a.trips);
    return list.slice(0, 8); // Top 8 drivers
  }, [filteredData]);

  // Executive Summary KPIs
  const kpis = useMemo(() => {
    const totalTrips = filteredData.length;
    const totalKm = filteredData.reduce((acc, c) => acc + (Number(c.distanceKm) || 0), 0);
    const totalMinutes = filteredData.reduce((acc, c) => acc + (Number(c.durationMinutes) || 0), 0);

    const avgKm = totalTrips > 0 ? (totalKm / totalTrips).toFixed(1) : '0';
    const avgMins = totalTrips > 0 ? Math.round(totalMinutes / totalTrips) : 0;

    const topFleet = fleetData.length > 0 ? fleetData[0].fleet : '-';
    const topDriver = driverData.length > 0 ? driverData[0].driver : '-';

    return {
      totalTrips,
      totalKm,
      avgKm,
      avgMins,
      topFleet,
      topDriver,
    };
  }, [filteredData, fleetData, driverData]);

  const periodLabels: Record<PeriodFilter, string> = {
    this_month: 'Bulan Ini',
    last_7_days: '7 Hari Terakhir',
    last_30_days: '30 Hari Terakhir',
    all: 'Semua Periode',
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden transition-all">
      {/* Top Banner Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center shrink-0 shadow-xs">
            <FaChartLine size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                Analisis & Grafik Operasional Ambulance
              </h3>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Live Analytics
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Visualisasi tren perjalanan, rasio aktivitas, utilisasi armada, dan produktivitas driver
            </p>
          </div>
        </div>

        {/* Filter Periode & Collapse Toggle */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap sm:flex-nowrap">
          {/* Period Filter Buttons */}
          <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-xs font-bold">
            {(['this_month', 'last_7_days', 'last_30_days', 'all'] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                  period === p
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1 shrink-0"
            title={isExpanded ? 'Lipat Tampilan Grafik' : 'Buka Tampilan Grafik'}
          >
            {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            <span className="text-[11px] hidden sm:inline">
              {isExpanded ? 'Tutup' : 'Buka Grafik'}
            </span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6 animate-fadeIn">
          {/* Executive KPI Mini Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-primary flex items-center justify-center shrink-0">
                <FaRoute size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-500 truncate">Rerata Jarak / Trip</p>
                <h4 className="text-base font-extrabold text-gray-900 mt-0.5">{kpis.avgKm} KM</h4>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FaClock size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-500 truncate">Rerata Waktu Tempuh</p>
                <h4 className="text-base font-extrabold text-gray-900 mt-0.5">{kpis.avgMins} Menit</h4>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <FaAmbulance size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-500 truncate">Armada Teraktif</p>
                <h4 className="text-base font-extrabold text-gray-900 mt-0.5 truncate">{kpis.topFleet}</h4>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <FaTrophy size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-500 truncate">Driver Terproduktif</p>
                <h4 className="text-base font-extrabold text-gray-900 mt-0.5 truncate">{kpis.topDriver}</h4>
              </div>
            </div>
          </div>

          {/* Main Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Daily Trend or Selected Tab (Span 2 cols on desktop) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex flex-col justify-between shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FaChartLine className="text-primary" size={16} />
                  <h4 className="text-sm font-extrabold text-gray-800">
                    {activeChartTab === 'daily'
                      ? 'Tren Perjalanan & Akumulasi Jarak Tempuh'
                      : activeChartTab === 'fleet'
                      ? 'Perbandingan Beban & Jarak per Armada'
                      : 'Peringkat Aktivitas Driver'}
                  </h4>
                </div>

                {/* Sub-tab Switcher */}
                <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('daily')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeChartTab === 'daily'
                        ? 'bg-white text-primary shadow-2xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Tren Harian
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('fleet')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeChartTab === 'fleet'
                        ? 'bg-white text-primary shadow-2xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Armada
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('driver')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeChartTab === 'driver'
                        ? 'bg-white text-primary shadow-2xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Driver
                  </button>
                </div>
              </div>

              {/* Chart Canvas Area */}
              <div className="h-72 w-full">
                {activeChartTab === 'daily' ? (
                  dailyTrendData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                      Belum ada kegiatan ekspedisi pada periode {periodLabels[period]}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="colorKm" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="displayDate"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#e2e8f0' }}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#e2e8f0' }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '12px',
                            border: 'none',
                            color: '#fff',
                            fontSize: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                          }}
                          labelStyle={{ fontWeight: 'bold', color: '#93c5fd' }}
                          formatter={(val: any, name: any) => [
                            name === 'trips' ? `${val} Trip` : `${val} KM`,
                            name === 'trips' ? 'Jumlah Trip' : 'Total Jarak Tempuh',
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="trips"
                          stroke="#2563eb"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorTrips)"
                          name="trips"
                        />
                        <Area
                          type="monotone"
                          dataKey="totalKm"
                          stroke="#10b981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorKm)"
                          name="totalKm"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )
                ) : activeChartTab === 'fleet' ? (
                  fleetData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                      Tidak ada data armada pada periode ini
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fleetData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="fleet" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '12px',
                            border: 'none',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                          formatter={(val: any, name: any) => [
                            name === 'trips' ? `${val} Trip` : `${val} KM`,
                            name === 'trips' ? 'Frekuensi Trip' : 'Jarak Tempuh (KM)',
                          ]}
                        />
                        <Bar dataKey="trips" fill="#2563eb" radius={[6, 6, 0, 0]} name="trips" />
                        <Bar dataKey="totalKm" fill="#10b981" radius={[6, 6, 0, 0]} name="totalKm" />
                      </BarChart>
                    </ResponsiveContainer>
                  )
                ) : driverData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                    Tidak ada data driver pada periode ini
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={driverData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                      <YAxis dataKey="driver" type="category" stroke="#64748b" fontSize={11} tickLine={false} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                        formatter={(val: any, name: any) => [
                          name === 'trips' ? `${val} Trip Disetir` : `${val} KM`,
                          name === 'trips' ? 'Jumlah Trip' : 'Total Jarak',
                        ]}
                      />
                      <Bar dataKey="trips" fill="#6366f1" radius={[0, 6, 6, 0]} name="trips" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Chart Legend / Footnote */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>Frekuensi Trip</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Jarak Tempuh (KM)</span>
                  </div>
                </div>
                <span className="text-gray-400">Periode: {periodLabels[period]}</span>
              </div>
            </div>

            {/* Chart 2: Activity Breakdown (Donut Chart) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between mb-2 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FaChartPie className="text-emerald-600" size={15} />
                  <h4 className="text-sm font-extrabold text-gray-800">Distribusi Jenis Kegiatan</h4>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {activityData.length} Kategori
                </span>
              </div>

              {/* Donut Canvas */}
              <div className="h-56 w-full relative flex items-center justify-center">
                {activityData.length === 0 ? (
                  <p className="text-gray-400 text-xs">Belum ada data kegiatan</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={activityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={78}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {activityData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={ACTIVITY_COLORS[index % ACTIVITY_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderRadius: '10px',
                            border: 'none',
                            color: '#fff',
                            fontSize: '11px',
                          }}
                          formatter={(val: any, name: any) => [`${val} Kegiatan`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-black text-gray-900 leading-none">
                        {kpis.totalTrips}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                        Total
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Top Categories Legend List */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 pt-2 border-t border-gray-100 scrollbar-none">
                {activityData.slice(0, 5).map((item, idx) => {
                  const percentage =
                    kpis.totalTrips > 0 ? Math.round((item.value / kpis.totalTrips) * 100) : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length] }}
                        ></span>
                        <span className="text-gray-700 font-semibold truncate text-[11px]">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-extrabold text-gray-900 text-xs">{item.value}</span>
                        <span className="text-[10px] font-bold text-gray-400 w-8 text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

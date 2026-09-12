import React from 'react';
import { FaAmbulance, FaProcedures, FaHospitalAlt, FaRoad } from 'react-icons/fa';
import { AmbulanceExpedition } from '../../types/ambulance';
import { getTodayDateString } from '../../utils/ambulanceUtils';

interface AmbulanceStatsProps {
  expeditions: AmbulanceExpedition[];
}

export const AmbulanceStats: React.FC<AmbulanceStatsProps> = ({ expeditions }) => {
  const todayStr = getTodayDateString();

  // 1. Total Kegiatan Hari Ini
  const todayExpeditions = expeditions.filter((item) => item.date === todayStr);
  const totalToday = todayExpeditions.length;

  // 2. Total Jemput Pasien
  const totalJemput = expeditions.filter(
    (item) => item.activityType === 'Jemput Pasien'
  ).length;

  // 3. Total Rujukan
  const totalRujukan = expeditions.filter(
    (item) => item.activityType === 'Merujuk Pasien'
  ).length;

  // 4. Total Jarak Tempuh (KM)
  const totalDistance = expeditions.reduce((acc, curr) => acc + (Number(curr.distanceKm) || 0), 0);

  const stats = [
    {
      title: 'Kegiatan Hari Ini',
      value: totalToday,
      unit: 'Trip',
      description: `Operasional per ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`,
      icon: <FaAmbulance size={24} />,
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-100',
    },
    {
      title: 'Total Jemput Pasien',
      value: totalJemput,
      unit: 'Pasien',
      description: 'Penjemputan pasien IGD',
      icon: <FaProcedures size={24} />,
      bgColor: 'bg-emerald-500',
      lightBg: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      borderColor: 'border-emerald-100',
    },
    {
      title: 'Total Rujukan Pasien',
      value: totalRujukan,
      unit: 'Pasien',
      description: 'Transfer ke Rumah Sakit lain',
      icon: <FaHospitalAlt size={24} />,
      bgColor: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-100',
    },
    {
      title: 'Total Jarak Tempuh',
      value: totalDistance % 1 === 0 ? totalDistance : totalDistance.toFixed(1),
      unit: 'KM',
      description: 'Akumulasi jarak seluruh trip',
      icon: <FaRoad size={24} />,
      bgColor: 'bg-indigo-500',
      lightBg: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      borderColor: 'border-indigo-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`bg-white rounded-2xl p-5 shadow-xs border ${stat.borderColor} hover:shadow-md transition-all duration-200 flex items-start justify-between`}
        >
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
            <p className="text-xs text-gray-400 mt-0.5">
              {stat.description}
            </p>
          </div>

          <div
            className={`w-12 h-12 rounded-xl ${stat.bgColor} text-white flex items-center justify-center shadow-md shrink-0`}
          >
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

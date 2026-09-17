import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  FaUserMd,
  FaClock,
  FaDatabase,
  FaAmbulance,
  FaChartLine,
  FaArrowRight,
  FaTshirt,
  FaTv,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    totalAmbulanceTrips: 0,
    totalLinenItems: 0,
    dbConnected: false,
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    // 1. Subscribe Doctors
    const unsubDoctors = onSnapshot(
      collection(db, 'doctors'),
      (snapshot) => {
        const docs = snapshot.docs.map((d) => d.data());
        setStats((prev) => ({
          ...prev,
          totalDoctors: docs.length,
          activeDoctors: docs.filter((d: any) => d.isActive).length,
          dbConnected: true,
        }));
      },
      (error) => {
        console.error(error);
        setStats((s) => ({ ...s, dbConnected: false }));
      }
    );

    // 2. Subscribe Ambulance Expeditions
    const unsubAmbulance = onSnapshot(
      collection(db, 'ambulance_expeditions'),
      (snapshot) => {
        setStats((prev) => ({
          ...prev,
          totalAmbulanceTrips: snapshot.docs.length,
        }));
      },
      (err) => console.warn('Ambulance count fetch skipped:', err)
    );

    // 3. Subscribe Linen Items
    const unsubLinen = onSnapshot(
      collection(db, 'linen_items'),
      (snapshot) => {
        setStats((prev) => ({
          ...prev,
          totalLinenItems: snapshot.docs.length,
        }));
      },
      (err) => console.warn('Linen count fetch skipped:', err)
    );

    return () => {
      unsubDoctors();
      unsubAmbulance();
      unsubLinen();
    };
  }, []);

  const statCards = [
    {
      title: 'Total Dokter Spesialis',
      value: stats.totalDoctors,
      subtitle: `${stats.activeDoctors} Dokter Aktif Jaga`,
      icon: <FaUserMd size={26} />,
      color: 'bg-blue-600 text-white',
      link: '/admin/doctors',
    },
    {
      title: 'Ekspedisi Ambulance',
      value: stats.totalAmbulanceTrips,
      subtitle: 'Kegiatan Operasional Armada',
      icon: <FaAmbulance size={26} />,
      color: 'bg-emerald-600 text-white',
      link: '/admin/ambulance',
    },
    {
      title: 'Monitoring Linen IGD',
      value: stats.totalLinenItems,
      subtitle: 'Jenis Linen Terkelola',
      icon: <FaTshirt size={26} />,
      color: 'bg-indigo-600 text-white',
      link: '/admin/linen',
    },
    {
      title: 'Status Database Cloud',
      value: stats.dbConnected ? 'Online' : 'Offline',
      subtitle: 'Firebase Firestore Real-time',
      icon: <FaDatabase size={26} />,
      color: stats.dbConnected ? 'bg-primary text-white' : 'bg-red-500 text-white',
      link: '#',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-blue-50 text-primary border border-blue-100 uppercase tracking-wider">
            Portal Administrasi Rumah Sakit
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
            Selamat Datang, Admin IGD
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Anda masuk sebagai <strong className="text-gray-700">{currentUser?.email}</strong>
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-400 flex items-center gap-1.5 justify-end font-semibold">
            <FaClock size={12} /> Waktu Akses Server
          </p>
          <p className="font-mono font-bold text-sm text-gray-800 mt-0.5">
            {new Date().toLocaleString('id-ID', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((stat, i) => (
          <Link
            key={i}
            to={stat.link}
            className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all flex items-center gap-4 group"
          >
            <div
              className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform`}
            >
              {stat.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-bold truncate">{stat.title}</p>
              <h3 className="text-2xl font-black text-gray-900 mt-0.5 tracking-tight">
                {stat.value}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate">{stat.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Modern Analytics Spotlight Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-2 max-w-xl z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/30 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
              Visual Data Analytics
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/25 text-emerald-300">
              Live Chart
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Grafik & Analisis Ekspedisi Ambulans
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Pantau tren perjalanan harian, akumulasi kilometer, persentase rujukan vs jemput pasien, utilisasi armada EVALIA/BSI/PHC, dan peringkat produktivitas pengemudi dalam satu dashboard visual modern.
          </p>
        </div>

        <div className="z-10 w-full md:w-auto shrink-0">
          <Link
            to="/admin/ambulance"
            className="w-full md:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5"
          >
            <FaChartLine size={16} />
            <span>Buka Analitik Ekspedisi</span>
            <FaArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Quick Navigation Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/admin/on-call"
          className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xs transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
            <FaTv size={18} />
          </div>
          <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-primary transition-colors">
            Jadwal Dokter On-Call & TV Display
          </h4>
          <p className="text-xs text-gray-500">
            Kelola master dokter spesialis, jadwal jaga harian & bulanan, dan monitor tampilan layar ruang tunggu IGD.
          </p>
        </Link>

        <Link
          to="/admin/ambulance"
          className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-emerald-300 hover:shadow-xs transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FaAmbulance size={18} />
          </div>
          <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors">
            Logbook Ekspedisi & Armada Ambulans
          </h4>
          <p className="text-xs text-gray-500">
            Kelola data perjalanan, armada, pengemudi, unduh laporan Excel 13 kolom, serta ekspor PDF resmi rumah sakit.
          </p>
        </Link>

        <Link
          to="/admin/linen"
          className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xs transition-all space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FaTshirt size={18} />
          </div>
          <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-indigo-700 transition-colors">
            LinenFlow IGD & Distribusi Laundry
          </h4>
          <p className="text-xs text-gray-500">
            Pantau stok lemari linen bersih, pencatatan linen kotor terinfeksi, dan serah terima unit laundry.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

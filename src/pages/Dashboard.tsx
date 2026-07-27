import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FaUserMd, FaCheckCircle, FaClock, FaDatabase } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    dbConnected: false
  });
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'doctors'), (snapshot) => {
      const docs = snapshot.docs.map(d => d.data());
      setStats({
        totalDoctors: docs.length,
        activeDoctors: docs.filter(d => d.isActive).length,
        dbConnected: true
      });
    }, (error) => {
      console.error(error);
      setStats(s => ({ ...s, dbConnected: false }));
    });
    
    return unsubscribe;
  }, []);

  const statCards = [
    { title: 'Total Dokter', value: stats.totalDoctors, icon: <FaUserMd size={28} />, color: 'bg-blue-500' },
    { title: 'Dokter Aktif', value: stats.activeDoctors, icon: <FaCheckCircle size={28} />, color: 'bg-green-500' },
    { title: 'Status Database', value: stats.dbConnected ? 'Terhubung' : 'Terputus', icon: <FaDatabase size={28} />, color: stats.dbConnected ? 'bg-primary' : 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Selamat Datang, Admin</h2>
          <p className="text-gray-500">Anda masuk sebagai {currentUser?.email}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm text-gray-400 flex items-center gap-2 justify-end">
            <FaClock /> Waktu Akses
          </p>
          <p className="font-medium text-gray-700">{new Date().toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
            <div className={`w-16 h-16 ${stat.color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
              <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Panduan Penggunaan</h3>
        <ul className="space-y-3 text-gray-600 list-disc pl-5">
          <li>Menu <strong>Jadwal Dokter</strong> digunakan untuk menambah daftar dokter dan mengatur siapa yang tampil di layar IGD.</li>
          <li>Menu <strong>Pengaturan</strong> digunakan untuk mengubah nama rumah sakit, logo, dan running text (teks berjalan) di bagian bawah layar.</li>
          <li>Semua perubahan yang Anda simpan akan secara otomatis (real-time) tampil di layar TV tanpa perlu me-refresh halaman TV.</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;

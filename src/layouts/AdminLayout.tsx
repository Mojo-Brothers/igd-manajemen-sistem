import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaHome, FaUserMd, FaCog, FaSignOutAlt, FaHospitalAlt, FaBars, FaTimes, FaCalendarAlt, FaBed, FaDownload } from 'react-icons/fa';
import { LinenItem } from '../types/linen';
import { subscribeLinenItems } from '../services/linenService';
import { LinenReportModal } from '../pages/linen/components/LinenReportModal';

const AdminLayout = () => {
  const { logout, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [linenItems, setLinenItems] = useState<LinenItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeLinenItems('igd', (items) => {
      setLinenItems(items);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const menuItems = [
    { path: '/admin', icon: <FaHome size={20} />, label: 'Dashboard' },
    { path: '/admin/doctors', icon: <FaUserMd size={20} />, label: 'Jadwal Dokter IGD' },
    { path: '/admin/on-call', icon: <FaCalendarAlt size={20} />, label: 'Jadwal On Call' },
    { path: '/admin/linen', icon: <FaBed size={20} />, label: 'LinenFlow IGD' },
    { path: '/admin/settings', icon: <FaCog size={20} />, label: 'Pengaturan' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <FaHospitalAlt size={28} />
            <div>
              <h2 className="font-bold text-base leading-tight">IGD Manajemen Sistem</h2>
              <p className="text-xs text-blue-200">Admin Panel</p>
            </div>
          </div>
          <button 
            className="md:hidden text-white/80 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <FaTimes size={24} />
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/20 font-semibold shadow-inner' 
                    : 'hover:bg-white/10 opacity-80 hover:opacity-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-black/20 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
          >
            <FaSignOutAlt size={20} />
            <span>Logout</span>
          </button>
          
          <div className="mt-4 pt-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-white/30 tracking-wider">Copyright by Roby Viori Fansya</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="h-16 bg-white shadow-sm flex items-center px-4 md:px-8 shrink-0 justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden text-gray-600 hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <FaBars size={24} />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-gray-800 truncate">
              {menuItems.find(m => m.path === location.pathname)?.label || 'Admin Panel'}
            </h1>
          </div>
          {location.pathname.startsWith('/admin/linen') ? (
            <div className="flex items-center gap-2.5">
              <button 
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="text-xs md:text-sm font-bold px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
                title="Unduh Laporan Mutasi & Distribusi Linen Harian / Bulanan (PDF & Excel)"
              >
                <FaDownload size={13} className="text-blue-600" />
                <span>Unduh Laporan</span>
              </button>

              <Link 
                to={location.search.includes('tab=coordinator') ? '/linen' : '/admin/linen?tab=coordinator'}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs md:text-sm font-bold px-3.5 py-2 rounded-xl border transition-all flex items-center justify-center ${
                  location.search.includes('tab=coordinator')
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs hover:bg-blue-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 shadow-2xs'
                }`}
              >
                {location.search.includes('tab=coordinator') ? (
                  <span>Mode Operasional Lemari</span>
                ) : (
                  <span>Dashboard Admin Manajemen Linen</span>
                )}
              </Link>
            </div>
          ) : (
            <Link 
              to={location.pathname.includes('on-call') ? '/on-call' : '/display'} 
              target="_blank" 
              className="text-xs md:text-sm text-primary hover:underline font-medium whitespace-nowrap"
            >
              Lihat Layar ↗
            </Link>
          )}
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          <Outlet />
        </div>

        {/* Modal Unduh Laporan Linen */}
        <LinenReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          items={linenItems}
          unitId="igd"
          unitName="Instalasi Gawat Darurat (IGD)"
        />
      </main>
    </div>
  );
};

export default AdminLayout;

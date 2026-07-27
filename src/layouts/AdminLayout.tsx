import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaHome, FaUserMd, FaCog, FaSignOutAlt, FaHospitalAlt } from 'react-icons/fa';

const AdminLayout = () => {
  const { logout, currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    { path: '/admin/doctors', icon: <FaUserMd size={20} />, label: 'Jadwal Dokter' },
    { path: '/admin/settings', icon: <FaCog size={20} />, label: 'Pengaturan' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <FaHospitalAlt size={28} />
          <div>
            <h2 className="font-bold text-lg leading-tight">Admin Panel</h2>
            <p className="text-xs text-blue-200">IGD Display</p>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
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
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center px-8 shrink-0 justify-between">
          <h1 className="text-xl font-bold text-gray-800">
            {menuItems.find(m => m.path === location.pathname)?.label || 'Admin Panel'}
          </h1>
          <Link to="/" target="_blank" className="text-sm text-primary hover:underline font-medium">
            Lihat Layar Display ↗
          </Link>
        </header>
        
        <div className="flex-1 overflow-auto p-8 bg-gray-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

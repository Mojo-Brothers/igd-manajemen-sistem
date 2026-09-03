import { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';

import Display from './pages/Display';
import OnCallDisplay from './pages/OnCallDisplay';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loaded Admin Pages
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Doctors = lazy(() => import('./pages/Doctors'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminOnCall = lazy(() => import('./pages/AdminOnCall'));
const LinenFlowPage = lazy(() => import('./pages/linen/LinenFlowPage'));

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <Toaster position="top-right" />
          <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div></div>}>
            <Routes>
            {/* Direct initial access to Admin Dashboard */}
            <Route path="/" element={<Navigate to="/admin" replace />} />

            {/* Public TV Display Routes */}
            <Route path="/display" element={<Display />} />
            <Route path="/on-call" element={<OnCallDisplay />} />

            {/* 1. Halaman Khusus IGD (Akses Meja Perawat & Lemari) */}
            <Route path="/linen" element={<LinenFlowPage initialRole="IGD" />} />
            <Route path="/linen/igd" element={<LinenFlowPage initialRole="IGD" />} />

            {/* 2. Halaman Khusus Laundry (Akses Runner & Petugas Cuci) */}
            <Route path="/laundry" element={<LinenFlowPage initialRole="LAUNDRY" />} />
            <Route path="/linen/laundry" element={<LinenFlowPage initialRole="LAUNDRY" />} />
            
            {/* Admin Login */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="doctors" element={<Doctors />} />
                <Route path="on-call" element={<AdminOnCall />} />
                <Route path="linen" element={<LinenFlowPage />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
          </Suspense>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;

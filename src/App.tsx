import { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Pages & Layouts (Eager load main display)
import Display from './pages/Display';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy loaded Admin Pages
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Doctors = lazy(() => import('./pages/Doctors'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <Toaster position="top-right" />
          <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div></div>}>
            <Routes>
            {/* Public TV Display Route */}
            <Route path="/" element={<Display />} />
            
            {/* Admin Login */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="doctors" element={<Doctors />} />
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

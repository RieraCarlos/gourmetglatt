import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './router/ProtectedRoute';
import Login from './pages/auth/Login/pageLogin';
import Home from './pages/Home';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/PageSupervisor';
import NotFound from './pages/NotFound';
import { useAppSelector } from './app/hook';
import OfflineStatus from './components/OfflineStatus';
import { Toaster } from 'sonner';

function App() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />

        {/* Protected Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/supervisor/*"
          element={
            <ProtectedRoute allowedRoles={['supervisor']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* Home redirection based on role */}
        <Route
          path="/"
          element={
            user ? (
              <Home />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      <OfflineStatus />
      <Toaster richColors position="top-right" />
    </Router>
  );
}

export default App;

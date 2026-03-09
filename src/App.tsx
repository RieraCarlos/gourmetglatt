import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import ProtectedRoute from './router/ProtectedRoute';
import Login from './pages/auth/Login/pageLogin';
import Home from './pages/Home';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/PageSupervisor';
import NotFound from './pages/NotFound';
import { useAppSelector, useAppDispatch } from './app/hook';
import { setAuth, setAuthReady, logout } from './features/auth/authSlice';
import { supabase } from './lib/supabase';
import OfflineStatus from './components/OfflineStatus';
import { Toaster } from 'sonner';
import { useRegisterSW } from 'virtual:pwa-register/react';

function App() {
  const { user, authReady } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // PWA Service Worker Registration
  useRegisterSW({
    onNeedRefresh() {

      // En una app real se mostraría un Toast al usuario, pero reload asegura la última versión
      window.location.reload();
    },
    onOfflineReady() {

    },
  });

  useEffect(() => {


    // Helper: sincronizar el perfil del servidor en segundo plano (fire-and-forget)
    const syncProfileInBackground = async (session: any) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();


        if (profile) {
          dispatch(setAuth({
            user: {
              id: session.user.id,
              email: session.user.email!,
              role: profile.role,
              name: profile.name,
              avatar_url: profile.avatar_url,
            },
            session: session,
          }));
        }
      } catch (err) {
        console.error("[App.tsx] Background profile sync failed (non-blocking):", err);
      }
    };

    // Auth Bootstrap & Subscription (callback SÍNCRONO — sin async/await)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {


      if (event === 'INITIAL_SESSION') {
        if (!session) {
          // No hay sesión real → limpiar localStorage si tenía datos viejos

          dispatch(logout());
        } else {
          // 🔥 OPTIMISTIC AUTH BOOTSTRAP 🔥
          // Sesión válida confirmada. Redux ya tiene el 'user' del localStorage.
          // Disparamos la sincronización del perfil en segundo plano sin bloquear.

          syncProfileInBackground(session);
        }
        // SIEMPRE desbloquear la UI al finalizar INITIAL_SESSION
        dispatch(setAuthReady(true));

      } else if (event === 'SIGNED_IN' && session) {
        // form-login.tsx ya actualizó Redux con el perfil completo
        // Solo sincronizamos por si acaso (ej: login desde otra pestaña)
        syncProfileInBackground(session);

      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Token renovado en segundo plano — sincronizar perfil silenciosamente
        syncProfileInBackground(session);

      } else if (event === 'SIGNED_OUT') {

        dispatch(logout());
      }
    });

    return () => {

      subscription.unsubscribe();
    };
  }, [dispatch]);

  // Loading Screen while verifying session
  if (!authReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#747d42] border-t-transparent"></div>
          <p className="text-sm text-muted-foreground animate-pulse">Iniciando aplicación...</p>
        </div>
      </div>
    );
  }

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

import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useMatchStore } from './store/matchStore';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import TournamentView from './pages/public/TournamentView';
import Live from './pages/Live';
import LiveMatchView from './components/public/LiveMatchView';
import AdminDashboard from './pages/admin/AdminDashboard';
import TournamentWizard from './pages/admin/TournamentWizard';
import AdminTournamentView from './pages/admin/AdminTournamentView';
import TournamentSchedule from './pages/admin/TournamentSchedule';
import Login from './pages/admin/Login';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuthStore();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const { fetchInitialData, isLoading } = useMatchStore();
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    fetchInitialData();
    initialize();
  }, [fetchInitialData, initialize]);

  // Wait until auth is initialized and initial data is loaded
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div className="w-12 h-12 rounded-full border-4 border-lime-DEFAULT/20 border-t-lime-DEFAULT animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/tournaments/:id" element={<TournamentView />} />
        <Route path="/live/:id" element={<LiveMatchView />} />
        
        {/* Login Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Fallbacks */}
        <Route path="/matches" element={<Navigate to="/" replace />} />
        <Route path="/profile" element={<Navigate to="/" replace />} />
        
        {/* Admin Routes - Protected */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/tournaments/new" element={<ProtectedRoute><TournamentWizard /></ProtectedRoute>} />
        <Route path="/admin/tournaments/:id" element={<ProtectedRoute><AdminTournamentView /></ProtectedRoute>} />
        <Route path="/admin/tournaments/:id/schedule" element={<ProtectedRoute><TournamentSchedule /></ProtectedRoute>} />
        <Route path="/admin/match/new/score" element={<ProtectedRoute><Live /></ProtectedRoute>} />
        <Route path="/admin/match/:id/score" element={<ProtectedRoute><Live /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

export default App;

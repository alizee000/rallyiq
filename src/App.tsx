import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useMatchStore } from './store/matchStore';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import TournamentView from './pages/public/TournamentView';
import Live from './pages/Live';
import LiveMatchView from './components/public/LiveMatchView';
import AdminDashboard from './pages/admin/AdminDashboard';
import TournamentWizard from './pages/admin/TournamentWizard';
import AdminTournamentView from './pages/admin/AdminTournamentView';
import TournamentSchedule from './pages/admin/TournamentSchedule';

function App() {
  const { fetchInitialData, isLoading } = useMatchStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (isLoading) {
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
        
        {/* Fallbacks */}
        <Route path="/matches" element={<Navigate to="/" replace />} />
        <Route path="/profile" element={<Navigate to="/" replace />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/tournaments/new" element={<TournamentWizard />} />
        <Route path="/admin/tournaments/:id" element={<AdminTournamentView />} />
        <Route path="/admin/tournaments/:id/schedule" element={<TournamentSchedule />} />
        <Route path="/admin/match/new/score" element={<Live />} />
        <Route path="/admin/match/:id/score" element={<Live />} />
      </Route>
    </Routes>
  );
}

export default App;

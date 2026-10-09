import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Play, MoreHorizontal } from 'lucide-react';
import { useMatchStore } from '../../store/matchStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { tournaments, matches, activeMatch } = useMatchStore();
  const matchesList = Object.values(matches);
  const tournamentsList = Object.values(tournaments);

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto pb-24">
      <header className="px-6 pt-12 pb-6 border-b border-white/60 bg-white/60 backdrop-blur-3xl sticky top-0 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        <h1 className="text-2xl font-display font-bold text-graphite-100 mb-2">Admin Dashboard</h1>
        <p className="text-sm text-graphite-400">Manage tournaments and score matches live.</p>
      </header>

      <div className="p-6 space-y-8">
        {/* Quick Actions */}
        <section>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/admin/tournaments/new')}
              className="neo-btn flex-1 !bg-lime-DEFAULT text-white p-4 rounded-[20px] font-bold flex flex-col items-center gap-2"
            >
              <Trophy size={24} />
              New Tournament
            </button>
            <button 
              onClick={() => {
                if (activeMatch) {
                  navigate(`/admin/match/${activeMatch.id}/score`);
                } else {
                  navigate(`/admin/match/new/score`);
                }
              }}
              className="neo-btn flex-1 bg-white/50 text-graphite-100 p-4 rounded-[20px] font-bold flex flex-col items-center gap-2"
            >
              <Plus size={24} className="text-cyan-DEFAULT" />
              Quick Match
            </button>
          </div>
        </section>

        {/* Active Matches */}
        <section>
          <h2 className="text-sm font-bold text-graphite-400 uppercase tracking-widest mb-4">In Progress</h2>
          {matchesList.filter(m => m.status === 'playing').length === 0 ? (
            <div className="glass-card p-6 text-center rounded-2xl">
              <p className="text-sm text-graphite-400">No matches currently in progress.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matchesList.filter(m => m.status === 'playing').map(m => (
                <div key={m.id} className="glass-card p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-lime-DEFAULT">
                  <div>
                    <div className="text-sm font-bold text-graphite-100 mb-1">
                      {m.teamA.players.map(p => p.name).join(' & ')} vs {m.teamB.players.map(p => p.name).join(' & ')}
                    </div>
                    <div className="text-xs text-graphite-400">Game {m.currentGame} • {m.currentScoreA} - {m.currentScoreB}</div>
                  </div>
                  <button 
                    onClick={() => navigate(`/admin/match/${m.id}/score`)}
                    className="p-3 bg-graphite-800 rounded-xl text-graphite-100 hover:bg-graphite-700 active:scale-95 transition-all"
                  >
                    <Play size={18} fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tournaments */}
        <section>
          <h2 className="text-sm font-bold text-graphite-400 uppercase tracking-widest mb-4">Tournaments</h2>
          {tournamentsList.length === 0 ? (
            <div className="glass-card p-6 text-center rounded-2xl">
              <p className="text-sm text-graphite-400">No tournaments created yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tournamentsList.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => navigate(`/admin/tournaments/${t.id}`)}
                  className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-black/5 transition-colors"
                >
                  <div>
                    <div className="text-sm font-bold text-graphite-100 mb-1">{t.name}</div>
                    <div className="text-xs text-graphite-400 uppercase">{t.status}</div>
                  </div>
                  <button className="p-2 text-graphite-400 hover:text-graphite-100">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

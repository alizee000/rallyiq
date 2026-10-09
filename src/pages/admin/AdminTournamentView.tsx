import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatchStore } from '../../store/matchStore';
import { ChevronLeft, Plus, Play } from 'lucide-react';

export default function AdminTournamentView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments, matches } = useMatchStore();
  
  const tournament = id ? tournaments[id] : null;
  
  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-graphite-100">
        <h2>Tournament not found</h2>
        <button onClick={() => navigate('/admin')} className="text-lime-DEFAULT underline">Go back</button>
      </div>
    );
  }

  const tournamentMatches = Object.values(matches).filter(m => m.tournamentId === id);
  const scheduled = tournamentMatches.filter(m => m.status === 'setup');
  const playing = tournamentMatches.filter(m => m.status === 'playing');
  const completed = tournamentMatches.filter(m => m.status === 'completed');

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto pb-24">
      <header className="px-4 py-4 flex items-center gap-4 border-b border-white/60 bg-white/60 backdrop-blur-3xl sticky top-0 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        <button onClick={() => navigate('/admin')} className="p-2 text-graphite-400 hover:text-graphite-100">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-graphite-100">{tournament.name}</h1>
          <p className="text-xs text-graphite-400 uppercase">{tournament.status}</p>
        </div>
      </header>

      <div className="p-6 space-y-8">
        <button 
          onClick={() => navigate(`/admin/tournaments/${id}/schedule`)}
          className="neo-btn w-full !bg-lime-DEFAULT text-white p-4 font-bold flex items-center justify-center gap-2 rounded-[20px]"
        >
          <Plus size={20} />
          Schedule Match
        </button>

        {playing.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              Live Matches
            </h2>
            <div className="space-y-3">
              {playing.map(m => (
                <div key={m.id} className="glass-card p-4 flex items-center justify-between border-l-4 border-l-red-500 rounded-[20px]">
                  <div>
                    <div className="text-sm font-bold text-graphite-100 mb-1">
                      {m.teamA.players.map(p => p.name).join(' & ')} vs {m.teamB.players.map(p => p.name).join(' & ')}
                    </div>
                    <div className="text-xs text-graphite-400">Game {m.currentGame} • {m.currentScoreA} - {m.currentScoreB}</div>
                  </div>
                  <button 
                    onClick={() => navigate(`/admin/match/${m.id}/score`)}
                    className="neo-btn p-3 !bg-red-500 rounded-[16px] text-white"
                  >
                    <Play size={18} fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {scheduled.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-graphite-400 uppercase tracking-widest mb-4">Scheduled Matches</h2>
            <div className="space-y-3">
              {scheduled.map(m => (
                <div key={m.id} className="glass-card p-4 flex items-center justify-between border-l-4 border-l-cyan-DEFAULT rounded-[20px]">
                  <div>
                    <div className="text-sm font-bold text-graphite-100 mb-1">
                      {m.teamA.players.map(p => p.name).join(' & ')} vs {m.teamB.players.map(p => p.name).join(' & ')}
                    </div>
                    <div className="text-xs text-graphite-400">Scheduled</div>
                  </div>
                  <button 
                    onClick={() => navigate(`/admin/match/${m.id}/score`)}
                    className="neo-btn px-5 py-2 !bg-cyan-DEFAULT text-white font-bold rounded-full text-sm"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-graphite-400 uppercase tracking-widest mb-4">Completed</h2>
            <div className="space-y-3">
              {completed.map(m => {
                const scoreString = m.games.length > 0 
                  ? m.games.map(g => `${g.scoreA}-${g.scoreB}`).join(', ') 
                  : `${m.currentScoreA}-${m.currentScoreB}`;
                
                return (
                  <div 
                    key={m.id} 
                    onClick={() => navigate(`/admin/match/${m.id}/score`)}
                    className="glass-card p-4 rounded-[20px] border-l-4 border-l-graphite-600 opacity-70 cursor-pointer hover:bg-black/5 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <div className="text-sm font-bold text-graphite-100 mb-1">
                        {m.teamA.players.map(p => p.name).join(' & ')} vs {m.teamB.players.map(p => p.name).join(' & ')}
                      </div>
                      <div className="text-xs text-graphite-400 font-bold tracking-wider">{scoreString}</div>
                    </div>
                  <div className="text-[10px] font-bold text-lime-DEFAULT uppercase tracking-widest">
                    Analysis
                  </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

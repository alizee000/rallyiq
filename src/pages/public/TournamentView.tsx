import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatchStore } from '../../store/matchStore';
import { ChevronLeft, Trophy, Calendar, Play } from 'lucide-react';

export default function TournamentView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments, matches } = useMatchStore();
  
  const tournament = id ? tournaments[id] : null;
  
  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-graphite-100 bg-transparent">
        <h2 className="text-xl font-bold mb-4">Tournament not found</h2>
        <button onClick={() => navigate('/')} className="text-lime-DEFAULT underline">Return Home</button>
      </div>
    );
  }

  const tournamentMatches = Object.values(matches).filter(m => m.tournamentId === id);
  const scheduled = tournamentMatches.filter(m => m.status === 'setup');
  const playing = tournamentMatches.filter(m => m.status === 'playing');
  const completed = tournamentMatches.filter(m => m.status === 'completed');

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto pb-24 relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-cyan-DEFAULT/10 to-transparent -z-10"></div>
      
      <header className="px-4 py-4 flex items-center relative z-20">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-graphite-400 hover:text-graphite-100">
          <ChevronLeft size={24} />
        </button>
      </header>

      <div className="px-6 mb-8 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-graphite-900  rounded-full mb-4">
          <Trophy size={12} className="text-cyan-DEFAULT" />
          <span className="text-[10px] font-bold text-graphite-300 uppercase tracking-widest">{tournament.status}</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-graphite-100 tracking-tight leading-tight mb-2">
          {tournament.name}
        </h1>
        <div className="flex items-center gap-2 text-xs text-graphite-400 font-medium">
          <Calendar size={14} />
          <span>Started {new Date(tournament.startDate).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="px-6 space-y-8">
        {playing.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-graphite-100 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-lime-DEFAULT animate-pulse "></div>
                Live Now
              </h2>
            </div>
            <div className="space-y-4">
              {playing.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => navigate(`/live/${m.id}`)}
                  className="glass-card p-5 rounded-3xl cursor-pointer hover:bg-black/5 transition-all active:scale-[0.98]  relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-lime-DEFAULT/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <div className="flex gap-2">
                      {m.stage && <span className="text-[10px] font-bold uppercase tracking-widest text-graphite-500 bg-black/5 px-2 py-0.5 rounded-sm">{m.stage}</span>}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-lime-DEFAULT bg-lime-DEFAULT/10 px-2 py-0.5 rounded-sm">Game {m.currentGame}</span>
                    </div>
                    <Play size={16} className="text-lime-DEFAULT opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="space-y-2 relative z-10">
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-graphite-100 text-sm truncate pr-4">
                        {m.teamA.players.map(p => p.name).join(' & ')}
                      </div>
                      <div className="font-display font-bold text-xl text-graphite-100">
                        {m.currentScoreA}
                      </div>
                    </div>
                    
                    <div className="relative py-2 flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-px bg-black/5"></div>
                      </div>
                      <div className="relative bg-white/40 px-2 rounded-full text-[10px] font-bold text-graphite-400 uppercase tracking-widest backdrop-blur-sm">
                        VS
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-graphite-100 text-sm truncate pr-4">
                        {m.teamB.players.map(p => p.name).join(' & ')}
                      </div>
                      <div className="font-display font-bold text-xl text-graphite-100">
                        {m.currentScoreB}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {scheduled.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-graphite-400 uppercase tracking-widest mb-4">Upcoming Matches</h2>
            <div className="space-y-3">
              {scheduled.map((m, index) => (
                <div key={m.id} className={`glass-card p-5 rounded-3xl opacity-80 ${index % 2 === 0 ? '!bg-white/80' : '!bg-black/5 shadow-inner'}`}>
                  {m.stage && <div className="text-[10px] font-bold uppercase tracking-widest text-graphite-500 mb-2">{m.stage}</div>}
                  <div className="text-sm font-bold text-graphite-100 mb-2">
                    {m.teamA.players.map(p => p.name).join(' & ')}
                  </div>
                  <div className="text-xs text-graphite-500 font-bold uppercase tracking-widest mb-2">VS</div>
                  <div className="text-sm font-bold text-graphite-100">
                    {m.teamB.players.map(p => p.name).join(' & ')}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-graphite-400 uppercase tracking-widest mb-4">Results</h2>
            <div className="space-y-3">
              {completed.map((m, index) => {
                const winnerIsA = m.games.filter(g => g.winner === 'A').length > m.games.filter(g => g.winner === 'B').length;
                const scoreString = m.games.length > 0 
                  ? m.games.map(g => `${g.scoreA}-${g.scoreB}`).join(', ') 
                  : `${m.currentScoreA}-${m.currentScoreB}`;

                return (
                  <div 
                    key={m.id} 
                    onClick={() => navigate(`/live/${m.id}`)}
                    className={`glass-card p-4 rounded-[20px] cursor-pointer hover:scale-[0.98] transition-all ${index % 2 === 0 ? '!bg-white/80' : '!bg-black/5 shadow-inner'}`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <div className={`text-sm font-bold truncate pr-2 ${winnerIsA ? 'text-graphite-100' : 'text-graphite-400'}`}>
                        {m.teamA.players.map(p => p.name).join(' & ')} {winnerIsA && '🏆'}
                      </div>
                      {m.stage && <div className="text-[10px] font-bold uppercase tracking-widest text-graphite-400">{m.stage}</div>}
                    </div>
                    
                    <div className="relative py-1 flex items-center justify-start ml-2 mb-1.5">
                      <div className="text-[10px] font-bold text-graphite-400/80 uppercase tracking-widest">
                        VS
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className={`text-sm font-bold truncate pr-2 ${!winnerIsA ? 'text-graphite-100' : 'text-graphite-400'}`}>
                        {m.teamB.players.map(p => p.name).join(' & ')} {!winnerIsA && '🏆'}
                      </div>
                      <div className={`font-display font-bold text-sm text-graphite-400 tracking-wider`}>
                        {scoreString}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        
        {tournamentMatches.length === 0 && (
          <div className="text-center py-10">
            <p className="text-graphite-400 text-sm">No matches scheduled yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

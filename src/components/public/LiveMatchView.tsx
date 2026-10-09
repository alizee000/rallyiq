import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatchStore } from '../../store/matchStore';
import CommentaryTab from '../match/CommentaryTab';
import MatchSummary from '../match/MatchSummary';
import { ChevronLeft } from 'lucide-react';

export default function LiveMatchView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { matches } = useMatchStore();
  const match = id ? matches[id] : null;

  useEffect(() => {
    // Poll for live updates every 5 seconds!
    const interval = setInterval(() => {
      useMatchStore.getState().fetchInitialData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-graphite-100">
        <h2 className="text-xl font-bold mb-4">Match not found</h2>
        <button onClick={() => navigate('/')} className="text-lime-DEFAULT underline">Go Home</button>
      </div>
    );
  }

  if (match.status === 'completed') {
    return <MatchSummary matchOverride={match} />;
  }

  const getTeamNames = (team: any) => team.players.map((p: any) => p.name).join(' & ');

  const renderSide = (side: 'A' | 'B') => {
    const isA = side === 'A';
    const team = isA ? match.teamA : match.teamB;
    const score = isA ? match.currentScoreA : match.currentScoreB;
    const isServing = match.servingSide === side;
    
    return (
      <div className={`flex-1 flex flex-col justify-center items-center relative overflow-hidden group
          ${isA ? 'bg-gradient-to-b from-graphite-900 to-graphite-950 border-r border-black/5' : 'bg-gradient-to-b from-graphite-800 to-graphite-950'}`}>
        
        {isServing && (
          <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${isA ? 'from-lime-DEFAULT/10' : 'from-cyan-DEFAULT/10'} to-transparent opacity-50`}></div>
        )}

        {isServing && (
          <div className="absolute top-4 flex flex-col items-center">
            <span className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isA ? 'text-lime-DEFAULT' : 'text-cyan-DEFAULT'}`}>Serving</span>
            <div className={`w-2 h-2 rounded-full animate-pulse ${isA ? 'bg-lime-DEFAULT ' : 'bg-cyan-DEFAULT '}`}></div>
          </div>
        )}
        
        <div className={`text-[120px] font-display font-bold leading-none tracking-tighter relative z-10 text-graphite-100`}>
          {score}
        </div>
        
        <div className="absolute bottom-4 w-full px-4 text-center z-10">
          <div className="glass-card mx-auto max-w-[90%] rounded-full py-1.5 px-3 border-black/10 shadow-lg">
            <p className="text-xs font-bold text-graphite-100 truncate w-full">
              {getTeamNames(team)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-3 pt-8 glass-panel border-b border-black/5 relative z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/matches')} 
            className="p-1 -ml-1 text-graphite-400 hover:text-graphite-100"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] text-graphite-400 font-bold uppercase tracking-widest mb-0.5">Game {match.currentGame} • LIVE</span>
            <div className="flex gap-2 text-xs font-bold text-graphite-500">
              {match.games.map((g, i) => (
                <span key={i} className={g.winner === 'A' ? 'text-lime-DEFAULT' : 'text-cyan-DEFAULT'}>
                  {g.scoreA}-{g.scoreB}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-red-500/20 text-red-500 text-xs font-bold rounded-full animate-pulse flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            LIVE
          </span>
        </div>
      </div>

      {/* Main Score Area */}
      <div className="h-[35vh] flex w-full relative shrink-0 pointer-events-none">
        {renderSide('A')}
        {renderSide('B')}
      </div>

      {/* Live Feed List (Commentary) */}
      <div className="flex-1 overflow-hidden relative flex flex-col pb-safe">
        <CommentaryTab matchOverride={match} />
      </div>
    </div>
  );
}

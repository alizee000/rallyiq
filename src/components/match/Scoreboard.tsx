import React, { useState } from 'react';
import { useMatchStore } from '../../store/matchStore';
import { Undo2, Settings, MoreHorizontal, Flag, ChevronLeft } from 'lucide-react';
import { Side, Team } from '../../domain/types';
import PointAnnotationSheet from './PointAnnotationSheet';
import CommentaryTab from './CommentaryTab';
import { generateCommentary } from '../../domain/commentary';

export default function Scoreboard() {
  const { activeMatch, scorePoint, undo, endMatch } = useMatchStore();
  const [annotationSide, setAnnotationSide] = useState<Side | null>(null);
  const [annotationStep, setAnnotationStep] = useState<'winner_shot' | 'loser_error'>('winner_shot');
  const [tempDetails, setTempDetails] = useState<{shotType?: string, errorType?: string, outcomeType?: 'winner' | 'unforced_error' | 'forced_error', pointWinnerId?: string, errorMakerId?: string}>({});

  if (!activeMatch) return null;

  const isDoubles = activeMatch.settings.type === 'doubles';

  const handleScore = (side: Side) => {
    scorePoint(side);
    setAnnotationSide(side);
    setAnnotationStep('winner_shot');
    
    const initialDetails: any = {};
    if (!isDoubles) {
      initialDetails.pointWinnerId = side === 'A' ? activeMatch.teamA.players[0].id : activeMatch.teamB.players[0].id;
    }
    setTempDetails(initialDetails);
  };

  const { updateLastPoint } = useMatchStore.getState();

  const handleWinnerShotSelect = (shot: string, playerId?: string) => {
    setTempDetails(prev => ({ ...prev, shotType: shot, pointWinnerId: playerId || prev.pointWinnerId }));
    
    if (!isDoubles) {
      setTempDetails(prev => ({ ...prev, errorMakerId: annotationSide === 'A' ? activeMatch.teamB.players[0].id : activeMatch.teamA.players[0].id }));
    }
    setAnnotationStep('loser_error');
  };

  const handleLoserErrorSelect = (error: string, playerId?: string) => {
    let outcome: 'winner' | 'unforced_error' | 'forced_error' | 'service_fault' = 'forced_error';
    if (error === 'Clean winner') outcome = 'winner';
    if (tempDetails.shotType === 'N/A (Unforced)') outcome = 'unforced_error';
    if (error === 'Service Fault') outcome = 'service_fault';
    
    updateLastPoint({ 
      ...tempDetails, 
      shotType: tempDetails.shotType === 'N/A (Unforced)' ? undefined : tempDetails.shotType,
      errorType: error,
      outcomeType: outcome,
      errorMakerId: playerId || tempDetails.errorMakerId
    });
    setAnnotationSide(null);
  };

  const getTeamNames = (team: Team) => {
    return team.players.map(p => p.name).join(' & ');
  };

  const renderSide = (side: Side) => {
    const isA = side === 'A';
    const team = isA ? activeMatch.teamA : activeMatch.teamB;
    const score = isA ? activeMatch.currentScoreA : activeMatch.currentScoreB;
    const isServing = activeMatch.servingSide === side;
    
    return (
      <div 
        className={`flex-1 flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300 cursor-pointer select-none group
          ${isA ? 'bg-gradient-to-b from-graphite-900 to-graphite-950 border-r border-black/5' : 'bg-gradient-to-b from-graphite-800 to-graphite-950'}`}
        onClick={() => handleScore(side)}
      >
        {isServing && (
          <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${isA ? 'from-lime-DEFAULT/10' : 'from-cyan-DEFAULT/10'} to-transparent opacity-50`}></div>
        )}

        {isServing && (
          <div className="absolute top-4 flex flex-col items-center">
            <span className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isA ? 'text-lime-DEFAULT' : 'text-cyan-DEFAULT'}`}>Serving</span>
            <div className={`w-2 h-2 rounded-full animate-pulse ${isA ? 'bg-lime-DEFAULT ' : 'bg-cyan-DEFAULT '}`}></div>
          </div>
        )}
        
        <div className={`text-[120px] font-display font-bold leading-none tracking-tighter transition-all duration-200 group-active:scale-95 group-active:opacity-80 relative z-10 text-graphite-100`}>
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

  const shotTypes = ['Smash', 'Drop', 'Clear', 'Drive', 'Net', 'Lift', 'Serve'];

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-3 pt-8 glass-panel border-b border-black/5 relative z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              useMatchStore.setState({ activeMatch: null });
              window.history.back();
            }} 
            className="p-1 -ml-1 text-graphite-400 hover:text-graphite-100"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] text-graphite-400 font-bold uppercase tracking-widest mb-0.5">Game {activeMatch.currentGame}</span>
            <div className="flex gap-2 text-xs font-bold text-graphite-500">
              {activeMatch.games.map((g, i) => (
                <span key={i} className={g.winner === 'A' ? 'text-lime-DEFAULT' : 'text-cyan-DEFAULT'}>
                  {g.scoreA}-{g.scoreB}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={undo} className="p-2 bg-graphite-800 rounded-full text-graphite-100 border border-black/10 shadow-lg active:scale-90 transition-all" disabled={activeMatch.history.length === 0}>
            <Undo2 size={16} />
          </button>
          <button onClick={endMatch} className="px-3 py-1.5 bg-coral-DEFAULT/20 rounded-full text-coral-DEFAULT border border-coral-DEFAULT/30 shadow-lg active:scale-90 transition-all font-bold text-xs flex items-center gap-1.5">
            <Flag size={14} />
            End Match
          </button>
        </div>
      </div>

      {/* Main Score Area */}
      <div className="h-[35vh] flex w-full relative shrink-0">
        {renderSide('A')}
        {renderSide('B')}
      </div>

      {/* Inline Quick Annotation Toolbar */}
      {annotationSide && (
        <div className="bg-graphite-900 border-y border-black/10 p-3 shrink-0 shadow-lg z-20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-lime-DEFAULT uppercase tracking-widest">
              {annotationStep === 'winner_shot' 
                ? `Point to Side ${annotationSide} - How?` 
                : `Side ${annotationSide === 'A' ? 'B' : 'A'} Lost - How?`}
            </span>
            <button onClick={() => setAnnotationSide(null)} className="text-[10px] font-bold text-graphite-400 hover:text-graphite-100 uppercase">Skip</button>
          </div>
          
          {annotationStep === 'winner_shot' ? (
            <div className="space-y-3">
              {isDoubles && (
                <div className="flex gap-2 mb-2 pb-2 border-b border-black/5">
                  {(annotationSide === 'A' ? activeMatch.teamA : activeMatch.teamB).players.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => setTempDetails(prev => ({ ...prev, pointWinnerId: p.id }))}
                      className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${tempDetails.pointWinnerId === p.id ? 'bg-lime-DEFAULT/20 text-lime-DEFAULT border-lime-DEFAULT/50' : 'bg-graphite-800 text-graphite-400 border-black/5'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {['Smash', 'Drop', 'Clear', 'Drive', 'Net', 'N/A (Unforced)'].map(shot => (
                  <button key={shot} onClick={() => handleWinnerShotSelect(shot)} className="py-1.5 px-3 bg-graphite-800 text-graphite-100 text-xs font-bold rounded-lg border border-black/10 active:scale-95 hover:bg-graphite-700">{shot}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {isDoubles && (
                <div className="flex gap-2 mb-2 pb-2 border-b border-black/5">
                  {(annotationSide === 'A' ? activeMatch.teamB : activeMatch.teamA).players.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => setTempDetails(prev => ({ ...prev, errorMakerId: p.id }))}
                      className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${tempDetails.errorMakerId === p.id ? 'bg-coral-DEFAULT/20 text-coral-DEFAULT border-coral-DEFAULT/50' : 'bg-graphite-800 text-graphite-400 border-black/5'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {['Net fault', 'Wide', 'Long', 'Service Fault', 'Clean winner'].map(err => (
                  <button key={err} onClick={() => handleLoserErrorSelect(err)} className="py-1.5 px-3 bg-graphite-800 text-graphite-100 text-xs font-bold rounded-lg border border-black/10 active:scale-95 hover:bg-graphite-700">{err}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Feed List (Commentary) */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <CommentaryTab />
      </div>
    </div>
  );
}

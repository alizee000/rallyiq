import React from 'react';
import { useMatchStore } from '../../store/matchStore';
import { generateCommentary } from '../../domain/commentary';
import { MessageSquare } from 'lucide-react';
import { MatchState } from '../../domain/types';

export default function CommentaryTab({ matchOverride }: { matchOverride?: MatchState }) {
  const activeMatchStore = useMatchStore(state => state.activeMatch);
  const activeMatch = matchOverride || activeMatchStore;
  
  if (!activeMatch) return null;

  // Reverse history so newest is on top
  const history = [...activeMatch.history].reverse();

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-graphite-400 p-8 text-center">
        <MessageSquare size={48} className="mb-4 opacity-50" />
        <p>No points recorded yet. The commentary will appear here as the match progresses.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 bg-transparent pt-6 pb-24 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar { display: none; }
      `}} />
      <div className="flex items-center justify-between px-2 mb-2 sticky top-0 z-20 bg-transparent/90 backdrop-blur-sm py-2">
        <h3 className="text-xs font-bold text-graphite-400 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-lime-DEFAULT animate-pulse"></div>
          Match Timeline
        </h3>
      </div>
      
      <div className="relative">
        {/* Continuous timeline line */}
        <div className="w-px h-full bg-black/10 absolute left-4 top-2 -z-10"></div>

      {history.map((event, i) => {
        const text = generateCommentary(event, activeMatch);
        const scoreA = event.scoringSide === 'A' ? event.previousStateSnapshot.currentScoreA + 1 : event.previousStateSnapshot.currentScoreA;
        const scoreB = event.scoringSide === 'B' ? event.previousStateSnapshot.currentScoreB + 1 : event.previousStateSnapshot.currentScoreB;
        const isWinner = event.details?.outcomeType === 'winner';
        const isError = event.details?.outcomeType === 'unforced_error' || event.details?.outcomeType === 'service_fault';
        
        let markerColor = 'bg-graphite-600';
        if (isWinner) markerColor = 'bg-lime-DEFAULT ';
        else if (isError) markerColor = 'bg-coral-DEFAULT ';

        return (
          <div key={event.id} className="flex gap-4 relative">
            <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${markerColor} z-10 border-2 border-graphite-950`}></div>
            <div className="glass-card rounded-2xl p-4 flex-1 shadow-lg border-black/5 relative overflow-hidden">
              {isWinner && <div className="absolute top-0 right-0 w-16 h-16 bg-lime-DEFAULT/10 rounded-full blur-xl -mt-8 -mr-8"></div>}
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-graphite-400 tracking-wider">
                  GAME {event.gameNumber}
                </span>
                <span className="text-sm font-display font-bold text-graphite-100 bg-graphite-900/80 border border-black/10 px-2.5 py-0.5 rounded-full">
                  {scoreA} - {scoreB}
                </span>
              </div>
              <p className="text-graphite-200 text-sm leading-relaxed font-medium">
                {text}
              </p>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

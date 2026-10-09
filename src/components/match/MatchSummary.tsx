import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../../store/matchStore';
import { Trophy, ChevronLeft } from 'lucide-react';
import { MatchState } from '../../domain/types';

export default function MatchSummary({ matchOverride }: { matchOverride?: MatchState }) {
  const navigate = useNavigate();
  const { activeMatch } = useMatchStore();
  
  const matchToDisplay = matchOverride || activeMatch;
  const isPublicViewer = !!matchOverride;

  if (!matchToDisplay || matchToDisplay.status !== 'completed') return null;

  const matchWinner = matchToDisplay.games.filter(g => g.winner === 'A').length > matchToDisplay.games.filter(g => g.winner === 'B').length ? 'A' : 'B';
  const winningTeam = matchWinner === 'A' ? matchToDisplay.teamA : matchToDisplay.teamB;

  // Compute Advanced Stats
  const history = matchToDisplay.history;
  
  const pointsWonA = history.filter(h => h.scoringSide === 'A');
  const pointsWonB = history.filter(h => h.scoringSide === 'B');

  const winnersA = pointsWonA.filter(h => h.details?.outcomeType === 'winner').length;
  const winnersB = pointsWonB.filter(h => h.details?.outcomeType === 'winner').length;

  const unforcedErrorsA = pointsWonB.filter(h => h.details?.outcomeType === 'unforced_error').length;
  const unforcedErrorsB = pointsWonA.filter(h => h.details?.outcomeType === 'unforced_error').length;

  const forcedErrorsA = pointsWonB.filter(h => h.details?.outcomeType === 'forced_error').length;
  const forcedErrorsB = pointsWonA.filter(h => h.details?.outcomeType === 'forced_error').length;

  const serviceFaultsA = pointsWonB.filter(h => h.details?.outcomeType === 'service_fault').length;
  const serviceFaultsB = pointsWonA.filter(h => h.details?.outcomeType === 'service_fault').length;

  const pointsWonOnServeA = pointsWonA.filter(h => h.previousStateSnapshot?.servingSide === 'A').length;
  const pointsWonOnServeB = pointsWonB.filter(h => h.previousStateSnapshot?.servingSide === 'B').length;

  let currentStreakA = 0, maxStreakA = 0;
  let currentStreakB = 0, maxStreakB = 0;
  history.forEach(h => {
    if (h.scoringSide === 'A') {
      currentStreakA++;
      currentStreakB = 0;
      maxStreakA = Math.max(maxStreakA, currentStreakA);
    } else {
      currentStreakB++;
      currentStreakA = 0;
      maxStreakB = Math.max(maxStreakB, currentStreakB);
    }
  });

  const StatRow = ({ label, valA, valB, highlightA = false, highlightB = false, reverseColors = false }: any) => {
    // If reverseColors is true (e.g. for errors), lower is better.
    let colorA = 'text-graphite-100';
    let colorB = 'text-graphite-100';
    
    if (valA > valB) {
      colorA = reverseColors ? 'text-coral-DEFAULT' : 'text-lime-DEFAULT';
      colorB = 'text-graphite-500';
    } else if (valB > valA) {
      colorB = reverseColors ? 'text-coral-DEFAULT' : 'text-lime-DEFAULT';
      colorA = 'text-graphite-500';
    }

    if (highlightA && valA === valB) colorA = 'text-lime-DEFAULT';
    if (highlightB && valA === valB) colorB = 'text-lime-DEFAULT';

    return (
      <div className="flex justify-between items-center py-2 border-b border-black/5 last:border-0">
        <span className={`font-display font-bold text-lg w-10 text-left ${colorA}`}>{valA}</span>
        <span className="text-graphite-400 text-[11px] font-bold uppercase tracking-wider flex-1 text-center">{label}</span>
        <span className={`font-display font-bold text-lg w-10 text-right ${colorB}`}>{valB}</span>
      </div>
    );
  };

  // Generate 2-sentence analysis
  let analysisText = '';
  const winnerName = winningTeam.players.map(p => p.name).join(' & ');
  const loserName = matchWinner === 'A' ? matchToDisplay.teamB.players.map(p => p.name).join(' & ') : matchToDisplay.teamA.players.map(p => p.name).join(' & ');
  const winnerWinners = matchWinner === 'A' ? winnersA : winnersB;
  const loserUnforced = matchWinner === 'A' ? unforcedErrorsB : unforcedErrorsA;
  const winnerStreak = matchWinner === 'A' ? maxStreakA : maxStreakB;
  const matchIsClose = Math.abs(pointsWonA.length - pointsWonB.length) < 10;

  if (matchIsClose) {
    analysisText = `In a tightly contested match, ${winnerName} edged out the victory with ${winnerWinners} crucial winners. `;
  } else {
    analysisText = `${winnerName} delivered a commanding performance, highlighting their dominance with a massive ${winnerStreak}-point streak. `;
  }
  
  if (loserUnforced > 8) {
    analysisText += `${loserName} struggled to find consistency, ultimately giving away ${loserUnforced} unforced errors.`;
  } else {
    analysisText += `${loserName} put up a solid fight but couldn't overcome the relentless attack.`;
  }

  const gamesWonA = matchToDisplay.games.filter(g => g.winner === 'A').length;
  const gamesWonB = matchToDisplay.games.filter(g => g.winner === 'B').length;

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 relative bg-transparent">
      <header className="px-4 py-4 flex items-center relative z-20">
        <button 
          onClick={() => {
            if (isPublicViewer) {
              navigate('/');
            } else {
              const tId = matchToDisplay.tournamentId;
              useMatchStore.setState({ activeMatch: null });
              if (tId) navigate(`/admin/tournaments/${tId}`);
              else navigate('/admin');
            }
          }}
          className="p-2 text-graphite-400 hover:text-graphite-100"
        >
          <ChevronLeft size={24} />
        </button>
      </header>

      <div className="flex-1 px-4">
        <div className="flex flex-col items-center justify-center py-4 relative mb-6">
          <div className="w-16 h-16 bg-lime-DEFAULT rounded-full flex items-center justify-center mb-3 shadow-[0_4px_20px_rgba(5,150,105,0.4)]">
            <Trophy size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-graphite-100 text-center tracking-tight leading-tight px-4">
            {winnerName} Win
          </h1>
          <div className="flex gap-4 mt-5">
            {matchToDisplay.games.length > 0 ? (
              matchToDisplay.games.map((g, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-[16px] shadow-sm border border-white/80">
                  <span className={`font-display font-bold text-2xl ${g.winner === 'A' ? 'text-lime-DEFAULT' : 'text-graphite-400'}`}>{g.scoreA}</span>
                  <span className="text-graphite-400 font-bold text-sm">-</span>
                  <span className={`font-display font-bold text-2xl ${g.winner === 'B' ? 'text-cyan-DEFAULT' : 'text-graphite-400'}`}>{g.scoreB}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-[16px] shadow-sm border border-white/80">
                <span className={`font-display font-bold text-2xl ${matchToDisplay.currentScoreA >= matchToDisplay.currentScoreB ? 'text-lime-DEFAULT' : 'text-graphite-400'}`}>{matchToDisplay.currentScoreA}</span>
                <span className="text-graphite-400 font-bold text-sm">-</span>
                <span className={`font-display font-bold text-2xl ${matchToDisplay.currentScoreB >= matchToDisplay.currentScoreA ? 'text-cyan-DEFAULT' : 'text-graphite-400'}`}>{matchToDisplay.currentScoreB}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis Summary */}
        <div className="glass-card rounded-[24px] p-5 mb-6 relative overflow-hidden">
          <h3 className="text-[10px] font-bold text-lime-DEFAULT mb-2 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-lime-DEFAULT"></div>
            Match Analysis
          </h3>
          <p className="text-sm text-graphite-200 font-medium leading-relaxed">
            {analysisText}
          </p>
        </div>

        {/* Detailed Stats */}
        <div className="glass-card rounded-3xl p-5 mb-6">
          <h3 className="text-[10px] font-bold text-graphite-400 mb-4 uppercase tracking-widest text-center">Team Stats</h3>
          <div className="flex justify-between mb-6">
            <span className="text-xs font-bold text-graphite-100 truncate max-w-[40%] text-left">
              {matchToDisplay.teamA.players.map(p => p.name).join(' & ')}
            </span>
            <span className="text-xs font-bold text-graphite-100 truncate max-w-[40%] text-right">
              {matchToDisplay.teamB.players.map(p => p.name).join(' & ')}
            </span>
          </div>

          <div className="space-y-1">
            <StatRow label="Total Points Won" valA={pointsWonA.length} valB={pointsWonB.length} />
            <StatRow label="Winners" valA={winnersA} valB={winnersB} />
            <StatRow label="Unforced Errors" valA={unforcedErrorsA} valB={unforcedErrorsB} reverseColors />
            <StatRow label="Forced Errors" valA={forcedErrorsA} valB={forcedErrorsB} reverseColors />
            <StatRow label="Service Faults" valA={serviceFaultsA} valB={serviceFaultsB} reverseColors />
            <StatRow label="Pts Won on Serve" valA={pointsWonOnServeA} valB={pointsWonOnServeB} />
            <StatRow label="Longest Streak" valA={maxStreakA} valB={maxStreakB} />
          </div>
        </div>

        {/* Individual Stats (Doubles Only) */}
        {matchToDisplay.settings.type === 'doubles' && (
          <div className="glass-card rounded-3xl p-5 mb-6">
            <h3 className="text-[10px] font-bold text-graphite-400 mb-4 uppercase tracking-widest text-center">Individual Performance</h3>
            <div className="space-y-6">
              {[
                { side: 'A', team: matchToDisplay.teamA, color: 'lime' },
                { side: 'B', team: matchToDisplay.teamB, color: 'cyan' }
              ].map(({ side, team, color }) => (
                <div key={side}>
                  <h4 className={`text-xs font-bold mb-3 uppercase tracking-widest text-${color}-DEFAULT`}>Side {side}</h4>
                  <div className="space-y-3">
                    {team.players.map(p => {
                      const pWinners = history.filter(h => h.details?.pointWinnerId === p.id && h.details?.outcomeType === 'winner').length;
                      const pUnforced = history.filter(h => h.details?.errorMakerId === p.id && (h.details?.outcomeType === 'unforced_error' || h.details?.outcomeType === 'service_fault')).length;
                      const pForced = history.filter(h => h.details?.errorMakerId === p.id && h.details?.outcomeType === 'forced_error').length;
                      
                      return (
                        <div key={p.id} className="bg-graphite-900/50 p-3 rounded-xl ">
                          <div className="font-bold text-graphite-100 text-sm mb-2">{p.name}</div>
                          <div className="flex justify-between text-xs font-medium">
                            <div className="text-center">
                              <div className="text-lime-DEFAULT font-bold text-lg">{pWinners}</div>
                              <div className="text-graphite-500 text-[10px] uppercase">Winners</div>
                            </div>
                            <div className="text-center">
                              <div className="text-coral-DEFAULT font-bold text-lg">{pUnforced}</div>
                              <div className="text-graphite-500 text-[10px] uppercase">Unforced</div>
                            </div>
                            <div className="text-center">
                              <div className="text-amber-DEFAULT font-bold text-lg">{pForced}</div>
                              <div className="text-graphite-500 text-[10px] uppercase">Forced Err</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {!isPublicViewer && (
        <div className="mt-4 pb-4 px-4">
          <button
            onClick={() => {
              const tId = matchToDisplay.tournamentId;
              useMatchStore.setState({ activeMatch: null });
              if (tId) navigate(`/admin/tournaments/${tId}`);
              else navigate('/admin');
            }}
            className="w-full bg-graphite-800 text-graphite-100 font-bold py-4 rounded-2xl  hover:bg-graphite-700 transition-colors active:scale-95"
          >
            {matchToDisplay.tournamentId ? 'Return to Tournament' : 'Return to Dashboard'}
          </button>
        </div>
      )}
    </div>
  );
}

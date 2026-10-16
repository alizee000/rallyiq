import React, { useState } from 'react';
import { MatchState } from '../../domain/types';
import { getTeamDisplayName, getMatchWinnerSide } from '../../domain/tournamentEngine';
import { Trophy, Play, Award, Swords } from 'lucide-react';

interface KnockoutBracketViewProps {
  matches: MatchState[];
  isAdmin?: boolean;
  onScoreMatch?: (matchId: string) => void;
  onGenerateBracket?: () => void;
}

export default function KnockoutBracketView({
  matches,
  isAdmin,
  onScoreMatch,
  onGenerateBracket,
}: KnockoutBracketViewProps) {
  const knockoutMatches = matches.filter(
    m => !!m.knockoutRound || ['quarter final', 'semi final', 'final'].includes(m.stage?.toLowerCase() || '')
  );

  const categories = Array.from(
    new Set(knockoutMatches.map(m => m.category?.trim()).filter(Boolean))
  ) as string[];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredKnockouts = knockoutMatches.filter(m => {
    if (selectedCategory === 'all') return true;
    return m.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
  });

  const quarterFinals = filteredKnockouts.filter(
    m => m.knockoutRound === 'quarter' || m.stage?.toLowerCase() === 'quarter final'
  );
  const semiFinals = filteredKnockouts.filter(
    m => m.knockoutRound === 'semi' || m.stage?.toLowerCase() === 'semi final'
  );
  const finals = filteredKnockouts.filter(
    m => m.knockoutRound === 'final' || m.stage?.toLowerCase() === 'final'
  );

  if (knockoutMatches.length === 0) {
    return (
      <div className="glass-card p-8 rounded-3xl text-center flex flex-col items-center">
        <Swords className="text-graphite-600 mb-3" size={36} />
        <h3 className="text-lg font-bold text-graphite-100 mb-1">No Knockout Matches Scheduled</h3>
        <p className="text-sm text-graphite-400 mb-6 max-w-xs">
          Once the pool stage finishes, advance the top 2 teams from each pool to populate the knockout bracket.
        </p>
        {isAdmin && onGenerateBracket && (
          <button
            onClick={onGenerateBracket}
            className="neo-btn !bg-cyan-DEFAULT text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md"
          >
            Advance Top 2 & Generate Bracket
          </button>
        )}
      </div>
    );
  }

  const renderMatchCard = (m: MatchState, label: string) => {
    const winnerSide = getMatchWinnerSide(m);
    const isLive = m.status === 'playing';
    const isCompleted = m.status === 'completed';
    const nameA = getTeamDisplayName(m.teamA);
    const nameB = getTeamDisplayName(m.teamB);
    const isPlaceholderA = nameA.toLowerCase().startsWith('winner of');
    const isPlaceholderB = nameB.toLowerCase().startsWith('winner of');
    const canStart = !isPlaceholderA && !isPlaceholderB;

    const scoreString = m.games.length > 0
      ? m.games.map(g => `${g.scoreA}-${g.scoreB}`).join(', ')
      : isLive
      ? `Game ${m.currentGame} • ${m.currentScoreA}-${m.currentScoreB}`
      : 'Scheduled';

    return (
      <div
        key={m.id}
        className={`glass-card p-4 rounded-3xl transition-all shadow-md relative overflow-hidden border ${
          isLive
            ? 'border-red-500/50 bg-red-500/5'
            : isCompleted
            ? 'border-lime-DEFAULT/30'
            : 'border-white/50'
        }`}
      >
        {/* Top Tag & Status */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-graphite-400">
              {label}
            </span>
            {m.category && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-DEFAULT/15 text-cyan-DEFAULT">
                {m.category}
              </span>
            )}
          </div>
          {isLive ? (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[10px] font-bold rounded-full animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              LIVE
            </span>
          ) : isCompleted ? (
            <span className="px-2 py-0.5 bg-lime-DEFAULT/20 text-lime-DEFAULT text-[10px] font-bold rounded-full">
              Final
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-black/5 text-graphite-400 text-[10px] font-bold rounded-full">
              Upcoming
            </span>
          )}
        </div>

        {/* Teams & Scores */}
        <div className="space-y-2">
          {/* Team A */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 truncate pr-2">
              <span
                className={`text-sm truncate font-bold ${
                  winnerSide === 'A'
                    ? 'text-graphite-100 font-black'
                    : isPlaceholderA
                    ? 'text-graphite-400 italic'
                    : 'text-graphite-300'
                }`}
              >
                {nameA}
              </span>
              {winnerSide === 'A' && <Trophy size={14} className="text-lime-DEFAULT shrink-0" />}
            </div>
            {isCompleted && (
              <span
                className={`text-xs font-bold ${
                  winnerSide === 'A' ? 'text-lime-DEFAULT font-black' : 'text-graphite-400'
                }`}
              >
                {m.games.filter(g => g.winner === 'A').length}
              </span>
            )}
          </div>

          {/* VS Divider */}
          <div className="relative py-1 flex items-center justify-center">
            <div className="w-full h-px bg-black/5"></div>
            <span className="absolute bg-white/70 px-2 rounded-full text-[9px] font-bold text-graphite-400 uppercase tracking-widest">
              VS
            </span>
          </div>

          {/* Team B */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 truncate pr-2">
              <span
                className={`text-sm truncate font-bold ${
                  winnerSide === 'B'
                    ? 'text-graphite-100 font-black'
                    : isPlaceholderB
                    ? 'text-graphite-400 italic'
                    : 'text-graphite-300'
                }`}
              >
                {nameB}
              </span>
              {winnerSide === 'B' && <Trophy size={14} className="text-lime-DEFAULT shrink-0" />}
            </div>
            {isCompleted && (
              <span
                className={`text-xs font-bold ${
                  winnerSide === 'B' ? 'text-lime-DEFAULT font-black' : 'text-graphite-400'
                }`}
              >
                {m.games.filter(g => g.winner === 'B').length}
              </span>
            )}
          </div>
        </div>

        {/* Score & Action Footer */}
        <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between">
          <span className="text-[11px] font-bold text-graphite-400 tracking-wider">
            {scoreString}
          </span>

          {isAdmin && onScoreMatch && (
            <div>
              {isLive ? (
                <button
                  onClick={() => onScoreMatch(m.id)}
                  className="neo-btn !bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Play size={12} fill="currentColor" />
                  Score
                </button>
              ) : isCompleted ? (
                <button
                  onClick={() => onScoreMatch(m.id)}
                  className="text-xs font-bold text-lime-DEFAULT hover:underline"
                >
                  Summary
                </button>
              ) : canStart ? (
                <button
                  onClick={() => onScoreMatch(m.id)}
                  className="neo-btn !bg-cyan-DEFAULT text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Play size={12} fill="currentColor" />
                  Start
                </button>
              ) : (
                <span className="text-[10px] text-graphite-400 font-medium italic">
                  Awaiting winner
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Category Filter Chips (if more than 1 category exists) */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex items-center gap-1.5 p-1 bg-black/5 rounded-2xl">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-white text-graphite-100 shadow-sm'
                  : 'text-graphite-300 hover:text-graphite-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedCategory === 'all' ? 'bg-graphite-100' : 'bg-transparent'}`} />
              <span>All Categories</span>
            </button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === c
                    ? 'bg-white text-graphite-100 shadow-sm'
                    : 'text-graphite-300 hover:text-graphite-100'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedCategory === c ? 'bg-graphite-100' : 'bg-transparent'}`} />
                <span>{c}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Finals Section */}
      {finals.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-lime-DEFAULT" size={20} />
            <h2 className="text-sm font-bold text-graphite-100 uppercase tracking-widest">
              Grand Final 🏆
            </h2>
          </div>
          <div className="space-y-4">
            {finals.map(m => renderMatchCard(m, 'Final Championship'))}
          </div>
        </section>
      )}

      {/* Semi-Finals Section */}
      {semiFinals.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-cyan-DEFAULT" size={18} />
            <h2 className="text-sm font-bold text-graphite-400 uppercase tracking-widest">
              Semi-Finals
            </h2>
          </div>
          <div className="space-y-4">
            {semiFinals.map((m, idx) =>
              renderMatchCard(m, `Semi-Final ${m.knockoutMatchNumber || idx + 1}`)
            )}
          </div>
        </section>
      )}

      {/* Quarter-Finals Section */}
      {quarterFinals.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Swords className="text-graphite-400" size={18} />
            <h2 className="text-sm font-bold text-graphite-400 uppercase tracking-widest">
              Quarter-Finals
            </h2>
          </div>
          <div className="space-y-4">
            {quarterFinals.map((m, idx) =>
              renderMatchCard(m, `Quarter-Final ${m.knockoutMatchNumber || idx + 1}`)
            )}
          </div>
        </section>
      )}
    </div>
  );
}

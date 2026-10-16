import React, { useState } from 'react';
import { MatchState } from '../../domain/types';
import { calculatePoolStandings } from '../../domain/tournamentEngine';
import { Trophy, ChevronRight, Award, Edit3 } from 'lucide-react';

interface PoolStandingsViewProps {
  matches: MatchState[];
  poolNames?: string[];
  isAdmin?: boolean;
  onAdvanceToKnockouts?: () => void;
  onCreatePool?: () => void;
  onEditPool?: (poolName: string, category?: string) => void;
}

export default function PoolStandingsView({
  matches,
  poolNames = [],
  isAdmin,
  onAdvanceToKnockouts,
  onCreatePool,
  onEditPool,
}: PoolStandingsViewProps) {
  // Extract all distinct (poolName, category) pairs from matches
  const uniquePoolMap = new Map<string, { key: string; name: string; category: string }>();

  matches.forEach(m => {
    if (!m.pool) return;
    const name = m.pool.trim();
    const cat = m.category?.trim() || 'General';
    const key = `${cat.toLowerCase()}:::${name.toLowerCase()}`;
    if (!uniquePoolMap.has(key)) {
      uniquePoolMap.set(key, { key, name, category: cat });
    }
  });

  // Also include any poolNames passed from props if not yet in matches
  poolNames.forEach(name => {
    const trimmed = name.trim();
    const exists = Array.from(uniquePoolMap.values()).some(
      p => p.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      const key = `general:::${trimmed.toLowerCase()}`;
      uniquePoolMap.set(key, { key, name: trimmed, category: 'General' });
    }
  });

  const allPools = Array.from(uniquePoolMap.values()).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  const categories = Array.from(
    new Set(allPools.map(p => p.category))
  ).filter(Boolean);

  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const activeCategory = (selectedCategory && categories.includes(selectedCategory))
    ? selectedCategory
    : (categories[0] || '');

  const filteredPools = allPools.filter(p => {
    if (!activeCategory || categories.length <= 1) return true;
    return p.category.toLowerCase() === activeCategory.toLowerCase();
  });

  if (allPools.length === 0) {
    return (
      <div className="glass-card p-8 rounded-3xl text-center flex flex-col items-center">
        <Trophy className="text-graphite-600 mb-3" size={36} />
        <h3 className="text-lg font-bold text-graphite-100 mb-1">No Pools Created Yet</h3>
        <p className="text-sm text-graphite-400 mb-6 max-w-xs">
          Organize teams into round-robin pools (e.g. Pool A for Women's Doubles) and automatically calculate live standings.
        </p>
        {isAdmin && onCreatePool && (
          <button
            onClick={onCreatePool}
            className="neo-btn !bg-lime-DEFAULT text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md"
          >
            Create First Pool
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter for Different Categories */}
      {categories.length > 1 && (
        <div className="w-full bg-black/5 rounded-2xl p-1 shadow-inner flex gap-1">
          {categories.map(cat => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-w-0 ${
                  isSelected
                    ? 'bg-white text-graphite-100 shadow-sm'
                    : 'text-graphite-300 hover:text-graphite-100'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-graphite-100' : 'bg-transparent'}`} />
                <span className="truncate">{cat}</span>
              </button>
            );
          })}
        </div>
      )}

      {isAdmin && onAdvanceToKnockouts && (
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="text-graphite-100" size={18} />
              <h3 className="text-sm font-bold text-graphite-100 uppercase tracking-wider">
                Pool Stage Progression{activeCategory && categories.length > 1 ? ` • ${activeCategory}` : ''}
              </h3>
            </div>
            <p className="text-xs text-graphite-300 font-medium">
              Ready to crown a champion? Advance the top 2 teams from each {activeCategory && categories.length > 1 ? activeCategory : ''} pool directly into the knockout bracket.
            </p>
          </div>
          <button
            onClick={onAdvanceToKnockouts}
            className="neo-btn !bg-black hover:!bg-graphite-100 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shrink-0 flex items-center gap-1.5"
          >
            Advance to Knockouts
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {filteredPools.length === 0 ? (
        <div className="glass-card p-8 rounded-3xl text-center flex flex-col items-center">
          <Trophy className="text-graphite-600 mb-3" size={32} />
          <h3 className="text-base font-bold text-graphite-100 mb-1">No Pools in {activeCategory}</h3>
          <p className="text-xs text-graphite-300 mb-4 max-w-xs font-medium">
            No pools found for this category.
          </p>
        </div>
      ) : (
        filteredPools.map((pool) => {
        const poolMatches = matches.filter(m => {
          const matchesPool = m.pool?.trim().toLowerCase() === pool.name.trim().toLowerCase();
          const matchesCat = pool.category === 'General'
            ? (!m.category || m.category.trim().toLowerCase() === 'general')
            : m.category?.trim().toLowerCase() === pool.category.toLowerCase();
          return matchesPool && matchesCat;
        });
        const poolCategory = pool.category !== 'General' ? pool.category : poolMatches.find(m => !!m.category)?.category;
        const standings = calculatePoolStandings(
          matches,
          pool.name,
          pool.category === 'General' ? undefined : pool.category
        );
        const completedCount = poolMatches.filter(m => m.status === 'completed').length;

        return (
          <div key={pool.key} className="glass-card rounded-3xl p-4 sm:p-5 overflow-hidden shadow-lg border border-white/50">
            {/* Pool Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-lg font-display font-black text-graphite-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-graphite-100"></span>
                    {pool.name}
                  </h3>
                  {poolCategory && (
                    <span className="px-2.5 py-0.5 rounded-full bg-black/5 text-graphite-200 text-[10px] font-bold uppercase tracking-wider">
                      {poolCategory}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-graphite-300 font-bold tracking-wide uppercase">
                  {completedCount} of {poolMatches.length} Matches Completed
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/5 text-graphite-200">
                  Top 2 Advance
                </span>
                {isAdmin && onEditPool && (
                  <button
                    onClick={() => onEditPool(pool.name, pool.category)}
                    className="px-2.5 py-1 bg-black/5 hover:bg-black/10 text-graphite-200 hover:text-graphite-100 rounded-full text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                    title="Edit Pool Teams"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Standings Table */}
            {standings.length === 0 ? (
              <p className="text-xs text-graphite-300 italic py-4 text-center">
                No matches or teams found in this pool yet.
              </p>
            ) : (
              <div className="w-full">
                <table className="w-full table-fixed text-left">
                  <thead>
                    <tr className="border-b border-black/10 text-[11px] font-black text-graphite-200 uppercase tracking-wider">
                      <th className="py-2.5 px-0.5 w-7 text-center">#</th>
                      <th className="py-2.5 px-1.5 text-left">Team</th>
                      <th className="py-2.5 px-0.5 w-7 text-center">P</th>
                      <th className="py-2.5 px-0.5 w-7 text-center">W</th>
                      <th className="py-2.5 px-0.5 w-7 text-center">L</th>
                      <th className="py-2.5 px-0.5 w-8 text-center">GD</th>
                      <th className="py-2.5 px-0.5 w-8 text-center">PD</th>
                      <th className="py-2.5 px-1 w-8 text-right font-black text-graphite-100 pr-1">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {standings.map((s) => {
                      const isTop1 = s.rank === 1;
                      const isTop2 = s.rank === 2;

                      // Extract individual player names for doubles so they appear on separate lines
                      const playerNames = (s.team.players && s.team.players.length > 1)
                        ? s.team.players.map(p => p.name)
                        : s.teamName.includes(' & ')
                        ? s.teamName.split(' & ')
                        : s.teamName.includes(' / ')
                        ? s.teamName.split(' / ')
                        : [s.teamName];

                      return (
                        <tr
                          key={s.team.id || s.teamName}
                          className={`transition-colors border-b border-black/5 last:border-b-0 ${
                            isTop1
                              ? 'bg-black/[0.03]'
                              : isTop2
                              ? 'bg-black/[0.02]'
                              : 'hover:bg-black/[0.015]'
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-2.5 px-0.5 text-center align-middle">
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold tabular-nums ${
                                isTop1
                                  ? 'bg-black text-white shadow-xs'
                                  : isTop2
                                  ? 'bg-graphite-200 text-white shadow-xs'
                                  : 'text-graphite-200 bg-black/5 font-bold'
                              }`}
                            >
                              {s.rank}
                            </span>
                          </td>

                          {/* Team / Player Names */}
                          <td className="py-2.5 px-1.5 text-left align-middle overflow-hidden">
                            <div className="flex flex-col justify-center min-w-0">
                              {playerNames.map((name, i) => (
                                <span
                                  key={i}
                                  className="text-xs font-bold leading-snug text-graphite-100 break-words"
                                  title={name}
                                >
                                  {name.trim()}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Played */}
                          <td className="py-2.5 px-0.5 text-center align-middle text-xs font-semibold tabular-nums text-graphite-200">
                            {s.played}
                          </td>

                          {/* Won */}
                          <td className="py-2.5 px-0.5 text-center align-middle text-xs font-black tabular-nums text-graphite-100">
                            {s.won}
                          </td>

                          {/* Lost */}
                          <td className="py-2.5 px-0.5 text-center align-middle text-xs font-medium tabular-nums text-graphite-300">
                            {s.lost}
                          </td>

                          {/* Game Difference */}
                          <td className="py-2.5 px-0.5 text-center align-middle text-xs font-black tabular-nums text-graphite-100">
                            {s.gameDiff > 0 ? `+${s.gameDiff}` : s.gameDiff}
                          </td>

                          {/* Point Difference */}
                          <td className="py-2.5 px-0.5 text-center align-middle text-xs font-semibold tabular-nums text-graphite-200">
                            {s.pointDiff > 0 ? `+${s.pointDiff}` : s.pointDiff}
                          </td>

                          {/* Points */}
                          <td className="py-2.5 px-1 text-right align-middle text-sm font-black tabular-nums text-graphite-50 pr-1">
                            {s.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      }))}
    </div>
  );
}

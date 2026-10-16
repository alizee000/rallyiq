import React, { useState } from 'react';
import { MatchState, Team, MatchType } from '../../domain/types';
import { 
  calculatePoolStandings, 
  generateKnockoutBracket, 
  PoolQualifier, 
  getTeamDisplayName 
} from '../../domain/tournamentEngine';
import { X, Award, Swords, ChevronRight } from 'lucide-react';

interface AdvanceKnockoutsModalProps {
  isOpen: boolean;
  tournamentId: string;
  matches: MatchState[];
  poolNames: string[];
  onClose: () => void;
  onKnockoutsGenerated: (matches: MatchState[]) => void;
}

export default function AdvanceKnockoutsModal({
  isOpen,
  tournamentId,
  matches,
  poolNames,
  onClose,
  onKnockoutsGenerated,
}: AdvanceKnockoutsModalProps) {
  if (!isOpen) return null;

  const categories = Array.from(
    new Set(matches.map(m => m.category?.trim()).filter(Boolean))
  ) as string[];

  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || '');

  // Filter pools by selected category if categories exist
  const relevantPoolNames = poolNames.filter(name => {
    if (!selectedCategory) return true;
    const poolMatches = matches.filter(
      m => m.pool?.trim().toLowerCase() === name.trim().toLowerCase()
    );
    return poolMatches.some(m => m.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase());
  });

  const effectivePoolNames = relevantPoolNames.length > 0 ? relevantPoolNames : poolNames;

  // Determine match type from selectedCategory or existing matches
  const matchType: MatchType = (selectedCategory.toLowerCase().includes('singles'))
    ? 'singles'
    : 'doubles';

  // For each pool, calculate standings and grab all teams
  const poolData = effectivePoolNames.map(name => {
    const standings = calculatePoolStandings(
      matches, 
      name, 
      selectedCategory || undefined
    );
    const teams = standings.map(s => s.team);
    const defaultWinner = teams[0] || null;
    const defaultRunnerUp = teams[1] || null;
    return {
      poolName: name,
      standings,
      teams,
      defaultWinner,
      defaultRunnerUp,
    };
  });

  // Qualifiers state: map poolName -> { winnerId, runnerUpId }
  const [selections, setSelections] = useState<Record<string, { winnerId: string; runnerUpId: string }>>(() => {
    const init: Record<string, { winnerId: string; runnerUpId: string }> = {};
    poolData.forEach(p => {
      init[p.poolName] = {
        winnerId: p.defaultWinner?.id || '',
        runnerUpId: p.defaultRunnerUp?.id || '',
      };
    });
    return init;
  });

  const handleSelectWinner = (poolName: string, teamId: string) => {
    setSelections(prev => ({
      ...prev,
      [poolName]: { ...prev[poolName], winnerId: teamId },
    }));
  };

  const handleSelectRunnerUp = (poolName: string, teamId: string) => {
    setSelections(prev => ({
      ...prev,
      [poolName]: { ...prev[poolName], runnerUpId: teamId },
    }));
  };

  const handleGenerate = () => {
    const qualifiers: PoolQualifier[] = [];

    for (const p of poolData) {
      const sel = selections[p.poolName];
      const winner = p.teams.find(t => t.id === sel?.winnerId) || p.defaultWinner;
      const runnerUp = p.teams.find(t => t.id === sel?.runnerUpId) || p.defaultRunnerUp;

      if (!winner || !runnerUp) {
        alert(`Please ensure both 1st and 2nd place teams are selected for ${p.poolName}.`);
        return;
      }

      qualifiers.push({
        poolName: p.poolName,
        category: selectedCategory || undefined,
        winner,
        runnerUp,
      });
    }

    const knockoutMatches = generateKnockoutBracket(
      tournamentId, 
      qualifiers, 
      matchType, 
      selectedCategory || undefined
    );
    onKnockoutsGenerated(knockoutMatches);
    onClose();
  };

  const formatStageTitle = () => {
    if (poolNames.length === 1) return 'Final Match (Top 2)';
    if (poolNames.length === 2) return 'Semi-Finals & Grand Final (4 Teams)';
    if (poolNames.length === 4) return 'Quarter-Finals, Semi-Finals & Grand Final (8 Teams)';
    return `${poolNames.length * 2} Teams Knockout Stage`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-graphite-900/50 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-lg glass-card rounded-3xl animate-in fade-in zoom-in-95 duration-200 shadow-2xl border border-white/50 max-h-[85dvh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="p-5 px-6 border-b border-black/5 relative shrink-0 bg-white/40 backdrop-blur-md">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-graphite-400 hover:text-graphite-100 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Award className="text-lime-DEFAULT" size={22} />
            <h2 className="text-xl font-display font-bold text-graphite-100">
              Advance Top 2 to Knockouts
            </h2>
          </div>
          <p className="text-xs text-graphite-400">
            Review the qualified teams from each pool. You can adjust seeding before generating the bracket.
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar overscroll-contain">
          {categories.length > 1 && (
            <div className="p-3 rounded-2xl bg-black/5">
            <label className="text-[10px] font-bold text-graphite-400 uppercase tracking-wider block mb-1.5">
              Select Category for Knockouts
            </label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="neo-input w-full rounded-xl p-2.5 text-xs text-graphite-100 font-bold bg-white"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-6">
          {/* Pools Qualifier Pickers */}
          {poolData.map(p => {
            const currentSel = selections[p.poolName];

            return (
              <div
                key={p.poolName}
                className="p-4 rounded-2xl bg-black/5 border border-black/5 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-graphite-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-lime-DEFAULT"></span>
                    {p.poolName}
                  </h3>
                  <span className="text-[10px] font-bold text-graphite-400 uppercase tracking-wider">
                    {p.teams.length} Teams
                  </span>
                </div>

                {p.teams.length < 2 ? (
                  <p className="text-xs text-coral-DEFAULT">
                    At least 2 teams are needed in {p.poolName} to select top 2.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1st Place (Winner) */}
                    <div>
                      <label className="text-[10px] font-bold text-lime-DEFAULT uppercase tracking-wider block mb-1">
                        🥇 1st Place (Winner)
                      </label>
                      <select
                        value={currentSel?.winnerId || ''}
                        onChange={e => handleSelectWinner(p.poolName, e.target.value)}
                        className="neo-input w-full rounded-xl p-2.5 text-xs text-graphite-100 font-bold bg-white"
                      >
                        {p.teams.map((t, idx) => (
                          <option key={t.id} value={t.id}>
                            #{idx + 1} {getTeamDisplayName(t)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2nd Place (Runner-up) */}
                    <div>
                      <label className="text-[10px] font-bold text-cyan-DEFAULT uppercase tracking-wider block mb-1">
                        🥈 2nd Place (Runner-Up)
                      </label>
                      <select
                        value={currentSel?.runnerUpId || ''}
                        onChange={e => handleSelectRunnerUp(p.poolName, e.target.value)}
                        className="neo-input w-full rounded-xl p-2.5 text-xs text-graphite-100 font-bold bg-white"
                      >
                        {p.teams.map((t, idx) => (
                          <option key={t.id} value={t.id}>
                            #{idx + 1} {getTeamDisplayName(t)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Bracket Format Summary */}
          <div className="p-4 rounded-2xl bg-cyan-DEFAULT/10 border border-cyan-DEFAULT/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Swords className="text-cyan-DEFAULT" size={16} />
              <span className="text-xs font-bold text-graphite-100 uppercase tracking-wider">
                Bracket Structure
              </span>
            </div>
            <p className="text-xs font-medium text-graphite-400">
              Generating: <span className="text-graphite-100 font-bold">{formatStageTitle()}</span>
            </p>
            {poolNames.length === 2 && (
              <ul className="text-[11px] text-graphite-400 mt-2 space-y-1 list-disc list-inside">
                <li>Semi-Final 1: 1st {poolNames[0]} vs 2nd {poolNames[1]}</li>
                <li>Semi-Final 2: 1st {poolNames[1]} vs 2nd {poolNames[0]}</li>
                <li>Final: Winner SF 1 vs Winner SF 2 (Auto-advanced upon completion)</li>
              </ul>
            )}
          </div>

          </div>
        </div>

        {/* Fixed Footer Buttons */}
        <div className="p-4 px-6 border-t border-black/5 bg-white/70 backdrop-blur-md shrink-0 flex gap-3 shadow-sm">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-graphite-400 bg-black/5 hover:bg-black/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white bg-lime-DEFAULT hover:bg-lime-DEFAULT/90 transition-colors shadow-md flex items-center justify-center gap-1.5"
          >
            Generate Knockout Matches
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

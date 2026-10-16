import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MatchType, Team, MatchState, TOURNAMENT_CATEGORIES, TournamentPlayer } from '../../domain/types';
import { generateRoundRobinMatches } from '../../domain/tournamentEngine';
import { X, Plus, Trash2, Users, User, Zap, Tag, Sparkles } from 'lucide-react';

interface PoolCreationModalProps {
  isOpen: boolean;
  tournamentId: string;
  existingPoolNames: string[];
  registeredPlayers?: TournamentPlayer[];
  onClose: () => void;
  onPoolCreated: (matches: MatchState[]) => void;
}

export default function PoolCreationModal({
  isOpen,
  tournamentId,
  existingPoolNames,
  registeredPlayers = [],
  onClose,
  onPoolCreated,
}: PoolCreationModalProps) {
  if (!isOpen) return null;

  // Compute default next pool name: Pool A, Pool B, etc.
  const poolLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const nextLetter = poolLetters.find(l => !existingPoolNames.some(p => p.toLowerCase().includes(`pool ${l.toLowerCase()}`))) || 'A';
  const defaultPoolName = `Pool ${nextLetter}`;

  const [poolName, setPoolName] = useState(defaultPoolName);
  const [category, setCategory] = useState<string>("Women's Doubles");
  const [customCategory, setCustomCategory] = useState('');
  const [matchType, setMatchType] = useState<MatchType>('doubles');
  const [autoGenerateFixtures, setAutoGenerateFixtures] = useState(true);

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (val === "Men's Singles" || val === "Women's Singles") {
      setMatchType('singles');
    } else if (val === "Women's Doubles" || val === "Men's Doubles" || val === "Mixed Doubles") {
      setMatchType('doubles');
    }
  };

  // New team input state
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);

  const handleAddTeam = () => {
    const p1 = player1.trim() || `Player ${teams.length * (matchType === 'doubles' ? 2 : 1) + 1}`;
    const p2 = player2.trim() || `Player ${teams.length * (matchType === 'doubles' ? 2 : 1) + 2}`;

    const newTeam: Team = {
      id: uuidv4(),
      players: matchType === 'singles'
        ? [{ id: uuidv4(), name: p1 }]
        : [{ id: uuidv4(), name: p1 }, { id: uuidv4(), name: p2 }],
    };

    setTeams(prev => [...prev, newTeam]);
    setPlayer1('');
    setPlayer2('');
  };

  const handleRemoveTeam = (index: number) => {
    setTeams(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    if (teams.length < 2) return;

    const effectiveCategory = category === '__custom__' ? customCategory.trim() : category.trim();

    if (autoGenerateFixtures) {
      const generatedMatches = generateRoundRobinMatches(
        tournamentId,
        poolName.trim(),
        teams,
        matchType,
        effectiveCategory || undefined
      );
      onPoolCreated(generatedMatches);
    } else {
      // Just create one scheduled match between first 2 teams to seed the pool
      const singleMatch = generateRoundRobinMatches(
        tournamentId,
        poolName.trim(),
        [teams[0], teams[1]],
        matchType,
        effectiveCategory || undefined
      );
      onPoolCreated(singleMatch);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-graphite-900/50 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Fixed Header */}
        <div className="p-5 px-6 border-b border-black/5 relative shrink-0 bg-white/40 backdrop-blur-md">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-graphite-400 hover:text-graphite-100 transition-colors"
          >
            <X size={20} />
          </button>

          <h2 className="text-xl font-display font-bold text-graphite-100 mb-0.5">Create New Pool</h2>
          <p className="text-xs text-graphite-400">
            Set up a round-robin group and auto-schedule all match fixtures in one tap.
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar overscroll-contain">
          {/* Category Selector */}
          <div>
            <label className="text-[11px] font-bold text-graphite-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
              <Tag size={13} className="text-lime-DEFAULT" />
              Event Category
            </label>
            <select
              value={category}
              onChange={e => handleCategoryChange(e.target.value)}
              className="neo-input w-full rounded-xl p-3.5 text-xs text-graphite-100 font-bold bg-white"
            >
              {TOURNAMENT_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__custom__">+ Custom Category...</option>
            </select>

            {category === '__custom__' && (
              <input
                type="text"
                placeholder="e.g. Under-19 Girls Singles"
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="neo-input w-full rounded-xl p-3 mt-2 text-xs text-graphite-100 font-bold"
                autoFocus
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pool Name Input */}
            <div>
              <label className="text-[11px] font-bold text-graphite-400 uppercase tracking-widest block mb-2">
                Pool Name
              </label>
              <input
                type="text"
                value={poolName}
                onChange={e => setPoolName(e.target.value)}
                className="neo-input w-full rounded-xl p-3 text-xs text-graphite-100 font-bold"
                placeholder="e.g. Pool A"
              />
            </div>

            {/* Match Type Segmented Control */}
            <div>
              <label className="text-[11px] font-bold text-graphite-400 uppercase tracking-widest block mb-2">
                Format
              </label>
              <div className="flex bg-black/5 p-1 rounded-xl shadow-inner">
                <button
                  type="button"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    matchType === 'singles'
                      ? 'bg-white text-lime-DEFAULT shadow-sm'
                      : 'text-graphite-400'
                  }`}
                  onClick={() => setMatchType('singles')}
                >
                  <User size={14} /> Singles
                </button>
                <button
                  type="button"
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    matchType === 'doubles'
                      ? 'bg-white text-cyan-DEFAULT shadow-sm'
                      : 'text-graphite-400'
                  }`}
                  onClick={() => setMatchType('doubles')}
                >
                  <Users size={14} /> Doubles
                </button>
              </div>
            </div>
          </div>

          {/* Add Teams Section */}
          <div className="border-t border-b border-black/5 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-graphite-400 uppercase tracking-widest">
                Add Teams ({teams.length} added)
              </label>
              <span className="text-[10px] text-graphite-400">Min. 2 teams required</span>
            </div>

            {registeredPlayers.length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-lime-DEFAULT font-bold bg-lime-DEFAULT/10 px-2.5 py-1 rounded-lg">
                <Sparkles size={12} />
                <span>Autocomplete enabled from {registeredPlayers.length} tournament players</span>
              </div>
            )}

            <div className="space-y-2">
              <input
                type="text"
                list="pool-registered-players"
                placeholder={matchType === 'doubles' ? 'Player 1 Name (type or select)' : 'Player Name (type or select)'}
                value={player1}
                onChange={e => setPlayer1(e.target.value)}
                className="neo-input w-full rounded-xl p-3 text-xs text-graphite-100"
              />
              {matchType === 'doubles' && (
                <input
                  type="text"
                  list="pool-registered-players"
                  placeholder="Player 2 Name (type or select)"
                  value={player2}
                  onChange={e => setPlayer2(e.target.value)}
                  className="neo-input w-full rounded-xl p-3 text-xs text-graphite-100"
                />
              )}

              {/* Datalist for autocomplete */}
              {registeredPlayers.length > 0 && (
                <datalist id="pool-registered-players">
                  {registeredPlayers.map(p => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              )}

              <button
                type="button"
                onClick={handleAddTeam}
                className="neo-btn w-full !bg-lime-DEFAULT/15 text-lime-DEFAULT py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 hover:!bg-lime-DEFAULT hover:text-white transition-colors"
              >
                <Plus size={14} /> Add Team to Pool
              </button>
            </div>

            {/* List of Added Teams */}
            {teams.length > 0 && (
              <div className="space-y-1.5 pt-2 max-h-36 overflow-y-auto pr-1">
                {teams.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 bg-black/5 rounded-xl text-xs font-bold text-graphite-100"
                  >
                    <span className="truncate pr-2">
                      {idx + 1}. {t.players.map(p => p.name).join(' & ')}
                    </span>
                    <button
                      onClick={() => handleRemoveTeam(idx)}
                      className="text-graphite-400 hover:text-coral-DEFAULT p-1 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto-generate Toggle */}
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={autoGenerateFixtures}
              onChange={e => setAutoGenerateFixtures(e.target.checked)}
              className="w-4 h-4 rounded text-lime-DEFAULT focus:ring-lime-DEFAULT"
            />
            <div className="text-xs">
              <span className="font-bold text-graphite-100 flex items-center gap-1">
                <Zap size={13} className="text-lime-DEFAULT" />
                Auto-generate round-robin matches
              </span>
              <p className="text-[10px] text-graphite-400">
                Creates matches so all {teams.length} teams play each other
              </p>
            </div>
          </label>
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
            disabled={teams.length < 2 || !poolName.trim()}
            onClick={handleCreate}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white bg-lime-DEFAULT hover:bg-lime-DEFAULT/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            Create Pool {teams.length > 0 && `(${teams.length} Teams)`}
          </button>
        </div>
      </div>
    </div>
  );
}

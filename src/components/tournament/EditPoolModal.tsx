import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MatchState, Team, TournamentPlayer, MatchType } from '../../domain/types';
import {
  getPoolTeams,
  getTeamKey,
  getTeamDisplayName,
  generateFixturesForNewTeam,
  getMatchesInvolvingTeam,
} from '../../domain/tournamentEngine';
import { X, Plus, Trash2, Users, User, AlertTriangle, Sparkles, Tag, CheckCircle2 } from 'lucide-react';
import ConfirmModal from '../layout/ConfirmModal';

interface EditPoolModalProps {
  isOpen: boolean;
  poolName: string;
  category?: string;
  tournamentId: string;
  tournamentMatches: MatchState[];
  registeredPlayers?: TournamentPlayer[];
  onClose: () => void;
  onMatchesAdded: (newMatches: MatchState[]) => void;
  onMatchesDeleted: (matchIds: string[]) => void;
  onDeletePool: (poolName: string, category?: string) => void;
}

export default function EditPoolModal({
  isOpen,
  poolName,
  category,
  tournamentId,
  tournamentMatches,
  registeredPlayers = [],
  onClose,
  onMatchesAdded,
  onMatchesDeleted,
  onDeletePool,
}: EditPoolModalProps) {
  if (!isOpen) return null;

  // Filter pool matches by both pool name and category
  const poolMatches = tournamentMatches.filter(m => {
    const matchesPool = m.pool?.trim().toLowerCase() === poolName.trim().toLowerCase();
    const matchesCat = !category || category === 'General'
      ? (!m.category || m.category.trim().toLowerCase() === 'general')
      : m.category?.trim().toLowerCase() === category.toLowerCase();
    return matchesPool && matchesCat;
  });
  const poolCategory = category || poolMatches.find(m => !!m.category)?.category;
  const inferredFormat: MatchType = poolMatches.some(m => m.settings?.type === 'singles')
    ? 'singles'
    : 'doubles';

  // Extract current teams in pool for this specific category
  const currentTeams = getPoolTeams(poolMatches, poolName, poolCategory);

  // Add team form state
  const [matchType, setMatchType] = useState<MatchType>(inferredFormat);
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Confirmation dialog state
  const [teamToDelete, setTeamToDelete] = useState<{ team: Team; matches: MatchState[] } | null>(null);
  const [isDeletingEntirePool, setIsDeletingEntirePool] = useState(false);

  const handleAddTeam = () => {
    const p1 = player1.trim() || `Player ${currentTeams.length * (matchType === 'doubles' ? 2 : 1) + 1}`;
    const p2 = player2.trim() || `Player ${currentTeams.length * (matchType === 'doubles' ? 2 : 1) + 2}`;

    const newTeam: Team = {
      id: uuidv4(),
      players:
        matchType === 'singles'
          ? [{ id: uuidv4(), name: p1 }]
          : [{ id: uuidv4(), name: p1 }, { id: uuidv4(), name: p2 }],
    };

    const newMatches = generateFixturesForNewTeam(
      tournamentId,
      poolName,
      newTeam,
      currentTeams,
      matchType,
      poolCategory
    );

    if (newMatches.length > 0) {
      onMatchesAdded(newMatches);
      setFeedbackMsg(`Added ${getTeamDisplayName(newTeam)} and created ${newMatches.length} new match fixtures.`);
    }

    setPlayer1('');
    setPlayer2('');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const initiateDeleteTeam = (team: Team) => {
    const teamMatches = getMatchesInvolvingTeam(poolMatches, poolName, getTeamKey(team));
    setTeamToDelete({ team, matches: teamMatches });
  };

  const confirmDeleteTeam = () => {
    if (!teamToDelete) return;
    const matchIds = teamToDelete.matches.map(m => m.id);
    onMatchesDeleted(matchIds);
    setTeamToDelete(null);
    setFeedbackMsg(`Removed ${getTeamDisplayName(teamToDelete.team)} and cleaned up ${matchIds.length} matches.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const confirmDeleteEntirePool = () => {
    onDeletePool(poolName, poolCategory);
    setIsDeletingEntirePool(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-graphite-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Pinned Header */}
        <div className="p-5 px-6 border-b border-black/5 flex justify-between items-center bg-white/40 backdrop-blur-md shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-DEFAULT" />
              <h2 className="text-xl font-display font-bold text-graphite-100">
                Edit {poolName}
              </h2>
              {poolCategory && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-DEFAULT/15 text-cyan-DEFAULT text-[10px] font-bold uppercase tracking-wider">
                  {poolCategory}
                </span>
              )}
            </div>
            <p className="text-xs text-graphite-300 font-medium mt-0.5">
              Manage participating teams and auto-generate fixtures
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-graphite-300 hover:text-graphite-100 rounded-full hover:bg-black/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar overscroll-contain">
          {/* Feedback Banner */}
          {feedbackMsg && (
            <div className="p-3 bg-lime-DEFAULT/15 border border-lime-DEFAULT/30 rounded-xl text-xs text-graphite-100 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-lime-DEFAULT shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Section 1: Current Teams in Pool */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-graphite-200 uppercase tracking-widest">
                Teams in this Pool ({currentTeams.length})
              </label>
              <span className="text-[10px] text-graphite-300 font-medium">
                {poolMatches.length} pool matches scheduled
              </span>
            </div>

            {currentTeams.length === 0 ? (
              <div className="p-4 rounded-2xl bg-black/5 text-center text-xs text-graphite-300 font-medium">
                No teams currently in this pool. Add teams below.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {currentTeams.map((team, idx) => {
                  const teamMatches = getMatchesInvolvingTeam(poolMatches, poolName, getTeamKey(team));
                  const completed = teamMatches.filter(m => m.status === 'completed').length;

                  return (
                    <div
                      key={team.id || idx}
                      className="flex items-center justify-between p-3 bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl shadow-sm hover:border-lime-DEFAULT/30 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xs font-mono font-bold text-graphite-300 w-5 text-right shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-bold text-graphite-100 truncate">
                            {getTeamDisplayName(team)}
                          </p>
                          <p className="text-[10px] text-graphite-300 font-medium">
                            {completed} played • {teamMatches.length - completed} scheduled
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => initiateDeleteTeam(team)}
                        className="p-1.5 text-graphite-300 hover:text-coral-DEFAULT rounded-lg hover:bg-red-50 transition-colors shrink-0"
                        title="Remove Team from Pool"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Add New Team to Pool */}
          <div className="border-t border-black/5 pt-5 space-y-3">
            <label className="text-[11px] font-bold text-graphite-400 uppercase tracking-widest block">
              Add New Team to {poolName}
            </label>

            {/* Format Selector */}
            <div className="flex bg-black/5 p-1 rounded-xl shadow-inner">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  matchType === 'singles'
                    ? 'bg-white text-lime-DEFAULT shadow-sm'
                    : 'text-graphite-400'
                }`}
                onClick={() => setMatchType('singles')}
              >
                <User size={13} /> Singles
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  matchType === 'doubles'
                    ? 'bg-white text-cyan-DEFAULT shadow-sm'
                    : 'text-graphite-400'
                }`}
                onClick={() => setMatchType('doubles')}
              >
                <Users size={13} /> Doubles
              </button>
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
                list="edit-pool-registered-players"
                placeholder={matchType === 'doubles' ? 'Player 1 Name (type or select)' : 'Player Name (type or select)'}
                value={player1}
                onChange={e => setPlayer1(e.target.value)}
                className="neo-input w-full rounded-xl p-3 text-xs text-graphite-100"
              />
              {matchType === 'doubles' && (
                <input
                  type="text"
                  list="edit-pool-registered-players"
                  placeholder="Player 2 Name (type or select)"
                  value={player2}
                  onChange={e => setPlayer2(e.target.value)}
                  className="neo-input w-full rounded-xl p-3 text-xs text-graphite-100"
                />
              )}

              {registeredPlayers.length > 0 && (
                <datalist id="edit-pool-registered-players">
                  {registeredPlayers.map(p => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              )}

              <button
                type="button"
                onClick={handleAddTeam}
                className="neo-btn w-full !bg-lime-DEFAULT/15 text-lime-DEFAULT py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:!bg-lime-DEFAULT hover:text-white transition-colors"
              >
                <Plus size={14} /> Add Team & Generate Fixtures
              </button>
            </div>
          </div>

          {/* Section 3: Danger Zone - Delete Entire Pool */}
          <div className="border-t border-black/5 pt-5">
            <div className="flex items-center justify-between p-3.5 bg-red-500/5 border border-red-500/15 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-coral-DEFAULT">Delete this Pool</p>
                <p className="text-[10px] text-graphite-400">
                  Permanently remove {poolName} and all its {poolMatches.length} matches
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeletingEntirePool(true)}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-coral-DEFAULT text-coral-DEFAULT hover:text-white rounded-xl text-xs font-bold transition-colors"
              >
                Delete Pool
              </button>
            </div>
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="p-4 px-6 border-t border-black/5 bg-white/70 backdrop-blur-md shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-graphite-900 text-white hover:bg-black transition-colors shadow-md"
          >
            Done
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Deleting Team */}
      <ConfirmModal
        isOpen={!!teamToDelete}
        title="Remove Team from Pool"
        message={
          teamToDelete && teamToDelete.matches.some(m => m.status === 'completed')
            ? `Warning: ${getTeamDisplayName(
                teamToDelete.team
              )} has already played completed matches in this pool. Removing this team will permanently delete their match history and standings.`
            : `Are you sure you want to remove ${
                teamToDelete ? getTeamDisplayName(teamToDelete.team) : 'this team'
              }? All ${teamToDelete?.matches.length || 0} scheduled matches involving this team in ${poolName} will be deleted.`
        }
        onCancel={() => setTeamToDelete(null)}
        onConfirm={confirmDeleteTeam}
      />

      {/* Confirmation Modal for Deleting Entire Pool */}
      <ConfirmModal
        isOpen={isDeletingEntirePool}
        title={`Delete ${poolName}`}
        message={`Are you sure you want to permanently delete ${poolName} and all its ${poolMatches.length} matches? This action cannot be undone.`}
        onCancel={() => setIsDeletingEntirePool(false)}
        onConfirm={confirmDeleteEntirePool}
      />
    </div>
  );
}

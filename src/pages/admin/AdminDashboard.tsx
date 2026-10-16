import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Plus,
  Play,
  Trash2,
  Users,
  Search,
  Sparkles,
  ChevronRight,
  Activity,
  UserCheck,
} from 'lucide-react';
import { useMatchStore } from '../../store/matchStore';
import ConfirmModal from '../../components/layout/ConfirmModal';
import PlayoImportModal from '../../components/tournament/PlayoImportModal';
import { TournamentPlayer } from '../../domain/types';
import { v4 as uuidv4 } from 'uuid';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    tournaments,
    matches,
    activeMatch,
    deleteTournament,
    deleteMatch,
    setTournamentPlayers,
    addTournamentPlayer,
    removeTournamentPlayer,
  } = useMatchStore();

  const matchesList = Object.values(matches);
  const tournamentsList = Object.values(tournaments);

  const [activeTab, setActiveTab] = useState<'tournaments' | 'players'>('tournaments');
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState<string>('all');
  const [playerSearchTerm, setPlayerSearchTerm] = useState<string>('');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargetTournamentId, setImportTargetTournamentId] = useState<string>('');
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualPlayerName, setManualPlayerName] = useState('');
  const [manualTournamentId, setManualTournamentId] = useState<string>('');

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'match' | 'tournament' | 'player';
    id: string;
    tournamentId?: string;
    name?: string;
  }>({ isOpen: false, type: 'match', id: '' });

  // Collect all players across all tournaments
  const allTournamentPlayers = tournamentsList.flatMap(t =>
    (t.players || []).map(p => ({
      ...p,
      tournamentId: t.id,
      tournamentName: t.name,
      playoUrl: t.playoUrl,
    }))
  );

  const filteredPlayers = allTournamentPlayers.filter(p => {
    const matchesTourney =
      selectedTournamentFilter === 'all' || p.tournamentId === selectedTournamentFilter;
    const matchesSearch = p.name.toLowerCase().includes(playerSearchTerm.toLowerCase());
    return matchesTourney && matchesSearch;
  });

  const handleAddManualPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = manualTournamentId || (tournamentsList.length > 0 ? tournamentsList[0].id : '');
    if (!manualPlayerName.trim() || !targetId) return;

    addTournamentPlayer(targetId, {
      id: uuidv4(),
      name: manualPlayerName.trim(),
    });

    setManualPlayerName('');
    setIsAddingManual(false);
  };

  const openImportForTournament = (tournamentId?: string) => {
    const target = tournamentId || (selectedTournamentFilter !== 'all' ? selectedTournamentFilter : tournamentsList[0]?.id);
    if (!target) {
      alert('Please create a tournament first before importing players.');
      return;
    }
    setImportTargetTournamentId(target);
    setIsImportModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-5 border-b border-white/60 bg-white/60 backdrop-blur-3xl sticky top-0 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        <h1 className="text-2xl font-display font-bold text-graphite-100 mb-1">Admin Dashboard</h1>
        <p className="text-xs text-graphite-300 font-medium">Manage tournaments, registered players, and score matches live.</p>
      </header>

      {/* Segmented Tab Navigation: Tournaments | Players */}
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center gap-1.5 bg-black/5 rounded-2xl p-1 shadow-inner w-full overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('tournaments')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 flex-1 min-w-max whitespace-nowrap ${
              activeTab === 'tournaments'
                ? 'bg-white text-graphite-100 shadow-sm'
                : 'text-graphite-300 hover:text-graphite-100'
            }`}
          >
            <Trophy size={14} className="shrink-0" />
            <span className="whitespace-nowrap">Tournaments</span>
            {tournamentsList.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                activeTab === 'tournaments' ? 'bg-black/5 text-graphite-100' : 'text-graphite-300'
              }`}>
                {tournamentsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 flex-1 min-w-max whitespace-nowrap ${
              activeTab === 'players'
                ? 'bg-white text-graphite-100 shadow-sm'
                : 'text-graphite-300 hover:text-graphite-100'
            }`}
          >
            <Users size={14} className="shrink-0" />
            <span className="whitespace-nowrap">Players</span>
            {allTournamentPlayers.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                activeTab === 'players' ? 'bg-black/5 text-graphite-100' : 'text-graphite-300'
              }`}>
                {allTournamentPlayers.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* VIEW 1: TOURNAMENTS */}
        {activeTab === 'tournaments' && (
          <div className="space-y-8">
            {/* Quick Actions */}
            <section>
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/admin/tournaments/new')}
                  className="neo-btn flex-1 !bg-lime-DEFAULT text-white p-4 rounded-[20px] font-bold flex flex-col items-center gap-2 shadow-md"
                >
                  <Trophy size={24} />
                  New Tournament
                </button>
                <button 
                  onClick={() => {
                    if (activeMatch) {
                      navigate(`/admin/match/${activeMatch.id}/score`);
                    } else {
                      navigate(`/admin/match/new/score`);
                    }
                  }}
                  className="neo-btn flex-1 bg-white/50 text-graphite-100 p-4 rounded-[20px] font-bold flex flex-col items-center gap-2"
                >
                  <Plus size={24} className="text-cyan-DEFAULT" />
                  Quick Match
                </button>
              </div>
            </section>

            {/* Active Matches */}
            {matchesList.filter(m => m.status === 'playing').length > 0 && (
              <section>
                <h2 className="text-sm font-black text-graphite-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  In Progress
                </h2>
                <div className="space-y-3">
                  {matchesList.filter(m => m.status === 'playing').map(m => (
                    <div key={m.id} className="glass-card p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-lime-DEFAULT">
                      <div>
                        <div className="text-sm font-bold text-graphite-100 mb-1">
                          {m.teamA.players.map(p => p.name).join(' & ')} vs {m.teamB.players.map(p => p.name).join(' & ')}
                        </div>
                        <div className="text-xs text-graphite-300 font-medium">Game {m.currentGame} • {m.currentScoreA} - {m.currentScoreB}</div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmState({ isOpen: true, type: 'match', id: m.id });
                          }}
                          className="p-3 bg-coral-DEFAULT/10 rounded-xl text-coral-DEFAULT hover:bg-coral-DEFAULT/20 active:scale-95 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button 
                          onClick={() => navigate(`/admin/match/${m.id}/score`)}
                          className="p-3 bg-graphite-800 rounded-xl text-graphite-100 hover:bg-graphite-700 active:scale-95 transition-all"
                        >
                          <Play size={18} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tournaments List */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-black text-graphite-200 uppercase tracking-widest">
                  Tournaments ({tournamentsList.length})
                </h2>
              </div>

              {tournamentsList.length === 0 ? (
                <div className="glass-card p-8 text-center rounded-3xl flex flex-col items-center">
                  <Trophy className="text-graphite-400 mb-3" size={32} />
                  <h3 className="text-base font-bold text-graphite-100 mb-1">No tournaments created yet</h3>
                  <p className="text-xs text-graphite-300 mb-5 max-w-xs font-medium">
                    Create your first tournament to organize matches, pools, and players.
                  </p>
                  <button
                    onClick={() => navigate('/admin/tournaments/new')}
                    className="neo-btn !bg-lime-DEFAULT text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md"
                  >
                    Create Tournament
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tournamentsList.map(t => {
                    const tournamentMatchCount = matchesList.filter(m => m.tournamentId === t.id).length;
                    const playerCount = (t.players || []).length;

                    return (
                      <div 
                        key={t.id} 
                        onClick={() => navigate(`/admin/tournaments/${t.id}`)}
                        className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-black/[0.03] transition-all group"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-graphite-100 truncate group-hover:text-lime-DEFAULT transition-colors">
                              {t.name}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-black/5 text-graphite-300 shrink-0">
                              {t.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-graphite-300 font-medium">
                            <span className="flex items-center gap-1">
                              <Users size={12} className="text-graphite-400" />
                              {playerCount} Players
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Activity size={12} className="text-graphite-400" />
                              {tournamentMatchCount} Matches
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmState({ isOpen: true, type: 'tournament', id: t.id, name: t.name });
                            }}
                            className="p-2 text-graphite-400 hover:text-coral-DEFAULT rounded-xl hover:bg-red-50 transition-colors"
                            title="Delete Tournament"
                          >
                            <Trash2 size={18} />
                          </button>
                          <ChevronRight size={18} className="text-graphite-300 group-hover:text-graphite-100 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Quick Players Preview Section */}
            {allTournamentPlayers.length > 0 && (
              <section className="pt-2 border-t border-black/5">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-graphite-300" />
                    <h2 className="text-sm font-black text-graphite-200 uppercase tracking-widest">
                      Registered Players ({allTournamentPlayers.length})
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('players')}
                    className="text-xs font-bold text-lime-DEFAULT hover:underline flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ChevronRight size={13} />
                  </button>
                </div>

                <div className="space-y-2">
                  {allTournamentPlayers.slice(0, 5).map((player, index) => (
                    <div
                      key={`preview-${player.tournamentId}-${player.id || index}`}
                      onClick={() => setActiveTab('players')}
                      className="p-2.5 bg-white/70 backdrop-blur-md border border-white/80 rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:bg-white transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[11px] font-mono font-bold text-graphite-300 w-5 text-right shrink-0">
                          #{index + 1}
                        </span>
                        {player.avatarUrl ? (
                          <img
                            src={player.avatarUrl}
                            alt={player.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-white"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-lime-DEFAULT/30 to-cyan-DEFAULT/30 text-graphite-100 font-bold text-xs flex items-center justify-center shrink-0 border border-white">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-bold text-graphite-100 truncate">
                          {player.name}
                        </span>
                        {player.isHost && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-lime-DEFAULT/20 text-lime-DEFAULT rounded shrink-0">
                            Host
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/5 text-graphite-300 shrink-0 truncate max-w-[120px]">
                        {player.tournamentName}
                      </span>
                    </div>
                  ))}
                  {allTournamentPlayers.length > 5 && (
                    <button
                      onClick={() => setActiveTab('players')}
                      className="w-full py-2 text-center text-xs font-bold text-graphite-300 hover:text-graphite-100 transition-colors"
                    >
                      + {allTournamentPlayers.length - 5} more players • Click to view all
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* VIEW 2: PLAYERS */}
        {activeTab === 'players' && (
          <div className="space-y-6">
            {/* Filter and Action Bar */}
            <div className="space-y-3">
              {/* Tournament Selector Pill (if more than 1 tournament) */}
              {tournamentsList.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  <div className="flex items-center gap-1.5 p-1 bg-black/5 rounded-2xl">
                    <button
                      onClick={() => setSelectedTournamentFilter('all')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        selectedTournamentFilter === 'all'
                          ? 'bg-white text-graphite-100 shadow-sm'
                          : 'text-graphite-300 hover:text-graphite-100'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedTournamentFilter === 'all' ? 'bg-graphite-100' : 'bg-transparent'}`} />
                      <span>All Tournaments ({allTournamentPlayers.length})</span>
                    </button>
                    {tournamentsList.map(t => {
                      const count = (t.players || []).length;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTournamentFilter(t.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                            selectedTournamentFilter === t.id
                              ? 'bg-white text-graphite-100 shadow-sm'
                              : 'text-graphite-300 hover:text-graphite-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedTournamentFilter === t.id ? 'bg-graphite-100' : 'bg-transparent'}`} />
                          <span>{t.name} ({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search & Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={14} className="absolute left-3.5 top-3 text-graphite-400" />
                  <input
                    type="text"
                    value={playerSearchTerm}
                    onChange={e => setPlayerSearchTerm(e.target.value)}
                    placeholder="Search players by name..."
                    className="w-full pl-9 pr-3.5 py-2 bg-white/70 backdrop-blur-md border border-graphite-200/60 rounded-2xl text-xs text-graphite-100 placeholder:text-graphite-400 focus:outline-none focus:ring-2 focus:ring-lime-DEFAULT/40 shadow-inner font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {tournamentsList.length > 0 && (
                    <>
                      <button
                        onClick={() => openImportForTournament()}
                        className="px-3.5 py-2 bg-black hover:bg-graphite-100 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        title="Import from Playo"
                      >
                        <Sparkles size={13} className="text-lime-DEFAULT" />
                        <span>Import</span>
                      </button>
                      <button
                        onClick={() => setIsAddingManual(!isAddingManual)}
                        className="p-2 bg-white/80 border border-graphite-200/60 rounded-2xl text-graphite-300 hover:text-graphite-100 hover:bg-white transition-all shadow-sm"
                        title="Add Player Manually"
                      >
                        <Plus size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Manual Player Form */}
              {isAddingManual && (
                <form
                  onSubmit={handleAddManualPlayer}
                  className="p-4 bg-white/80 backdrop-blur-xl border border-graphite-200/60 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-sm animate-in fade-in"
                >
                  <input
                    type="text"
                    value={manualPlayerName}
                    onChange={e => setManualPlayerName(e.target.value)}
                    placeholder="Enter player full name..."
                    autoFocus
                    className="flex-1 bg-white/90 border border-graphite-200 rounded-xl px-3.5 py-2 text-xs text-graphite-100 focus:outline-none focus:ring-2 focus:ring-lime-DEFAULT/40 shadow-inner font-medium"
                  />
                  {tournamentsList.length > 1 && (
                    <select
                      value={manualTournamentId || (selectedTournamentFilter !== 'all' ? selectedTournamentFilter : tournamentsList[0]?.id)}
                      onChange={e => setManualTournamentId(e.target.value)}
                      className="bg-white border border-graphite-200 rounded-xl px-3 py-2 text-xs text-graphite-100 font-bold"
                    >
                      {tournamentsList.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 sm:flex-none px-4 py-2 bg-lime-DEFAULT text-black font-black text-xs rounded-xl hover:bg-lime-DEFAULT/90 transition-all shadow-sm"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingManual(false)}
                      className="px-3 py-2 text-xs text-graphite-300 hover:text-graphite-100 font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Players List */}
            {filteredPlayers.length === 0 ? (
              <div className="glass-card p-8 rounded-3xl text-center flex flex-col items-center">
                <Users className="text-graphite-400 mb-3" size={32} />
                <h3 className="text-base font-bold text-graphite-100 mb-1">
                  {playerSearchTerm ? 'No matching players' : 'No Players Registered Yet'}
                </h3>
                <p className="text-xs text-graphite-300 mb-5 max-w-xs font-medium">
                  {playerSearchTerm
                    ? `No players match "${playerSearchTerm}". Try another name.`
                    : 'Import players directly from Playo or add them manually to organize round-robin pools and matches.'}
                </p>
                {tournamentsList.length > 0 && !playerSearchTerm && (
                  <button
                    onClick={() => openImportForTournament()}
                    className="px-5 py-2.5 bg-black hover:bg-graphite-100 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-md"
                  >
                    <Sparkles size={14} className="text-lime-DEFAULT" />
                    Import from Playo
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center px-1 text-[11px] font-black text-graphite-200 uppercase tracking-wider">
                  <span>Player Name</span>
                  <span>Tournament</span>
                </div>

                {filteredPlayers.map((player, index) => (
                  <div
                    key={`${player.tournamentId}-${player.id || index}`}
                    className="p-3 bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3 group hover:border-lime-DEFAULT/40 hover:bg-white transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Index Number */}
                      <span className="text-[11px] font-mono font-bold text-graphite-300 w-6 text-right shrink-0">
                        #{index + 1}
                      </span>

                      {/* Avatar */}
                      {player.avatarUrl ? (
                        <img
                          src={player.avatarUrl}
                          alt={player.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-lime-DEFAULT/30 to-cyan-DEFAULT/30 text-graphite-100 font-black text-xs flex items-center justify-center shrink-0 border border-white shadow-sm">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Name & Details */}
                      <div className="truncate flex-1">
                        <div className="flex items-center gap-2 truncate">
                          <p className="text-xs font-bold text-graphite-100 truncate">
                            {player.name}
                          </p>
                          {player.isHost && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-lime-DEFAULT/20 text-lime-DEFAULT rounded shrink-0">
                              Host
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right side: Tournament Tag & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/admin/tournaments/${player.tournamentId}`)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/5 text-graphite-300 hover:text-graphite-100 hover:bg-black/10 transition-colors truncate max-w-[130px]"
                        title={`Open ${player.tournamentName}`}
                      >
                        {player.tournamentName}
                      </button>

                      <button
                        onClick={() => navigate(`/admin/tournaments/${player.tournamentId}`)}
                        className="p-1.5 text-graphite-300 hover:text-graphite-100 rounded-lg hover:bg-black/5 transition-colors"
                        title="View Tournament"
                      >
                        <ChevronRight size={15} />
                      </button>

                      <button
                        onClick={() => {
                          setConfirmState({
                            isOpen: true,
                            type: 'player',
                            id: player.id,
                            tournamentId: player.tournamentId,
                            name: player.name,
                          });
                        }}
                        className="p-1.5 text-graphite-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove Player"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={
          confirmState.type === 'tournament'
            ? 'Delete Tournament'
            : confirmState.type === 'player'
            ? 'Remove Player'
            : 'Delete Match'
        }
        message={
          confirmState.type === 'tournament'
            ? `Are you sure you want to delete "${confirmState.name}"? This will also permanently delete all matches associated with it.`
            : confirmState.type === 'player'
            ? `Are you sure you want to remove "${confirmState.name}" from this tournament?`
            : 'Are you sure you want to permanently delete this match?'
        }
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (confirmState.type === 'tournament') {
            deleteTournament(confirmState.id);
          } else if (confirmState.type === 'player' && confirmState.tournamentId) {
            removeTournamentPlayer(confirmState.tournamentId, confirmState.id);
          } else {
            deleteMatch(confirmState.id);
          }
        }}
      />

      {/* Playo Import Modal */}
      {isImportModalOpen && importTargetTournamentId && (
        <PlayoImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={(imported, info, url) => {
            setTournamentPlayers(importTargetTournamentId, imported, info, url);
          }}
          initialUrl={tournaments[importTargetTournamentId]?.playoUrl}
        />
      )}
    </div>
  );
}

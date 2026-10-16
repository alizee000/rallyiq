import React, { useState } from 'react';
import { Users, Search, Plus, Trash2, MapPin, Sparkles, RefreshCw, UserCheck, Trophy } from 'lucide-react';
import { Tournament, MatchState, TournamentPlayer } from '../../domain/types';
import PlayoImportModal from './PlayoImportModal';
import { v4 as uuidv4 } from 'uuid';

interface TournamentPlayersViewProps {
  tournament: Tournament;
  matches: MatchState[];
  onSetPlayers: (players: TournamentPlayer[], playoInfo?: any, playoUrl?: string) => void;
  onAddPlayer: (player: TournamentPlayer) => void;
  onRemovePlayer: (playerId: string) => void;
  onOpenCreatePool?: () => void;
  isAdmin?: boolean;
}

export default function TournamentPlayersView({
  tournament,
  matches,
  onSetPlayers,
  onAddPlayer,
  onRemovePlayer,
  onOpenCreatePool,
  isAdmin = true,
}: TournamentPlayersViewProps) {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualName, setManualName] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);

  const players = tournament.players || [];

  // Build a lookup of player -> pool assignments based on existing matches
  const playerPoolMap: Record<string, string> = {};
  matches.forEach(m => {
    if (m.pool) {
      [...m.teamA.players, ...m.teamB.players].forEach(p => {
        playerPoolMap[p.name.toLowerCase().trim()] = m.pool!;
        if (p.id) playerPoolMap[p.id] = m.pool!;
      });
    }
  });

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    onAddPlayer({
      id: uuidv4(),
      name: manualName.trim(),
    });
    setManualName('');
    setIsAddingManual(false);
  };

  return (
    <div className="space-y-6">
      {/* Playo Activity Banner (if available) */}
      {tournament.playoInfo && (
        <div className="bg-gradient-to-r from-lime-DEFAULT/15 via-white/80 to-cyan-DEFAULT/15 border border-white/80 backdrop-blur-xl rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-lime-DEFAULT/20 text-lime-DEFAULT">
                <Sparkles size={14} />
              </span>
              <span className="text-[10px] font-bold tracking-widest uppercase text-graphite-500">
                Playo Activity Sync
              </span>
            </div>
            {tournament.playoInfo.venue && (
              <h3 className="text-base font-display font-bold text-graphite-100 flex items-center gap-1.5">
                <MapPin size={16} className="text-lime-DEFAULT shrink-0" />
                {tournament.playoInfo.venue}
              </h3>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-graphite-400">
              {tournament.playoInfo.hostName && (
                <div className="flex items-center gap-1.5">
                  {tournament.playoInfo.hostAvatar ? (
                    <img
                      src={tournament.playoInfo.hostAvatar}
                      alt={tournament.playoInfo.hostName}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  ) : (
                    <Users size={12} />
                  )}
                  <span>Host: <strong className="text-graphite-700">{tournament.playoInfo.hostName}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <UserCheck size={13} className="text-lime-DEFAULT" />
                <span>{players.length} Registered</span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="self-start sm:self-center px-4 py-2 bg-white/80 hover:bg-white text-graphite-800 border border-graphite-200/60 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw size={13} className="text-lime-DEFAULT" />
              Re-sync Playo
            </button>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-3 text-graphite-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search players..."
            className="w-full pl-9 pr-4 py-2 bg-white/70 backdrop-blur-md border border-graphite-200/60 rounded-2xl text-xs text-graphite-100 placeholder:text-graphite-400 focus:outline-none focus:ring-2 focus:ring-lime-DEFAULT/40 shadow-inner"
          />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {onOpenCreatePool && players.length > 0 && (
              <button
                onClick={onOpenCreatePool}
                className="px-3.5 py-2 bg-gradient-to-r from-lime-DEFAULT to-lime-DEFAULT/90 text-graphite-900 rounded-2xl text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5"
              >
                <Trophy size={14} />
                Create Pool
              </button>
            )}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2 bg-graphite-900 text-white rounded-2xl text-xs font-bold shadow-sm hover:bg-black transition-all flex items-center gap-1.5"
            >
              <Sparkles size={14} className="text-lime-DEFAULT" />
              Import Playo
            </button>
            <button
              onClick={() => setIsAddingManual(!isAddingManual)}
              className="p-2 bg-white/80 border border-graphite-200/60 rounded-2xl text-graphite-600 hover:text-graphite-900 hover:bg-white transition-all shadow-sm"
              title="Add Player Manually"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Manual Add Input */}
      {isAdmin && isAddingManual && (
        <form
          onSubmit={handleAddManual}
          className="p-4 bg-white/80 backdrop-blur-xl border border-graphite-200/60 rounded-2xl flex gap-2 shadow-sm animate-in fade-in"
        >
          <input
            type="text"
            value={manualName}
            onChange={e => setManualName(e.target.value)}
            placeholder="Enter player full name..."
            autoFocus
            className="flex-1 bg-white/90 border border-graphite-200 rounded-xl px-3.5 py-2 text-xs text-graphite-100 focus:outline-none focus:ring-2 focus:ring-lime-DEFAULT/40 shadow-inner"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-lime-DEFAULT text-graphite-900 font-bold text-xs rounded-xl hover:bg-lime-DEFAULT/90 transition-all shadow-sm"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsAddingManual(false)}
            className="px-3 py-2 text-xs text-graphite-400 hover:text-graphite-600 font-bold"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Empty State */}
      {players.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white/50 backdrop-blur-xl border border-white/80 rounded-3xl shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-lime-DEFAULT/20 to-cyan-DEFAULT/20 flex items-center justify-center mb-4 text-lime-DEFAULT">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-display font-bold text-graphite-100 mb-1">
            No Players in Tournament Yet
          </h3>
          <p className="text-xs text-graphite-400 max-w-sm mb-6 leading-relaxed">
            Import participants directly from your Playo activity link to list them under this tournament and easily seed them into pools.
          </p>
          {isAdmin && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-5 py-2.5 bg-graphite-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all flex items-center gap-2 shadow-md"
            >
              <Sparkles size={15} className="text-lime-DEFAULT" />
              Import from Playo
            </button>
          )}
        </div>
      )}

      {/* Players List View */}
      {players.length > 0 && (
        <div className="flex flex-col space-y-2">
          {filteredPlayers.map((player, index) => {
            const assignedPool =
              playerPoolMap[player.name.toLowerCase().trim()] ||
              (player.id ? playerPoolMap[player.id] : undefined);

            return (
              <div
                key={player.id || index}
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

                {/* Right side: Pool status & actions */}
                <div className="flex items-center gap-3 shrink-0">
                  {assignedPool ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-DEFAULT/15 text-cyan-DEFAULT rounded-lg">
                      {assignedPool}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-graphite-300 px-2 py-0.5 bg-black/5 rounded-lg">
                      Unassigned
                    </span>
                  )}

                  {/* Remove button */}
                  {isAdmin && (
                    <button
                      onClick={() => onRemovePlayer(player.id)}
                      className="p-1.5 text-graphite-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove Player"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredPlayers.length === 0 && (
            <div className="text-center py-8 text-xs text-graphite-300 font-medium">
              No players match "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      {isAdmin && (
        <PlayoImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={(imported, info, url) => {
            onSetPlayers(imported, info, url);
          }}
          initialUrl={tournament.playoUrl}
        />
      )}
    </div>
  );
}

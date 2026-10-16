import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatchStore } from '../../store/matchStore';
import { ChevronLeft, Plus, Play, Trash2, Award, Swords, Calendar, Users } from 'lucide-react';
import ConfirmModal from '../../components/layout/ConfirmModal';
import PoolStandingsView from '../../components/tournament/PoolStandingsView';
import KnockoutBracketView from '../../components/tournament/KnockoutBracketView';
import PoolCreationModal from '../../components/tournament/PoolCreationModal';
import AdvanceKnockoutsModal from '../../components/tournament/AdvanceKnockoutsModal';
import TournamentPlayersView from '../../components/tournament/TournamentPlayersView';
import EditPoolModal from '../../components/tournament/EditPoolModal';

export default function AdminTournamentView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    tournaments, 
    matches, 
    deleteMatch, 
    deleteMultipleMatches,
    deletePool,
    scheduleMultipleMatches,
    setTournamentPlayers,
    addTournamentPlayer,
    removeTournamentPlayer,
  } = useMatchStore();
  
  const [activeTab, setActiveTab] = useState<'matches' | 'pools' | 'bracket' | 'players'>('pools');
  const [confirmMatchId, setConfirmMatchId] = useState<string | null>(null);
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<{ name: string; category?: string } | null>(null);
  
  const tournament = id ? tournaments[id] : null;
  
  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-graphite-100">
        <h2>Tournament not found</h2>
        <button onClick={() => navigate('/admin')} className="text-lime-DEFAULT underline">Go back</button>
      </div>
    );
  }

  const tournamentMatches = Object.values(matches).filter(m => m.tournamentId === id);

  const matchCategories = Array.from(
    new Set(tournamentMatches.map(m => m.category?.trim()).filter(Boolean))
  ) as string[];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredMatches = tournamentMatches.filter(m => {
    if (selectedCategory === 'all') return true;
    return m.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
  });

  const scheduled = filteredMatches.filter(m => m.status === 'setup');
  const playing = filteredMatches.filter(m => m.status === 'playing');
  const completed = filteredMatches.filter(m => m.status === 'completed');

  // Collect distinct pools
  const poolNames = Array.from(
    new Set(tournamentMatches.map(m => m.pool?.trim()).filter(Boolean))
  ) as string[];

  const distinctPoolCount = new Set(
    tournamentMatches
      .filter(m => !!m.pool)
      .map(m => `${m.category?.trim().toLowerCase() || 'general'}:::${m.pool!.trim().toLowerCase()}`)
  ).size;

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto pb-24">
      {/* Header */}
      <header className="px-4 py-4 flex items-center gap-4 border-b border-white/60 bg-white/60 backdrop-blur-3xl sticky top-0 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        <button onClick={() => navigate('/admin')} className="p-2 text-graphite-400 hover:text-graphite-100">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-graphite-100">{tournament.name}</h1>
          <p className="text-xs text-graphite-400 uppercase">{tournament.status}</p>
        </div>
      </header>

      {/* Tab Segmented Bar */}
      <div className="px-4 sm:px-6 pt-5 pb-2">
        <div className="flex items-center gap-1.5 bg-black/5 rounded-2xl p-1 shadow-inner w-full overflow-x-auto scrollbar-hide">
          {/* Standings Tab */}
          <button
            onClick={() => setActiveTab('pools')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 flex-1 min-w-max whitespace-nowrap ${
              activeTab === 'pools'
                ? 'bg-white text-graphite-100 shadow-sm'
                : 'text-graphite-300 hover:text-graphite-100'
            }`}
          >
            <Award size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Standings</span>
            {distinctPoolCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                activeTab === 'pools' ? 'bg-black/5 text-graphite-100' : 'text-graphite-300'
              }`}>
                {distinctPoolCount}
              </span>
            )}
          </button>

          {/* Matches Tab */}
          <button
            onClick={() => setActiveTab('matches')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 flex-1 min-w-max whitespace-nowrap ${
              activeTab === 'matches'
                ? 'bg-white text-graphite-100 shadow-sm'
                : 'text-graphite-300 hover:text-graphite-100'
            }`}
          >
            <Calendar size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Matches</span>
          </button>

          {/* Knockouts Tab */}
          <button
            onClick={() => setActiveTab('bracket')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 flex-1 min-w-max whitespace-nowrap ${
              activeTab === 'bracket'
                ? 'bg-white text-graphite-100 shadow-sm'
                : 'text-graphite-300 hover:text-graphite-100'
            }`}
          >
            <Swords size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Knockout</span>
          </button>

          {/* Players Tab */}
          <button
            onClick={() => setActiveTab('players')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 flex-1 min-w-max whitespace-nowrap ${
              activeTab === 'players'
                ? 'bg-white text-graphite-100 shadow-sm'
                : 'text-graphite-300 hover:text-graphite-100'
            }`}
          >
            <Users size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Players</span>
            {tournament.players && tournament.players.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                activeTab === 'players' ? 'bg-black/5 text-graphite-100' : 'text-graphite-300'
              }`}>
                {tournament.players.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* TAB 1: MATCHES */}
        {activeTab === 'matches' && (
          <div className="space-y-8">
            <div className="flex gap-3">
              <button 
                onClick={() => navigate(`/admin/tournaments/${id}/schedule`)}
                className="neo-btn flex-1 !bg-lime-DEFAULT text-white p-3.5 font-bold flex items-center justify-center gap-2 rounded-[20px] text-sm shadow-md"
              >
                <Plus size={18} />
                Schedule Match
              </button>
              <button 
                onClick={() => setIsPoolModalOpen(true)}
                className="neo-btn !bg-black/5 text-graphite-100 hover:bg-black/10 p-3.5 font-bold flex items-center justify-center gap-1.5 rounded-[20px] text-xs transition-colors"
              >
                <Plus size={16} />
                New Pool
              </button>
            </div>

            {/* Category Filter Pills (if multiple categories exist) */}
            {matchCategories.length > 1 && (
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
                    <span>All Matches</span>
                  </button>
                  {matchCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        selectedCategory === cat
                          ? 'bg-white text-graphite-100 shadow-sm'
                          : 'text-graphite-300 hover:text-graphite-100'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedCategory === cat ? 'bg-graphite-100' : 'bg-transparent'}`} />
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live Matches */}
            {playing.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  Live Matches
                </h2>
                <div className="space-y-3">
                  {playing.map(m => (
                    <div key={m.id} className="glass-card p-4 flex items-center justify-between border-l-4 border-l-red-500 rounded-[20px]">
                      <div>
                        <div className="text-sm font-bold text-graphite-100 mb-1">
                          {m.teamA.players.map(p => p.name).join(' & ')} vs {m.teamB.players.map(p => p.name).join(' & ')}
                        </div>
                        <div className="text-xs text-graphite-400">
                          {m.category && <span className="font-bold text-lime-DEFAULT mr-2 uppercase tracking-wide">{m.category} •</span>}
                          {m.pool && <span className="font-bold text-cyan-DEFAULT mr-2 uppercase tracking-wide">{m.pool} •</span>}
                          {m.stage && <span className="font-bold text-graphite-500 mr-2 uppercase tracking-wide">{m.stage} •</span>}
                          Game {m.currentGame} • {m.currentScoreA} - {m.currentScoreB}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmMatchId(m.id);
                          }}
                          className="p-3 bg-coral-DEFAULT/10 rounded-xl text-coral-DEFAULT hover:bg-coral-DEFAULT/20 active:scale-95 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button 
                          onClick={() => navigate(`/admin/match/${m.id}/score`)}
                          className="neo-btn p-3 !bg-red-500 rounded-[16px] text-white"
                        >
                          <Play size={18} fill="currentColor" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Scheduled Matches */}
            {scheduled.length > 0 && (
              <section>
                <h2 className="text-sm font-black text-graphite-200 uppercase tracking-widest mb-4">Scheduled Matches</h2>
                <div className="space-y-3">
                  {scheduled.map(m => (
                    <div key={m.id} className="glass-card p-4 flex items-center justify-between border-l-4 border-l-cyan-DEFAULT rounded-[20px]">
                      <div>
                        <div className="text-sm font-bold text-graphite-100 mb-1">
                          {m.teamA.players.map(p => p.name).join(' & ')} vs {m.teamB.players.map(p => p.name).join(' & ')}
                        </div>
                        <div className="text-xs text-graphite-400">
                          {m.category && <span className="font-bold text-lime-DEFAULT mr-2 uppercase tracking-wide">{m.category} •</span>}
                          {m.pool && <span className="font-bold text-cyan-DEFAULT mr-2 uppercase tracking-wide">{m.pool} •</span>}
                          {m.stage && <span className="font-bold text-graphite-500 mr-2 uppercase tracking-wide">{m.stage} •</span>}
                          Scheduled
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmMatchId(m.id);
                          }}
                          className="p-3 bg-coral-DEFAULT/10 rounded-xl text-coral-DEFAULT hover:bg-coral-DEFAULT/20 active:scale-95 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button 
                          onClick={() => navigate(`/admin/match/${m.id}/score`)}
                          className="neo-btn px-5 py-2 !bg-cyan-DEFAULT text-white font-bold rounded-full text-sm"
                        >
                          Start
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Completed Matches */}
            {completed.length > 0 && (
              <section>
                <h2 className="text-sm font-black text-graphite-200 uppercase tracking-widest mb-4">Completed</h2>
                <div className="space-y-3">
                  {completed.map(m => {
                    const scoreString = m.games.length > 0 
                      ? m.games.map(g => `${g.scoreA}-${g.scoreB}`).join(', ') 
                      : `${m.currentScoreA}-${m.currentScoreB}`;
                    
                    return (
                      <div 
                        key={m.id} 
                        onClick={() => navigate(`/admin/match/${m.id}/score`)}
                        className="glass-card p-4 rounded-[20px] border-l-4 border-l-graphite-600 opacity-70 cursor-pointer hover:bg-black/5 transition-colors flex justify-between items-center"
                      >
                        <div>
                          <div className="text-sm font-bold text-graphite-100 mb-1">
                            {m.teamA.players.map(p => p.name).join(' & ')} vs {m.teamB.players.map(p => p.name).join(' & ')}
                          </div>
                          <div className="text-xs text-graphite-400 font-bold tracking-wider">
                            {m.category && <span className="text-lime-DEFAULT mr-2 uppercase">{m.category} •</span>}
                            {m.pool && <span className="text-cyan-DEFAULT mr-2 uppercase">{m.pool} •</span>}
                            {m.stage && <span className="text-graphite-500 mr-2 uppercase">{m.stage} •</span>}
                            {scoreString}
                          </div>
                        </div>
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] font-bold text-lime-DEFAULT uppercase tracking-widest">
                          Analysis
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmMatchId(m.id);
                          }}
                          className="p-2 text-graphite-400 hover:text-coral-DEFAULT transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {tournamentMatches.length === 0 && (
              <div className="text-center py-12 glass-card rounded-3xl p-8">
                <p className="text-graphite-400 text-sm mb-4">No matches scheduled yet.</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setIsPoolModalOpen(true)}
                    className="neo-btn !bg-lime-DEFAULT text-white px-5 py-2.5 rounded-xl font-bold text-xs"
                  >
                    Create Pool Fixtures
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: POOLS & STANDINGS */}
        {activeTab === 'pools' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-graphite-400 uppercase tracking-widest">
                Pool Groups & Standings
              </h2>
              <button
                onClick={() => setIsPoolModalOpen(true)}
                className="neo-btn !bg-lime-DEFAULT text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Plus size={14} />
                Add Pool
              </button>
            </div>

            <PoolStandingsView
              matches={tournamentMatches}
              poolNames={poolNames}
              isAdmin={true}
              onAdvanceToKnockouts={() => setIsAdvanceModalOpen(true)}
              onCreatePool={() => setIsPoolModalOpen(true)}
              onEditPool={(poolName, category) => setEditingPool({ name: poolName, category })}
            />
          </div>
        )}

        {/* TAB 3: KNOCKOUT BRACKET */}
        {activeTab === 'bracket' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-graphite-400 uppercase tracking-widest">
                Knockout Tree
              </h2>
              {poolNames.length > 0 && (
                <button
                  onClick={() => setIsAdvanceModalOpen(true)}
                  className="neo-btn !bg-cyan-DEFAULT text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Swords size={14} />
                  Advance Qualifiers
                </button>
              )}
            </div>

            <KnockoutBracketView
              matches={tournamentMatches}
              isAdmin={true}
              onScoreMatch={(matchId) => navigate(`/admin/match/${matchId}/score`)}
              onGenerateBracket={() => setIsAdvanceModalOpen(true)}
            />
          </div>
        )}

        {/* TAB 4: PLAYERS */}
        {activeTab === 'players' && (
          <TournamentPlayersView
            tournament={tournament}
            matches={tournamentMatches}
            onSetPlayers={(players, info, url) => setTournamentPlayers(tournament.id, players, info, url)}
            onAddPlayer={(player) => addTournamentPlayer(tournament.id, player)}
            onRemovePlayer={(playerId) => removeTournamentPlayer(tournament.id, playerId)}
            onOpenCreatePool={() => setIsPoolModalOpen(true)}
            isAdmin={true}
          />
        )}
      </div>
      
      {/* Modals */}
      <PoolCreationModal
        isOpen={isPoolModalOpen}
        tournamentId={tournament.id}
        existingPoolNames={poolNames}
        registeredPlayers={tournament.players || []}
        onClose={() => setIsPoolModalOpen(false)}
        onPoolCreated={(newMatches) => {
          scheduleMultipleMatches(newMatches);
          setActiveTab('pools');
        }}
      />

      <AdvanceKnockoutsModal
        isOpen={isAdvanceModalOpen}
        tournamentId={tournament.id}
        matches={tournamentMatches}
        poolNames={poolNames}
        onClose={() => setIsAdvanceModalOpen(false)}
        onKnockoutsGenerated={(knockoutMatches) => {
          scheduleMultipleMatches(knockoutMatches);
          setActiveTab('bracket');
        }}
      />

      <ConfirmModal 
        isOpen={!!confirmMatchId}
        title="Delete Match"
        message="Are you sure you want to permanently delete this match?"
        onCancel={() => setConfirmMatchId(null)}
        onConfirm={() => {
          if (confirmMatchId) {
            deleteMatch(confirmMatchId);
          }
        }}
      />

      {editingPool && (
        <EditPoolModal
          isOpen={!!editingPool}
          poolName={editingPool.name}
          category={editingPool.category}
          tournamentId={tournament.id}
          tournamentMatches={tournamentMatches}
          registeredPlayers={tournament.players || []}
          onClose={() => setEditingPool(null)}
          onMatchesAdded={(newMatches) => scheduleMultipleMatches(newMatches)}
          onMatchesDeleted={(deletedIds) => deleteMultipleMatches(deletedIds)}
          onDeletePool={(pName, pCat) => deletePool(tournament.id, pName, pCat)}
        />
      )}
    </div>
  );
}

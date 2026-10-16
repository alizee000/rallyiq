import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatchStore } from '../../store/matchStore';
import { ChevronLeft, Trophy, Calendar, Play, Award, Swords, Users } from 'lucide-react';
import PoolStandingsView from '../../components/tournament/PoolStandingsView';
import KnockoutBracketView from '../../components/tournament/KnockoutBracketView';
import TournamentPlayersView from '../../components/tournament/TournamentPlayersView';

export default function TournamentView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments, matches } = useMatchStore();
  
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'bracket' | 'players'>('matches');

  const tournament = id ? tournaments[id] : null;
  
  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-graphite-100 bg-transparent">
        <h2 className="text-xl font-bold mb-4">Tournament not found</h2>
        <button onClick={() => navigate('/')} className="text-lime-DEFAULT underline">Return Home</button>
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
    <div className="flex flex-col h-full bg-transparent overflow-y-auto pb-24 relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-cyan-DEFAULT/10 to-transparent -z-10"></div>
      
      {/* Top Header */}
      <header className="px-4 py-4 flex items-center justify-between relative z-20">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-graphite-400 hover:text-graphite-100 active:scale-95 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={() => window.location.reload()} 
          className="p-2 -mr-2 text-graphite-400 hover:text-lime-DEFAULT active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        </button>
      </header>

      {/* Hero Tournament Title */}
      <div className="px-6 mb-6 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-graphite-900 rounded-full mb-3 shadow-sm">
          <Trophy size={12} className="text-cyan-DEFAULT" />
          <span className="text-[10px] font-bold text-graphite-300 uppercase tracking-widest">{tournament.status}</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-graphite-100 tracking-tight leading-tight mb-2">
          {tournament.name}
        </h1>
        <div className="flex items-center gap-2 text-xs text-graphite-400 font-medium">
          <Calendar size={14} />
          <span>Started {new Date(tournament.startDate).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="px-4 sm:px-6 mb-6 relative z-10">
        <div className="flex items-center gap-1.5 bg-black/5 rounded-2xl p-1 shadow-inner w-full overflow-x-auto scrollbar-hide">
          {/* Standings Tab */}
          <button
            onClick={() => setActiveTab('standings')}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 flex-1 min-w-max whitespace-nowrap ${
              activeTab === 'standings'
                ? 'bg-white text-graphite-100 shadow-sm'
                : 'text-graphite-300 hover:text-graphite-100'
            }`}
          >
            <Award size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Standings</span>
            {distinctPoolCount > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${
                activeTab === 'standings' ? 'bg-black/5 text-graphite-100' : 'text-graphite-300'
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

      {/* Main Content Area */}
      <div className="px-6 space-y-8">
        {/* TAB 1: MATCHES */}
        {activeTab === 'matches' && (
          <div className="space-y-8">
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

            {playing.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-graphite-100 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-lime-DEFAULT animate-pulse"></div>
                    Live Now
                  </h2>
                </div>
                <div className="space-y-4">
                  {playing.map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => navigate(`/live/${m.id}`)}
                      className="glass-card p-5 rounded-3xl cursor-pointer hover:bg-black/5 transition-all active:scale-[0.98] relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-lime-DEFAULT/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex justify-between items-center mb-4 relative z-10">
                        <div className="flex gap-2 flex-wrap">
                          {m.category && <span className="text-[10px] font-bold uppercase tracking-widest text-lime-DEFAULT bg-lime-DEFAULT/10 px-2 py-0.5 rounded-sm">{m.category}</span>}
                          {m.pool && <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-DEFAULT bg-cyan-DEFAULT/10 px-2 py-0.5 rounded-sm">{m.pool}</span>}
                          {m.stage && <span className="text-[10px] font-bold uppercase tracking-widest text-graphite-500 bg-black/5 px-2 py-0.5 rounded-sm">{m.stage}</span>}
                          <span className="text-[10px] font-bold uppercase tracking-widest text-lime-DEFAULT bg-lime-DEFAULT/10 px-2 py-0.5 rounded-sm">Game {m.currentGame}</span>
                        </div>
                        <Play size={16} className="text-lime-DEFAULT opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      <div className="space-y-2 relative z-10">
                        <div className="flex justify-between items-center">
                          <div className="font-bold text-graphite-100 text-sm truncate pr-4">
                            {m.teamA.players.map(p => p.name).join(' & ')}
                          </div>
                          <div className="font-display font-bold text-xl text-graphite-100">
                            {m.currentScoreA}
                          </div>
                        </div>
                        
                        <div className="relative py-2 flex items-center justify-center">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full h-px bg-black/5"></div>
                          </div>
                          <div className="relative bg-white/40 px-2 rounded-full text-[10px] font-bold text-graphite-400 uppercase tracking-widest backdrop-blur-sm">
                            VS
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="font-bold text-graphite-100 text-sm truncate pr-4">
                            {m.teamB.players.map(p => p.name).join(' & ')}
                          </div>
                          <div className="font-display font-bold text-xl text-graphite-100">
                            {m.currentScoreB}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {scheduled.length > 0 && (
              <section>
                <h2 className="text-sm font-black text-graphite-200 uppercase tracking-widest mb-4">Upcoming Matches</h2>
                <div className="space-y-3">
                  {scheduled.map((m, index) => (
                    <div key={m.id} className={`glass-card p-5 rounded-3xl opacity-80 ${index % 2 === 0 ? '!bg-white/80' : '!bg-black/5 shadow-inner'}`}>
                      <div className="flex gap-2 mb-2 flex-wrap">
                        {m.category && <div className="text-[10px] font-bold uppercase tracking-widest text-lime-DEFAULT bg-lime-DEFAULT/10 px-2 py-0.5 rounded-sm">{m.category}</div>}
                        {m.pool && <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-DEFAULT bg-cyan-DEFAULT/10 px-2 py-0.5 rounded-sm">{m.pool}</div>}
                        {m.stage && <div className="text-[10px] font-bold uppercase tracking-widest text-graphite-500 bg-black/5 px-2 py-0.5 rounded-sm">{m.stage}</div>}
                      </div>
                      <div className="text-sm font-bold text-graphite-100 mb-2">
                        {m.teamA.players.map(p => p.name).join(' & ')}
                      </div>
                      <div className="text-xs text-graphite-300 font-black uppercase tracking-widest mb-2">VS</div>
                      <div className="text-sm font-bold text-graphite-100">
                        {m.teamB.players.map(p => p.name).join(' & ')}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section>
                <h2 className="text-sm font-black text-graphite-200 uppercase tracking-widest mb-4">Results</h2>
                <div className="space-y-3">
                  {completed.map((m, index) => {
                    const winnerIsA = m.games.filter(g => g.winner === 'A').length > m.games.filter(g => g.winner === 'B').length;
                    const scoreString = m.games.length > 0 
                      ? m.games.map(g => `${g.scoreA}-${g.scoreB}`).join(', ') 
                      : `${m.currentScoreA}-${m.currentScoreB}`;

                    return (
                      <div 
                        key={m.id} 
                        onClick={() => navigate(`/live/${m.id}`)}
                        className={`glass-card p-4 rounded-[20px] cursor-pointer hover:scale-[0.98] transition-all ${index % 2 === 0 ? '!bg-white/80' : '!bg-black/5 shadow-inner'}`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <div className={`text-sm font-bold truncate pr-2 ${winnerIsA ? 'text-graphite-100' : 'text-graphite-400'}`}>
                            {m.teamA.players.map(p => p.name).join(' & ')} {winnerIsA && '🏆'}
                          </div>
                          <div className="flex gap-1.5 flex-wrap">
                            {m.category && <div className="text-[10px] font-bold uppercase tracking-widest text-lime-DEFAULT bg-lime-DEFAULT/10 px-2 py-0.5 rounded-sm">{m.category}</div>}
                            {m.pool && <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-DEFAULT bg-cyan-DEFAULT/10 px-2 py-0.5 rounded-sm">{m.pool}</div>}
                            {m.stage && <div className="text-[10px] font-bold uppercase tracking-widest text-graphite-400">{m.stage}</div>}
                          </div>
                        </div>
                        
                        <div className="relative py-1 flex items-center justify-start ml-2 mb-1.5">
                          <div className="text-[10px] font-bold text-graphite-400/80 uppercase tracking-widest">
                            VS
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className={`text-sm font-bold truncate pr-2 ${!winnerIsA ? 'text-graphite-100' : 'text-graphite-400'}`}>
                            {m.teamB.players.map(p => p.name).join(' & ')} {!winnerIsA && '🏆'}
                          </div>
                          <div className={`font-display font-bold text-sm text-graphite-400 tracking-wider`}>
                            {scoreString}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            
            {tournamentMatches.length === 0 && (
              <div className="text-center py-10">
                <p className="text-graphite-400 text-sm">No matches scheduled yet.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STANDINGS */}
        {activeTab === 'standings' && (
          <div className="space-y-6">
            <PoolStandingsView
              matches={tournamentMatches}
              poolNames={poolNames}
              isAdmin={false}
            />
          </div>
        )}

        {/* TAB 3: KNOCKOUT BRACKET */}
        {activeTab === 'bracket' && (
          <div className="space-y-6">
            <KnockoutBracketView
              matches={tournamentMatches}
              isAdmin={false}
            />
          </div>
        )}

        {/* TAB 4: PLAYERS */}
        {activeTab === 'players' && (
          <div className="space-y-6">
            <TournamentPlayersView
              tournament={tournament}
              matches={tournamentMatches}
              onSetPlayers={() => {}}
              onAddPlayer={() => {}}
              onRemovePlayer={() => {}}
              isAdmin={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}

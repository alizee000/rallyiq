import { create } from 'zustand';
import { MatchState, Side, PointEventDetails, Tournament, PlayerProfile, TournamentPlayer } from '../domain/types';
import { addPoint, undoLastPoint } from '../domain/scoring';
import { advanceKnockoutWinner } from '../domain/tournamentEngine';
import { supabase } from '../lib/supabase';

interface AppStore {
  activeMatch: MatchState | null; // For the admin currently scoring
  matches: Record<string, MatchState>; // All matches globally
  tournaments: Record<string, Tournament>;
  profiles: Record<string, PlayerProfile>;
  isLoading: boolean;
  
  // Hydration
  fetchInitialData: () => Promise<void>;

  // Admin actions
  startMatch: (match: MatchState) => void;
  scorePoint: (side: Side, details?: PointEventDetails) => void;
  updateLastPoint: (details: PointEventDetails) => void;
  undo: () => void;
  endMatch: () => void;
  
  createTournament: (t: Tournament) => void;
  setTournamentPlayers: (
    tournamentId: string,
    players: TournamentPlayer[],
    playoInfo?: Tournament['playoInfo'],
    playoUrl?: string
  ) => void;
  addTournamentPlayer: (tournamentId: string, player: TournamentPlayer) => void;
  removeTournamentPlayer: (tournamentId: string, playerId: string) => void;
  updateTournamentPlayer: (tournamentId: string, player: TournamentPlayer) => void;
  createProfile: (p: PlayerProfile) => void;
  scheduleMatch: (m: MatchState) => void;
  scheduleMultipleMatches: (matches: MatchState[]) => void;
  deleteMatch: (id: string) => void;
  deleteMultipleMatches: (ids: string[]) => void;
  deletePool: (tournamentId: string, poolName: string, category?: string) => void;
  deleteTournament: (id: string) => void;
}

// Helper to push to supabase and localStorage
const syncTournament = async (t: Tournament) => {
  // Always cache locally so data is immediate and persists offline
  try {
    localStorage.setItem(
      `iqrally_tournament_roster_${t.id}`,
      JSON.stringify({
        players: t.players || [],
        playoInfo: t.playoInfo,
        playoUrl: t.playoUrl,
      })
    );
  } catch (err) {
    console.error('Failed to cache tournament in localStorage', err);
  }

  // Attempt to sync full payload including players if table has columns
  const fullPayload: any = {
    id: t.id,
    name: t.name,
    start_date: t.startDate,
    status: t.status,
  };
  if (t.players !== undefined) fullPayload.players = t.players;
  if (t.playoInfo !== undefined) fullPayload.playo_info = t.playoInfo;
  if (t.playoUrl !== undefined) fullPayload.playo_url = t.playoUrl;

  const { error } = await supabase.from('iqrally_tournaments').upsert(fullPayload);
  if (error) {
    // If schema cache indicates columns don't exist yet, retry with base columns
    if (error.code === 'PGRST204' || error.message?.includes('column')) {
      supabase
        .from('iqrally_tournaments')
        .upsert({
          id: t.id,
          name: t.name,
          start_date: t.startDate,
          status: t.status,
        })
        .then(({ error: retryErr }: { error: any }) => {
          if (retryErr) console.error('Supabase base sync error:', retryErr);
        });
    } else {
      console.error('Supabase sync error:', error);
    }
  }
};

const syncMatch = (m: MatchState) => {
  supabase.from('iqrally_matches').upsert({
    id: m.id,
    tournament_id: m.tournamentId || null,
    status: m.status,
    state: m
  }).then(({error}: {error: any}) => { if (error) console.error("Supabase sync error:", error); });
};

export const useMatchStore = create<AppStore>()((set, get) => ({
  activeMatch: null,
  matches: {},
  tournaments: {},
  profiles: {},
  isLoading: true,
  
  fetchInitialData: async () => {
    try {
      const [tournamentsRes, matchesRes] = await Promise.all([
        supabase.from('iqrally_tournaments').select('*'),
        supabase.from('iqrally_matches').select('*')
      ]);
      
      const loadedTournaments: Record<string, Tournament> = {};
      if (tournamentsRes.data) {
        tournamentsRes.data.forEach((t: any) => {
          let cachedRoster: any = null;
          try {
            const raw = localStorage.getItem(`iqrally_tournament_roster_${t.id}`);
            if (raw) cachedRoster = JSON.parse(raw);
          } catch (e) {
            console.error('Failed to parse cached roster', e);
          }

          loadedTournaments[t.id] = {
            id: t.id,
            name: t.name,
            startDate: t.start_date,
            status: t.status,
            playoUrl: t.playo_url || cachedRoster?.playoUrl,
            playoInfo: t.playo_info || cachedRoster?.playoInfo,
            players: t.players || cachedRoster?.players || [],
          };
        });
      }

      const loadedMatches: Record<string, MatchState> = {};
      if (matchesRes.data) {
        matchesRes.data.forEach((m: any) => {
          loadedMatches[m.id] = m.state as MatchState;
        });
      }

      set({ tournaments: loadedTournaments, matches: loadedMatches, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch initial data", err);
      set({ isLoading: false });
    }
  },

  createTournament: (t) => {
    set(state => ({ tournaments: { ...state.tournaments, [t.id]: t } }));
    syncTournament(t);
  },

  setTournamentPlayers: (tournamentId, players, playoInfo, playoUrl) => {
    set(state => {
      const tourney = state.tournaments[tournamentId];
      if (!tourney) return state;
      const updatedTourney: Tournament = {
        ...tourney,
        players,
        playoInfo: playoInfo !== undefined ? playoInfo : tourney.playoInfo,
        playoUrl: playoUrl !== undefined ? playoUrl : tourney.playoUrl,
      };
      syncTournament(updatedTourney);
      return {
        tournaments: {
          ...state.tournaments,
          [tournamentId]: updatedTourney,
        },
      };
    });
  },

  addTournamentPlayer: (tournamentId, player) => {
    set(state => {
      const tourney = state.tournaments[tournamentId];
      if (!tourney) return state;
      const existing = tourney.players || [];
      const updatedTourney: Tournament = {
        ...tourney,
        players: [...existing, player],
      };
      syncTournament(updatedTourney);
      return {
        tournaments: {
          ...state.tournaments,
          [tournamentId]: updatedTourney,
        },
      };
    });
  },

  removeTournamentPlayer: (tournamentId, playerId) => {
    set(state => {
      const tourney = state.tournaments[tournamentId];
      if (!tourney) return state;
      const updatedTourney: Tournament = {
        ...tourney,
        players: (tourney.players || []).filter(p => p.id !== playerId),
      };
      syncTournament(updatedTourney);
      return {
        tournaments: {
          ...state.tournaments,
          [tournamentId]: updatedTourney,
        },
      };
    });
  },

  updateTournamentPlayer: (tournamentId, updatedPlayer) => {
    set(state => {
      const tourney = state.tournaments[tournamentId];
      if (!tourney) return state;
      const updatedTourney: Tournament = {
        ...tourney,
        players: (tourney.players || []).map(p => p.id === updatedPlayer.id ? updatedPlayer : p),
      };
      syncTournament(updatedTourney);
      return {
        tournaments: {
          ...state.tournaments,
          [tournamentId]: updatedTourney,
        },
      };
    });
  },
  
  createProfile: (p) => set(state => ({ profiles: { ...state.profiles, [p.id]: p } })),
  
  scheduleMatch: (m) => {
    set(state => ({ matches: { ...state.matches, [m.id]: m } }));
    syncMatch(m);
  },

  scheduleMultipleMatches: (newMatches) => {
    const updates: Record<string, MatchState> = {};
    newMatches.forEach(m => {
      updates[m.id] = m;
      syncMatch(m);
    });
    set(state => ({ matches: { ...state.matches, ...updates } }));
  },

  startMatch: (match: MatchState) => {
    set((state) => ({ 
      activeMatch: match,
      matches: { ...state.matches, [match.id]: match }
    }));
    syncMatch(match);
  },
  
  scorePoint: (side: Side, details?: PointEventDetails) => {
    let syncedMatch: MatchState | null = null;
    let advancedTargetMatch: MatchState | null = null;
    set((state) => {
      if (!state.activeMatch) return state;
      const newMatch = addPoint(state.activeMatch, side, details);
      syncedMatch = newMatch;
      
      const newMatches = { ...state.matches, [newMatch.id]: newMatch };

      // If match just completed and has a knockout target, propagate the winner
      if (newMatch.status === 'completed' && newMatch.knockoutNextMatchId) {
        advancedTargetMatch = advanceKnockoutWinner(newMatch, newMatches);
        if (advancedTargetMatch) {
          newMatches[advancedTargetMatch.id] = advancedTargetMatch;
        }
      }

      return { 
        activeMatch: newMatch,
        matches: newMatches
      };
    });
    if (syncedMatch) syncMatch(syncedMatch);
    if (advancedTargetMatch) syncMatch(advancedTargetMatch);
  },
  
  updateLastPoint: (details: PointEventDetails) => {
    let syncedMatch: MatchState | null = null;
    set((state) => {
      if (!state.activeMatch || state.activeMatch.history.length === 0) return state;
      const newMatch = JSON.parse(JSON.stringify(state.activeMatch));
      newMatch.history[newMatch.history.length - 1].details = {
        ...newMatch.history[newMatch.history.length - 1].details,
        ...details
      };
      syncedMatch = newMatch;
      return { 
        activeMatch: newMatch,
        matches: { ...state.matches, [newMatch.id]: newMatch }
      };
    });
    if (syncedMatch) syncMatch(syncedMatch);
  },
  
  undo: () => {
    let syncedMatch: MatchState | null = null;
    set((state) => {
      if (!state.activeMatch) return state;
      const newMatch = undoLastPoint(state.activeMatch);
      syncedMatch = newMatch;
      return { 
        activeMatch: newMatch,
        matches: { ...state.matches, [newMatch.id]: newMatch }
      };
    });
    if (syncedMatch) syncMatch(syncedMatch);
  },
  
  endMatch: () => {
    let syncedMatch: MatchState | null = null;
    let advancedTargetMatch: MatchState | null = null;
    set((state) => {
      if (!state.activeMatch) return state;
      const newMatch = { ...state.activeMatch, status: 'completed' as const };
      
      if (newMatch.currentScoreA > 0 || newMatch.currentScoreB > 0) {
         newMatch.games = [...newMatch.games, {
           scoreA: newMatch.currentScoreA,
           scoreB: newMatch.currentScoreB,
           winner: newMatch.currentScoreA > newMatch.currentScoreB ? 'A' : (newMatch.currentScoreB > newMatch.currentScoreA ? 'B' : undefined)
         }];
      }
      
      syncedMatch = newMatch;
      const newMatches = { ...state.matches, [newMatch.id]: newMatch };

      if (newMatch.knockoutNextMatchId) {
        advancedTargetMatch = advanceKnockoutWinner(newMatch, newMatches);
        if (advancedTargetMatch) {
          newMatches[advancedTargetMatch.id] = advancedTargetMatch;
        }
      }

      return { 
        activeMatch: newMatch,
        matches: newMatches
      };
    });
    if (syncedMatch) syncMatch(syncedMatch);
    if (advancedTargetMatch) syncMatch(advancedTargetMatch);
  },

  deleteMatch: (id: string) => {
    set((state) => {
      const newMatches = { ...state.matches };
      delete newMatches[id];
      return { matches: newMatches, activeMatch: state.activeMatch?.id === id ? null : state.activeMatch };
    });
    supabase.from('iqrally_matches').delete().eq('id', id).then();
  },

  deleteMultipleMatches: (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    set((state) => {
      const newMatches = { ...state.matches };
      ids.forEach(id => delete newMatches[id]);
      const newActive = state.activeMatch && idSet.has(state.activeMatch.id) ? null : state.activeMatch;
      return { matches: newMatches, activeMatch: newActive };
    });
    supabase.from('iqrally_matches').delete().in('id', ids).then();
  },

  deletePool: (tournamentId: string, poolName: string, category?: string) => {
    const targetPool = poolName.trim().toLowerCase();
    const targetCategory = category?.trim().toLowerCase();
    const toDeleteIds: string[] = [];
    set((state) => {
      const newMatches = { ...state.matches };
      Object.entries(newMatches).forEach(([id, m]) => {
        const matchesPool = m.tournamentId === tournamentId && m.pool?.trim().toLowerCase() === targetPool;
        const matchesCategory = !targetCategory || targetCategory === 'general'
          ? (!m.category || m.category.trim().toLowerCase() === 'general')
          : m.category?.trim().toLowerCase() === targetCategory;
        if (matchesPool && matchesCategory) {
          toDeleteIds.push(id);
          delete newMatches[id];
        }
      });
      const newActive = state.activeMatch && toDeleteIds.includes(state.activeMatch.id) ? null : state.activeMatch;
      return { matches: newMatches, activeMatch: newActive };
    });
    if (toDeleteIds.length > 0) {
      supabase.from('iqrally_matches').delete().in('id', toDeleteIds).then();
    }
  },

  deleteTournament: (id: string) => {
    set((state) => {
      const newTournaments = { ...state.tournaments };
      delete newTournaments[id];
      const newMatches = { ...state.matches };
      Object.keys(newMatches).forEach(matchId => {
        if (newMatches[matchId].tournamentId === id) {
          delete newMatches[matchId];
        }
      });
      return { tournaments: newTournaments, matches: newMatches };
    });
    supabase.from('iqrally_tournaments').delete().eq('id', id).then();
    supabase.from('iqrally_matches').delete().eq('tournament_id', id).then();
  }
}));

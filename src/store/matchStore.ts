import { create } from 'zustand';
import { MatchState, Side, PointEventDetails, Tournament, PlayerProfile } from '../domain/types';
import { addPoint, undoLastPoint } from '../domain/scoring';
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
  createProfile: (p: PlayerProfile) => void;
  scheduleMatch: (m: MatchState) => void;
  deleteMatch: (id: string) => void;
  deleteTournament: (id: string) => void;
}

// Helper to push to supabase without awaiting
const syncTournament = (t: Tournament) => {
  supabase.from('iqrally_tournaments').upsert({
    id: t.id,
    name: t.name,
    start_date: t.startDate,
    status: t.status
  }).then(({error}: {error: any}) => { if (error) console.error("Supabase sync error:", error); });
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
          loadedTournaments[t.id] = {
            id: t.id,
            name: t.name,
            startDate: t.start_date,
            status: t.status
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
  
  createProfile: (p) => set(state => ({ profiles: { ...state.profiles, [p.id]: p } })),
  
  scheduleMatch: (m) => {
    set(state => ({ matches: { ...state.matches, [m.id]: m } }));
    syncMatch(m);
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
    set((state) => {
      if (!state.activeMatch) return state;
      const newMatch = addPoint(state.activeMatch, side, details);
      syncedMatch = newMatch;
      return { 
        activeMatch: newMatch,
        matches: { ...state.matches, [newMatch.id]: newMatch }
      };
    });
    if (syncedMatch) syncMatch(syncedMatch);
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
      return { 
        activeMatch: newMatch,
        matches: { ...state.matches, [newMatch.id]: newMatch }
      };
    });
    if (syncedMatch) syncMatch(syncedMatch);
  },

  deleteMatch: (id: string) => {
    set((state) => {
      const newMatches = { ...state.matches };
      delete newMatches[id];
      return { matches: newMatches, activeMatch: state.activeMatch?.id === id ? null : state.activeMatch };
    });
    supabase.from('iqrally_matches').delete().eq('id', id).then();
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

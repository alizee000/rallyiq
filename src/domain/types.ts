export type Player = {
  id: string;
  name: string;
};

export type Team = {
  id: string;
  players: Player[];
};

export type Side = 'A' | 'B';
export type MatchType = 'singles' | 'doubles';
export type MatchStatus = 'setup' | 'playing' | 'completed' | 'retired';

export type GameScore = {
  scoreA: number;
  scoreB: number;
  winner?: Side;
};

export type MatchSettings = {
  type: MatchType;
  bestOfGames: number; // usually 3
  pointsToWin: number; // usually 21
  winByTwo: boolean;
  capAt: number; // usually 30
};

export type PointEventDetails = {
  pointWinnerId?: string; // Player who scored the winner
  errorMakerId?: string; // Player who made an error
  shotType?: string; // Smash, Drop, etc.
  errorType?: string; // Net, Wide, Long, etc.
  outcomeType?: 'winner' | 'unforced_error' | 'forced_error' | 'service_fault' | 'unknown';
  rallyLength?: 'short' | 'medium' | 'long';
};

export type PointEvent = {
  id: string;
  timestamp: number;
  gameNumber: number;
  scoringSide: Side;
  details?: PointEventDetails;
  // Snapshot of state before this point was played (for undo)
  previousStateSnapshot: any; 
};

export type PlayerProfile = {
  id: string;
  name: string;
  avatarUrl?: string;
  matchesPlayed: number;
  matchesWon: number;
};

export type TournamentPlayer = {
  id: string;
  name: string;
  avatarUrl?: string;
  playoId?: string;
  guestCount?: number;
  isHost?: boolean;
  pool?: string;
  category?: string;
};

export type Tournament = {
  id: string;
  name: string;
  startDate: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  playoUrl?: string;
  playoInfo?: {
    venue?: string;
    date?: string;
    hostName?: string;
    hostAvatar?: string;
    totalJoined?: number;
  };
  players?: TournamentPlayer[];
};

export const TOURNAMENT_CATEGORIES = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
] as const;

export type TournamentCategory = (typeof TOURNAMENT_CATEGORIES)[number] | string;

export type MatchState = {
  id: string;
  tournamentId?: string;
  category?: TournamentCategory; // e.g. "Women's Doubles", "Men's Singles"
  stage?: string; // League Match, Round 2, Round 3, Quarter Final, Semi Final, Final, etc.
  pool?: string; // 'Pool A', 'Pool B', etc.
  knockoutRound?: 'quarter' | 'semi' | 'final';
  knockoutMatchNumber?: number;
  knockoutNextMatchId?: string;
  knockoutSlot?: 'A' | 'B';
  status: MatchStatus;
  settings: MatchSettings;
  teamA: Team;
  teamB: Team;
  
  currentGame: number;
  currentScoreA: number;
  currentScoreB: number;
  
  games: GameScore[]; // Past games
  
  // Service state
  servingSide: Side;
  serverA?: string; 
  serverB?: string; 
  receiverA?: string; 
  receiverB?: string; 
  
  history: PointEvent[]; 
};

export type PoolStanding = {
  team: Team;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  gamesWon: number;
  gamesLost: number;
  gameDiff: number;
  pointsWon: number;
  pointsLost: number;
  pointDiff: number;
  points: number; // 2 pts per win
  rank: number;
};

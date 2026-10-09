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

export type Tournament = {
  id: string;
  name: string;
  startDate: string;
  status: 'upcoming' | 'ongoing' | 'completed';
};

export type MatchState = {
  id: string;
  tournamentId?: string;
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

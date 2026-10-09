import { v4 as uuidv4 } from 'uuid';
import { MatchState, Team, PointEvent } from './types';

export const generateDemoMatch = (): MatchState => {
  const teamA: Team = { id: 'teamA', players: [{ id: 'p1', name: 'Viktor' }] };
  const teamB: Team = { id: 'teamB', players: [{ id: 'p2', name: 'Lee Z.' }] };

  const match: MatchState = {
    id: uuidv4(),
    status: 'completed',
    settings: { type: 'singles', bestOfGames: 3, pointsToWin: 21, winByTwo: true, capAt: 30 },
    teamA,
    teamB,
    currentGame: 2,
    currentScoreA: 21,
    currentScoreB: 19,
    games: [
      { scoreA: 18, scoreB: 21, winner: 'B' },
      { scoreA: 21, scoreB: 19, winner: 'A' }
    ],
    servingSide: 'A',
    history: [],
  };

  // Add a few historical points to history just to populate commentary
  const mockHistory: PointEvent[] = [
    {
      id: uuidv4(), timestamp: Date.now() - 300000, gameNumber: 2, scoringSide: 'A',
      details: { outcomeType: 'winner', shotType: 'Smash' },
      previousStateSnapshot: { currentScoreA: 18, currentScoreB: 19, servingSide: 'A' }
    },
    {
      id: uuidv4(), timestamp: Date.now() - 200000, gameNumber: 2, scoringSide: 'A',
      details: { outcomeType: 'forced_error', shotType: 'Clear' },
      previousStateSnapshot: { currentScoreA: 19, currentScoreB: 19, servingSide: 'A' }
    },
    {
      id: uuidv4(), timestamp: Date.now() - 100000, gameNumber: 2, scoringSide: 'A',
      details: { outcomeType: 'winner', shotType: 'Drop' },
      previousStateSnapshot: { currentScoreA: 20, currentScoreB: 19, servingSide: 'A' }
    }
  ];

  match.history = mockHistory;

  return match;
};

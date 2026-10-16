import { describe, it, expect } from 'vitest';
import { 
  calculatePoolStandings, 
  generateRoundRobinMatches, 
  generateKnockoutBracket, 
  advanceKnockoutWinner 
} from './tournamentEngine';
import { Team, MatchState } from './types';

describe('Tournament Engine', () => {
  const team1: Team = { id: 't1', players: [{ id: 'p1', name: 'Alice' }] };
  const team2: Team = { id: 't2', players: [{ id: 'p2', name: 'Bob' }] };
  const team3: Team = { id: 't3', players: [{ id: 'p3', name: 'Charlie' }] };
  const team4: Team = { id: 't4', players: [{ id: 'p4', name: 'David' }] };

  describe('Round Robin Generation', () => {
    it('generates correct number of fixtures for 3 teams (3 matches)', () => {
      const fixtures = generateRoundRobinMatches('tourn-1', 'Pool A', [team1, team2, team3], 'singles');
      expect(fixtures).toHaveLength(3);
      expect(fixtures.every(f => f.pool === 'Pool A')).toBe(true);
      expect(fixtures.every(f => f.status === 'setup')).toBe(true);
      expect(fixtures.every(f => f.stage === 'League Match')).toBe(true);
    });

    it('generates correct number of fixtures for 4 teams (6 matches)', () => {
      const fixtures = generateRoundRobinMatches('tourn-1', 'Pool B', [team1, team2, team3, team4], 'singles');
      expect(fixtures).toHaveLength(6);
    });

    it('generates pool fixtures with specific category like Women\'s Doubles or Men\'s Singles', () => {
      const fixturesWD = generateRoundRobinMatches(
        'tourn-1',
        'Pool A',
        [team1, team2, team3],
        'doubles',
        "Women's Doubles"
      );
      expect(fixturesWD).toHaveLength(3);
      expect(fixturesWD.every(f => f.category === "Women's Doubles")).toBe(true);
      expect(fixturesWD.every(f => f.settings.type === 'doubles')).toBe(true);

      const fixturesMS = generateRoundRobinMatches(
        'tourn-1',
        'Pool B',
        [team1, team2, team3],
        'singles',
        "Men's Singles"
      );
      expect(fixturesMS).toHaveLength(3);
      expect(fixturesMS.every(f => f.category === "Men's Singles")).toBe(true);
      expect(fixturesMS.every(f => f.settings.type === 'singles')).toBe(true);
    });
  });

  describe('Pool Standings Calculation', () => {
    it('calculates points, game differential, and ranks correctly', () => {
      const match1: MatchState = {
        id: 'm1',
        tournamentId: 'tourn-1',
        pool: 'Pool A',
        stage: 'League Match',
        status: 'completed',
        settings: { type: 'singles', bestOfGames: 3, pointsToWin: 21, winByTwo: true, capAt: 30 },
        teamA: team1,
        teamB: team2,
        currentGame: 2,
        currentScoreA: 0,
        currentScoreB: 0,
        games: [
          { scoreA: 21, scoreB: 15, winner: 'A' },
          { scoreA: 21, scoreB: 18, winner: 'A' },
        ],
        servingSide: 'A',
        history: [],
      };

      const match2: MatchState = {
        id: 'm2',
        tournamentId: 'tourn-1',
        pool: 'Pool A',
        stage: 'League Match',
        status: 'completed',
        settings: { type: 'singles', bestOfGames: 3, pointsToWin: 21, winByTwo: true, capAt: 30 },
        teamA: team2,
        teamB: team3,
        currentGame: 3,
        currentScoreA: 0,
        currentScoreB: 0,
        games: [
          { scoreA: 21, scoreB: 19, winner: 'A' },
          { scoreA: 18, scoreB: 21, winner: 'B' },
          { scoreA: 21, scoreB: 16, winner: 'A' },
        ],
        servingSide: 'A',
        history: [],
      };

      const standings = calculatePoolStandings([match1, match2], 'Pool A');
      expect(standings).toHaveLength(3);

      // Team 1 (Alice): played 1, won 1, lost 0, pts 2, gamesWon 2, gamesLost 0 (diff +2)
      expect(standings[0].teamName).toBe('Alice');
      expect(standings[0].won).toBe(1);
      expect(standings[0].points).toBe(2);
      expect(standings[0].gameDiff).toBe(2);
      expect(standings[0].rank).toBe(1);

      // Team 2 (Bob): played 2, won 1, lost 1, pts 2, gamesWon 2, gamesLost 3 (diff -1)
      expect(standings[1].teamName).toBe('Bob');
      expect(standings[1].won).toBe(1);
      expect(standings[1].lost).toBe(1);
      expect(standings[1].points).toBe(2);
      expect(standings[1].gameDiff).toBe(-1);
      expect(standings[1].rank).toBe(2);

      // Team 3 (Charlie): played 1, won 0, lost 1, pts 0
      expect(standings[2].teamName).toBe('Charlie');
      expect(standings[2].rank).toBe(3);
    });
  });

  describe('Knockout Bracket Generation', () => {
    it('generates Semi-Finals and Final for 2 pools', () => {
      const qualifiers = [
        { poolName: 'Pool A', winner: team1, runnerUp: team2 },
        { poolName: 'Pool B', winner: team3, runnerUp: team4 },
      ];

      const matches = generateKnockoutBracket('tourn-1', qualifiers, 'singles');
      expect(matches).toHaveLength(3); // SF1, SF2, Final

      const sf1 = matches.find(m => m.knockoutRound === 'semi' && m.knockoutMatchNumber === 1);
      const sf2 = matches.find(m => m.knockoutRound === 'semi' && m.knockoutMatchNumber === 2);
      const finalMatch = matches.find(m => m.knockoutRound === 'final');

      expect(sf1).toBeDefined();
      expect(sf2).toBeDefined();
      expect(finalMatch).toBeDefined();

      // SF 1 is Winner A vs Runner-up B
      expect(sf1?.teamA.players[0].name).toBe('Alice');
      expect(sf1?.teamB.players[0].name).toBe('David');
      expect(sf1?.knockoutNextMatchId).toBe(finalMatch?.id);
      expect(sf1?.knockoutSlot).toBe('A');

      // SF 2 is Winner B vs Runner-up A
      expect(sf2?.teamA.players[0].name).toBe('Charlie');
      expect(sf2?.teamB.players[0].name).toBe('Bob');
      expect(sf2?.knockoutNextMatchId).toBe(finalMatch?.id);
      expect(sf2?.knockoutSlot).toBe('B');
    });

    it('advances winner of Semi-Final into Final', () => {
      const qualifiers = [
        { poolName: 'Pool A', winner: team1, runnerUp: team2 },
        { poolName: 'Pool B', winner: team3, runnerUp: team4 },
      ];
      const matches = generateKnockoutBracket('tourn-1', qualifiers, 'singles');
      const sf1 = matches.find(m => m.knockoutRound === 'semi' && m.knockoutMatchNumber === 1)!;
      const finalMatch = matches.find(m => m.knockoutRound === 'final')!;

      const matchMap: Record<string, MatchState> = {};
      matches.forEach(m => { matchMap[m.id] = m; });

      // Alice (Team A) wins SF1
      const completedSF1: MatchState = {
        ...sf1,
        status: 'completed',
        games: [
          { scoreA: 21, scoreB: 10, winner: 'A' },
          { scoreA: 21, scoreB: 12, winner: 'A' },
        ],
      };

      const updatedFinal = advanceKnockoutWinner(completedSF1, matchMap);
      expect(updatedFinal).not.toBeNull();
      expect(updatedFinal?.teamA.players[0].name).toBe('Alice');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { checkGameWinner, addPoint, createInitialMatchState, undoLastPoint } from './scoring';
import { MatchSettings, Team, MatchState } from './types';

describe('Scoring Engine', () => {
  const settings: MatchSettings = {
    type: 'singles',
    bestOfGames: 3,
    pointsToWin: 21,
    winByTwo: true,
    capAt: 30
  };

  const teamA: Team = { id: 't1', players: [{ id: 'p1', name: 'Player 1' }] };
  const teamB: Team = { id: 't2', players: [{ id: 'p2', name: 'Player 2' }] };

  it('checks game winner correctly', () => {
    expect(checkGameWinner(21, 19, settings)).toBe('A');
    expect(checkGameWinner(20, 21, settings)).toBeUndefined();
    expect(checkGameWinner(20, 22, settings)).toBe('B');
    expect(checkGameWinner(29, 29, settings)).toBeUndefined();
    expect(checkGameWinner(30, 29, settings)).toBe('A'); // Cap at 30
  });

  it('progresses score and changes games', () => {
    let state = createInitialMatchState('m1', teamA, teamB, settings, 'A');
    
    // Win first game for A
    for (let i = 0; i < 21; i++) {
      state = addPoint(state, 'A');
    }
    
    expect(state.currentGame).toBe(2);
    expect(state.currentScoreA).toBe(0);
    expect(state.games.length).toBe(1);
    expect(state.games[0].winner).toBe('A');
    
    // A won the game, so A serves next
    expect(state.servingSide).toBe('A');
  });

  it('undoes points correctly including game transitions', () => {
    let state = createInitialMatchState('m1', teamA, teamB, settings, 'A');
    
    state = addPoint(state, 'A');
    state = addPoint(state, 'B');
    expect(state.currentScoreA).toBe(1);
    expect(state.currentScoreB).toBe(1);
    expect(state.servingSide).toBe('B');

    state = undoLastPoint(state);
    expect(state.currentScoreA).toBe(1);
    expect(state.currentScoreB).toBe(0);
    expect(state.servingSide).toBe('A');
  });
});

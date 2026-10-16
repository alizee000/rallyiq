import { describe, it, expect } from 'vitest';
import {
  generateRoundRobinMatches,
  getPoolTeams,
  generateFixturesForNewTeam,
  getMatchesInvolvingTeam,
  getTeamKey,
} from './tournamentEngine';
import { Team } from './types';

describe('Edit Pool Engine Helpers', () => {
  const team1: Team = { id: 't1', players: [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }] };
  const team2: Team = { id: 't2', players: [{ id: 'p3', name: 'Charlie' }, { id: 'p4', name: 'David' }] };
  const team3: Team = { id: 't3', players: [{ id: 'p5', name: 'Eve' }, { id: 'p6', name: 'Frank' }] };

  it('correctly extracts unique teams from existing pool matches', () => {
    const matches = generateRoundRobinMatches('tourney-1', 'Pool A', [team1, team2, team3], 'doubles');
    expect(matches.length).toBe(3); // 3 pairs

    const extractedTeams = getPoolTeams(matches, 'Pool A');
    expect(extractedTeams.length).toBe(3);
    const names = extractedTeams.map(t => t.players.map(p => p.name).join(' & '));
    expect(names).toContain('Alice & Bob');
    expect(names).toContain('Charlie & David');
    expect(names).toContain('Eve & Frank');
  });

  it('generates fixtures between new team and all existing teams', () => {
    const initialMatches = generateRoundRobinMatches('tourney-1', 'Pool A', [team1, team2], 'doubles');
    const existingTeams = getPoolTeams(initialMatches, 'Pool A');

    const newMatches = generateFixturesForNewTeam(
      'tourney-1',
      'Pool A',
      team3,
      existingTeams,
      'doubles',
      "Women's Doubles"
    );

    // team3 vs team1, team3 vs team2 = 2 matches
    expect(newMatches.length).toBe(2);
    expect(newMatches.every(m => m.pool === 'Pool A')).toBe(true);
    expect(newMatches.every(m => m.category === "Women's Doubles")).toBe(true);
  });

  it('finds all matches involving a specific team in a pool', () => {
    const matches = generateRoundRobinMatches('tourney-1', 'Pool A', [team1, team2, team3], 'doubles');
    const team1Matches = getMatchesInvolvingTeam(matches, 'Pool A', getTeamKey(team1));
    expect(team1Matches.length).toBe(2); // team1 plays team2, team1 plays team3
  });

  it('correctly isolates pool teams when two categories share identical pool names (Pool A)', () => {
    const msTeam1: Team = { id: 'ms1', players: [{ id: 'p1', name: 'John' }] };
    const msTeam2: Team = { id: 'ms2', players: [{ id: 'p2', name: 'Mike' }] };
    const wdTeam1: Team = { id: 'wd1', players: [{ id: 'p3', name: 'Sara' }, { id: 'p4', name: 'Emma' }] };
    const wdTeam2: Team = { id: 'wd2', players: [{ id: 'p5', name: 'Chloe' }, { id: 'p6', name: 'Zoe' }] };

    const msMatches = generateRoundRobinMatches('tourney-1', 'Pool A', [msTeam1, msTeam2], 'singles', "Men's Singles");
    const wdMatches = generateRoundRobinMatches('tourney-1', 'Pool A', [wdTeam1, wdTeam2], 'doubles', "Women's Doubles");
    const allMatches = [...msMatches, ...wdMatches];

    // Teams for Men's Singles Pool A should ONLY be msTeam1 and msTeam2
    const msPoolTeams = getPoolTeams(allMatches, 'Pool A', "Men's Singles");
    expect(msPoolTeams.length).toBe(2);
    expect(msPoolTeams.map(t => t.players[0].name)).toEqual(['John', 'Mike']);

    // Teams for Women's Doubles Pool A should ONLY be wdTeam1 and wdTeam2
    const wdPoolTeams = getPoolTeams(allMatches, 'Pool A', "Women's Doubles");
    expect(wdPoolTeams.length).toBe(2);
    expect(wdPoolTeams.map(t => t.players.map(p => p.name).join(' & '))).toEqual(['Sara & Emma', 'Chloe & Zoe']);
  });
});

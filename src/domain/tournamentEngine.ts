import { v4 as uuidv4 } from 'uuid';
import { MatchState, MatchType, MatchSettings, Team, PoolStanding } from './types';
import { createInitialMatchState } from './scoring';

export const getTeamDisplayName = (team: Team): string => {
  if (!team || !team.players || team.players.length === 0) return 'TBD';
  return team.players.map(p => p.name).join(' & ');
};

export const getTeamKey = (team: Team): string => {
  if (!team || !team.players || team.players.length === 0) return team.id || 'tbd';
  return team.players.map(p => p.name.trim().toLowerCase()).sort().join(' & ');
};

export const getMatchWinnerSide = (match: MatchState): 'A' | 'B' | null => {
  if (match.status !== 'completed' && match.status !== 'retired') return null;
  
  const gamesWonA = match.games.filter(g => g.winner === 'A').length;
  const gamesWonB = match.games.filter(g => g.winner === 'B').length;
  
  if (gamesWonA > gamesWonB) return 'A';
  if (gamesWonB > gamesWonA) return 'B';
  
  // Fallback for matches ended with partial game
  if (match.currentScoreA > match.currentScoreB) return 'A';
  if (match.currentScoreB > match.currentScoreA) return 'B';
  return null;
};

/**
 * Calculates pool standings dynamically from all matches belonging to a specific pool (and optional category).
 */
export const calculatePoolStandings = (matches: MatchState[], poolName: string, category?: string): PoolStanding[] => {
  const poolMatches = matches.filter(m => {
    const matchesPool = m.pool?.trim().toLowerCase() === poolName.trim().toLowerCase();
    const matchesCategory = !category || m.category?.trim().toLowerCase() === category.trim().toLowerCase();
    return matchesPool && matchesCategory;
  });
  
  // Collect all unique teams participating in this pool
  const teamMap: Record<string, Team> = {};
  poolMatches.forEach(m => {
    if (m.teamA && m.teamA.players && m.teamA.players.length > 0) {
      const keyA = getTeamKey(m.teamA);
      if (!teamMap[keyA]) teamMap[keyA] = m.teamA;
    }
    if (m.teamB && m.teamB.players && m.teamB.players.length > 0) {
      const keyB = getTeamKey(m.teamB);
      if (!teamMap[keyB]) teamMap[keyB] = m.teamB;
    }
  });

  const standingsMap: Record<string, PoolStanding> = {};

  Object.entries(teamMap).forEach(([key, team]) => {
    standingsMap[key] = {
      team,
      teamName: getTeamDisplayName(team),
      played: 0,
      won: 0,
      lost: 0,
      gamesWon: 0,
      gamesLost: 0,
      gameDiff: 0,
      pointsWon: 0,
      pointsLost: 0,
      pointDiff: 0,
      points: 0,
      rank: 0,
    };
  });

  // Calculate statistics from completed matches
  poolMatches.forEach(m => {
    if (m.status !== 'completed') return;

    const keyA = getTeamKey(m.teamA);
    const keyB = getTeamKey(m.teamB);
    const standingA = standingsMap[keyA];
    const standingB = standingsMap[keyB];

    if (!standingA || !standingB) return;

    standingA.played += 1;
    standingB.played += 1;

    let matchGW_A = 0;
    let matchGW_B = 0;
    let matchPW_A = 0;
    let matchPW_B = 0;

    m.games.forEach(g => {
      matchPW_A += g.scoreA;
      matchPW_B += g.scoreB;
      if (g.winner === 'A') matchGW_A += 1;
      else if (g.winner === 'B') matchGW_B += 1;
    });

    standingA.gamesWon += matchGW_A;
    standingA.gamesLost += matchGW_B;
    standingA.pointsWon += matchPW_A;
    standingA.pointsLost += matchPW_B;

    standingB.gamesWon += matchGW_B;
    standingB.gamesLost += matchGW_A;
    standingB.pointsWon += matchPW_B;
    standingB.pointsLost += matchPW_A;

    const winnerSide = getMatchWinnerSide(m);
    if (winnerSide === 'A') {
      standingA.won += 1;
      standingA.points += 2;
      standingB.lost += 1;
    } else if (winnerSide === 'B') {
      standingB.won += 1;
      standingB.points += 2;
      standingA.lost += 1;
    }
  });

  // Calculate differentials
  Object.values(standingsMap).forEach(s => {
    s.gameDiff = s.gamesWon - s.gamesLost;
    s.pointDiff = s.pointsWon - s.pointsLost;
  });

  // Sort standings: Points DESC -> Game Difference DESC -> Point Difference DESC -> Points Won DESC
  const sorted = Object.values(standingsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return b.pointsWon - a.pointsWon;
  });

  // Assign ranks
  sorted.forEach((item, index) => {
    item.rank = index + 1;
  });

  return sorted;
};

/**
 * Generates all round-robin fixtures between teams in a pool.
 */
export const generateRoundRobinMatches = (
  tournamentId: string,
  poolName: string,
  teams: Team[],
  matchType: MatchType,
  category?: string,
  settingsOverride?: Partial<MatchSettings>
): MatchState[] => {
  const settings: MatchSettings = {
    type: matchType,
    bestOfGames: 3,
    pointsToWin: 21,
    winByTwo: true,
    capAt: 30,
    ...settingsOverride,
  };

  const matches: MatchState[] = [];

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const match = createInitialMatchState(uuidv4(), teams[i], teams[j], settings, 'A');
      match.tournamentId = tournamentId;
      match.status = 'setup';
      match.stage = 'League Match';
      match.pool = poolName.trim();
      if (category) match.category = category.trim();
      matches.push(match);
    }
  }

  return matches;
};

export type PoolQualifier = {
  poolName: string;
  category?: string;
  winner: Team;
  runnerUp: Team;
};

/**
 * Creates a placeholder team with a label (e.g. "Winner of SF 1").
 */
export const createPlaceholderTeam = (label: string): Team => ({
  id: uuidv4(),
  players: [{ id: uuidv4(), name: label }],
});

/**
 * Generates knockout matches from top-2 qualifiers of each pool.
 * Automatically wires up links so winner of SF1 advances to Final Team A, etc.
 */
export const generateKnockoutBracket = (
  tournamentId: string,
  qualifiers: PoolQualifier[],
  matchType: MatchType,
  category?: string,
  settingsOverride?: Partial<MatchSettings>
): MatchState[] => {
  const settings: MatchSettings = {
    type: matchType,
    bestOfGames: 3,
    pointsToWin: 21,
    winByTwo: true,
    capAt: 30,
    ...settingsOverride,
  };

  const matches: MatchState[] = [];

  // Scenario 1: Exactly 1 Pool (Top 2 play the Final directly)
  if (qualifiers.length === 1) {
    const q = qualifiers[0];
    const finalMatch = createInitialMatchState(uuidv4(), q.winner, q.runnerUp, settings, 'A');
    finalMatch.tournamentId = tournamentId;
    finalMatch.status = 'setup';
    finalMatch.stage = 'Final';
    finalMatch.knockoutRound = 'final';
    finalMatch.knockoutMatchNumber = 1;
    matches.push(finalMatch);
    return matches;
  }

  // Scenario 2: Exactly 2 Pools (Pool A & Pool B -> 4 teams -> Semi-Finals & Final)
  if (qualifiers.length === 2) {
    const [poolA, poolB] = qualifiers;

    const finalMatchId = uuidv4();

    // SF 1: Winner Pool A vs Runner-up Pool B
    const sf1 = createInitialMatchState(uuidv4(), poolA.winner, poolB.runnerUp, settings, 'A');
    sf1.tournamentId = tournamentId;
    sf1.status = 'setup';
    sf1.stage = 'Semi Final';
    sf1.knockoutRound = 'semi';
    sf1.knockoutMatchNumber = 1;
    sf1.knockoutNextMatchId = finalMatchId;
    sf1.knockoutSlot = 'A';

    // SF 2: Winner Pool B vs Runner-up Pool A
    const sf2 = createInitialMatchState(uuidv4(), poolB.winner, poolA.runnerUp, settings, 'A');
    sf2.tournamentId = tournamentId;
    sf2.status = 'setup';
    sf2.stage = 'Semi Final';
    sf2.knockoutRound = 'semi';
    sf2.knockoutMatchNumber = 2;
    sf2.knockoutNextMatchId = finalMatchId;
    sf2.knockoutSlot = 'B';

    // Final Match (Teams initially placeholder until SFs conclude)
    const finalMatch = createInitialMatchState(
      finalMatchId,
      createPlaceholderTeam('Winner of SF 1'),
      createPlaceholderTeam('Winner of SF 2'),
      settings,
      'A'
    );
    finalMatch.tournamentId = tournamentId;
    finalMatch.status = 'setup';
    finalMatch.stage = 'Final';
    finalMatch.knockoutRound = 'final';
    finalMatch.knockoutMatchNumber = 1;

    matches.push(sf1, sf2, finalMatch);
    return matches;
  }

  // Scenario 3: 4 Pools (Pool A, B, C, D -> 8 teams -> Quarter-Finals, Semi-Finals & Final)
  if (qualifiers.length === 4) {
    const [pA, pB, pC, pD] = qualifiers;

    const finalMatchId = uuidv4();
    const sf1Id = uuidv4();
    const sf2Id = uuidv4();

    // QF 1: 1st A vs 2nd B -> to SF 1 Slot A
    const qf1 = createInitialMatchState(uuidv4(), pA.winner, pB.runnerUp, settings, 'A');
    qf1.tournamentId = tournamentId;
    qf1.status = 'setup';
    qf1.stage = 'Quarter Final';
    qf1.knockoutRound = 'quarter';
    qf1.knockoutMatchNumber = 1;
    qf1.knockoutNextMatchId = sf1Id;
    qf1.knockoutSlot = 'A';

    // QF 2: 1st C vs 2nd D -> to SF 1 Slot B
    const qf2 = createInitialMatchState(uuidv4(), pC.winner, pD.runnerUp, settings, 'A');
    qf2.tournamentId = tournamentId;
    qf2.status = 'setup';
    qf2.stage = 'Quarter Final';
    qf2.knockoutRound = 'quarter';
    qf2.knockoutMatchNumber = 2;
    qf2.knockoutNextMatchId = sf1Id;
    qf2.knockoutSlot = 'B';

    // QF 3: 1st B vs 2nd A -> to SF 2 Slot A
    const qf3 = createInitialMatchState(uuidv4(), pB.winner, pA.runnerUp, settings, 'A');
    qf3.tournamentId = tournamentId;
    qf3.status = 'setup';
    qf3.stage = 'Quarter Final';
    qf3.knockoutRound = 'quarter';
    qf3.knockoutMatchNumber = 3;
    qf3.knockoutNextMatchId = sf2Id;
    qf3.knockoutSlot = 'A';

    // QF 4: 1st D vs 2nd C -> to SF 2 Slot B
    const qf4 = createInitialMatchState(uuidv4(), pD.winner, pC.runnerUp, settings, 'A');
    qf4.tournamentId = tournamentId;
    qf4.status = 'setup';
    qf4.stage = 'Quarter Final';
    qf4.knockoutRound = 'quarter';
    qf4.knockoutMatchNumber = 4;
    qf4.knockoutNextMatchId = sf2Id;
    qf4.knockoutSlot = 'B';

    // SF 1
    const sf1 = createInitialMatchState(
      sf1Id,
      createPlaceholderTeam('Winner of QF 1'),
      createPlaceholderTeam('Winner of QF 2'),
      settings,
      'A'
    );
    sf1.tournamentId = tournamentId;
    sf1.status = 'setup';
    sf1.stage = 'Semi Final';
    sf1.knockoutRound = 'semi';
    sf1.knockoutMatchNumber = 1;
    sf1.knockoutNextMatchId = finalMatchId;
    sf1.knockoutSlot = 'A';

    // SF 2
    const sf2 = createInitialMatchState(
      sf2Id,
      createPlaceholderTeam('Winner of QF 3'),
      createPlaceholderTeam('Winner of QF 4'),
      settings,
      'A'
    );
    sf2.tournamentId = tournamentId;
    sf2.status = 'setup';
    sf2.stage = 'Semi Final';
    sf2.knockoutRound = 'semi';
    sf2.knockoutMatchNumber = 2;
    sf2.knockoutNextMatchId = finalMatchId;
    sf2.knockoutSlot = 'B';

    // Final
    const finalMatch = createInitialMatchState(
      finalMatchId,
      createPlaceholderTeam('Winner of SF 1'),
      createPlaceholderTeam('Winner of SF 2'),
      settings,
      'A'
    );
    finalMatch.tournamentId = tournamentId;
    finalMatch.status = 'setup';
    finalMatch.stage = 'Final';
    finalMatch.knockoutRound = 'final';
    finalMatch.knockoutMatchNumber = 1;

    matches.push(qf1, qf2, qf3, qf4, sf1, sf2, finalMatch);
    return matches;
  }

  // General fallback for N pools: Pair adjacent pools in Semi-Finals or Finals
  const finalMatchId = uuidv4();
  qualifiers.forEach((q, idx) => {
    const match = createInitialMatchState(uuidv4(), q.winner, q.runnerUp, settings, 'A');
    match.tournamentId = tournamentId;
    match.status = 'setup';
    match.stage = qualifiers.length > 2 ? 'Quarter Final' : 'Semi Final';
    match.knockoutRound = qualifiers.length > 2 ? 'quarter' : 'semi';
    match.knockoutMatchNumber = idx + 1;
    matches.push(match);
  });

  if (category) {
    matches.forEach(m => {
      m.category = category.trim();
    });
  }

  return matches;
};

/**
 * When a match completes, checks if the winner advances to a downstream knockout match.
 * Returns the modified target match if one was updated, or null.
 */
export const advanceKnockoutWinner = (
  completedMatch: MatchState,
  allMatches: Record<string, MatchState>
): MatchState | null => {
  if (!completedMatch.knockoutNextMatchId || !completedMatch.knockoutSlot) return null;

  const targetMatch = allMatches[completedMatch.knockoutNextMatchId];
  if (!targetMatch) return null;

  const winnerSide = getMatchWinnerSide(completedMatch);
  if (!winnerSide) return null;

  const winningTeam = winnerSide === 'A' ? completedMatch.teamA : completedMatch.teamB;

  const updatedTarget: MatchState = JSON.parse(JSON.stringify(targetMatch));
  if (completedMatch.knockoutSlot === 'A') {
    updatedTarget.teamA = winningTeam;
  } else {
    updatedTarget.teamB = winningTeam;
  }

  return updatedTarget;
};

/**
 * Extracts all unique teams participating in a pool.
 */
export const getPoolTeams = (matches: MatchState[], poolName: string, category?: string): Team[] => {
  const poolMatches = matches.filter(m => {
    const matchesPool = m.pool?.trim().toLowerCase() === poolName.trim().toLowerCase();
    const matchesCategory = !category || m.category?.trim().toLowerCase() === category.trim().toLowerCase();
    return matchesPool && matchesCategory;
  });

  const teamMap: Record<string, Team> = {};
  poolMatches.forEach(m => {
    if (m.teamA?.players?.length) {
      const keyA = getTeamKey(m.teamA);
      if (!teamMap[keyA]) teamMap[keyA] = m.teamA;
    }
    if (m.teamB?.players?.length) {
      const keyB = getTeamKey(m.teamB);
      if (!teamMap[keyB]) teamMap[keyB] = m.teamB;
    }
  });

  return Object.values(teamMap);
};

/**
 * Generates round-robin matches when a new team is added to an existing pool.
 * It pairs the new team with each of the existing teams.
 */
export const generateFixturesForNewTeam = (
  tournamentId: string,
  poolName: string,
  newTeam: Team,
  existingTeams: Team[],
  matchType: MatchType,
  category?: string,
  settingsOverride?: Partial<MatchSettings>
): MatchState[] => {
  const settings: MatchSettings = {
    type: matchType,
    bestOfGames: 3,
    pointsToWin: 21,
    winByTwo: true,
    capAt: 30,
    ...settingsOverride,
  };

  const newKey = getTeamKey(newTeam);
  const matches: MatchState[] = [];

  existingTeams.forEach(otherTeam => {
    if (getTeamKey(otherTeam) === newKey) return; // avoid self-match

    const match = createInitialMatchState(uuidv4(), otherTeam, newTeam, settings, 'A');
    match.tournamentId = tournamentId;
    match.status = 'setup';
    match.stage = 'League Match';
    match.pool = poolName.trim();
    if (category) match.category = category.trim();
    matches.push(match);
  });

  return matches;
};

/**
 * Finds all matches in a pool that involve a specific team (by id or team key).
 */
export const getMatchesInvolvingTeam = (
  matches: MatchState[],
  poolName: string,
  teamIdentifier: string
): MatchState[] => {
  const target = teamIdentifier.trim().toLowerCase();
  return matches.filter(m => {
    if (m.pool?.trim().toLowerCase() !== poolName.trim().toLowerCase()) return false;
    const isTeamA = m.teamA?.id === target || getTeamKey(m.teamA) === target;
    const isTeamB = m.teamB?.id === target || getTeamKey(m.teamB) === target;
    return isTeamA || isTeamB;
  });
};


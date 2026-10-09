import { MatchState, Side, PointEventDetails, PointEvent } from './types';
import { v4 as uuidv4 } from 'uuid';

export const createInitialMatchState = (
  id: string,
  teamA: import('./types').Team,
  teamB: import('./types').Team,
  settings: import('./types').MatchSettings,
  startingSide: Side,
  startingServerA?: string,
  startingServerB?: string
): MatchState => {
  return {
    id,
    status: 'playing',
    settings,
    teamA,
    teamB,
    currentGame: 1,
    currentScoreA: 0,
    currentScoreB: 0,
    games: [],
    servingSide: startingSide,
    serverA: startingServerA || teamA.players[0]?.id,
    serverB: startingServerB || teamB.players[0]?.id,
    receiverA: teamA.players[1]?.id || teamA.players[0]?.id, // Doubles logic: 2nd player
    receiverB: teamB.players[1]?.id || teamB.players[0]?.id,
    history: [],
  };
};

export const checkGameWinner = (scoreA: number, scoreB: number, settings: import('./types').MatchSettings): Side | undefined => {
  const { pointsToWin, winByTwo, capAt } = settings;
  
  if (scoreA >= capAt) return 'A';
  if (scoreB >= capAt) return 'B';

  if (scoreA >= pointsToWin) {
    if (!winByTwo || (scoreA - scoreB >= 2)) return 'A';
  }
  if (scoreB >= pointsToWin) {
    if (!winByTwo || (scoreB - scoreA >= 2)) return 'B';
  }
  
  return undefined;
};

export const addPoint = (
  state: MatchState,
  scoringSide: Side,
  details?: PointEventDetails
): MatchState => {
  if (state.status !== 'playing') return state;

  const newState = JSON.parse(JSON.stringify(state)) as MatchState; // Deep copy for simplicity
  
  // Create history event
  const event: PointEvent = {
    id: uuidv4(),
    timestamp: Date.now(),
    gameNumber: state.currentGame,
    scoringSide,
    details,
    previousStateSnapshot: {
      currentScoreA: state.currentScoreA,
      currentScoreB: state.currentScoreB,
      servingSide: state.servingSide,
      serverA: state.serverA,
      serverB: state.serverB,
      receiverA: state.receiverA,
      receiverB: state.receiverB,
    }
  };

  newState.history.push(event);

  // Update Score
  if (scoringSide === 'A') {
    newState.currentScoreA += 1;
  } else {
    newState.currentScoreB += 1;
  }

  // Handle service rotation
  if (scoringSide === state.servingSide) {
    // Serving side won the point.
    // In singles, they just switch courts (conceptually, the server stays the same, just serves from the other side).
    // In doubles, the server and receiver of the serving team swap positions.
    if (state.settings.type === 'doubles') {
      if (scoringSide === 'A') {
        const temp = newState.serverA;
        newState.serverA = newState.receiverA;
        newState.receiverA = temp;
      } else {
        const temp = newState.serverB;
        newState.serverB = newState.receiverB;
        newState.receiverB = temp;
      }
    }
  } else {
    // Receiving side won the point. Service changes over.
    newState.servingSide = scoringSide;
    // The new server is determined by the parity of their new score.
    // In badminton, even score -> right court, odd score -> left court.
    // We assume the players stayed in their last known positions.
    // This requires tracking court positions explicitly, but a simplified approach 
    // without explicit court tracking uses the fact that player positions only change
    // when THEIR team scores while serving.
    // If they were receiving, they just use whichever player is currently in the correct court.
    // This is hard to do perfectly without tracking L/R court explicitly.
    
    // For this engine, we will track who is server and who is receiver.
    // When they win the serve, the player who is supposed to be in the court
    // matching the score's parity becomes the server.
    // Actually, a simpler robust way:
    // When team A loses serve, A's positions don't change.
    // When team B wins serve, their score dictates who serves based on their positions.
    // But since we only swap when scoring *on serve*, we can just say:
    // "The player who didn't serve last time for this team serves next" - NO!
    // Correct rule: If you win the point while receiving, you don't swap. The player in the appropriate court serves.
    // For our state, `server` and `receiver` variables represent the roles.
    // We will just swap them if it's doubles to simulate the other person serving if needed? 
    // No, let's keep it simple: we can allow the user to override the server via UI if it gets out of sync,
    // or just assume: `server` is the one who served last for that team. If they win the serve back, it's the OTHER player.
    // Yes! In traditional doubles, if you win serve back, it's always the other partner who serves next compared to your team's last server.
    if (state.settings.type === 'doubles') {
      if (scoringSide === 'A') {
        const temp = newState.serverA;
        newState.serverA = newState.receiverA;
        newState.receiverA = temp;
      } else {
        const temp = newState.serverB;
        newState.serverB = newState.receiverB;
        newState.receiverB = temp;
      }
    }
  }

  // Check game completion
  const gameWinner = checkGameWinner(newState.currentScoreA, newState.currentScoreB, newState.settings);
  
  if (gameWinner) {
    newState.games.push({
      scoreA: newState.currentScoreA,
      scoreB: newState.currentScoreB,
      winner: gameWinner
    });

    const gamesWonA = newState.games.filter(g => g.winner === 'A').length;
    const gamesWonB = newState.games.filter(g => g.winner === 'B').length;
    const requiredGamesToWin = Math.ceil(newState.settings.bestOfGames / 2);

    if (gamesWonA >= requiredGamesToWin || gamesWonB >= requiredGamesToWin) {
      newState.status = 'completed';
    } else {
      // Start next game
      newState.currentGame += 1;
      newState.currentScoreA = 0;
      newState.currentScoreB = 0;
      // Loser of this game serves first in the next game conceptually, 
      // wait, no: the WINNER of the game serves first in the next game.
      newState.servingSide = gameWinner;
    }
  }

  return newState;
};

export const undoLastPoint = (state: MatchState): MatchState => {
  if (state.history.length === 0) return state;
  
  const newState = JSON.parse(JSON.stringify(state)) as MatchState;
  const lastEvent = newState.history.pop()!;
  
  // Restore previous score and service state
  const prev = lastEvent.previousStateSnapshot;
  newState.currentScoreA = prev.currentScoreA;
  newState.currentScoreB = prev.currentScoreB;
  newState.servingSide = prev.servingSide;
  newState.serverA = prev.serverA;
  newState.serverB = prev.serverB;
  newState.receiverA = prev.receiverA;
  newState.receiverB = prev.receiverB;

  // Handle undoing a game completion
  if (newState.status === 'completed') {
    newState.status = 'playing';
    newState.games.pop();
  } else if (newState.currentGame > lastEvent.gameNumber) {
    newState.currentGame = lastEvent.gameNumber;
    newState.games.pop();
  }

  return newState;
};

import { PointEvent, MatchState } from './types';

// Improved hash for better distribution
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return Math.abs(hash);
};

const pickRandom = (arr: string[], id: string) => arr[hashString(id) % arr.length];

export const generateCommentary = (event: PointEvent, match: MatchState): string => {
  const isA = event.scoringSide === 'A';
  const scoringTeam = isA ? match.teamA : match.teamB;
  const losingTeam = isA ? match.teamB : match.teamA;
  
  const winner = scoringTeam.players.map(p => p.name).join(' & ');
  const loser = losingTeam.players.map(p => p.name).join(' & ');
  
  const scoreA = event.previousStateSnapshot.currentScoreA;
  const scoreB = event.previousStateSnapshot.currentScoreB;
  
  const { details } = event;
  let text = `Point to ${winner}.`;
  
  if (details) {
    const shot = details.shotType && details.shotType !== 'N/A (Unforced)' ? details.shotType.toLowerCase() : '';
    const err = details.errorType ? details.errorType.toLowerCase() : '';

    if (details.outcomeType === 'winner') {
      const templates = [
        `Boom! ${winner} unleashes a devastating ${shot || 'strike'}, leaving ${loser} grasping at air.`,
        `Absolute perfection. A brilliant ${shot || 'shot'} from ${winner} that ${loser} had absolutely no answer for.`,
        `What a rally! ${winner} finishes it off with a clinical ${shot || 'winner'} down the line.`,
        `${loser} is left stranded as ${winner} produces a majestic ${shot || 'winner'}.`,
        `Textbook execution by ${winner}. The ${shot || 'shot'} is placed perfectly for a clean winner.`,
        `You can't defend that. ${winner} finds the gap with a sublime ${shot || 'shot'}.`,
        `That is world-class from ${winner}! A thunderous ${shot || 'winner'} to end the point.`,
        `${winner} catches ${loser} completely off guard with a sneaky ${shot || 'shot'}.`,
        `Beautiful touch from ${winner}, guiding the ${shot || 'shuttle'} into the open court.`,
        `A masterclass in placement! ${winner}'s ${shot || 'winner'} is simply too good.`,
        `${winner} steps up and absolutely buries that ${shot || 'opportunity'}. No chance for ${loser}.`,
        `Just watch the wrist work there. ${winner} disguises the ${shot || 'shot'} beautifully.`,
        `Pinpoint accuracy! ${winner} lands the ${shot || 'winner'} right on the line.`,
        `${loser} covers the court well, but ${winner}'s ${shot || 'shot'} is just out of reach.`,
        `That's a highlight reel ${shot || 'winner'} from ${winner}! Unbelievable stuff.`
      ];
      text = pickRandom(templates, event.id);

    } else if (details.outcomeType === 'unforced_error') {
      const templates = [
        `A momentary lapse in concentration for ${loser}, sending the shuttle ${err || 'wide'}. Point gifted to ${winner}.`,
        `${loser} will be disappointed with that one. An unforced error gives ${winner} a free point.`,
        `Uncharacteristic mistake from ${loser}. The shot goes ${err || 'astray'}, letting ${winner} off the hook.`,
        `Easy point for ${winner} as ${loser} misjudges the flight and commits a costly ${err || 'error'}.`,
        `${loser} tries to be too cute with the ${shot || 'shot'} but it results in a frustrating ${err || 'fault'}.`,
        `That's a freebie for ${winner}. ${loser} completely mis-hits the shuttle.`,
        `${loser} looks at the racket in disbelief. A basic ${err || 'error'} hands the point to ${winner}.`,
        `You can hear the frustration from ${loser}. Pushing the shot just a bit too far ${err || 'out'}.`,
        `${winner} doesn't even have to work for that one. ${loser} dumps the return right into the net.`,
        `A rush of blood to the head for ${loser}, going for too much and missing ${err || 'the mark'}.`,
        `Sloppy play from ${loser} here. That shot was never on.`,
        `${loser} will want that one back. An easy put-away inexplicably goes ${err || 'wrong'}.`,
        `The pressure might be telling. ${loser} frames the shot for an ugly error.`,
        `A rare miscalculation by ${loser}, letting the shuttle drift ${err || 'out'}.`,
        `${winner} gladly accepts the gift as ${loser}'s attempt fails to clear the tape.`
      ];
      text = pickRandom(templates, event.id);

    } else if (details.outcomeType === 'forced_error') {
      const templates = [
        `${winner} dictates the pace with a heavy ${shot || 'shot'}, forcing ${loser} into a desperate ${err || 'error'}.`,
        `Incredible pressure applied by ${winner}'s attack, and ${loser}'s defense finally cracks.`,
        `The ${shot || 'shot'} from ${winner} is just too good, leaving ${loser} stretching and committing a forced error.`,
        `${winner} pins ${loser} deep into the court. The resulting ${err || 'error'} was almost inevitable.`,
        `Brilliant offensive play by ${winner}. They rip a ${shot || 'shot'} that completely overpowers ${loser}'s defenses.`,
        `${loser} does incredibly well to even get a racket on it, but ${winner}'s ${shot || 'shot'} is just too aggressive.`,
        `Relentless attacking from ${winner}! ${loser} defends valiantly but eventually succumbs to a ${err || 'mistake'}.`,
        `That ${shot || 'shot'} had so much venom on it. ${loser} could only pop it up for a ${err || 'fault'}.`,
        `${winner} forces the issue with a sharp angle, and ${loser} can't scramble back in time.`,
        `Great tactical play by ${winner}, exposing the open space and forcing a hasty ${err || 'error'} from ${loser}.`,
        `The pace is frightening right now. ${winner}'s ${shot || 'shot'} induces a panicked return from ${loser}.`,
        `${loser} is scrambling all over the court. ${winner}'s ${shot || 'shot'} finally breaks their resistance.`,
        `A vicious ${shot || 'shot'} right at the body! ${loser} is tied up and sends it ${err || 'wide'}.`,
        `${winner} strings together a beautiful combination, ending with a ${shot || 'shot'} that forces the ${err || 'error'}.`,
        `You have to applaud the setup from ${winner}. The ${shot || 'shot'} leaves ${loser} with zero options.`
      ];
      text = pickRandom(templates, event.id);

    } else if (details.outcomeType === 'service_fault') {
      const templates = [
        `Disaster for ${loser} as they commit a service fault.`,
        `${loser} hands the serve right back with a careless service error.`,
        `A complete misfire on the serve from ${loser}. ${winner} will gladly take that.`,
      ];
      text = pickRandom(templates, event.id);

    } else {
      if (shot && err) {
        const templates = [
          `${winner} plays a solid ${shot}, and ${loser} blinks first with a ${err}.`,
          `The ${shot} by ${winner} proves tricky, as ${loser} faults with a ${err}.`,
          `${loser} attempts to handle the ${shot} but sends it ${err}. Point to ${winner}.`,
          `A probing ${shot} from ${winner} draws a ${err} error from ${loser}.`,
          `${winner} keeps it simple with a ${shot}, waiting for ${loser} to make the ${err} mistake.`
        ];
        text = pickRandom(templates, event.id);
      } else if (shot) {
        text = `Point to ${winner} after a solid ${shot}.`;
      } else if (err) {
        text = `${loser} makes a ${err} error, handing the point to ${winner}.`;
      }
    }
  }

  // Add game point / match point context dynamically
  const nextScoreA = isA ? scoreA + 1 : scoreA;
  const nextScoreB = isA ? scoreB : scoreB + 1;
  const { pointsToWin, winByTwo, capAt } = match.settings;

  const isGamePoint = (s: number, opp: number) => {
    if (s === capAt - 1) return true;
    if (s >= pointsToWin - 1 && (!winByTwo || s - opp >= 1)) return true;
    return false;
  };

  if ((isA && isGamePoint(nextScoreA, nextScoreB)) || (!isA && isGamePoint(nextScoreB, nextScoreA))) {
    const gpTemplates = [
      ` And with that, it's Game Point!`,
      ` Crucial moment now... Game Point for ${winner}.`,
      ` They are one point away from taking the game!`,
      ` Pressure is mounting. Game Point!`,
      ` The finish line is in sight for ${winner}. Game Point.`
    ];
    text += pickRandom(gpTemplates, event.id + 'gp');
  }

  return text;
};

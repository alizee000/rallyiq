import { TournamentPlayer } from '../domain/types';

export interface PlayoFetchResult {
  success: boolean;
  activity: {
    id: string;
    venue: string;
    date: string;
    startTime?: string;
    endTime?: string;
    sport?: string;
    maxPlayers?: number;
    host?: {
      id: string;
      name: string;
      profilePicUrl?: string | null;
    } | null;
    joinedCount: number;
    players: Array<{
      id: string;
      name: string;
      profilePicUrl?: string | null;
      count: number;
      link?: string | null;
    }>;
  };
  error?: string;
}

/**
 * Fetch Playo activity details via backend serverless / dev API endpoint
 */
export async function fetchPlayoActivity(url: string): Promise<PlayoFetchResult> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error('Please enter a valid Playo activity link');
  }

  const endpoint = `/api/playo?url=${encodeURIComponent(trimmed)}`;
  const response = await fetch(endpoint);

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Failed to fetch activity from Playo (${response.status})`);
  }

  if (!data?.success || !data?.activity) {
    throw new Error(data?.error || 'Invalid activity data received from Playo');
  }

  return data as PlayoFetchResult;
}

/**
 * Parses raw text copied from WhatsApp or Playo into TournamentPlayer items.
 * Example formats handled:
 * 1. Monali
 * 2) Vishruth Ramesh
 * • Frigewin J
 * Abhishek Sahu (+1)
 */
export function parseRawPlayerText(rawText: string): TournamentPlayer[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/);
  const result: TournamentPlayer[] = [];

  for (const line of lines) {
    let clean = line.trim();
    if (!clean) continue;

    // Remove leading numbering like "1.", "1)", "1 -", "[1]", "•", "-", "*"
    clean = clean.replace(/^(?:\[?\d+[.)\]\s-]*|[•\-\*]\s*)/, '').trim();

    // Skip empty lines or obvious header lines
    if (!clean || clean.toLowerCase().startsWith('players:') || clean.toLowerCase().startsWith('joined:')) {
      continue;
    }

    // Detect guest count e.g. "(+1)" or "+ 1"
    const guestMatch = clean.match(/\(\+(\d+)\)|\+(\d+)\s*(?:guest|more)?/i);
    let guestCount = 0;
    if (guestMatch) {
      guestCount = parseInt(guestMatch[1] || guestMatch[2] || '1', 10);
      clean = clean.replace(guestMatch[0], '').trim();
    }

    if (!clean) continue;

    const baseId = Math.random().toString(36).substring(2, 9);
    result.push({
      id: baseId,
      name: clean,
      guestCount: guestCount > 0 ? guestCount : undefined,
    });

    // Expand guests if any
    for (let g = 1; g <= guestCount; g++) {
      result.push({
        id: `${baseId}-guest-${g}`,
        name: `${clean} (Guest ${g})`,
      });
    }
  }

  return result;
}

/**
 * Normalizes Playo players array into TournamentPlayer items,
 * expanding any attendee who brought +1 / +2 guests.
 */
export function expandPlayoPlayers(
  playoPlayers: PlayoFetchResult['activity']['players'],
  hostId?: string
): TournamentPlayer[] {
  const result: TournamentPlayer[] = [];

  for (const p of playoPlayers) {
    const isHost = hostId ? p.id === hostId : false;
    result.push({
      id: p.id,
      name: p.name,
      avatarUrl: p.profilePicUrl || undefined,
      playoId: p.id,
      guestCount: p.count > 1 ? p.count - 1 : undefined,
      isHost,
    });

    // If participant RSVP'd for more than 1 (count > 1), expand additional spots
    if (p.count > 1) {
      for (let g = 1; g < p.count; g++) {
        result.push({
          id: `${p.id}-guest-${g}`,
          name: `${p.name} (Guest ${g})`,
          playoId: p.id,
          avatarUrl: p.profilePicUrl || undefined,
        });
      }
    }
  }

  return result;
}

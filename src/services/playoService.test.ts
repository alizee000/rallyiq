import { describe, it, expect } from 'vitest';
import { parseRawPlayerText, expandPlayoPlayers } from './playoService';

describe('Playo Service', () => {
  it('parses raw text with numbered lists correctly', () => {
    const raw = `
1. Monali
2) Vishruth Ramesh
3 - Frigewin J
4. Abhishek Sahu (+1)
• Sai Charan
`;
    const players = parseRawPlayerText(raw);
    expect(players.length).toBe(6); // 5 players + 1 guest
    expect(players[0].name).toBe('Monali');
    expect(players[1].name).toBe('Vishruth Ramesh');
    expect(players[2].name).toBe('Frigewin J');
    expect(players[3].name).toBe('Abhishek Sahu');
    expect(players[4].name).toBe('Abhishek Sahu (Guest 1)');
    expect(players[5].name).toBe('Sai Charan');
  });

  it('expands playo players with guest counts and identifies host', () => {
    const playoJoined = [
      { id: 'h1', name: 'Zee A', profilePicUrl: 'https://example.com/host.jpg', count: 1 },
      { id: 'p1', name: 'Monali', profilePicUrl: null, count: 1 },
      { id: 'p2', name: 'Kiran', profilePicUrl: null, count: 2 },
    ];

    const expanded = expandPlayoPlayers(playoJoined, 'h1');
    expect(expanded.length).toBe(4);
    expect(expanded[0].isHost).toBe(true);
    expect(expanded[0].name).toBe('Zee A');
    expect(expanded[1].name).toBe('Monali');
    expect(expanded[2].name).toBe('Kiran');
    expect(expanded[3].name).toBe('Kiran (Guest 1)');
  });
});

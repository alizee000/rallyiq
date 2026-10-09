import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { MatchSettings, MatchType, Side, Team } from '../../domain/types';
import { createInitialMatchState } from '../../domain/scoring';
import { useMatchStore } from '../../store/matchStore';
import { Users, User, Play, Calendar } from 'lucide-react';

export default function MatchSetup({ tournamentId, onComplete }: { tournamentId?: string, onComplete?: () => void }) {
  const { startMatch, scheduleMatch } = useMatchStore();
  const navigate = useNavigate();
  
  const [matchType, setMatchType] = useState<MatchType>('singles');
  const [playerA1, setPlayerA1] = useState('');
  const [playerA2, setPlayerA2] = useState('');
  const [playerB1, setPlayerB1] = useState('');
  const [playerB2, setPlayerB2] = useState('');
  const [stage, setStage] = useState('League Match');

  const stages = ['League Match', 'Round 2', 'Round 3', 'Quarter Final', 'Semi Final', 'Final'];
  
  const handleStart = () => {
    const settings: MatchSettings = {
      type: matchType,
      bestOfGames: 3,
      pointsToWin: 21,
      winByTwo: true,
      capAt: 30
    };
    
    const teamA: Team = {
      id: 'teamA',
      players: matchType === 'singles' 
        ? [{ id: uuidv4(), name: playerA1.trim() || 'Player 1' }]
        : [{ id: uuidv4(), name: playerA1.trim() || 'Player 1' }, { id: uuidv4(), name: playerA2.trim() || 'Player 2' }]
    };
    
    const teamB: Team = {
      id: 'teamB',
      players: matchType === 'singles' 
        ? [{ id: uuidv4(), name: playerB1.trim() || 'Player 3' }]
        : [{ id: uuidv4(), name: playerB1.trim() || 'Player 3' }, { id: uuidv4(), name: playerB2.trim() || 'Player 4' }]
    };
    
    const match = createInitialMatchState(uuidv4(), teamA, teamB, settings, 'A');
    if (tournamentId) {
      match.stage = stage;
    }
    
    if (tournamentId) {
      match.tournamentId = tournamentId;
      match.status = 'setup'; // Scheduled
      scheduleMatch(match);
      if (onComplete) onComplete();
      else navigate(`/admin/tournaments/${tournamentId}`);
    } else {
      startMatch(match);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-24 px-6 pt-12">
      <h1 className="text-3xl font-display font-bold text-graphite-100 mb-8">
        {tournamentId ? 'Schedule Match' : 'Match Setup'}
      </h1>
      
      <div className="flex bg-black/5 rounded-xl p-1 mb-6 shadow-inner">
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-300 ${matchType === 'singles' ? 'bg-white text-lime-DEFAULT font-bold shadow-sm' : 'text-graphite-500 hover:text-graphite-700'}`}
          onClick={() => setMatchType('singles')}
        >
          <User size={18} /> Singles
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all duration-300 ${matchType === 'doubles' ? 'bg-white text-cyan-DEFAULT font-bold shadow-sm' : 'text-graphite-500 hover:text-graphite-700'}`}
          onClick={() => setMatchType('doubles')}
        >
          <Users size={18} /> Doubles
        </button>
      </div>

      {tournamentId && (
        <div className="mb-8">
          <label className="text-xs text-graphite-400 font-bold mb-2 uppercase tracking-widest pl-2 block">Match Stage</label>
          <select 
            className="neo-input w-full rounded-xl p-4 text-graphite-100 transition-all font-bold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-1rem)_center]"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            {stages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}
      
      <div className="space-y-6 flex-1">
        {/* Team A */}
        <div className="glass-card p-5 rounded-[24px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-lime-DEFAULT"></div>
          <h2 className="text-xs text-graphite-400 font-bold mb-4 uppercase tracking-widest pl-2">Side A</h2>
          <div className="space-y-3">
            <input
              type="text"
              className="neo-input w-full rounded-xl p-4 text-graphite-100 transition-all placeholder:text-graphite-400 font-medium"
              placeholder="Player 1 Name"
              value={playerA1}
              onChange={(e) => setPlayerA1(e.target.value)}
            />
            {matchType === 'doubles' && (
              <input
                type="text"
                className="neo-input w-full rounded-xl p-4 text-graphite-100 transition-all placeholder:text-graphite-400 font-medium animate-in fade-in slide-in-from-top-2"
                placeholder="Player 2 Name"
                value={playerA2}
                onChange={(e) => setPlayerA2(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Team B */}
        <div className="glass-card p-5 rounded-[24px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-DEFAULT"></div>
          <h2 className="text-xs text-graphite-400 font-bold mb-4 uppercase tracking-widest pl-2">Side B</h2>
          <div className="space-y-3">
            <input
              type="text"
              className="neo-input w-full rounded-xl p-4 text-graphite-100 transition-all placeholder:text-graphite-400 font-medium"
              placeholder="Opponent 1 Name"
              value={playerB1}
              onChange={(e) => setPlayerB1(e.target.value)}
            />
            {matchType === 'doubles' && (
              <input
                type="text"
                className="neo-input w-full rounded-xl p-4 text-graphite-100 transition-all placeholder:text-graphite-400 font-medium animate-in fade-in slide-in-from-top-2"
                placeholder="Opponent 2 Name"
                value={playerB2}
                onChange={(e) => setPlayerB2(e.target.value)}
              />
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 pb-4">
        <button
          onClick={handleStart}
          className={`neo-btn w-full ${tournamentId ? '!bg-cyan-DEFAULT' : '!bg-lime-DEFAULT'} text-white font-bold py-4 rounded-[20px] flex items-center justify-center gap-2`}
        >
          {tournamentId ? <Calendar size={20} /> : <Play size={20} fill="currentColor" />}
          {tournamentId ? 'Schedule Match' : 'Start Match'}
        </button>
      </div>
    </div>
  );
}

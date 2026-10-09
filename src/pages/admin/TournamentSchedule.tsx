import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MatchSetup from '../../components/match/MatchSetup';
import { ChevronLeft } from 'lucide-react';
import { useMatchStore } from '../../store/matchStore';

export default function TournamentSchedule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tournaments } = useMatchStore();
  const tournament = id ? tournaments[id] : null;

  if (!tournament) return <div>Tournament not found</div>;

  return (
    <div className="flex flex-col h-full bg-transparent">
      <header className="px-4 py-4 flex items-center gap-4 border-b border-white/60 bg-white/60 backdrop-blur-3xl sticky top-0 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        <button onClick={() => navigate(-1)} className="p-2 text-graphite-400 hover:text-graphite-100">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-graphite-100">Schedule Match</h1>
          <p className="text-xs text-graphite-400 uppercase">{tournament.name}</p>
        </div>
      </header>
      
      <MatchSetup tournamentId={id} />
    </div>
  );
}

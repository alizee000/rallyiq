import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../../store/matchStore';
import { v4 as uuidv4 } from 'uuid';
import { ChevronLeft } from 'lucide-react';

export default function TournamentWizard() {
  const navigate = useNavigate();
  const { createTournament } = useMatchStore();
  const [name, setName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const newTournament = {
      id: uuidv4(),
      name,
      startDate: new Date().toISOString(),
      status: 'upcoming' as const
    };
    
    createTournament(newTournament);
    navigate('/admin');
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <header className="px-4 py-4 flex items-center gap-4 border-b border-black/5 bg-graphite-900 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="p-2 text-graphite-400 hover:text-graphite-100">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-graphite-100">Create Tournament</h1>
      </header>

      <div className="p-6">
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-graphite-400 uppercase tracking-widest mb-2">
              Tournament Name
            </label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="neo-input w-full rounded-xl px-4 py-4 text-graphite-100 placeholder:text-graphite-400 font-medium transition-colors"
              placeholder="e.g. Summer Smash 2024"
              autoFocus
            />
          </div>

          <button 
            type="submit"
            disabled={!name.trim()}
            className="neo-btn w-full py-4 !bg-lime-DEFAULT text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Tournament
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';
import { Search, Trophy, Calendar, ChevronRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { tournaments } = useMatchStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'upcoming' | 'completed'>('all');

  const tournamentList = Object.values(tournaments)
    .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    .filter(t => filter === 'all' ? true : t.status === filter)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto pb-24 relative">
      {/* Hero Header */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-br from-lime-DEFAULT/20 via-cyan-DEFAULT/10 to-transparent -z-10"></div>
      
      <header className="px-6 pt-16 pb-8 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-graphite-100 tracking-tight leading-tight">
              Rally<span className="text-lime-DEFAULT">IQ</span>
            </h1>
            <p className="text-graphite-400 text-sm font-medium mt-1 tracking-wide uppercase">Premium Court Analytics</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-graphite-900  flex items-center justify-center shadow-lg">
            <Trophy className="text-lime-DEFAULT" size={20} />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-graphite-400" size={18} />
          </div>
          <input
            type="text"
            className="neo-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-graphite-100 placeholder:text-graphite-400 font-medium"
            placeholder="Search tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>
      
      {/* Filter Tabs */}
      <div className="px-6 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-4 pt-2 scrollbar-hide -mx-6 px-6">
          {['all', 'ongoing', 'upcoming', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`neo-btn whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest ${filter === f ? '!bg-lime-DEFAULT text-white' : 'text-graphite-400 hover:text-graphite-100'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tournament List */}
      <div className="px-6 space-y-4">
        {tournamentList.length === 0 ? (
          <div className="glass-card p-8 rounded-3xl text-center flex flex-col items-center">
            <Trophy className="text-graphite-600 mb-3" size={32} />
            <p className="text-graphite-400 font-medium">No tournaments found.</p>
          </div>
        ) : (
          tournamentList.map(t => (
            <div 
              key={t.id}
              onClick={() => navigate(`/tournaments/${t.id}`)}
              className="glass-card p-5 rounded-3xl relative overflow-hidden group cursor-pointer hover:bg-black/5 transition-all active:scale-[0.98]  hover:border-black/10"
            >
              {t.status === 'ongoing' && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-lime-DEFAULT/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-lime-DEFAULT/20 transition-all"></div>
              )}
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex gap-2 items-center">
                  {t.status === 'ongoing' ? (
                    <span className="px-2.5 py-1 bg-lime-DEFAULT/20 text-lime-DEFAULT text-[10px] font-bold rounded-full uppercase tracking-widest flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-lime-DEFAULT rounded-full animate-pulse"></div>
                      Live
                    </span>
                  ) : t.status === 'upcoming' ? (
                    <span className="px-2.5 py-1 bg-cyan-DEFAULT/20 text-cyan-DEFAULT text-[10px] font-bold rounded-full uppercase tracking-widest">
                      Upcoming
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-graphite-800 text-graphite-400 text-[10px] font-bold rounded-full uppercase tracking-widest">
                      Completed
                    </span>
                  )}
                </div>
                <button className="text-graphite-500 group-hover:text-graphite-100 transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <h3 className="text-xl font-display font-bold text-graphite-100 mb-2 relative z-10 group-hover:text-lime-DEFAULT transition-colors tracking-tight">
                {t.name}
              </h3>
              
              <div className="flex items-center gap-2 text-xs text-graphite-400 font-medium relative z-10">
                <Calendar size={14} />
                <span>{new Date(t.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

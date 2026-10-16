import React, { useState } from 'react';
import { X, Link2, FileText, Check, Loader2, Users, MapPin, Calendar, UserCheck, Search, Sparkles } from 'lucide-react';
import { TournamentPlayer } from '../../domain/types';
import { fetchPlayoActivity, parseRawPlayerText, expandPlayoPlayers, PlayoFetchResult } from '../../services/playoService';

interface PlayoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (players: TournamentPlayer[], activityInfo?: any, playoUrl?: string) => void;
  initialUrl?: string;
}

export default function PlayoImportModal({
  isOpen,
  onClose,
  onImport,
  initialUrl = '',
}: PlayoImportModalProps) {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'link' | 'text'>('link');
  const [url, setUrl] = useState(initialUrl || 'https://playo.co/match/1869e609-583d-4a0c-b381-c4047acf6de5');
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parsed candidates ready for confirmation
  const [fetchedActivity, setFetchedActivity] = useState<PlayoFetchResult['activity'] | null>(null);
  const [candidates, setCandidates] = useState<TournamentPlayer[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const handleFetchUrl = async () => {
    if (!url.trim()) {
      setError('Please enter a Playo link');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPlayoActivity(url.trim());
      setFetchedActivity(res.activity);
      const expanded = expandPlayoPlayers(res.activity.players, res.activity.host?.id);
      setCandidates(expanded);
      setSelectedIds(new Set(expanded.map(p => p.id)));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity. Try Quick Paste instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleParseText = () => {
    if (!rawText.trim()) {
      setError('Please paste player names');
      return;
    }
    setError(null);
    const parsed = parseRawPlayerText(rawText);
    if (parsed.length === 0) {
      setError('Could not find any player names in the pasted text');
      return;
    }
    setCandidates(parsed);
    setSelectedIds(new Set(parsed.map(p => p.id)));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map(p => p.id)));
    }
  };

  const handleConfirmImport = () => {
    const selectedPlayers = candidates.filter(p => selectedIds.has(p.id));
    if (selectedPlayers.length === 0) return;

    const activityInfo = fetchedActivity
      ? {
          venue: fetchedActivity.venue,
          date: fetchedActivity.date,
          hostName: fetchedActivity.host?.name,
          hostAvatar: fetchedActivity.host?.profilePicUrl,
          totalJoined: fetchedActivity.joinedCount,
        }
      : undefined;

    onImport(selectedPlayers, activityInfo, mode === 'link' ? url.trim() : undefined);
    onClose();
  };

  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-graphite-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Pinned Header */}
        <div className="p-6 pb-4 border-b border-graphite-200/50 flex justify-between items-center bg-white/80 backdrop-blur-md shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-lime-DEFAULT/15 text-lime-DEFAULT">
                <Sparkles size={18} />
              </span>
              <h3 className="text-xl font-display font-bold text-graphite-100">Import Players</h3>
            </div>
            <p className="text-xs text-graphite-400 mt-1">
              Import registered players from Playo to seed into pools & matches
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-graphite-400 hover:text-graphite-100 rounded-full hover:bg-black/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto min-h-0 flex-1 overscroll-contain">
          {/* Mode Tabs */}
          <div className="flex bg-black/5 rounded-2xl p-1 shadow-inner">
            <button
              onClick={() => {
                setMode('link');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'link'
                  ? 'bg-white text-graphite-100 shadow-sm'
                  : 'text-graphite-400 hover:text-graphite-600'
              }`}
            >
              <Link2 size={14} />
              Playo Link
            </button>
            <button
              onClick={() => {
                setMode('text');
                setError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'text'
                  ? 'bg-white text-graphite-100 shadow-sm'
                  : 'text-graphite-400 hover:text-graphite-600'
              }`}
            >
              <FileText size={14} />
              Quick Paste / Text
            </button>
          </div>

          {/* Mode 1: URL input */}
          {mode === 'link' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-graphite-200 uppercase tracking-wider">
                Playo Match / Activity Link
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://playo.co/match/... or https://playo.page.link/..."
                  className="flex-1 bg-white/60 border border-graphite-200 rounded-xl px-3.5 py-2.5 text-xs text-graphite-100 placeholder:text-graphite-400 focus:outline-none focus:ring-2 focus:ring-lime-DEFAULT/50 shadow-inner font-medium"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={loading}
                  className="px-4 py-2.5 bg-[#515154] hover:bg-[#333336] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-lime-DEFAULT" />
                      Fetching...
                    </>
                  ) : (
                    'Fetch'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: Quick Paste */}
          {mode === 'text' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-graphite-200 uppercase tracking-wider">
                Paste WhatsApp / Playo Player Names
              </label>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                rows={4}
                placeholder="Paste names copied from Playo or WhatsApp:&#10;1. Monali&#10;2. Vishruth Ramesh&#10;3. Frigewin J&#10;4. Abhishek Sahu (+1)"
                className="w-full bg-white/60 border border-graphite-200 rounded-xl p-3 text-xs text-graphite-100 placeholder:text-graphite-400 focus:outline-none focus:ring-2 focus:ring-lime-DEFAULT/50 shadow-inner"
              />
              <button
                onClick={handleParseText}
                className="w-full py-2.5 bg-black hover:bg-graphite-100 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                Parse Player Names
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-xs flex items-start gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Activity Info Banner if fetched */}
          {fetchedActivity && (
            <div className="p-3.5 bg-gradient-to-br from-lime-DEFAULT/10 to-cyan-DEFAULT/10 border border-lime-DEFAULT/20 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-graphite-900 flex items-center gap-1.5">
                  <MapPin size={13} className="text-lime-DEFAULT" />
                  {fetchedActivity.venue}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-white/80 rounded-full text-graphite-600">
                  {fetchedActivity.sport}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-graphite-500 pt-1 border-t border-black/5">
                {fetchedActivity.host && (
                  <div className="flex items-center gap-1.5">
                    {fetchedActivity.host.profilePicUrl ? (
                      <img
                        src={fetchedActivity.host.profilePicUrl}
                        alt={fetchedActivity.host.name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      <Users size={12} />
                    )}
                    <span>Host: <strong className="text-graphite-800">{fetchedActivity.host.name}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <UserCheck size={12} className="text-lime-DEFAULT" />
                  <span>{fetchedActivity.joinedCount} Joined</span>
                </div>
              </div>
            </div>
          )}

          {/* Candidates Preview & Selection */}
          {candidates.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-graphite-200/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-graphite-700 flex items-center gap-1.5">
                  Players Found ({candidates.length})
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-lime-DEFAULT hover:underline"
                >
                  {selectedIds.size === candidates.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Search Filter */}
              {candidates.length > 8 && (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-graphite-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search players..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white/60 border border-graphite-200 rounded-lg text-xs text-graphite-100 placeholder:text-graphite-400 focus:outline-none focus:ring-1 focus:ring-lime-DEFAULT"
                  />
                </div>
              )}

              {/* Player Checkboxes List */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {filteredCandidates.map((p, idx) => {
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelect(p.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-lime-DEFAULT/10 border-lime-DEFAULT/40 text-graphite-100'
                          : 'bg-white/40 border-graphite-200/60 text-graphite-300 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                            isSelected
                              ? 'bg-lime-DEFAULT border-lime-DEFAULT text-black'
                              : 'border-graphite-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>

                        {p.avatarUrl ? (
                          <img
                            src={p.avatarUrl}
                            alt={p.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-white"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-graphite-200 flex items-center justify-center text-[10px] font-bold text-graphite-600 shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="truncate">
                          <p className="text-xs font-bold text-graphite-100 truncate">
                            {p.name}
                          </p>
                          {p.isHost && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-lime-DEFAULT/20 text-lime-DEFAULT rounded">
                              Host
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] text-graphite-300 font-mono font-bold shrink-0">
                        #{idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pinned Footer */}
        <div className="p-4 border-t border-graphite-200/50 bg-white/80 backdrop-blur-md flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-graphite-300 hover:text-graphite-100 hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={selectedIds.size === 0}
            className="flex-1 py-2.5 rounded-xl text-xs font-black bg-lime-DEFAULT hover:bg-lime-DEFAULT/90 text-black shadow-md shadow-lime-DEFAULT/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Users size={14} />
            Import {selectedIds.size} {selectedIds.size === 1 ? 'Player' : 'Players'}
          </button>
        </div>
      </div>
    </div>
  );
}

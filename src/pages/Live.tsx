import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';
import MatchSetup from '../components/match/MatchSetup';
import Scoreboard from '../components/match/Scoreboard';
import MatchSummary from '../components/match/MatchSummary';

export default function Live() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeMatch, matches, startMatch } = useMatchStore();

  useEffect(() => {
    // If we are visiting a specific match ID and it's not the active one, make it active
    if (id && id !== 'new') {
      const matchToLoad = matches[id];
      if (matchToLoad && (!activeMatch || activeMatch.id !== id)) {
        // Change status to playing if it was scheduled
        const loadedMatch = { ...matchToLoad };
        if (loadedMatch.status === 'setup') {
          loadedMatch.status = 'playing';
        }
        startMatch(loadedMatch);
      }
    }
  }, [id, matches, activeMatch, startMatch]);

  if (id === 'new') {
    return <MatchSetup />;
  }

  if (activeMatch) {
    if (activeMatch.status === 'completed') {
      return <MatchSummary />;
    }
    return <Scoreboard />;
  }

  // Fallback while loading or if match not found
  return (
    <div className="flex flex-col items-center justify-center h-full text-graphite-100">
      <h2 className="text-xl font-bold mb-4">Match not found</h2>
      <button onClick={() => navigate('/admin')} className="text-lime-DEFAULT underline">Return to Admin</button>
    </div>
  );
}

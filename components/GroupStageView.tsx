'use client';

import React, { useRef } from 'react';
import { useTournamentStore } from '../store/useTournamentStore';
import { GroupTable } from './GroupTable';
import { MatchCard } from './MatchCard';

interface GroupStageViewProps {
  onShowThirds: () => void;
  isLocked?: boolean;
}

export const GroupStageView: React.FC<GroupStageViewProps> = ({ onShowThirds, isLocked = false }) => {
  const { groups, matches, updateMatchScore } = useTournamentStore();

  const groupKeys = Object.keys(groups).sort();
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToGroup = (groupId: string) => {
    const element = groupRefs.current[groupId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleMatchComplete = (completedId: string) => {
    // Generate all group match IDs in sequence (Group A match 1-6, Group B match 1-6...)
    const allGroupMatches = groupKeys.flatMap(groupId => 
      Object.values(matches)
        .filter(m => m.id.startsWith(`G-${groupId}-`))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(m => m.id)
    );

    const currentIdx = allGroupMatches.indexOf(completedId);
    if (currentIdx !== -1) {
      // Find the next incomplete match in the entire group stage
      const nextIncompleteId = allGroupMatches.slice(currentIdx + 1).find(id => !matches[id]?.isCompleted);
      
      if (nextIncompleteId) {
        // Focus and scroll to it
        setTimeout(() => {
          const nextInput = document.querySelector(`[data-match-id="${nextIncompleteId}"] input`) as HTMLInputElement | null;
          if (nextInput) {
            nextInput.focus();
            nextInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Quick Jump Navigator */}
      <div className="sticky top-16 z-20 backdrop-blur-xl bg-[#0f0f1b]/60 border border-white/10 rounded-2xl p-3 shadow-lg max-w-full overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max px-1">
          <span className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-widest mr-2">
            Quick Jump:
          </span>
          {groupKeys.map(key => (
            <button
              key={key}
              onClick={() => scrollToGroup(key)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-white/77 hover:bg-brand-red hover:text-white hover:border-brand-red hover:shadow-[0_0_15px_rgba(230,27,35,0.4)] hover:scale-105 font-bold font-mono text-xs sm:text-sm transition-all duration-300"
            >
              {key}
            </button>
          ))}
          {/* Vertical divider */}
          <div className="h-6 w-[1px] bg-white/10 mx-2" />
          <button
            onClick={onShowThirds}
            className="px-4 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:scale-105 font-bold text-xs sm:text-sm transition-all duration-300 flex items-center gap-1.5"
          >
            📊 3rd Place Ladder
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="space-y-12">
        {groupKeys.map(groupId => {
          const group = groups[groupId];
          // Get the 6 matches of this group
          const groupMatches = Object.values(matches)
            .filter(m => m.id.startsWith(`G-${groupId}-`))
            .sort((a, b) => a.id.localeCompare(b.id));

          return (
            <div
              key={groupId}
              ref={el => {
                groupRefs.current[groupId] = el;
              }}
              className="scroll-mt-36"
            >
              {/* Group Title Header */}
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-purple to-white tracking-wider">
                  GROUP {groupId}
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-brand-purple/30 to-transparent" />
              </div>

              {/* Group Content Container (Table + Matches) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Standings Table (Lg takes 5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex justify-between items-center text-xs text-white/50 px-1 font-semibold uppercase tracking-wider">
                    <span>Standings Table</span>
                    <span className="text-[10px] text-brand-purple lowercase">
                      live updating
                    </span>
                  </div>
                  <GroupTable groupId={groupId} standings={group.standings} />
                </div>

                {/* Right: 6 Match Predictor Cards (Lg takes 7 cols) */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="text-xs text-white/50 px-1 font-semibold uppercase tracking-wider">
                    Matches & Predictions
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {groupMatches.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        isLocked={isLocked}
                        onComplete={handleMatchComplete}
                        onScoreChange={(homeScore, awayScore, homePens, awayPens) =>
                          updateMatchScore(match.id, homeScore, awayScore, homePens, awayPens)
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

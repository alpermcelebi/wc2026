'use client';

import React from 'react';
import { Match } from '../types/tournament';

interface MatchCardProps {
  match: Match;
  onScoreChange: (
    homeScore: number | null,
    awayScore: number | null,
    homePens?: number | null,
    awayPens?: number | null
  ) => void;
  compact?: boolean;
  isFocused?: boolean;
  isDimmed?: boolean;
  onComplete?: (matchId: string) => void;
  onUnlock?: (matchId: string) => void;
  isLocked?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onScoreChange,
  compact = false,
  isFocused = false,
  isDimmed = false,
  onComplete,
  onUnlock,
  isLocked = false
}) => {
  const { id, stage, homeTeam, awayTeam, homeScore, awayScore, homePenalties, awayPenalties } = match;
  const isKnockout = stage !== 'group';

  const isMatchCompleted = match.isCompleted && homeScore !== null && awayScore !== null;
  let winnerSlot: 'home' | 'away' | null = null;
  if (isKnockout && isMatchCompleted) {
    if (homeScore! > awayScore!) {
      winnerSlot = 'home';
    } else if (homeScore! < awayScore!) {
      winnerSlot = 'away';
    } else {
      const hp = homePenalties ?? 0;
      const ap = awayPenalties ?? 0;
      if (hp > ap) {
        winnerSlot = 'home';
      } else if (hp < ap) {
        winnerSlot = 'away';
      }
    }
  }

  const handleHomeScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onScoreChange(null, awayScore, null, null);
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        const validated = Math.max(0, num);
        onScoreChange(validated, awayScore, homePenalties, awayPenalties);
        if (awayScore !== null && onComplete) {
          setTimeout(() => onComplete(id), 50);
        }
      }
    }
  };

  const handleAwayScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onScoreChange(homeScore, null, null, null);
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        const validated = Math.max(0, num);
        onScoreChange(homeScore, validated, homePenalties, awayPenalties);
        if (homeScore !== null && onComplete) {
          setTimeout(() => onComplete(id), 50);
        }
      }
    }
  };

  const handleHomePensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onScoreChange(homeScore, awayScore, null, awayPenalties);
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        const validated = Math.max(0, num);
        onScoreChange(homeScore, awayScore, validated, awayPenalties);
        if (awayPenalties !== null && validated !== awayPenalties && onComplete) {
          setTimeout(() => onComplete(id), 50);
        }
      }
    }
  };

  const handleAwayPensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onScoreChange(homeScore, awayScore, homePenalties, null);
    } else {
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        const validated = Math.max(0, num);
        onScoreChange(homeScore, awayScore, homePenalties, validated);
        if (homePenalties !== null && validated !== homePenalties && onComplete) {
          setTimeout(() => onComplete(id), 50);
        }
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (homeScore !== null && awayScore !== null && onComplete) {
        if (homeScore === awayScore) {
          if (homePenalties !== null && awayPenalties !== null && homePenalties !== awayPenalties) {
            onComplete(id);
          }
        } else {
          onComplete(id);
        }
      }
    }
  };

  const handleInputBlur = () => {
    if (homeScore !== null && awayScore !== null && onComplete) {
      if (homeScore === awayScore) {
        if (homePenalties !== null && awayPenalties !== null && homePenalties !== awayPenalties) {
          onComplete(id);
        }
      } else {
        onComplete(id);
      }
    }
  };

  const handleClick = () => {
    if (isLocked) return;
    if (isDimmed && onUnlock) {
      onUnlock(id);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target;
    setTimeout(() => {
      const currentX = window.scrollX || window.pageXOffset;
      const card = target.closest('.match-card-container');
      if (!card) return;

      const cardRect = card.getBoundingClientRect();
      const absoluteCardTop = cardRect.top + window.scrollY;
      const targetY = absoluteCardTop - (window.innerHeight / 3);

      window.scrollTo({
        top: targetY,
        left: currentX,
        behavior: 'smooth'
      });
    }, 150);
  };

  const showPenalties =
    isKnockout &&
    homeScore !== null &&
    awayScore !== null &&
    homeScore === awayScore;

  // Visual label for stages
  const getStageLabel = () => {
    switch (stage) {
      case 'group':
        return `Group Stage • ${id}`;
      case 'r32':
        return `Round of 32`;
      case 'r16':
        return `Round of 16`;
      case 'qf':
        return `Quarter-final`;
      case 'sf':
        return `Semi-final`;
      case 'thirdPlace':
        return `Third-place Play-off`;
      case 'final':
        return `Final`;
      default:
        return stage;
    }
  };

  // --- Compact helper for team rendering ---
  const renderTeam = (team: typeof homeTeam, slot: 'home' | 'away') => {
    const keyVal = team?.code || `${slot}-empty`;
    const isWinner = winnerSlot === slot;
    const isLoser = winnerSlot !== null && winnerSlot !== slot;

    return (
      <div key={keyVal} className={`flex items-center ${compact ? 'gap-2' : 'gap-3'} min-w-0 animate-slideFadeIn`}>
        {team ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={team.flagUrl}
              alt={team.name}
              className={`${compact ? 'w-6 h-4' : 'w-8 h-5'} object-cover rounded shadow-sm border border-white/10 flex-shrink-0 transition-all duration-300`}
            />
            <span className={`truncate transition-all duration-300 ${
              isLoser 
                ? 'font-medium text-white/30' 
                : `font-medium text-white ${compact ? 'text-xs' : 'text-sm sm:text-base'}`
            }`}>
              {team.name}
            </span>
            {!compact && (
              <span className={`text-xs font-mono hidden sm:inline transition-colors duration-300 ${isWinner ? 'text-white/60' : 'text-white/20'}`}>
                ({team.code})
              </span>
            )}
            {isWinner && (
              <span 
                className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] flex-shrink-0" 
                title="Winner"
              />
            )}
          </>
        ) : (
          <>
            <div className={`${compact ? 'w-6 h-4' : 'w-8 h-5'} rounded bg-white/5 border border-white/5 flex-shrink-0 flex items-center justify-center`}>
              <span className={`${compact ? 'text-[6px]' : 'text-[8px]'} text-white/30 font-bold`}>TBD</span>
            </div>
            <span className={`font-medium text-white/30 ${compact ? 'text-xs' : 'text-sm'} italic`}>
              TBD
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div
      data-match-id={id}
      onClick={handleClick}
      className={`match-card-container relative group overflow-hidden ${compact ? 'rounded-xl p-2' : 'rounded-2xl p-4'} bg-[#0f0f1b]/60 border transition-all duration-300 backdrop-blur-md ${
        isFocused
          ? 'scale-[1.05] border-brand-purple/50 z-20 shadow-[0_0_20px_rgba(139,92,246,0.25)]'
          : isDimmed
          ? 'opacity-50 border-white/5 scale-100 z-10 cursor-pointer hover:border-brand-purple/40 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]'
          : 'border-white/10 border-brand-glow scale-100 z-10'
      }`}
    >
      {/* Background glow on hover */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-purple/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Card Header */}
      <div className={`flex flex-col gap-0.5 ${compact ? 'mb-1' : 'mb-3'}`}>
        <div className={`flex items-center justify-between ${compact ? 'text-[9px]' : 'text-xs'} font-semibold text-white/50 tracking-wider`}>
          <span>{getStageLabel()}</span>
          {isDimmed && (
            <span className="text-[10px] text-brand-purple/80 hover:text-brand-purple flex items-center gap-1 transition-colors" title={isLocked ? "Saved Bracket is Locked" : "Click to unlock and edit prediction"}>
              🔒 <span className="hidden group-hover:inline text-[7px] uppercase tracking-wider font-black">{isLocked ? 'Locked' : 'Unlock'}</span>
            </span>
          )}
          {!compact && isKnockout && !isDimmed && (
            <span className="px-2 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple border border-brand-purple/20 font-bold text-[9px] uppercase tracking-widest">
              Knockout
            </span>
          )}
        </div>
        {!compact && match.date && match.stadium_city && (
          <div className="text-[10px] text-zinc-400 font-medium tracking-wide">
            {match.date} • {match.stadium_city}
          </div>
        )}
      </div>

      {/* Teams and Inputs Row */}
      <div className={`flex flex-col ${compact ? 'gap-1.5' : 'gap-3'}`}>
        {/* Home Team */}
        <div 
          data-team-slot="home" 
          className={`flex items-center justify-between ${compact ? 'gap-2' : 'gap-3'} transition-all duration-300 ease-in-out ${
            winnerSlot !== null && winnerSlot !== 'home' ? 'opacity-40 saturate-[0.25]' : 'opacity-100'
          }`}
        >
          {renderTeam(homeTeam, 'home')}
          <input
            type="number"
            min="0"
            disabled={isLocked || (isKnockout ? (!isFocused || !homeTeam || !awayTeam) : (!homeTeam || !awayTeam))}
            value={homeScore ?? ''}
            onChange={handleHomeScoreChange}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            onFocus={handleFocus}
            placeholder="-"
            className={`${compact ? 'w-9 h-7 text-sm' : 'w-12 h-9'} rounded-lg bg-white/5 border border-white/10 text-center font-bold text-white placeholder-white/20 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none transition-all disabled:opacity-30 disabled:cursor-not-allowed`}
          />
        </div>

        {/* Away Team */}
        <div 
          data-team-slot="away" 
          className={`flex items-center justify-between ${compact ? 'gap-2' : 'gap-3'} transition-all duration-300 ease-in-out ${
            winnerSlot !== null && winnerSlot !== 'away' ? 'opacity-40 saturate-[0.25]' : 'opacity-100'
          }`}
        >
          {renderTeam(awayTeam, 'away')}
          <input
            type="number"
            min="0"
            disabled={isLocked || (isKnockout ? (!isFocused || !homeTeam || !awayTeam) : (!homeTeam || !awayTeam))}
            value={awayScore ?? ''}
            onChange={handleAwayScoreChange}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            onFocus={handleFocus}
            placeholder="-"
            className={`${compact ? 'w-9 h-7 text-sm' : 'w-12 h-9'} rounded-lg bg-white/5 border border-white/10 text-center font-bold text-white placeholder-white/20 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none transition-all disabled:opacity-30 disabled:cursor-not-allowed`}
          />
        </div>
      </div>

      {/* Penalties UI */}
      {showPenalties && (
        <div className={`${compact ? 'mt-2 pt-2' : 'mt-4 pt-3'} border-t border-white/5 flex flex-col items-center gap-2 animate-fadeIn`}>
          <span className={`${compact ? 'text-[8px]' : 'text-[10px]'} font-bold text-brand-orange tracking-widest uppercase`}>
            Penalty Shootout
          </span>
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-white/40 font-semibold`}>{homeTeam?.code}</span>
              <input
                type="number"
                min="0"
                disabled={isLocked || !isFocused}
                value={homePenalties ?? ''}
                onChange={handleHomePensChange}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                onFocus={handleFocus}
                placeholder="0"
                className={`${compact ? 'w-8 h-6 text-xs' : 'w-10 h-8'} rounded bg-brand-orange/10 border border-brand-orange/20 text-center font-bold text-brand-orange focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none disabled:opacity-30`}
              />
            </div>
            <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-white/20 font-bold`}>vs</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                disabled={isLocked || !isFocused}
                value={awayPenalties ?? ''}
                onChange={handleAwayPensChange}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                onFocus={handleFocus}
                placeholder="0"
                className={`${compact ? 'w-8 h-6 text-xs' : 'w-10 h-8'} rounded bg-brand-orange/10 border border-brand-orange/20 text-center font-bold text-brand-orange focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none disabled:opacity-30`}
              />
              <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-white/40 font-semibold`}>{awayTeam?.code}</span>
            </div>
          </div>
          {homePenalties !== null && awayPenalties !== null && homePenalties === awayPenalties && (
            <span className="text-[9px] text-red-400 italic">Penalties cannot be tied</span>
          )}
        </div>
      )}
    </div>
  );
};

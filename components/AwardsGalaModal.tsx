'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, Sparkles, User, Trophy, Share2, Check } from 'lucide-react';
import { MOCK_PLAYERS } from '../utils/playersData';
import { Player, AwardsState, GroupState, Team } from '../types/tournament';

interface AwardsGalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  awards: AwardsState;
  setAwardPrediction: (key: keyof AwardsState, value: string | null) => void;
  groups: Record<string, GroupState>;
  onGeneratePoster: () => void;
  isLocked?: boolean;
  savedBracketCode?: string | null;
  onSaveBracket?: () => void;
  isSaving?: boolean;
}

const AWARD_CONFIGS = [
  {
    key: 'goldenBall' as const,
    title: 'Golden Ball',
    subtitle: 'Tournament MVP',
    icon: '🏆',
    rank: 1, // Tallest podium
    gradient: 'from-amber-500/25 via-yellow-600/10 to-amber-700/5',
    borderColor: 'border-amber-500/30',
    glowColor: 'shadow-amber-500/10',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    description: 'Outstanding player of the tournament.',
    filter: (p: Player) => p.id !== 'other'
  },
  {
    key: 'goldenBoot' as const,
    title: 'Golden Boot',
    subtitle: 'Top Scorer',
    icon: '⚽',
    rank: 2, // Second tallest
    gradient: 'from-orange-500/25 via-red-600/10 to-orange-700/5',
    borderColor: 'border-orange-500/30',
    glowColor: 'shadow-orange-500/10',
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    description: 'Top scorer of the tournament.',
    filter: (p: Player) => p.id !== 'other'
  },
  {
    key: 'goldenGlove' as const,
    title: 'Golden Glove',
    subtitle: 'Best Goalkeeper',
    icon: '🧤',
    rank: 3, // Third tallest
    gradient: 'from-blue-500/25 via-indigo-600/10 to-blue-700/5',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-blue-500/10',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    description: 'Outstanding goalkeeper in the tournament.',
    filter: (p: Player) => p.position === 'GK' && p.id !== 'other'
  },
  {
    key: 'bestYoungPlayer' as const,
    title: 'Best Young Player',
    subtitle: 'Best U21 Star',
    icon: '🌟',
    rank: 4, // Shortest
    gradient: 'from-lime-500/25 via-emerald-600/10 to-lime-700/5',
    borderColor: 'border-lime-500/30',
    glowColor: 'shadow-lime-500/10',
    badgeBg: 'bg-lime-500/10 text-brand-lime border-lime-500/20',
    description: 'Best young talent born on or after Jan 1, 2005.',
    filter: (p: Player) => p.isYoung === true && p.id !== 'other'
  }
];

interface DisplayPlayer {
  id: string;
  name: string;
  teamCode: string;
  position: string;
  isYoung?: boolean;
  isCustom?: boolean;
}

export default function AwardsGalaModal({
  isOpen,
  onClose,
  awards,
  setAwardPrediction,
  groups,
  onGeneratePoster,
  isLocked = false,
  savedBracketCode = null,
  onSaveBracket,
  isSaving = false
}: AwardsGalaModalProps) {
  const [activePodiumKey, setActivePodiumKey] = useState<keyof AwardsState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (activePodiumKey) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [activePodiumKey]);

  // Create team flags lookup
  const teamFlagMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (groups) {
      Object.values(groups).forEach((g: GroupState) => {
        g.teams.forEach((t: Team) => {
          map[t.code] = t.flagUrl;
        });
      });
    }
    return map;
  }, [groups]);

  // Get active award config
  const activeAwardConfig = useMemo(() => {
    return AWARD_CONFIGS.find(a => a.key === activePodiumKey);
  }, [activePodiumKey]);

  // Get list of players for selection panel
  const filteredPlayersList = useMemo(() => {
    if (!activeAwardConfig) return [];
    
    // Filter base catalog (e.g. only GK for Golden Glove)
    const base = MOCK_PLAYERS.filter(activeAwardConfig.filter);
    
    // Ensure "Other / Write-in" is always at the very bottom
    const otherOption = MOCK_PLAYERS.find(p => p.id === 'other');
    const list = base.filter(p => p.id !== 'other');
    if (otherOption) {
      list.push(otherOption);
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) return list;
    return list.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.teamCode.toLowerCase().includes(query)
    );
  }, [activeAwardConfig, searchQuery]);

  // Open podium handler to initialize selection states without useEffect
  const handleOpenPodium = (key: keyof AwardsState) => {
    if (isLocked) return;
    setActivePodiumKey(key);
    const val = awards[key];
    if (val && val.startsWith('write-in:')) {
      setCustomName(val.substring(9));
    } else {
      setCustomName('');
    }
  };

  const isWriteInActive = activePodiumKey && (awards[activePodiumKey]?.startsWith('write-in:') ?? false);

  if (!isOpen) return null;

  // Resolve player info for rendering in podium
  const getSelectedPlayerDetails = (key: keyof AwardsState): DisplayPlayer | null => {
    const val = awards[key];
    if (!val) return null;
    const isCustom = val.startsWith('write-in:');
    if (isCustom) {
      return {
        id: val,
        name: val.substring(9) || 'Custom Player',
        teamCode: 'WRITE-IN',
        position: 'FW',
        isCustom: true
      };
    }
    const standardPlayer = MOCK_PLAYERS.find(p => p.id === val);
    if (standardPlayer) {
      return {
        ...standardPlayer,
        isCustom: false
      };
    }
    return null;
  };

  const handleSelectPlayer = (player: Player) => {
    if (isLocked || !activePodiumKey) return;

    if (player.id === 'other') {
      setAwardPrediction(activePodiumKey, 'write-in:');
      // Wait for input to render then focus it
      setTimeout(() => {
        const input = document.getElementById('write-in-gala-input') as HTMLInputElement | null;
        input?.focus();
      }, 100);
    } else {
      setAwardPrediction(activePodiumKey, player.id);
      setActivePodiumKey(null);
      setSearchQuery('');
    }
  };

  const handleCustomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked || !activePodiumKey) return;
    const val = e.target.value;
    setCustomName(val);
    setAwardPrediction(activePodiumKey, `write-in:${val}`);
  };

  const handleFinishCustom = () => {
    setActivePodiumKey(null);
    setSearchQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#070711]/95 backdrop-blur-xl shadow-2xl transition-all duration-300 transform scale-100 flex flex-col max-h-[95vh] text-zinc-100">
        
        {/* Top brand gradient strip */}
        <div className="h-1 bg-brand-gradient w-full flex-shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                Tournament Awards Gala
              </h3>
              <p className="text-xs text-zinc-400">
                Fulfill your final predictions and crown the individual awards of the FIFA World Cup 2026.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-8 flex-1 overflow-y-auto scrollbar-thin relative flex flex-col gap-8">
          
          {activePodiumKey && activeAwardConfig ? (
            <div className="flex-1 flex flex-col animate-fadeIn">
              {/* AUTOCOMPLETE SELECTION PANEL (Replaces Podium View to prevent overlap) */}
              <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                {/* Overlay Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{activeAwardConfig.icon}</span>
                    <div>
                      <h4 className="text-lg font-black text-white uppercase tracking-wider">
                        Select {activeAwardConfig.title}
                      </h4>
                      <p className="text-xs text-zinc-400 italic">
                        {activeAwardConfig.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActivePodiumKey(null);
                      setSearchQuery('');
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Autocomplete Input Search Area */}
                {isWriteInActive ? (
                  <div className="space-y-4 py-4 animate-fadeIn">
                    <div className="flex items-center gap-3 w-full bg-white/3 border border-brand-lime/30 p-4 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl bg-brand-lime/10 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-brand-lime" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[9px] font-black text-brand-lime uppercase tracking-wider block">
                          Enter Custom Candidate
                        </span>
                        <input
                          id="write-in-gala-input"
                          type="text"
                          placeholder="Type candidate full name..."
                          value={customName}
                          onChange={handleCustomNameChange}
                          className="w-full bg-transparent border-b border-white/10 focus:border-brand-lime outline-none text-white text-base touch-manipulation font-bold py-0.5 placeholder-white/20 transition-colors disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleFinishCustom}
                      className="px-6 py-2.5 rounded-xl bg-brand-lime text-zinc-950 font-black text-xs hover:opacity-90 shadow-md shadow-brand-lime/10 transition-all"
                    >
                      Confirm Custom Player
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl">
                      <Search className="w-4 h-4 text-zinc-500" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search standard superstars by name or team code..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent outline-none text-base touch-manipulation text-white placeholder-white/20 font-semibold"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Scrollable list of players */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin rounded-2xl border border-white/5 bg-white/2 p-2 flex flex-col gap-1">
                      {filteredPlayersList.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 text-sm font-bold font-mono">
                          No players matching your search query.
                        </div>
                      ) : (
                        filteredPlayersList.map(p => {
                          const isSelected = awards[activePodiumKey] === p.id;
                          return (
                            <button
                              key={p.id}
                              onClick={() => handleSelectPlayer(p)}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl text-left text-xs font-semibold transition-all ${
                                p.id === 'other'
                                  ? 'bg-brand-lime/10 hover:bg-brand-lime/20 text-brand-lime border border-brand-lime/20 mt-2'
                                  : isSelected
                                  ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/20'
                                  : 'bg-transparent text-white/70 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {p.id !== 'other' && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={teamFlagMap[p.teamCode]}
                                    alt={p.teamCode}
                                    className="w-6 h-4 object-cover rounded border border-white/10 flex-shrink-0"
                                  />
                                )}
                                <span className="truncate text-sm font-bold">{p.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-white/30 uppercase">
                                  {p.id === 'other' ? 'Custom Entry' : `${p.teamCode} • ${p.position}`}
                                </span>
                                {isSelected && <Check className="w-4 h-4 text-brand-purple flex-shrink-0" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between h-full">

              {/* Main Awards Grid (Uniform card sizing) */}
              <div className="grid grid-cols-2 gap-4 w-full px-2 pt-4">
                {AWARD_CONFIGS.map(award => {
                  const player = getSelectedPlayerDetails(award.key);
                  return (
                    <div 
                      key={award.key}
                      onClick={() => handleOpenPodium(award.key)}
                      className={`relative flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br ${award.gradient} border ${award.borderColor} hover:${award.borderColor.replace('/30', '/60')} shadow-lg hover:shadow-xl ${award.glowColor} h-[135px] cursor-pointer transition-all duration-300 hover:scale-[1.02]`}
                    >
                      {/* Top Row: Title & Icon */}
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black text-white/50 uppercase tracking-wider block">
                            {award.title}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wide mt-1 border ${award.badgeBg}`}>
                            {award.subtitle}
                          </span>
                        </div>
                        <span className="text-2xl filter drop-shadow-md">{award.icon}</span>
                      </div>

                      {/* Bottom Row: Candidate selection */}
                      <div className="mt-2 w-full flex items-center justify-between min-w-0">
                        {player ? (
                          <div className="flex items-center gap-2.5 min-w-0 w-full">
                            {player.isCustom ? (
                              <div className="w-8 h-8 rounded-lg bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-4 h-4 text-brand-lime" />
                              </div>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={teamFlagMap[player.teamCode]}
                                alt={player.teamCode}
                                className="w-8 h-5.5 object-cover rounded shadow border border-white/10 flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-black text-white truncate block leading-tight">
                                {player.name}
                              </span>
                              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mt-0.5">
                                {player.teamCode}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 w-full text-zinc-400">
                            <div className="w-8 h-8 rounded-full border border-dashed border-white/20 bg-white/5 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 opacity-40" />
                            </div>
                            <span className="text-[11px] font-bold tracking-wide italic opacity-40">
                              Tap to select...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-6 mt-8 w-full">
                <div className="text-center w-full">
                  <p className="text-xs text-zinc-400">
                    Status: <span className="font-mono text-zinc-300 font-bold">
                      {Object.values(awards).filter(v => v !== null && v !== 'write-in:').length}/4 Categories Predicted
                    </span>
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-3 w-full">
                  {savedBracketCode ? (
                    <div className="w-full max-w-sm flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                      ✓ Saved: {savedBracketCode}
                    </div>
                  ) : (
                    onSaveBracket && (
                      <button
                        onClick={onSaveBracket}
                        disabled={isSaving}
                        className="w-full max-w-sm flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            🔒 Save My Bracket
                          </>
                        )}
                      </button>
                    )
                  )}

                  <button
                    onClick={onGeneratePoster}
                    className="w-full max-w-sm flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-red via-brand-purple to-brand-blue font-black text-sm text-white hover:opacity-95 shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    <Share2 className="w-4 h-4 animate-pulse" />
                    Generate My Shareable Poster
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTournamentStore } from '../store/useTournamentStore';
import { MOCK_PLAYERS } from '../utils/playersData';
import { Player, AwardsState } from '../types/tournament';
import { Trophy, Search, X, Award, Sparkles, User, ShieldAlert } from 'lucide-react';

const AWARDS = [
  {
    key: 'goldenBall' as const,
    title: 'Golden Ball',
    subtitle: 'Tournament MVP / Top Player',
    icon: '🏆',
    description: 'Awarded to the best player of the tournament. Classic candidates include playmakers and forwards.',
    filter: (p: Player) => p.id !== 'other' // All real players, plus write-in handled separately
  },
  {
    key: 'goldenBoot' as const,
    title: 'Golden Boot',
    subtitle: 'Top Scorer / Gol Kralı',
    icon: '⚽',
    description: 'Awarded to the player who scores the most goals. Typically dominated by lethal strikers.',
    filter: (p: Player) => p.id !== 'other'
  },
  {
    key: 'goldenGlove' as const,
    title: 'Golden Glove',
    subtitle: 'Best Goalkeeper / En İyi Kaleci',
    icon: '🧤',
    description: 'Awarded to the outstanding goalkeeper of the tournament. Restricted to shot-stoppers.',
    filter: (p: Player) => p.position === 'GK' && p.id !== 'other'
  },
  {
    key: 'bestYoungPlayer' as const,
    title: 'Best Young Player',
    subtitle: 'Best player under 21 years old',
    icon: '🌟',
    description: 'Awarded to the best young talent born on or after January 1, 2005.',
    filter: (p: Player) => p.isYoung === true && p.id !== 'other'
  }
];

interface AwardCardProps {
  awardKey: keyof AwardsState;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  playerList: Player[];
  teamFlagMap: Record<string, string>;
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
  isLocked?: boolean;
}

const AwardCard: React.FC<AwardCardProps> = ({
  awardKey,
  title,
  subtitle,
  description,
  icon,
  playerList,
  teamFlagMap,
  selectedValue,
  onSelect,
  isLocked = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse if selected value is a write-in
  const isWriteIn = selectedValue?.startsWith('write-in:') ?? false;
  const writeInName = isWriteIn ? selectedValue!.substring(9) : '';

  // Find standard selected player
  const selectedPlayer = useMemo(() => {
    if (!selectedValue || isWriteIn) return null;
    return playerList.find(p => p.id === selectedValue) || null;
  }, [selectedValue, isWriteIn, playerList]);

  // Filter players list based on search
  const filteredPlayers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return playerList;
    return playerList.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.teamCode.toLowerCase().includes(query)
    );
  }, [searchQuery, playerList]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync custom input field with store state
  useEffect(() => {
    if (isWriteIn) {
      setCustomName(writeInName);
    } else {
      setCustomName('');
    }
  }, [isWriteIn, writeInName]);

  const handleSelectPlayer = (player: Player) => {
    if (player.id === 'other') {
      onSelect('write-in:');
      setIsOpen(false);
      // Small timeout to allow input rendering, then focus it
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      onSelect(player.id);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleCustomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomName(val);
    onSelect(`write-in:${val}`);
  };

  const handleClearSelection = () => {
    onSelect(null);
    setSearchQuery('');
    setCustomName('');
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f1b]/60 backdrop-blur-md p-6 flex flex-col justify-between shadow-xl min-h-[300px] border-brand-glow transition-all duration-300">
      {/* Background radial accent glow */}
      <div className="absolute -right-10 -top-10 -z-10 w-24 h-24 rounded-full bg-brand-purple/5 blur-xl pointer-events-none" />

      {/* Card Body */}
      <div className="space-y-4">
        {/* Award title and icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h4 className="font-black text-white text-base sm:text-lg tracking-wide">
                {title}
              </h4>
              <p className="text-[10px] sm:text-xs font-semibold text-brand-lime uppercase tracking-wider">
                {subtitle}
              </p>
            </div>
          </div>
          {selectedValue && !isLocked && (
            <button
              onClick={handleClearSelection}
              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold transition-colors"
              title="Clear Selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed italic">
          {description}
        </p>

        {/* Selected Player Visualization Frame */}
        <div className="h-20 rounded-2xl border border-white/5 bg-white/2 flex items-center px-4 relative overflow-hidden">
          {selectedPlayer ? (
            <div className="flex items-center gap-3 w-full animate-fadeIn">
              {/* Flag container */}
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={teamFlagMap[selectedPlayer.teamCode]}
                  alt={selectedPlayer.teamCode}
                  className="w-12 h-8 object-cover rounded shadow-md border border-white/10"
                />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-purple text-[8px] font-black text-white border border-zinc-950">
                  {selectedPlayer.position}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-white text-sm sm:text-base truncate leading-snug">
                  {selectedPlayer.name}
                </p>
                <p className="text-xs font-bold text-white/40 tracking-wider">
                  {selectedPlayer.teamCode} • {selectedPlayer.isYoung ? 'Under-21 Star' : 'Senior Squad'}
                </p>
              </div>
              <Award className="w-6 h-6 text-brand-lime opacity-40 flex-shrink-0" />
            </div>
          ) : isWriteIn ? (
            <div className="flex items-center gap-3 w-full animate-fadeIn">
              <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-brand-lime" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black text-brand-lime uppercase tracking-wider">
                  Write-in Candidate
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  disabled={isLocked}
                  placeholder="Type player name..."
                  value={customName}
                  onChange={handleCustomNameChange}
                  className="w-full bg-transparent border-b border-white/10 focus:border-brand-lime outline-none text-white text-base touch-manipulation font-bold py-0.5 placeholder-white/20 transition-colors disabled:opacity-50"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-white/20 w-full select-none">
              <div className="w-10 h-10 rounded-xl border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold font-mono tracking-wider">
                No prediction entered
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Autocomplete Input Select Search Area */}
      <div className="mt-4 relative" ref={dropdownRef}>
        {!isWriteIn && (
          <>
            {/* Dropdown Button Box */}
            <button
              onClick={() => !isLocked && setIsOpen(!isOpen)}
              disabled={isLocked}
              className={`w-full h-10 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-left text-xs font-semibold text-white/60 hover:text-white flex items-center justify-between transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="truncate">
                {selectedPlayer ? 'Change prediction...' : 'Select a candidate...'}
              </span>
              <Search className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Floating Dropdown List Panel */}
            {isOpen && (
              <div className="absolute bottom-12 left-0 right-0 z-30 max-h-48 overflow-y-auto scrollbar-thin rounded-2xl border border-white/10 bg-[#0c0c16]/98 p-1.5 shadow-2xl backdrop-blur-xl animate-fadeIn flex flex-col gap-0.5">
                {/* Search query textbox inside dropdown */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 mb-1.5">
                  <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search candidate..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent outline-none text-base touch-manipulation text-white placeholder-white/20 font-semibold"
                    autoFocus
                  />
                </div>

                {filteredPlayers.length === 0 ? (
                  <div className="text-center py-4 text-white/30 text-xs font-bold font-mono">
                    No matching players
                  </div>
                ) : (
                  filteredPlayers.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPlayer(p)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all ${
                        p.id === 'other'
                          ? 'bg-brand-lime/10 hover:bg-brand-lime/15 text-brand-lime mt-1'
                          : selectedValue === p.id
                          ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/20'
                          : 'bg-transparent text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {p.id !== 'other' && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={teamFlagMap[p.teamCode]}
                            alt={p.teamCode}
                            className="w-5 h-3.5 object-cover rounded border border-white/10 flex-shrink-0"
                          />
                        )}
                        <span className="truncate">{p.name}</span>
                      </div>
                      <span className="font-mono text-[9px] text-white/30 uppercase flex-shrink-0 ml-2">
                        {p.id === 'other' ? 'Custom' : `${p.teamCode} • ${p.position}`}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface AwardsPredictionViewProps {
  isLocked?: boolean;
}

export const AwardsPredictionView: React.FC<AwardsPredictionViewProps> = ({ isLocked = false }) => {
  const { awards, setAwardPrediction, groups } = useTournamentStore();

  // Create team flags lookup
  const teamFlagMap = useMemo(() => {
    const map: Record<string, string> = {};
    Object.values(groups).forEach(g => {
      g.teams.forEach(t => {
        map[t.code] = t.flagUrl;
      });
    });
    return map;
  }, [groups]);

  // Construct filtered list for each category
  const getPlayersForAward = (awardKey: keyof AwardsState) => {
    const awardConfig = AWARDS.find(a => a.key === awardKey);
    if (!awardConfig) return MOCK_PLAYERS;
    
    // Filter base catalog (e.g. only GK for Golden Glove)
    const base = MOCK_PLAYERS.filter(awardConfig.filter);
    
    // Ensure "Other / Write-in" is always at the very bottom
    const otherOption = MOCK_PLAYERS.find(p => p.id === 'other');
    const list = base.filter(p => p.id !== 'other');
    if (otherOption) {
      list.push(otherOption);
    }
    return list;
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Title Intro Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f0f1b]/80 via-[#130f24]/85 to-[#0b101c]/80 backdrop-blur-md p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gradient" />
        <div className="space-y-2 max-w-xl">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-lime/10 text-brand-lime border border-brand-lime/20">
            Final Step predictions
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
            Individual Tournament Awards
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Predict the individual winners of the major FIFA honors. Type to search through our database of global superstars, or select **Other / Write-in** to enter a custom player of your choice!
          </p>
        </div>
        <div className="flex-shrink-0 bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
          <Trophy className="w-8 h-8 text-brand-lime" />
          <div>
            <p className="text-xs text-white/50 font-bold uppercase">Predicted</p>
            <p className="text-lg font-black text-white font-mono">
              {Object.values(awards).filter(v => v !== null && v !== 'write-in:').length}/4
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 4 Awards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {AWARDS.map(award => {
          const playerList = getPlayersForAward(award.key);
          const val = awards[award.key];

          return (
            <AwardCard
              key={award.key}
              awardKey={award.key}
              title={award.title}
              subtitle={award.subtitle}
              description={award.description}
              icon={award.icon}
              playerList={playerList}
              teamFlagMap={teamFlagMap}
              selectedValue={val}
              onSelect={value => setAwardPrediction(award.key, value)}
              isLocked={isLocked}
            />
          );
        })}
      </div>
    </div>
  );
};

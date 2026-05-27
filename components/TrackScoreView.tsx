'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTournamentStore } from '../store/useTournamentStore';
import { calculateBracketScore, generateMockActualResults, ScoringResult } from '../utils/scoringEngine';
import { Trophy, Search, Sparkles, TrendingUp, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Match, AwardsState, Stage } from '../types/tournament';
import { MOCK_PLAYERS } from '../utils/playersData';

interface TrackScoreViewProps {
  initialCode?: string | null;
}

export const TrackScoreView: React.FC<TrackScoreViewProps> = ({ initialCode = null }) => {
  const { groups, matches: storeMatches, trackedPredictions: loadedPredictions, setTrackedPredictions: setLoadedPredictions, compareMode, setCompareMode } = useTournamentStore();
  
  const [bracketCode, setBracketCode] = useState(initialCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'groups' | 'knockouts' | 'awards'>('groups');

  // Build team flag and name lookups from store groups
  const teamFlagMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (groups) {
      Object.values(groups).forEach(g => {
        g.teams.forEach(t => {
          map[t.code] = t.flagUrl;
        });
      });
    }
    return map;
  }, [groups]);

  const teamNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (groups) {
      Object.values(groups).forEach(g => {
        g.teams.forEach(t => {
          map[t.code] = t.name;
        });
      });
    }
    return map;
  }, [groups]);

  // Load code from LocalStorage on mount if not provided as prop
  useEffect(() => {
    if (!initialCode) {
      const savedCode = localStorage.getItem('saved_bracket_code');
      if (savedCode) {
        setBracketCode(savedCode);
        handleLoadBracket(savedCode);
      }
    } else {
      handleLoadBracket(initialCode);
    }
  }, [initialCode]);

  const handleLoadBracket = async (codeToLoad: string) => {
    const code = codeToLoad.trim().toUpperCase();
    if (!code) {
      setError('Please enter a bracket code.');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadedPredictions(null);

    try {
      // 1. Try to fetch from Next.js server API
      const res = await fetch(`/api/bracket?code=${code}`);
      const data = await res.json();

      if (data.success && data.predictions) {
        setLoadedPredictions(data.predictions);
      } else if (data.mock || !data.success) {
        // 2. Fall back to LocalStorage checks if API indicates mock mode or fails
        const localDataStr = localStorage.getItem(`local_bracket_${code}`);
        if (localDataStr) {
          try {
            const parsed = JSON.parse(localDataStr);
            if (parsed && parsed.matches && parsed.awards) {
              setLoadedPredictions(parsed);
              return;
            }
          } catch (e) {
            console.error('Failed to parse local storage bracket:', e);
          }
        }
        
        setError(data.error || 'Bracket not found. If this was a mock save, ensure you are on the same browser/device.');
      }
    } catch (err: any) {
      console.error('Error loading bracket:', err);
      // Try local storage anyway as a secondary fallback
      const localDataStr = localStorage.getItem(`local_bracket_${code}`);
      if (localDataStr) {
        try {
          const parsed = JSON.parse(localDataStr);
          if (parsed && parsed.matches && parsed.awards) {
            setLoadedPredictions(parsed);
            return;
          }
        } catch (e) {}
      }
      setError('Connection error. Could not retrieve predictions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLoadBracket(bracketCode);
  };

  // Generate actual simulated results based on current predictions and chosen compare mode
  const actualResults = useMemo(() => {
    if (!loadedPredictions) return null;
    if (compareMode === 'live') {
      // Live mode uses the actual store matches (by default scheduled until finished)
      return {
        matches: storeMatches,
        awards: {
          goldenBall: null,
          goldenBoot: null,
          goldenGlove: null,
          bestYoungPlayer: null
        }
      };
    }
    return generateMockActualResults(loadedPredictions, compareMode);
  }, [loadedPredictions, compareMode, storeMatches]);

  // Calculate scores
  const scoreResults = useMemo((): ScoringResult | null => {
    if (!loadedPredictions || !actualResults) return null;
    return calculateBracketScore(loadedPredictions, actualResults);
  }, [loadedPredictions, actualResults]);

  // Max possible scores
  const maxPossible = {
    total: 341,
    groups: 144, // 72 matches * 2 pts
    knockouts: 165, // 16*5 (R32) + 8*5 (R16) + 4*5 (QF) + 2*5 (SF) + 1*5 (3rd) + 1*10 (Final)
    awards: 32 // 4 awards * 8 pts
  };

  // Helper to fetch award details
  const getPlayerDetails = (playerId: string | null) => {
    if (!playerId) return null;
    if (playerId.startsWith('write-in:')) {
      return { name: playerId.substring(9), teamCode: 'WRITE-IN', isCustom: true };
    }
    const standard = MOCK_PLAYERS.find(p => p.id === playerId);
    return standard ? { name: standard.name, teamCode: standard.teamCode, isCustom: false } : null;
  };

  // Group stage matches list sorted
  const sortedGroupMatches = useMemo(() => {
    if (!loadedPredictions) return [];
    return Object.values(loadedPredictions.matches)
      .filter(m => m.stage === 'group')
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [loadedPredictions]);

  // Knockout matches list
  const sortedKnockoutMatches = useMemo(() => {
    if (!loadedPredictions) return [];
    const stagesOrder: Record<Stage, number> = {
      'group': 0,
      'r32': 1,
      'r16': 2,
      'qf': 3,
      'sf': 4,
      'thirdPlace': 5,
      'final': 6
    };
    return Object.values(loadedPredictions.matches)
      .filter(m => m.stage !== 'group')
      .sort((a, b) => {
        const orderDiff = stagesOrder[a.stage] - stagesOrder[b.stage];
        if (orderDiff !== 0) return orderDiff;
        return a.id.localeCompare(b.id);
      });
  }, [loadedPredictions]);

  const getStageLabel = (stage: Stage) => {
    switch (stage) {
      case 'r32': return 'Round of 32';
      case 'r16': return 'Round of 16';
      case 'qf': return 'Quarter-final';
      case 'sf': return 'Semi-final';
      case 'thirdPlace': return 'Third-place Play-off';
      case 'final': return 'Final';
      default: return stage;
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Search Bar & Loader Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f0f1b]/80 via-[#130f24]/85 to-[#0b101c]/80 backdrop-blur-md p-6 shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gradient" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-purple/10 text-brand-purple border border-brand-purple/20">
              Track Prediction Performance
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Track My Score Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Enter your unique 6-character prediction code to view point rewards and outcome comparison details.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="flex-1 relative flex items-center bg-white/5 border border-white/10 focus-within:border-brand-purple rounded-2xl px-4 py-3 transition-colors">
              <Search className="w-4 h-4 text-zinc-500 mr-2" />
              <input
                type="text"
                maxLength={10}
                placeholder="Enter Code (e.g. WC-K38P)"
                value={bracketCode}
                onChange={e => setBracketCode(e.target.value.toUpperCase())}
                className="w-full bg-transparent border-none outline-none text-base touch-manipulation text-white placeholder-white/20 font-black tracking-wider uppercase font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 rounded-2xl bg-brand-purple hover:bg-brand-purple/90 text-white font-black text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-brand-purple/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load'}
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {loadedPredictions && actualResults && scoreResults && (
        <div className="space-y-8 animate-fadeIn">
          {/* Controls & Mode selectors */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/5 border border-white/5 p-4 rounded-3xl backdrop-blur-md">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                Currently Tracking Bracket
              </p>
              <h3 className="text-base font-black text-brand-purple uppercase tracking-wider font-mono">
                Code: {bracketCode || 'LOCAL'}
              </h3>
            </div>

            <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1 w-full lg:w-auto overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setCompareMode('live')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  compareMode === 'live'
                    ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Real-world Results
              </button>
              <button
                type="button"
                onClick={() => setCompareMode('simulation')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  compareMode === 'simulation'
                    ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Realistic Simulation
              </button>
              <button
                type="button"
                onClick={() => setCompareMode('perfect')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  compareMode === 'perfect'
                    ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Perfect Match
              </button>
            </div>
          </div>

          {/* Point Dashboard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Total Points Big Widget */}
            <div className="relative overflow-hidden rounded-3xl border border-brand-purple/30 bg-[#0c0c20]/80 shadow-[0_0_25px_rgba(139,92,246,0.15)] p-6 flex flex-col justify-between min-h-[160px]">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-brand-purple/20 blur-xl" />
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-brand-purple" />
                  Total Score
                </span>
                <p className="text-4xl font-black text-white font-mono mt-2">
                  {scoreResults.totalScore}
                  <span className="text-xs text-zinc-500 font-bold ml-1.5">/ {maxPossible.total} pts</span>
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                <span>Accuracy Rate</span>
                <span className="font-mono font-bold text-brand-purple">
                  {Math.round((scoreResults.totalScore / maxPossible.total) * 100)}%
                </span>
              </div>
            </div>

            {/* Group Stage points */}
            <div className="rounded-3xl border border-white/10 bg-[#0f0f1b]/60 p-6 flex flex-col justify-between min-h-[160px]">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                  Group stage
                </span>
                <p className="text-3xl font-black text-brand-red font-mono mt-2">
                  {scoreResults.groupPoints}
                  <span className="text-xs text-zinc-500 font-bold ml-1.5">/ {maxPossible.groups} pts</span>
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 space-y-1 text-[10px] sm:text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Exact Scores:</span>
                  <span className="font-mono text-white font-bold">{scoreResults.correctGroupScores} (+{scoreResults.correctGroupScores * 2}pts)</span>
                </div>
                <div className="flex justify-between">
                  <span>Outcomes:</span>
                  <span className="font-mono text-white font-bold">{scoreResults.correctGroupOutcomes} (+{scoreResults.correctGroupOutcomes * 1}pts)</span>
                </div>
              </div>
            </div>

            {/* Knockouts stage */}
            <div className="rounded-3xl border border-white/10 bg-[#0f0f1b]/60 p-6 flex flex-col justify-between min-h-[160px]">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                  Knockout rounds
                </span>
                <p className="text-3xl font-black text-brand-blue font-mono mt-2">
                  {scoreResults.knockoutPoints}
                  <span className="text-xs text-zinc-500 font-bold ml-1.5">/ {maxPossible.knockouts} pts</span>
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                <span>Correct Winners:</span>
                <span className="font-mono text-white font-bold">{scoreResults.correctKnockouts} teams</span>
              </div>
            </div>

            {/* Awards category */}
            <div className="rounded-3xl border border-white/10 bg-[#0f0f1b]/60 p-6 flex flex-col justify-between min-h-[160px]">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">
                  Individual Awards
                </span>
                <p className="text-3xl font-black text-brand-lime font-mono mt-2">
                  {scoreResults.awardsPoints}
                  <span className="text-xs text-zinc-500 font-bold ml-1.5">/ {maxPossible.awards} pts</span>
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                <span>Correct Awards:</span>
                <span className="font-mono text-white font-bold">{scoreResults.correctAwards} / 4</span>
              </div>
            </div>

          </div>

          {/* Sub Navigation tabs */}
          <div className="flex border-b border-white/10 gap-1 overflow-x-auto scrollbar-none mt-8">
            <button
              onClick={() => setActiveSubTab('groups')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all duration-300 ${
                activeSubTab === 'groups'
                  ? 'border-brand-red text-brand-red bg-brand-red/5'
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Group Match Comparisons ({sortedGroupMatches.length})
            </button>
            <button
              onClick={() => setActiveSubTab('knockouts')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all duration-300 ${
                activeSubTab === 'knockouts'
                  ? 'border-brand-blue text-brand-blue bg-brand-blue/5'
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Knockout Stage Comparisons ({sortedKnockoutMatches.length})
            </button>
            <button
              onClick={() => setActiveSubTab('awards')}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all duration-300 ${
                activeSubTab === 'awards'
                  ? 'border-brand-lime text-brand-lime bg-brand-lime/5'
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Awards Predictions
            </button>
          </div>

          {/* Tab lists content */}
          <div className="mt-4">
            
            {/* SUBTAB: Group Stage */}
            {activeSubTab === 'groups' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedGroupMatches.map(predMatch => {
                    const actualMatch = actualResults.matches[predMatch.id];
                    if (!actualMatch) return null;

                    const predHome = predMatch.homeScore ?? 0;
                    const predAway = predMatch.awayScore ?? 0;
                    const actHome = actualMatch.homeScore ?? 0;
                    const actAway = actualMatch.awayScore ?? 0;

                    const isScheduled = actualMatch.status === 'SCHEDULED' || !actualMatch.status;

                    const isCorrectScore = !isScheduled && predHome === actHome && predAway === actAway;
                    
                    const predOutcome = predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
                    const actOutcome = actHome > actAway ? 'home' : actHome < actAway ? 'away' : 'draw';
                    const isCorrectOutcome = !isScheduled && predOutcome === actOutcome;

                    let ptsGained = 0;
                    let badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                    let badgeLabel = 'Incorrect';
                    let Icon = XCircle;

                    if (isScheduled) {
                      badgeColor = 'bg-white/5 text-zinc-400 border-white/10';
                      badgeLabel = 'Upcoming';
                      Icon = AlertCircle;
                    } else if (isCorrectScore) {
                      ptsGained = 2;
                      badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      badgeLabel = 'Correct Score';
                      Icon = CheckCircle2;
                    } else if (isCorrectOutcome) {
                      ptsGained = 1;
                      badgeColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                      badgeLabel = 'Correct Outcome';
                      Icon = CheckCircle2;
                    }

                    return (
                      <div
                        key={predMatch.id}
                        className="p-4 rounded-2xl border border-white/10 bg-[#0f0f1b]/50 hover:bg-[#0f0f1b]/80 transition-colors flex items-center justify-between gap-4"
                      >
                        {/* Team Info block */}
                        <div className="flex-1 space-y-2 min-w-0">
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider block">
                            Group {predMatch.id.split('-')[1]} • Match {predMatch.id.split('-')[2]}
                          </span>
                          
                          {/* Home Team */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {predMatch.homeTeam?.flagUrl && (
                                <img
                                  src={teamFlagMap[predMatch.homeTeam.code] || predMatch.homeTeam.flagUrl}
                                  alt=""
                                  className="w-6 h-4 object-cover rounded border border-white/10 flex-shrink-0"
                                />
                              )}
                              <span className="text-xs font-bold text-white truncate">
                                {predMatch.homeTeam?.name || 'TBD'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 font-mono text-xs">
                              <span className="text-white/40" title="Predicted">{predHome}</span>
                              <span className="text-white font-black" title="Actual">{isScheduled ? '—' : actHome}</span>
                            </div>
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {predMatch.awayTeam?.flagUrl && (
                                <img
                                  src={teamFlagMap[predMatch.awayTeam.code] || predMatch.awayTeam.flagUrl}
                                  alt=""
                                  className="w-6 h-4 object-cover rounded border border-white/10 flex-shrink-0"
                                />
                              )}
                              <span className="text-xs font-bold text-white truncate">
                                {predMatch.awayTeam?.name || 'TBD'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 font-mono text-xs">
                              <span className="text-white/40" title="Predicted">{predAway}</span>
                              <span className="text-white font-black" title="Actual">{isScheduled ? '—' : actAway}</span>
                            </div>
                          </div>
                        </div>

                        {/* Point Badge info */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
                            <Icon className="w-3 h-3" />
                            {badgeLabel}
                          </span>
                          <span className="font-mono text-sm font-black text-white">
                            {isScheduled ? '—' : `+${ptsGained} pts`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUBTAB: Knockouts */}
            {activeSubTab === 'knockouts' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedKnockoutMatches.map(predMatch => {
                    const actualMatch = actualResults.matches[predMatch.id];
                    if (!actualMatch) return null;

                    const isScheduled = actualMatch.status === 'SCHEDULED' || !actualMatch.status;

                    // Compute winners
                    const getMatchWinnerLocal = (m: Match) => {
                      if (m.homeScore === null || m.awayScore === null) return null;
                      if (m.homeScore > m.awayScore) return m.homeTeam?.code || null;
                      if (m.homeScore < m.awayScore) return m.awayTeam?.code || null;
                      
                      const hp = m.homePenalties ?? 0;
                      const ap = m.awayPenalties ?? 0;
                      if (hp > ap) return m.homeTeam?.code || null;
                      if (hp < ap) return m.awayTeam?.code || null;
                      return null;
                    };

                    const predWinner = getMatchWinnerLocal(predMatch);
                    const actWinner = isScheduled ? null : getMatchWinnerLocal(actualMatch);

                    const isCorrectWinner = !isScheduled && predWinner && actWinner && predWinner === actWinner;
                    const ptsValue = predMatch.id === 'FINAL' ? 10 : 5;
                    const ptsGained = isCorrectWinner ? ptsValue : 0;

                    let badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                    let badgeLabel = 'Incorrect';
                    let Icon = XCircle;

                    if (isScheduled) {
                      badgeColor = 'bg-white/5 text-zinc-400 border-white/10';
                      badgeLabel = 'Upcoming';
                      Icon = AlertCircle;
                    } else if (isCorrectWinner) {
                      badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      badgeLabel = predMatch.id === 'FINAL' ? 'Champion Crowned!' : 'Correct Advance';
                      Icon = CheckCircle2;
                    }

                    return (
                      <div
                        key={predMatch.id}
                        className="p-4 rounded-2xl border border-white/10 bg-[#0f0f1b]/50 hover:bg-[#0f0f1b]/80 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 space-y-2 min-w-0">
                          <span className="text-[9px] font-black text-brand-purple uppercase tracking-wider block">
                            {getStageLabel(predMatch.stage)} • {predMatch.id}
                          </span>

                          {/* Home Team */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              {predMatch.homeTeam?.flagUrl && (
                                <img
                                  src={teamFlagMap[predMatch.homeTeam.code] || predMatch.homeTeam.flagUrl}
                                  alt=""
                                  className="w-6 h-4 object-cover rounded border border-white/10 flex-shrink-0"
                                />
                              )}
                              <span className={`font-bold truncate ${predWinner === predMatch.homeTeam?.code ? 'text-brand-purple' : 'text-white'}`}>
                                {predMatch.homeTeam?.name || 'TBD'}
                              </span>
                            </div>
                            <div className="font-mono text-zinc-400">
                              Pred: <span className="text-white font-bold">{predMatch.homeScore ?? '-'}{predMatch.homeScore === predMatch.awayScore && predMatch.homePenalties !== undefined ? ` (${predMatch.homePenalties})` : ''}</span>
                            </div>
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              {predMatch.awayTeam?.flagUrl && (
                                <img
                                  src={teamFlagMap[predMatch.awayTeam.code] || predMatch.awayTeam.flagUrl}
                                  alt=""
                                  className="w-6 h-4 object-cover rounded border border-white/10 flex-shrink-0"
                                />
                              )}
                              <span className={`font-bold truncate ${predWinner === predMatch.awayTeam?.code ? 'text-brand-purple' : 'text-white'}`}>
                                {predMatch.awayTeam?.name || 'TBD'}
                              </span>
                            </div>
                            <div className="font-mono text-zinc-400">
                              Act: <span className="text-white font-bold">{isScheduled ? '-' : (actualMatch.homeScore ?? '-')}{!isScheduled && actualMatch.homeScore === actualMatch.awayScore && actualMatch.homePenalties !== undefined ? ` (${actualMatch.homePenalties})` : ''}</span>
                            </div>
                          </div>
                        </div>

                        {/* Points badge */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
                            <Icon className="w-3 h-3" />
                            {badgeLabel}
                          </span>
                          <span className="font-mono text-sm font-black text-white">
                            {isScheduled ? '—' : `+${ptsGained} pts`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUBTAB: Awards */}
            {activeSubTab === 'awards' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {(['goldenBall', 'goldenBoot', 'goldenGlove', 'bestYoungPlayer'] as Array<keyof AwardsState>).map(key => {
                    const predId = loadedPredictions.awards[key];
                    const actId = actualResults.awards[key];

                    const predPlayer = getPlayerDetails(predId);
                    const actPlayer = getPlayerDetails(actId);

                    const isScheduled = !actId;
                    const isMatched = !isScheduled && predId && actId && predId === actId;
                    const ptsGained = isMatched ? 8 : 0;

                    let badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                    let badgeLabel = 'Incorrect';
                    let Icon = XCircle;

                    if (isScheduled) {
                      badgeColor = 'bg-white/5 text-zinc-400 border-white/10';
                      badgeLabel = 'Upcoming';
                      Icon = AlertCircle;
                    } else if (isMatched) {
                      badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      badgeLabel = 'Award Match!';
                      Icon = CheckCircle2;
                    }

                    const awardTitleMap = {
                      goldenBall: { title: 'Golden Ball', icon: '🏆', desc: 'Tournament MVP' },
                      goldenBoot: { title: 'Golden Boot', icon: '⚽', desc: 'Top Goalscorer' },
                      goldenGlove: { title: 'Golden Glove', icon: '🧤', desc: 'Best Goalkeeper' },
                      bestYoungPlayer: { title: 'Best Young Player', icon: '🌟', desc: 'Best U21 Talent' }
                    };

                    const cfg = awardTitleMap[key];

                    return (
                      <div
                        key={key}
                        className="p-6 rounded-3xl border border-white/10 bg-[#0f0f1b]/50 flex flex-col justify-between gap-6"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{cfg.icon}</span>
                            <div>
                              <h4 className="text-sm font-black text-white uppercase tracking-wider">{cfg.title}</h4>
                              <p className="text-[10px] text-zinc-500">{cfg.desc}</p>
                            </div>
                          </div>
                          
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
                            <Icon className="w-3 h-3" />
                            {badgeLabel}
                          </span>
                        </div>

                        {/* Comparison box */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">My Prediction</span>
                            {predPlayer ? (
                              <div>
                                <p className="text-xs font-black text-white truncate">{predPlayer.name}</p>
                                <p className="text-[9px] font-mono text-zinc-400 mt-0.5">{predPlayer.teamCode}</p>
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-600 font-mono italic">None selected</p>
                            )}
                          </div>

                          <div className="space-y-1 border-l border-white/5 pl-4">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Actual / Simulated</span>
                            {actPlayer ? (
                              <div>
                                <p className="text-xs font-black text-brand-lime truncate">{actPlayer.name}</p>
                                <p className="text-[9px] font-mono text-zinc-400 mt-0.5">{actPlayer.teamCode}</p>
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-600 font-mono italic">None selected</p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-white/5 text-xs text-zinc-400">
                          <span>Point Gain</span>
                          <span className="font-mono font-bold text-white">
                            {isScheduled ? '—' : `+${ptsGained} pts`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* No Predictions Loaded View */}
      {!loadedPredictions && !loading && (
        <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-white/10 rounded-3xl bg-[#0f0f1b]/20 min-h-[300px]">
          <Trophy className="w-12 h-12 text-zinc-600 mb-4 animate-pulse" />
          <h3 className="text-base font-black text-white uppercase tracking-wider">No Predictions Loaded</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            Load your prediction code using the input box above to compare results, calculate rewards, and view dashboard analytics.
          </p>
        </div>
      )}
    </div>
  );
};

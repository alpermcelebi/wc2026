'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTournamentStore } from '../store/useTournamentStore';
import { GroupStageView } from '../components/GroupStageView';
import { KnockoutBracketView } from '../components/KnockoutBracketView';
import { GroupTable } from '../components/GroupTable';
import { Trophy, RefreshCw, Layers, GitBranch, Table, Share2, TrendingUp } from 'lucide-react';
import { MusicPlayer } from '../components/MusicPlayer';
import { AwardsPredictionView } from '../components/AwardsPredictionView';
import ShareModal from '../components/ShareModal';
import AwardsGalaModal from '../components/AwardsGalaModal';
import { TrackScoreView } from '../components/TrackScoreView';
import { serializePredictions } from '../utils/shareCompression';
import { calculateBracketScore, generateMockActualResults } from '../utils/scoringEngine';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'groups' | 'bracket' | 'thirds' | 'awards' | 'track'>('groups');
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isGalaOpen, setIsGalaOpen] = useState(false);
  
  const [savedBracketCode, setSavedBracketCode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { thirdPlaceLadder, resetTournament, matches, awards, setAwardPrediction, groups, loadPredictions, trackedPredictions, setTrackedPredictions, compareMode } = useTournamentStore();

  const prevGroupStageCompleteRef = useRef<boolean | null>(null);
  const prevFinalCompleteRef = useRef<boolean | null>(null);

  const isGroupStageComplete = Object.values(matches)
    .filter(m => m.stage === 'group')
    .every(m => m.isCompleted);

  const isFinalComplete = !!matches['FINAL']?.isCompleted;


  // Compute live prediction score dynamically from tracked predictions and compareMode
  const liveScore = useMemo(() => {
    let preds = trackedPredictions;
    if (!preds && savedBracketCode && typeof window !== 'undefined') {
      const localData = localStorage.getItem(`local_bracket_${savedBracketCode}`);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed && parsed.matches && parsed.awards) {
            preds = parsed;
          }
        } catch (e) {
          console.error('Error parsing local bracket fallback:', e);
        }
      }
    }

    if (!preds) return 0;

    let actualResults;
    if (compareMode === 'live') {
      actualResults = {
        matches,
        awards: {
          goldenBall: null,
          goldenBoot: null,
          goldenGlove: null,
          bestYoungPlayer: null
        }
      };
    } else {
      actualResults = generateMockActualResults(preds, compareMode);
    }

    const res = calculateBracketScore(preds, actualResults);
    return res.totalScore;
  }, [trackedPredictions, compareMode, savedBracketCode, matches]);

  // Sync saved bracket code on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const code = localStorage.getItem('saved_bracket_code');
      if (code) {
        setSavedBracketCode(code);
      }
    }
  }, []);

  // Load predictions from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPredsStr = localStorage.getItem('wc2026_live_predictions');
      if (savedPredsStr) {
        try {
          const parsed = JSON.parse(savedPredsStr);
          if (parsed && parsed.matches && parsed.awards) {
            loadPredictions(parsed.matches, parsed.awards);
          }
        } catch (e) {
          console.error('Failed to parse saved predictions:', e);
        }
      }
    }
  }, [loadPredictions]);

  // Auto-save predictions to LocalStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(matches).length > 0) {
      localStorage.setItem('wc2026_live_predictions', JSON.stringify({ matches, awards }));
    }
  }, [matches, awards]);

  useEffect(() => {
    if (prevGroupStageCompleteRef.current === null) {
      prevGroupStageCompleteRef.current = isGroupStageComplete;
      return;
    }

    if (isGroupStageComplete && !prevGroupStageCompleteRef.current) {
      setActiveTab('bracket');
    }

    prevGroupStageCompleteRef.current = isGroupStageComplete;
  }, [isGroupStageComplete]);

  useEffect(() => {
    if (prevFinalCompleteRef.current === null) {
      prevFinalCompleteRef.current = isFinalComplete;
      return;
    }

    if (isFinalComplete && !prevFinalCompleteRef.current) {
      setIsGalaOpen(true);
    }

    prevFinalCompleteRef.current = isFinalComplete;
  }, [isFinalComplete]);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all your predictions?')) {
      resetTournament();
      setSavedBracketCode(null);
      localStorage.removeItem('saved_bracket_code');
      localStorage.removeItem('wc2026_live_predictions');
    }
  };

  const handleSaveBracket = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/bracket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          predictions: { matches, awards }
        })
      });
      const data = await res.json();
      if (data.success && data.code) {
        setSavedBracketCode(data.code);
        localStorage.setItem('saved_bracket_code', data.code);
        
        // Handle mock mode fallback (saving state locally in LocalStorage)
        if (data.mock) {
          localStorage.setItem(`local_bracket_${data.code}`, JSON.stringify({ matches, awards }));
        }
      } else {
        alert(data.error || 'Failed to save predictions.');
      }
    } catch (err) {
      console.error('Error saving bracket:', err);
      alert('Network connection error. Failed to save predictions.');
    } finally {
      setIsSaving(false);
    }
  };

  const isLocked = false;

  return (
    <div className="relative min-h-screen bg-[#06060c] bg-grid-pattern text-zinc-100 flex flex-col antialiased">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 -z-10 w-[500px] h-[500px] rounded-full bg-brand-red/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 -z-10 w-[600px] h-[600px] rounded-full bg-brand-blue/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 -z-10 w-[300px] h-[300px] rounded-full bg-brand-purple/10 blur-[100px] pointer-events-none" />

      {/* Main Top Header */}
      <header className="sticky top-0 z-30 bg-[#06060c]/40 backdrop-blur-md">
        {/* Colorful bottom border for header */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-gradient" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-red via-brand-purple to-brand-blue flex items-center justify-center shadow-lg shadow-brand-red/20">
              <Trophy className="w-5 h-5 text-white font-bold" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-white leading-none">
                WORLD CUP 2026
              </h1>
              <p className="text-[9px] font-black text-brand-lime uppercase tracking-widest leading-none mt-1">
                Bracket Predictor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 font-semibold text-xs transition-all duration-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Predictor</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Informational Card: Tournament Overview Bar */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f0f1b]/80 via-[#130f24]/85 to-[#0b101c]/80 backdrop-blur-md p-6 sm:p-8 shadow-xl">
          {/* Subtle colorful strip at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gradient" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full items-stretch">
            {/* Box 1: MATCH TOTALS */}
            <div className="px-5 py-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-6">
              <div className="flex-1">
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Group Matches</span>
                <span className="text-2xl sm:text-3xl font-black text-brand-red font-mono block mt-1">72</span>
              </div>
              <div className="h-10 w-[1px] bg-white/10" />
              <div className="flex-1 text-right md:text-left">
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Knockout Matches</span>
                <span className="text-2xl sm:text-3xl font-black text-brand-blue font-mono block mt-1">32</span>
              </div>
            </div>

            {/* Box 2: TOURNAMENT TIMELINE */}
            <div className="px-5 py-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">World Cup Timeline</span>
              <span className="text-sm sm:text-base font-black text-white font-sans mt-1">June 11 – July 19, 2026</span>
              <span className="text-[10px] text-brand-lime font-bold mt-0.5">United States, Mexico & Canada</span>
            </div>

            {/* Box 3: PREDICTION SCORE */}
            <div className="px-5 py-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-center">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">PREDICTION SCORE</span>
              <span className="text-2xl sm:text-3xl font-black text-brand-yellow drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] font-mono mt-1 flex items-baseline gap-1">
                {liveScore} <span className="text-xs font-bold text-brand-yellow/80">PTS</span>
              </span>
              <span className="text-[9px] text-zinc-500 font-bold mt-0.5">
                #1,405 Global Leaderboard Rank
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all duration-300 ${activeTab === 'groups'
                ? 'border-brand-red text-brand-red bg-brand-red/5'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Layers className="w-4 h-4" />
            Group Stage
          </button>
          <button
            onClick={() => setActiveTab('bracket')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all duration-300 ${activeTab === 'bracket'
                ? 'border-brand-purple text-brand-purple bg-brand-purple/5'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <GitBranch className="w-4 h-4" />
            Knockout Bracket
          </button>

          <button
            onClick={() => setActiveTab('awards')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all duration-300 ${activeTab === 'awards'
                ? 'border-brand-lime text-brand-lime bg-brand-lime/5'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <Trophy className="w-4 h-4" />
            Individual Awards
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all duration-300 ${activeTab === 'track'
                ? 'border-brand-purple text-brand-purple bg-brand-purple/5'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <TrendingUp className="w-4 h-4" />
            Track My Score
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-4">
          {activeTab === 'groups' && (
            <GroupStageView 
              onShowThirds={() => setActiveTab('thirds')} 
              isLocked={isLocked} 
            />
          )}

          {activeTab === 'bracket' && (
            <KnockoutBracketView 
              isLocked={isLocked} 
            />
          )}

          {activeTab === 'thirds' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-black text-lg text-white uppercase tracking-wide">
                      Third-Place Standings Ladder
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                      After group matches are played, the 3rd-placed team from each of the 12 groups is ranked here. The **top 8 teams** qualify for the Round of 32.
                      Ties are broken by: **Points &gt; Goal Difference &gt; Goals For &gt; Group ID**.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('groups')}
                    className="flex-shrink-0 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs transition-all duration-300 flex items-center gap-1.5 self-start sm:self-auto shadow-md"
                  >
                    ← Back to Groups
                  </button>
                </div>
                {thirdPlaceLadder.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-sm border border-dashed border-white/10 rounded-xl">
                    Predict some group stage scores to populate the third-place ladder!
                  </div>
                ) : (
                  <GroupTable standings={thirdPlaceLadder} isThirdPlaceLadder={true} />
                )}
              </div>
            </div>
          )}

          {activeTab === 'awards' && (
            <AwardsPredictionView 
              isLocked={isLocked} 
            />
          )}

          {activeTab === 'track' && (
            <TrackScoreView 
              initialCode={savedBracketCode} 
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950/40 py-6 mt-16 text-center text-xs text-zinc-600">
        <p>© 2026 FIFA World Cup Predictor • Built for dynamic live bracket tracking</p>
      </footer>

      {/* Floating Music Player Widget */}
      <MusicPlayer />

      {/* Floating Awards Ceremony / Share Button */}
      {matches['FINAL']?.isCompleted && (
        <button
          onClick={() => setIsGalaOpen(true)}
          className="fixed bottom-6 right-20 z-40 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-brand-purple to-brand-blue hover:opacity-95 text-white font-black text-sm shadow-xl shadow-brand-purple/30 hover:scale-105 active:scale-95 transition-all duration-300 animate-fadeIn"
        >
          <Trophy className="w-4 h-4 animate-pulse text-amber-300" />
          Awards Ceremony & Share
        </button>
      )}

      {/* Awards Gala Modal */}
      <AwardsGalaModal
        isOpen={isGalaOpen}
        onClose={() => setIsGalaOpen(false)}
        awards={awards}
        setAwardPrediction={setAwardPrediction}
        groups={groups}
        isLocked={isLocked}
        savedBracketCode={savedBracketCode}
        onSaveBracket={handleSaveBracket}
        isSaving={isSaving}
        onGeneratePoster={() => {
          setIsGalaOpen(false);
          setIsShareOpen(true);
        }}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        shareCode={isShareOpen ? serializePredictions(matches, awards) : ''}
      />
    </div>
  );
}

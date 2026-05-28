'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTournamentStore } from '../../../store/useTournamentStore';
import { deserializePredictions } from '../../../utils/shareCompression';
import { GroupStageView } from '../../../components/GroupStageView';
import { KnockoutBracketView } from '../../../components/KnockoutBracketView';
import { GroupTable } from '../../../components/GroupTable';
import { Trophy, RefreshCw, Layers, GitBranch, Table, PlusCircle, AlertCircle } from 'lucide-react';
import { MusicPlayer } from '../../../components/MusicPlayer';
import { AwardsPredictionView } from '../../../components/AwardsPredictionView';

interface SharedDashboardClientProps {
  code: string;
}

export default function SharedDashboardClient({ code }: SharedDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'groups' | 'bracket' | 'thirds' | 'awards'>('groups');
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { thirdPlaceLadder, importPredictions, resetTournament } = useTournamentStore();

  useEffect(() => {
    try {
      if (code) {
        const parsed = deserializePredictions(code);
        importPredictions(parsed);
        setIsLoaded(true);
      }
    } catch (err) {
      console.error('Failed to parse share code:', err);
      setError('The shared prediction link is invalid or has been corrupted.');
    }
  }, [code, importPredictions]);

  const handleCreateOwn = () => {
    resetTournament();
    router.push('/');
  };

  if (error) {
    return (
      <div className="relative min-h-screen bg-[#06060c] text-zinc-100 flex flex-col items-center justify-center p-4 antialiased">
        <div className="max-w-md w-full border border-white/10 bg-gradient-to-br from-[#0f0f1b]/80 to-[#130f24]/80 backdrop-blur-md p-8 rounded-3xl text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Invalid Shared Bracket</h2>
            <p className="text-sm text-zinc-400">
              We couldn't decode the tournament predictions from this link. It might be broken or incomplete.
            </p>
          </div>
          <button
            onClick={handleCreateOwn}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-red via-brand-purple to-brand-blue font-bold text-sm text-white hover:opacity-90 shadow-lg hover:shadow-brand-purple/20 transition-all duration-300"
          >
            <PlusCircle className="w-4 h-4" />
            Create Your Own Bracket
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative min-h-screen bg-[#06060c] text-zinc-100 flex flex-col items-center justify-center p-4 antialiased">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-400 font-bold uppercase tracking-wider animate-pulse">
            Loading Shared Predictions...
          </p>
        </div>
      </div>
    );
  }

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
              onClick={handleCreateOwn}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-red via-brand-purple to-brand-blue hover:opacity-95 font-semibold text-xs transition-all duration-300 text-white shadow-md shadow-brand-purple/10"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Start My Bracket</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Shared View Warning Banner */}
        <div className="w-full px-4 box-border max-w-full">
          <div className="relative overflow-hidden rounded-3xl border border-brand-purple/30 bg-gradient-to-r from-[#170e2b]/80 to-[#0c0d1c]/80 backdrop-blur-md p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
              Shared Bracket View
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              Viewing Shared Predictions
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
              You are inspecting a bracket filled out by another user. Feel free to tweak these scores, browse the tabs, or click the button on the right to clear it and start fresh with your own prediction!
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleCreateOwn}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-xs transition-all duration-300 text-white"
            >
              <PlusCircle className="w-4 h-4 text-brand-lime" />
              Create My Own Bracket
            </button>
          </div>
        </div>
      </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all duration-300 ${
              activeTab === 'groups'
                ? 'border-brand-red text-brand-red bg-brand-red/5'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            Group Stage
          </button>
          <button
            onClick={() => setActiveTab('bracket')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all duration-300 ${
              activeTab === 'bracket'
                ? 'border-brand-purple text-brand-purple bg-brand-purple/5'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Knockout Bracket
          </button>

          <button
            onClick={() => setActiveTab('awards')}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all duration-300 ${
              activeTab === 'awards'
                ? 'border-brand-lime text-brand-lime bg-brand-lime/5'
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Individual Awards
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-4 w-full max-w-full overflow-x-auto">
          {activeTab === 'groups' && <GroupStageView onShowThirds={() => setActiveTab('thirds')} />}

          {activeTab === 'bracket' && <KnockoutBracketView />}

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

          {activeTab === 'awards' && <AwardsPredictionView />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950/40 py-6 mt-16 text-center text-xs text-zinc-600">
        <p>© 2026 FIFA World Cup Predictor • Built for dynamic live bracket tracking</p>
      </footer>

      {/* Floating Music Player Widget */}
      <MusicPlayer />
    </div>
  );
}

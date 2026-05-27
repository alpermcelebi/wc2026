'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, ArrowLeft } from 'lucide-react';

const CODE_TO_EMOJI: Record<string, string> = {
  ARG: '🇦🇷', FRA: '🇫🇷', BRA: '🇧🇷', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', GER: '🇩🇪',
  ESP: '🇪🇸', POR: '🇵🇹', NED: '🇳🇱', BEL: '🇧🇪', ITA: '🇮🇹',
  TUR: '🇹🇷', USA: '🇺🇸', MEX: '🇲🇽', CAN: '🇨🇦', MAR: '🇲🇦',
  COL: '🇨🇴', URU: '🇺🇾', CRO: '🇭🇷', SEN: '🇸🇳', JPN: '🇯🇵',
  KOR: '🇰🇷', SUI: '🇨🇭', SWE: '🇸🇪', NOR: '🇳🇴', AUT: '🇦🇹',
  DEN: '🇩🇰', UKR: '🇺🇦', POL: '🇵🇱', ROU: '🇷🇴', HUN: '🇭🇺',
  SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', CZE: '🇨🇿', GRE: '🇬🇷',
};

const getFlagEmoji = (code: string) => CODE_TO_EMOJI[code.toUpperCase()] || '🏳️';

const CountUpTicker = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / 1000, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  return <span>🔥 {count.toLocaleString()} Brackets Created</span>;
};

interface CommunityStats {
  total_brackets_count: number;
  champion_distribution: Array<{ code: string; name: string; percentage: number }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/community-stats');
        const data = await res.json();
        if (data.success) {
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching community stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#06060c] bg-grid-pattern text-zinc-100 flex flex-col antialiased">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 -z-10 w-[500px] h-[500px] rounded-full bg-brand-purple/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 -z-10 w-[600px] h-[600px] rounded-full bg-brand-blue/5 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#06060c]/40 backdrop-blur-md">
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
                Global Statistics
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-xs transition-all duration-300 text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Predictor</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
        <div className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            COMMUNITY INSIGHTS
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl">
            See predictions submitted by users worldwide. Find out who the community believes will lift the trophy in 2026.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-zinc-500 font-semibold uppercase tracking-wider">Loading global insights...</p>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch animate-fadeIn">
            {/* Metric A: Global Participant Counter */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f0f1b]/80 via-[#130f24]/85 to-[#0b101c]/80 backdrop-blur-md p-8 shadow-xl flex flex-col justify-between min-h-[220px]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gradient" />
              <div>
                <span className="text-xs text-zinc-500 uppercase font-black tracking-wider block">
                  TOTAL BRACKETS SUBMITTED
                </span>
                <h3 className="text-3xl sm:text-4xl font-black text-white mt-4 font-mono">
                  <CountUpTicker value={stats.total_brackets_count} />
                </h3>
              </div>
              <p className="text-sm text-zinc-400 mt-4 leading-relaxed">
                Join thousands of football fans worldwide tracking predictions for the FIFA World Cup 2026. Create your tournament tree, save it, and claim your share code.
              </p>
            </div>

            {/* Metric B: The Champion Odds Grid */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f0f1b]/80 via-[#130f24]/85 to-[#0b101c]/80 backdrop-blur-md p-8 shadow-xl flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gradient" />
              <div>
                <span className="text-xs text-zinc-500 uppercase font-black tracking-wider block mb-6">
                  GLOBAL CHAMPION PREDICTIONS
                </span>
                <div className="space-y-4">
                  {stats.champion_distribution.slice(0, 7).map((item) => (
                    <div key={item.code} className="flex items-center gap-3 w-full">
                      <div className="w-24 text-xs font-bold text-zinc-300 flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-sm">{getFlagEmoji(item.code)}</span>
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex-1 bg-neutral-800/80 h-2 rounded-full overflow-hidden border border-white/5 relative">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.3)] transition-all duration-1000 ease-out"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-xs font-black text-amber-400 flex-shrink-0">
                        {item.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-zinc-400 font-semibold">Stats currently unavailable. Please try again later.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950/40 py-6 mt-16 text-center text-xs text-zinc-600">
        <p>© 2026 FIFA World Cup Predictor • Built for dynamic live bracket tracking</p>
      </footer>
    </div>
  );
}

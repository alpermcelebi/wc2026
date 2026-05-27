import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '../../../utils/supabaseClient';

export const revalidate = 300; // Cache on Next.js/Vercel edge for 5 minutes (300 seconds)

const CODE_TO_NAME: Record<string, string> = {
  MEX: 'Mexico', KOR: 'South Korea', RSA: 'South Africa', CZE: 'Czechia',
  CAN: 'Canada', BIH: 'Bosnia', QAT: 'Qatar', SUI: 'Switzerland',
  BRA: 'Brazil', MAR: 'Morocco', SCO: 'Scotland', HAI: 'Haiti',
  USA: 'United States', AUS: 'Australia', PAR: 'Paraguay', TUR: 'Türkiye',
  GER: 'Germany', ECU: 'Ecuador', CIV: 'Ivory Coast', CUW: 'Curaçao',
  NED: 'Netherlands', JPN: 'Japan', TUN: 'Tunisia', SWE: 'Sweden',
  BEL: 'Belgium', IRN: 'Iran', EGY: 'Egypt', NZL: 'New Zealand',
  ESP: 'Spain', URU: 'Uruguay', KSA: 'Saudi Arabia', CPV: 'Cape Verde',
  FRA: 'France', SEN: 'Senegal', NOR: 'Norway', IRQ: 'Iraq',
  ARG: 'Argentina', ALG: 'Algeria', AUT: 'Austria', JOR: 'Jordan',
  ENG: 'England', COL: 'Colombia', UZB: 'Uzbekistan', COD: 'DR Congo',
  POR: 'Portugal', CRO: 'Croatia', PAN: 'Panama', GHA: 'Ghana',
};

const getName = (code: string) => CODE_TO_NAME[code] || code;

// In-Memory cache fallback for serverless instances
let cachedStats: any = null;
let lastFetched = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in ms

const MOCK_STATS = {
  success: true,
  total_brackets_count: 14205,
  champion_distribution: [
    { code: 'BRA', name: 'Brazil', percentage: 34.2 },
    { code: 'FRA', name: 'France', percentage: 28.0 },
    { code: 'TUR', name: 'Türkiye', percentage: 12.5 },
    { code: 'ARG', name: 'Argentina', percentage: 9.3 },
    { code: 'ENG', name: 'England', percentage: 6.8 },
  ]
};

export async function GET() {
  try {
    const now = Date.now();
    if (cachedStats && (now - lastFetched < CACHE_DURATION)) {
      return NextResponse.json(cachedStats, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=59'
        }
      });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json(MOCK_STATS, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=59'
        }
      });
    }

    // Fetch the predictions column from user_brackets
    const { data, error } = await supabase
      .from('user_brackets')
      .select('predictions_data');

    if (error) {
      console.error('Supabase error fetching stats:', error);
      // Fallback to mock data on db errors
      return NextResponse.json(MOCK_STATS);
    }

    const totalCount = data?.length || 0;
    if (totalCount === 0) {
      return NextResponse.json(MOCK_STATS);
    }

    const champCounts: Record<string, number> = {};

    for (const row of data || []) {
      const matches = row.predictions_data?.matches;
      if (!matches) continue;
      
      const finalMatch = matches['FINAL'];
      if (!finalMatch) continue;

      const homeCode = finalMatch.homeTeam?.code;
      const awayCode = finalMatch.awayTeam?.code;
      const homeScore = finalMatch.homeScore;
      const awayScore = finalMatch.awayScore;
      const homePens = finalMatch.homePenalties;
      const awayPens = finalMatch.awayPenalties;

      let winnerCode = '';
      if (homeScore !== null && awayScore !== null) {
        if (homeScore > awayScore) {
          winnerCode = homeCode;
        } else if (awayScore > homeScore) {
          winnerCode = awayCode;
        } else if (homePens !== null && awayPens !== null) {
          winnerCode = homePens > awayPens ? homeCode : awayCode;
        }
      }

      if (winnerCode) {
        champCounts[winnerCode] = (champCounts[winnerCode] || 0) + 1;
      }
    }

    const totalWithWinner = Object.values(champCounts).reduce((a, b) => a + b, 0);
    
    // Sort and convert to percentage
    let championDistribution = Object.entries(champCounts)
      .map(([code, count]) => {
        const percentage = totalWithWinner > 0 ? (count / totalWithWinner) * 100 : 0;
        return {
          code,
          name: getName(code),
          percentage: parseFloat(percentage.toFixed(1))
        };
      })
      .sort((a, b) => b.percentage - a.percentage);

    // If no winner predictions calculated, fallback to mock distribution
    if (championDistribution.length === 0) {
      championDistribution = MOCK_STATS.champion_distribution;
    }

    const result = {
      success: true,
      total_brackets_count: totalCount > 0 ? totalCount : MOCK_STATS.total_brackets_count,
      champion_distribution: championDistribution
    };

    cachedStats = result;
    lastFetched = now;

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=59'
      }
    });

  } catch (err: any) {
    console.error('Error computing community stats:', err);
    return NextResponse.json(MOCK_STATS);
  }
}

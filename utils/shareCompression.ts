import { KNOCKOUT_MATCH_IDS } from './seedData';
import { MOCK_PLAYERS } from './playersData';
import { Match, AwardsState } from '../types/tournament';

export const TEAM_CODE_TO_ISO: Record<string, string> = {
  MEX: 'mx', KOR: 'kr', RSA: 'za', CZE: 'cz',
  CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  BRA: 'br', MAR: 'ma', SCO: 'gb-sct', HAI: 'ht',
  USA: 'us', AUS: 'au', PAR: 'py', TUR: 'tr',
  GER: 'de', ECU: 'ec', CIV: 'ci', CUW: 'cw',
  NED: 'nl', JPN: 'jp', TUN: 'tn', SWE: 'se',
  BEL: 'be', IRN: 'ir', EGY: 'eg', NZL: 'nz',
  ESP: 'es', URU: 'uy', KSA: 'sa', CPV: 'cv',
  FRA: 'fr', SEN: 'sn', NOR: 'no', IRQ: 'iq',
  ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  ENG: 'gb-eng', COL: 'co', UZB: 'uz', COD: 'cd',
  POR: 'pt', CRO: 'hr', PAN: 'pa', GHA: 'gh',
  OTH: 'us'
};

export const getFlagUrlByCode = (code: string): string => {
  const iso = TEAM_CODE_TO_ISO[code.toUpperCase()];
  if (!iso) return 'https://flagcdn.com/w80/un.png';
  return `https://flagcdn.com/w80/${iso.toLowerCase()}.png`;
};

export interface SharePayload {
  m: (number[] | null)[]; // Flat list of match scores: [homeScore, awayScore, homePens?, awayPens?]
  a: (string | null)[]; // List of awards: [goldenBall, goldenBoot, goldenGlove, bestYoungPlayer]
  s: {
    home: string; // Finalist home team code
    away: string; // Finalist away team code
    homeScore: number | null;
    awayScore: number | null;
    homePens: number | null;
    awayPens: number | null;
    winner: string; // Champion team code
    gbName: string;
    gbTeam: string;
    gtName: string;
    ggTeam: string;
    byName: string;
    byTeam: string;
    sfTeams: string[];
    qfTeams: string[];
  };
}

// Generate the fixed list of all 104 match IDs in a deterministic order
export const getDeterministicMatchIds = (): string[] => {
  const ids: string[] = [];
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  groups.forEach(g => {
    for (let i = 1; i <= 6; i++) {
      ids.push(`G-${g}-${i}`);
    }
  });
  ids.push(...KNOCKOUT_MATCH_IDS.r32);
  ids.push(...KNOCKOUT_MATCH_IDS.r16);
  ids.push(...KNOCKOUT_MATCH_IDS.qf);
  ids.push(...KNOCKOUT_MATCH_IDS.sf);
  ids.push(...KNOCKOUT_MATCH_IDS.thirdPlace);
  ids.push(...KNOCKOUT_MATCH_IDS.final);
  return ids;
};

// Safe Base64 encoding supporting Unicode in both Node/Edge and Browser
export const encodeBase64 = (str: string): string => {
  if (typeof window === 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  } else {
    return btoa(unescape(encodeURIComponent(str)));
  }
};

export const decodeBase64 = (str: string): string => {
  if (typeof window === 'undefined') {
    return Buffer.from(str, 'base64').toString('utf-8');
  } else {
    return decodeURIComponent(escape(atob(str)));
  }
};

// Convert URL-safe base64 back and forth
export const toUrlSafeBase64 = (base64: string): string => {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const fromUrlSafeBase64 = (urlSafe: string): string => {
  let base64 = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
};

// Serialize Zustand store predictions into a compressed URL-safe string
export const serializePredictions = (
  matches: Record<string, Match>,
  awards: AwardsState
): string => {
  const matchIds = getDeterministicMatchIds();
  const m = matchIds.map(id => {
    const match = matches[id];
    if (!match || !match.isCompleted || match.homeScore === null || match.awayScore === null) {
      return null;
    }
    const scoreArr = [match.homeScore, match.awayScore];
    if (typeof match.homePenalties === 'number' && typeof match.awayPenalties === 'number') {
      scoreArr.push(match.homePenalties, match.awayPenalties);
    }
    return scoreArr;
  });

  const a = [awards.goldenBall, awards.goldenBoot, awards.goldenGlove, awards.bestYoungPlayer];

  // Compile summary data for final & champion
  const finalMatch = matches['FINAL'];
  const homeCode = finalMatch?.homeTeam?.code ?? '';
  const awayCode = finalMatch?.awayTeam?.code ?? '';
  const homeScore = finalMatch?.homeScore ?? null;
  const awayScore = finalMatch?.awayScore ?? null;
  const homePens = finalMatch?.homePenalties ?? null;
  const awayPens = finalMatch?.awayPenalties ?? null;

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

  // Helper to extract player info
  const getPlayerInfo = (val: string | null) => {
    if (!val) return { name: 'Undecided', team: '' };
    if (val.startsWith('write-in:')) {
      return { name: val.substring(9) || 'Write-in', team: 'OTH' };
    }
    const p = MOCK_PLAYERS.find(pl => pl.id === val);
    return { name: p?.name ?? 'Unknown', team: p?.teamCode ?? '' };
  };

  const gb = getPlayerInfo(awards.goldenBall);
  const gt = getPlayerInfo(awards.goldenBoot);
  const gg = getPlayerInfo(awards.goldenGlove);
  const by = getPlayerInfo(awards.bestYoungPlayer);

  const sfTeams = [
    matches['SF_1']?.homeTeam?.code,
    matches['SF_1']?.awayTeam?.code,
    matches['SF_2']?.homeTeam?.code,
    matches['SF_2']?.awayTeam?.code,
  ].filter(Boolean) as string[];

  const qfTeams = [
    matches['QF_1']?.homeTeam?.code,
    matches['QF_1']?.awayTeam?.code,
    matches['QF_2']?.homeTeam?.code,
    matches['QF_2']?.awayTeam?.code,
    matches['QF_3']?.homeTeam?.code,
    matches['QF_3']?.awayTeam?.code,
    matches['QF_4']?.homeTeam?.code,
    matches['QF_4']?.awayTeam?.code,
  ].filter(Boolean) as string[];

  const payload: SharePayload = {
    m,
    a,
    s: {
      home: homeCode,
      away: awayCode,
      homeScore,
      awayScore,
      homePens,
      awayPens,
      winner: winnerCode,
      gbName: gb.name,
      gbTeam: gb.team,
      gtName: gt.name,
      gtTeam: gt.team,
      ggName: gg.name,
      ggTeam: gg.team,
      byName: by.name,
      byTeam: by.team,
      sfTeams,
      qfTeams
    }
  };

  const jsonStr = JSON.stringify(payload);
  const rawBase64 = encodeBase64(jsonStr);
  return toUrlSafeBase64(rawBase64);
};

// Deserialize the compressed URL-safe string back into a store-consumable payload
export const deserializePredictions = (
  code: string
): {
  m: Record<string, [number, number, number?, number?]>;
  a: {
    gb: string | null;
    gt: string | null;
    gv: string | null;
    by: string | null;
  };
  s: SharePayload['s'];
} => {
  const rawBase64 = fromUrlSafeBase64(code);
  const jsonStr = decodeBase64(rawBase64);
  const payload = JSON.parse(jsonStr) as SharePayload;

  const matchIds = getDeterministicMatchIds();
  const m: Record<string, [number, number, number?, number?]> = {};

  payload.m.forEach((scores, idx) => {
    const id = matchIds[idx];
    if (id && scores !== null) {
      m[id] = scores as [number, number, number?, number?];
    }
  });

  const a = {
    gb: payload.a[0],
    gt: payload.a[1],
    gv: payload.a[2],
    by: payload.a[3]
  };

  return { m, a, s: payload.s };
};

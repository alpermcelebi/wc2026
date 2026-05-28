import { Team, Match } from '../types/tournament';

export const TEAMS_BY_GROUP: Record<string, { name: string; code: string; iso: string }[]> = {
  A: [
    { name: 'Mexico', code: 'MEX', iso: 'mx' },
    { name: 'South Korea', code: 'KOR', iso: 'kr' },
    { name: 'South Africa', code: 'RSA', iso: 'za' },
    { name: 'Czechia', code: 'CZE', iso: 'cz' }
  ],
  B: [
    { name: 'Canada', code: 'CAN', iso: 'ca' },
    { name: 'Bosnia & Herzegovina', code: 'BIH', iso: 'ba' },
    { name: 'Qatar', code: 'QAT', iso: 'qa' },
    { name: 'Switzerland', code: 'SUI', iso: 'ch' }
  ],
  C: [
    { name: 'Brazil', code: 'BRA', iso: 'br' },
    { name: 'Morocco', code: 'MAR', iso: 'ma' },
    { name: 'Scotland', code: 'SCO', iso: 'gb-sct' },
    { name: 'Haiti', code: 'HAI', iso: 'ht' }
  ],
  D: [
    { name: 'United States', code: 'USA', iso: 'us' },
    { name: 'Australia', code: 'AUS', iso: 'au' },
    { name: 'Paraguay', code: 'PAR', iso: 'py' },
    { name: 'Türkiye', code: 'TUR', iso: 'tr' }
  ],
  E: [
    { name: 'Germany', code: 'GER', iso: 'de' },
    { name: 'Ecuador', code: 'ECU', iso: 'ec' },
    { name: 'Ivory Coast', code: 'CIV', iso: 'ci' },
    { name: 'Curaçao', code: 'CUW', iso: 'cw' }
  ],
  F: [
    { name: 'Netherlands', code: 'NED', iso: 'nl' },
    { name: 'Japan', code: 'JPN', iso: 'jp' },
    { name: 'Tunisia', code: 'TUN', iso: 'tn' },
    { name: 'Sweden', code: 'SWE', iso: 'se' }
  ],
  G: [
    { name: 'Belgium', code: 'BEL', iso: 'be' },
    { name: 'Iran', code: 'IRN', iso: 'ir' },
    { name: 'Egypt', code: 'EGY', iso: 'eg' },
    { name: 'New Zealand', code: 'NZL', iso: 'nz' }
  ],
  H: [
    { name: 'Spain', code: 'ESP', iso: 'es' },
    { name: 'Uruguay', code: 'URU', iso: 'uy' },
    { name: 'Saudi Arabia', code: 'KSA', iso: 'sa' },
    { name: 'Cape Verde', code: 'CPV', iso: 'cv' }
  ],
  I: [
    { name: 'France', code: 'FRA', iso: 'fr' },
    { name: 'Senegal', code: 'SEN', iso: 'sn' },
    { name: 'Norway', code: 'NOR', iso: 'no' },
    { name: 'Iraq', code: 'IRQ', iso: 'iq' }
  ],
  J: [
    { name: 'Argentina', code: 'ARG', iso: 'ar' },
    { name: 'Algeria', code: 'ALG', iso: 'dz' },
    { name: 'Austria', code: 'AUT', iso: 'at' },
    { name: 'Jordan', code: 'JOR', iso: 'jo' }
  ],
  K: [
    { name: 'Portugal', code: 'POR', iso: 'pt' },
    { name: 'Colombia', code: 'COL', iso: 'co' },
    { name: 'Uzbekistan', code: 'UZB', iso: 'uz' },
    { name: 'Congo DR', code: 'COD', iso: 'cd' }
  ],
  L: [
    { name: 'England', code: 'ENG', iso: 'gb-eng' },
    { name: 'Croatia', code: 'CRO', iso: 'hr' },
    { name: 'Panama', code: 'PAN', iso: 'pa' },
    { name: 'Ghana', code: 'GHA', iso: 'gh' }
  ]
};

export const getFlagUrl = (iso: string): string => {
  return `https://flagcdn.com/w80/${iso.toLowerCase()}.png`;
};

export const INITIAL_TEAMS: Team[] = Object.entries(TEAMS_BY_GROUP).flatMap(([group, teams]) =>
  teams.map(team => ({
    name: team.name,
    code: team.code,
    flagUrl: getFlagUrl(team.iso),
    group: group
  }))
);

export const generateGroupMatches = (): Record<string, Match> => {
  const matches: Record<string, Match> = {};

  Object.entries(TEAMS_BY_GROUP).forEach(([group, teamsData]) => {
    const groupTeams: Team[] = teamsData.map(t => ({
      name: t.name,
      code: t.code,
      flagUrl: getFlagUrl(t.iso),
      group: group
    }));

    // Round-robin fixtures for 4 teams
    const fixtures = [
      { id: `G-${group}-1`, home: groupTeams[0], away: groupTeams[1] },
      { id: `G-${group}-2`, home: groupTeams[2], away: groupTeams[3] },
      { id: `G-${group}-3`, home: groupTeams[0], away: groupTeams[2] },
      { id: `G-${group}-4`, home: groupTeams[3], away: groupTeams[1] },
      { id: `G-${group}-5`, home: groupTeams[3], away: groupTeams[0] },
      { id: `G-${group}-6`, home: groupTeams[1], away: groupTeams[2] }
    ];

    fixtures.forEach(fixture => {
      matches[fixture.id] = {
        id: fixture.id,
        stage: 'group',
        homeTeam: fixture.home,
        awayTeam: fixture.away,
        homeScore: null,
        awayScore: null,
        isCompleted: false,
        status: 'SCHEDULED'
      };
    });
  });

  return matches;
};

export const KNOCKOUT_MATCH_IDS = {
  r32: [
    'R32_1', 'R32_2', 'R32_3', 'R32_4',
    'R32_5', 'R32_6', 'R32_7', 'R32_8',
    'R32_9', 'R32_10', 'R32_11', 'R32_12',
    'R32_13', 'R32_14', 'R32_15', 'R32_16'
  ],
  r16: [
    'R16_1', 'R16_2', 'R16_3', 'R16_4',
    'R16_5', 'R16_6', 'R16_7', 'R16_8'
  ],
  qf: ['QF_1', 'QF_2', 'QF_3', 'QF_4'],
  sf: ['SF_1', 'SF_2'],
  thirdPlace: ['3RD_PLACE'],
  final: ['FINAL']
};

export const generateKnockoutMatches = (): Record<string, Match> => {
  const matches: Record<string, Match> = {};

  const r32Data: Record<string, { date: string; city: string; home: string; away: string; next: string }> = {
    'R32_1': { date: 'June 29', city: 'Foxborough', home: 'Winner Group E', away: '3rd Group A/B/C/D/F', next: 'R16_1' },
    'R32_2': { date: 'June 30', city: 'East Rutherford', home: 'Winner Group I', away: '3rd Group C/D/F/G/H', next: 'R16_1' },
    'R32_3': { date: 'June 28', city: 'Inglewood', home: 'Runner-up Group A', away: 'Runner-up Group B', next: 'R16_2' },
    'R32_4': { date: 'June 29', city: 'Guadalupe', home: 'Winner Group F', away: 'Runner-up Group C', next: 'R16_2' },
    'R32_5': { date: 'July 2', city: 'Toronto', home: 'Runner-up Group K', away: 'Runner-up Group L', next: 'R16_3' },
    'R32_6': { date: 'July 2', city: 'Inglewood', home: 'Winner Group H', away: 'Runner-up Group J', next: 'R16_3' },
    'R32_7': { date: 'July 1', city: 'Santa Clara', home: 'Winner Group D', away: '3rd Group B/E/F/I/J', next: 'R16_4' },
    'R32_8': { date: 'July 1', city: 'Seattle', home: 'Winner Group G', away: '3rd Group A/E/H/I/J', next: 'R16_4' },
    'R32_9': { date: 'June 29', city: 'Houston', home: 'Winner Group C', away: 'Runner-up Group F', next: 'R16_5' },
    'R32_10': { date: 'June 30', city: 'Arlington', home: 'Runner-up Group E', away: 'Runner-up Group I', next: 'R16_5' },
    'R32_11': { date: 'June 30', city: 'Meksiko', home: 'Winner Group A', away: '3rd Group C/E/F/H/I', next: 'R16_6' },
    'R32_12': { date: 'July 1', city: 'Atlanta', home: 'Winner Group L', away: '3rd Group E/H/I/J/K', next: 'R16_6' },
    'R32_13': { date: 'July 3', city: 'Miami Gardens', home: 'Winner Group J', away: 'Runner-up Group H', next: 'R16_7' },
    'R32_14': { date: 'July 3', city: 'Arlington', home: 'Runner-up Group D', away: 'Runner-up Group G', next: 'R16_7' },
    'R32_15': { date: 'July 2', city: 'Vancouver', home: 'Winner Group B', away: '3rd Group E/F/G/I/J', next: 'R16_8' },
    'R32_16': { date: 'July 3', city: 'Kansas City', home: 'Winner Group K', away: '3rd Group D/E/I/J/L', next: 'R16_8' }
  };

  const r16Data: Record<string, { date: string; city: string; home: string; away: string; next: string }> = {
    'R16_1': { date: 'July 4', city: 'Philadelphia', home: 'Winner R32_1', away: 'Winner R32_2', next: 'QF_1' },
    'R16_2': { date: 'July 4', city: 'Houston', home: 'Winner R32_3', away: 'Winner R32_4', next: 'QF_1' },
    'R16_3': { date: 'July 6', city: 'Arlington', home: 'Winner R32_5', away: 'Winner R32_6', next: 'QF_2' },
    'R16_4': { date: 'July 6', city: 'Seattle', home: 'Winner R32_7', away: 'Winner R32_8', next: 'QF_2' },
    'R16_5': { date: 'July 5', city: 'East Rutherford', home: 'Winner R32_9', away: 'Winner R32_10', next: 'QF_3' },
    'R16_6': { date: 'July 5', city: 'Meksiko', home: 'Winner R32_11', away: 'Winner R32_12', next: 'QF_3' },
    'R16_7': { date: 'July 7', city: 'Atlanta', home: 'Winner R32_13', away: 'Winner R32_14', next: 'QF_4' },
    'R16_8': { date: 'July 7', city: 'Vancouver', home: 'Winner R32_15', away: 'Winner R32_16', next: 'QF_4' }
  };

  const qfData: Record<string, { date: string; city: string; home: string; away: string; next: string }> = {
    'QF_1': { date: 'July 9', city: 'Foxborough', home: 'Winner R16_1', away: 'Winner R16_2', next: 'SF_1' },
    'QF_2': { date: 'July 10', city: 'Inglewood', home: 'Winner R16_3', away: 'Winner R16_4', next: 'SF_1' },
    'QF_3': { date: 'July 11', city: 'Miami Gardens', home: 'Winner R16_5', away: 'Winner R16_6', next: 'SF_2' },
    'QF_4': { date: 'July 11', city: 'Kansas City', home: 'Winner R16_7', away: 'Winner R16_8', next: 'SF_2' }
  };

  const sfData: Record<string, { date: string; city: string; home: string; away: string; next: string }> = {
    'SF_1': { date: 'July 14', city: 'Arlington', home: 'Winner QF_1', away: 'Winner QF_2', next: 'FINAL/3RD_PLACE' },
    'SF_2': { date: 'July 15', city: 'Atlanta', home: 'Winner QF_3', away: 'Winner QF_4', next: 'FINAL/3RD_PLACE' }
  };

  // R32
  Object.entries(r32Data).forEach(([id, data]) => {
    matches[id] = {
      id,
      stage: 'r32',
      homeTeam: null,
      awayTeam: null,
      homeScore: null,
      awayScore: null,
      isCompleted: false,
      homePenalties: null,
      awayPenalties: null,
      date: data.date,
      stadium_city: data.city,
      home_slot: data.home,
      away_slot: data.away,
      winner_next_match_id: data.next
    };
  });

  // R16
  Object.entries(r16Data).forEach(([id, data]) => {
    matches[id] = {
      id,
      stage: 'r16',
      homeTeam: null,
      awayTeam: null,
      homeScore: null,
      awayScore: null,
      isCompleted: false,
      homePenalties: null,
      awayPenalties: null,
      date: data.date,
      stadium_city: data.city,
      home_slot: data.home,
      away_slot: data.away,
      winner_next_match_id: data.next
    };
  });

  // QF
  Object.entries(qfData).forEach(([id, data]) => {
    matches[id] = {
      id,
      stage: 'qf',
      homeTeam: null,
      awayTeam: null,
      homeScore: null,
      awayScore: null,
      isCompleted: false,
      homePenalties: null,
      awayPenalties: null,
      date: data.date,
      stadium_city: data.city,
      home_slot: data.home,
      away_slot: data.away,
      winner_next_match_id: data.next
    };
  });

  // SF
  Object.entries(sfData).forEach(([id, data]) => {
    matches[id] = {
      id,
      stage: 'sf',
      homeTeam: null,
      awayTeam: null,
      homeScore: null,
      awayScore: null,
      isCompleted: false,
      homePenalties: null,
      awayPenalties: null,
      date: data.date,
      stadium_city: data.city,
      home_slot: data.home,
      away_slot: data.away,
      winner_next_match_id: data.next
    };
  });

  // Third Place
  matches['3RD_PLACE'] = {
    id: '3RD_PLACE',
    stage: 'thirdPlace',
    homeTeam: null,
    awayTeam: null,
    homeScore: null,
    awayScore: null,
    isCompleted: false,
    homePenalties: null,
    awayPenalties: null,
    date: 'July 18',
    stadium_city: 'Miami Gardens',
    home_slot: 'Loser SF_1',
    away_slot: 'Loser SF_2'
  };

  // Final
  matches['FINAL'] = {
    id: 'FINAL',
    stage: 'final',
    homeTeam: null,
    awayTeam: null,
    homeScore: null,
    awayScore: null,
    isCompleted: false,
    homePenalties: null,
    awayPenalties: null,
    date: 'July 19',
    stadium_city: 'East Rutherford',
    home_slot: 'Winner SF_1',
    away_slot: 'Winner SF_2'
  };

  Object.values(matches).forEach(m => {
    m.status = 'SCHEDULED';
  });

  return matches;
};

export const BRACKET_FLOW: Record<string, { target: string; slot: 'home' | 'away' }> = {
  // R32 -> R16
  'R32_1': { target: 'R16_1', slot: 'home' },
  'R32_2': { target: 'R16_1', slot: 'away' },
  'R32_3': { target: 'R16_2', slot: 'home' },
  'R32_4': { target: 'R16_2', slot: 'away' },
  'R32_5': { target: 'R16_3', slot: 'home' },
  'R32_6': { target: 'R16_3', slot: 'away' },
  'R32_7': { target: 'R16_4', slot: 'home' },
  'R32_8': { target: 'R16_4', slot: 'away' },
  'R32_9': { target: 'R16_5', slot: 'home' },
  'R32_10': { target: 'R16_5', slot: 'away' },
  'R32_11': { target: 'R16_6', slot: 'home' },
  'R32_12': { target: 'R16_6', slot: 'away' },
  'R32_13': { target: 'R16_7', slot: 'home' },
  'R32_14': { target: 'R16_7', slot: 'away' },
  'R32_15': { target: 'R16_8', slot: 'home' },
  'R32_16': { target: 'R16_8', slot: 'away' },

  // R16 -> QF
  'R16_1': { target: 'QF_1', slot: 'home' },
  'R16_2': { target: 'QF_1', slot: 'away' },
  'R16_3': { target: 'QF_2', slot: 'home' },
  'R16_4': { target: 'QF_2', slot: 'away' },
  'R16_5': { target: 'QF_3', slot: 'home' },
  'R16_6': { target: 'QF_3', slot: 'away' },
  'R16_7': { target: 'QF_4', slot: 'home' },
  'R16_8': { target: 'QF_4', slot: 'away' },

  // QF -> SF
  'QF_1': { target: 'SF_1', slot: 'home' },
  'QF_2': { target: 'SF_1', slot: 'away' },
  'QF_3': { target: 'SF_2', slot: 'home' },
  'QF_4': { target: 'SF_2', slot: 'away' },

  // SF -> FINAL
  'SF_1': { target: 'FINAL', slot: 'home' },
  'SF_2': { target: 'FINAL', slot: 'away' }
};

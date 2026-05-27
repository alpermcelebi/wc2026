export type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'thirdPlace' | 'final';

export interface Team {
  name: string;
  code: string;
  flagUrl: string;
  group: string; // 'A' | 'B' | ... | 'L'
}

export interface Match {
  id: string;
  stage: Stage;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore: number | null;
  awayScore: number | null;
  isCompleted: boolean;
  status?: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  homePenalties?: number | null;
  awayPenalties?: number | null;
  // Fields to store custom user picks/predictions
  predictedHomeScore?: number | null;
  predictedAwayScore?: number | null;
  // Metadata fields for schedules & brackets
  date?: string;
  stadium_city?: string;
  home_slot?: string;
  away_slot?: string;
  winner_next_match_id?: string;
}

export interface GroupStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  pos: number;
}

export interface GroupState {
  id: string; // 'A' to 'L'
  teams: Team[];
  standings: GroupStanding[];
}

export interface ThirdPlaceStanding extends GroupStanding {
  group: string; // Group ID, 'A' to 'L'
  isQualified: boolean;
}

export interface TournamentState {
  matches: Record<string, Match>;
  groups: Record<string, GroupState>;
  thirdPlaceLadder: ThirdPlaceStanding[];
  selectedPredictions: Record<string, { home: number; away: number; homePens?: number; awayPens?: number }>;
}

export interface Player {
  id: string;
  name: string;
  teamCode: string; // e.g. 'GER', 'ARG', 'FRA'
  position: 'GK' | 'DF' | 'MF' | 'FW';
  isYoung?: boolean;
}

export interface AwardsState {
  goldenBall: string | null;
  goldenBoot: string | null;
  goldenGlove: string | null;
  bestYoungPlayer: string | null;
}

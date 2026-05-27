import { GroupState, GroupStanding, Team, ThirdPlaceStanding, Match } from '../types/tournament';

export type Groups = Record<string, GroupState>;
export type AdvancedTeams = Record<string, { home: Team | null; away: Team | null }>;

// Allowed third-place matchups for group winners to prevent playing their own group winner
export const ALLOWED_THIRDS: Record<string, string[]> = {
  E: ['A', 'B', 'C', 'D', 'F'],
  I: ['C', 'D', 'F', 'G', 'H'],
  A: ['C', 'E', 'F', 'H', 'I'],
  L: ['E', 'H', 'I', 'J', 'K'],
  D: ['B', 'E', 'F', 'I', 'J'],
  G: ['A', 'E', 'H', 'I', 'J'],
  B: ['E', 'F', 'G', 'I', 'J'],
  K: ['D', 'E', 'I', 'J', 'L']
};

/**
 * 1. Group Ranking Tie-Breakers:
 * Sorts group standings based on:
 * 1) Total Points
 * 2) Overall Goal Difference (GD)
 * 3) Overall Goals For (GF)
 * 4) Head-to-head points
 * 5) Head-to-head goal difference
 * 6) Head-to-head goals scored
 * 7) Alphabetical fallback
 */
export const sortGroupStandings = (standings: GroupStanding[], groupMatches: Match[]): GroupStanding[] => {
  return [...standings].sort((a, b) => {
    // 1. Points
    if (b.pts !== a.pts) return b.pts - a.pts;
    // 2. Goal Difference (GD)
    if (b.gd !== a.gd) return b.gd - a.gd;
    // 3. Goals Scored (GF)
    if (b.gf !== a.gf) return b.gf - a.gf;

    // Head-to-Head check between a and b
    const h2hMatch = groupMatches.find(m =>
      m.isCompleted &&
      ((m.homeTeam?.code === a.team.code && m.awayTeam?.code === b.team.code) ||
       (m.homeTeam?.code === b.team.code && m.awayTeam?.code === a.team.code))
    );

    if (h2hMatch && h2hMatch.homeScore !== null && h2hMatch.awayScore !== null) {
      const aIsHome = h2hMatch.homeTeam?.code === a.team.code;
      const aScore = aIsHome ? h2hMatch.homeScore : h2hMatch.awayScore;
      const bScore = aIsHome ? h2hMatch.awayScore : h2hMatch.homeScore;

      // 4. Head-to-head points
      const aH2hPts = aScore > bScore ? 3 : aScore < bScore ? 0 : 1;
      const bH2hPts = bScore > aScore ? 3 : bScore < aScore ? 0 : 1;
      if (bH2hPts !== aH2hPts) return bH2hPts - aH2hPts;

      // 5. Head-to-head goal difference
      const aH2hGd = aScore - bScore;
      const bH2hGd = bScore - aScore;
      if (bH2hGd !== aH2hGd) return bH2hGd - aH2hGd;

      // 6. Head-to-head goals scored
      if (bScore !== aScore) return bScore - aScore;
    }

    // 7. Alphabetical fallback
    return a.team.name.localeCompare(b.team.name);
  });
};

/**
 * 2. Rank the 12 third-placed teams across all groups.
 * Top 8 qualify, bottom 4 are eliminated.
 */
export const calculateThirdPlaceLadder = (groupsState: Groups): ThirdPlaceStanding[] => {
  const thirds: ThirdPlaceStanding[] = [];

  Object.entries(groupsState).forEach(([groupId, state]) => {
    // Index 2 represents the 3rd-placed team
    const thirdStanding = state.standings[2];
    if (thirdStanding) {
      thirds.push({
        ...thirdStanding,
        group: groupId,
        isQualified: false
      });
    }
  });

  // Sort: Points -> GD -> GF -> Group ID alphabetical fallback (for deterministic tie-breaker)
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.group.localeCompare(b.group);
  });

  // Top 8 qualify
  thirds.forEach((standing, idx) => {
    if (idx < 8) {
      standing.isQualified = true;
    }
  });

  return thirds;
};

/**
 * Bipartite matching solver to match the 8 qualified third place teams to the 8 group winners
 */
export const matchThirdsToWinners = (qualifiedThirdGroups: string[]): Record<string, string> | null => {
  const winners = ['E', 'I', 'A', 'L', 'D', 'G', 'B', 'K'];
  const result: Record<string, string> = {};
  const used = new Set<string>();

  function backtrack(index: number): boolean {
    if (index === winners.length) {
      return true;
    }
    const winner = winners[index];
    const allowed = ALLOWED_THIRDS[winner];
    for (const group of qualifiedThirdGroups) {
      if (!used.has(group) && allowed.includes(group) && group !== winner) {
        result[winner] = group;
        used.add(group);
        if (backtrack(index + 1)) {
          return true;
        }
        used.delete(group);
        delete result[winner];
      }
    }
    return false;
  }

  if (backtrack(0)) {
    return result;
  }
  return null;
};

/**
 * 3. NEW ROUND OF 32 KNOCKOUT BRACKET PATHWAY (32 Teams Total)
 * Computes all advancing slots.
 */
export const calculateAdvancedTeams = (groupsState: Groups): AdvancedTeams => {
  const winners: Record<string, Team> = {};
  const runnersUp: Record<string, Team> = {};

  Object.entries(groupsState).forEach(([groupId, state]) => {
    const first = state.standings[0]?.team;
    const second = state.standings[1]?.team;
    if (first) winners[groupId] = first;
    if (second) runnersUp[groupId] = second;
  });

  // 1. Rank the third-place teams and get the qualified ones
  const thirdsLadder = calculateThirdPlaceLadder(groupsState);
  const qualifiedThirds = thirdsLadder.filter(t => t.isQualified);
  const qualifiedGroups = qualifiedThirds.map(t => t.group).sort();

  // 2. Solve the matching for third-place teams to winners
  const thirdsMatching = matchThirdsToWinners(qualifiedGroups) || {};

  // Helper to extract the 3rd-placed team from groupsState
  const getGroupThird = (groupId: string): Team | null => {
    if (!groupId) return null;
    return groupsState[groupId]?.standings[2]?.team || null;
  };

  // 3. Construct the official Round of 32 matchups
  return {
    'R32_1': { home: winners['E'] || null, away: getGroupThird(thirdsMatching['E']) },
    'R32_2': { home: winners['I'] || null, away: getGroupThird(thirdsMatching['I']) },
    'R32_3': { home: runnersUp['A'] || null, away: runnersUp['B'] || null },
    'R32_4': { home: winners['F'] || null, away: runnersUp['C'] || null },
    'R32_5': { home: runnersUp['K'] || null, away: runnersUp['L'] || null },
    'R32_6': { home: winners['H'] || null, away: runnersUp['J'] || null },
    'R32_7': { home: winners['D'] || null, away: getGroupThird(thirdsMatching['D']) },
    'R32_8': { home: winners['G'] || null, away: getGroupThird(thirdsMatching['G']) },
    'R32_9': { home: winners['C'] || null, away: runnersUp['F'] || null },
    'R32_10': { home: runnersUp['E'] || null, away: runnersUp['I'] || null },
    'R32_11': { home: winners['A'] || null, away: getGroupThird(thirdsMatching['A']) },
    'R32_12': { home: winners['L'] || null, away: getGroupThird(thirdsMatching['L']) },
    'R32_13': { home: winners['J'] || null, away: runnersUp['H'] || null },
    'R32_14': { home: runnersUp['D'] || null, away: runnersUp['G'] || null },
    'R32_15': { home: winners['B'] || null, away: getGroupThird(thirdsMatching['B']) },
    'R32_16': { home: winners['K'] || null, away: getGroupThird(thirdsMatching['K']) }
  };
};

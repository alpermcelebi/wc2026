import { create } from 'zustand';
import { Match, GroupState, ThirdPlaceStanding, GroupStanding, Team, AwardsState } from '../types/tournament';
import {
  generateGroupMatches,
  generateKnockoutMatches,
  INITIAL_TEAMS,
  TEAMS_BY_GROUP,
  BRACKET_FLOW,
  KNOCKOUT_MATCH_IDS
} from '../utils/seedData';
import {
  sortGroupStandings,
  calculateThirdPlaceLadder,
  calculateAdvancedTeams
} from '../utils/tournamentEngine';

interface TournamentStore {
  matches: Record<string, Match>;
  groups: Record<string, GroupState>;
  thirdPlaceLadder: ThirdPlaceStanding[];
  awards: AwardsState;
  updateMatchScore: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePens?: number | null,
    awayPens?: number | null
  ) => void;
  setAwardPrediction: (awardType: keyof AwardsState, value: string | null) => void;
  importPredictions: (serialized: {
    m: Record<string, [number, number, number?, number?]>;
    a: {
      gb: string | null;
      gt: string | null;
      gv: string | null;
      by: string | null;
    };
  }) => void;
  resetTournament: () => void;
  loadPredictions: (matches: Record<string, Match>, awards: AwardsState) => void;
}

// Initial group standings calculation helper
const calculateInitialGroups = (): Record<string, GroupState> => {
  const groups: Record<string, GroupState> = {};
  Object.keys(TEAMS_BY_GROUP).forEach(groupId => {
    const teams: Team[] = TEAMS_BY_GROUP[groupId].map(t => ({
      name: t.name,
      code: t.code,
      flagUrl: `https://flagcdn.com/w80/${t.iso.toLowerCase()}.png`,
      group: groupId
    }));

    const standings: GroupStanding[] = teams.map((team, idx) => ({
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
      pos: idx + 1
    }));

    groups[groupId] = {
      id: groupId,
      teams,
      standings
    };
  });
  return groups;
};

export const useTournamentStore = create<TournamentStore>((set, get) => {
  // Recalculate standings for a specific group
  const recalculateGroup = (groupId: string, matches: Record<string, Match>, groups: Record<string, GroupState>) => {
    const group = groups[groupId];
    const groupMatches = Object.values(matches).filter(m => m.id.startsWith(`G-${groupId}-`));

    // Reset stats
    const newStandings: GroupStanding[] = group.teams.map(team => ({
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0,
      pos: 1
    }));

    // Aggregate match stats
    groupMatches.forEach(m => {
      if (!m.isCompleted || m.homeScore === null || m.awayScore === null) return;

      const home = newStandings.find(s => s.team.code === m.homeTeam?.code);
      const away = newStandings.find(s => s.team.code === m.awayTeam?.code);

      if (home && away) {
        home.played += 1;
        away.played += 1;
        home.gf += m.homeScore;
        home.ga += m.awayScore;
        away.gf += m.awayScore;
        away.ga += m.homeScore;

        if (m.homeScore > m.awayScore) {
          home.won += 1;
          home.pts += 3;
          away.lost += 1;
        } else if (m.homeScore < m.awayScore) {
          away.won += 1;
          away.pts += 3;
          home.lost += 1;
        } else {
          home.drawn += 1;
          home.pts += 1;
          away.drawn += 1;
          away.pts += 1;
        }
        home.gd = home.gf - home.ga;
        away.gd = away.gf - away.ga;
      }
    });

    // Sort standings using the 6-tier tiebreakers engine
    const sorted = sortGroupStandings(newStandings, groupMatches);
    sorted.forEach((standing, idx) => {
      standing.pos = idx + 1;
    });

    groups[groupId] = {
      ...group,
      standings: sorted
    };
  };

  // Recursively reset downstream knockout matches
  const resetDownstreamMatches = (matchId: string, matches: Record<string, Match>) => {
    // Special check for SF matches which flow to both Final and Third-Place Play-off
    if (matchId === 'SF_1') {
      const f1 = matches['FINAL'];
      f1.homeTeam = null;
      f1.homeScore = null;
      f1.awayScore = null;
      f1.isCompleted = false;
      f1.homePenalties = null;
      f1.awayPenalties = null;
      resetDownstreamMatches('FINAL', matches);

      const tp1 = matches['3RD_PLACE'];
      tp1.homeTeam = null;
      tp1.homeScore = null;
      tp1.awayScore = null;
      tp1.isCompleted = false;
      tp1.homePenalties = null;
      tp1.awayPenalties = null;
      resetDownstreamMatches('3RD_PLACE', matches);
      return;
    }

    if (matchId === 'SF_2') {
      const f1 = matches['FINAL'];
      f1.awayTeam = null;
      f1.homeScore = null;
      f1.awayScore = null;
      f1.isCompleted = false;
      f1.homePenalties = null;
      f1.awayPenalties = null;
      resetDownstreamMatches('FINAL', matches);

      const tp1 = matches['3RD_PLACE'];
      tp1.awayTeam = null;
      tp1.homeScore = null;
      tp1.awayScore = null;
      tp1.isCompleted = false;
      tp1.homePenalties = null;
      tp1.awayPenalties = null;
      resetDownstreamMatches('3RD_PLACE', matches);
      return;
    }

    const flow = BRACKET_FLOW[matchId];
    if (!flow) return;

    const targetMatch = matches[flow.target];
    if (targetMatch) {
      const prevTeam = flow.slot === 'home' ? targetMatch.homeTeam : targetMatch.awayTeam;
      if (flow.slot === 'home') {
        targetMatch.homeTeam = null;
      } else {
        targetMatch.awayTeam = null;
      }
      targetMatch.homeScore = null;
      targetMatch.awayScore = null;
      targetMatch.isCompleted = false;
      targetMatch.homePenalties = null;
      targetMatch.awayPenalties = null;

      if (prevTeam !== null) {
        resetDownstreamMatches(targetMatch.id, matches);
      }
    }
  };

  // Propagate a completed match to its next bracket slots
  const propagateMatchWinner = (matchId: string, matches: Record<string, Match>) => {
    const match = matches[matchId];
    if (!match.isCompleted || match.homeScore === null || match.awayScore === null) return;

    let winner: Team | null = null;
    let loser: Team | null = null;

    if (match.homeScore > match.awayScore) {
      winner = match.homeTeam;
      loser = match.awayTeam;
    } else if (match.homeScore < match.awayScore) {
      winner = match.awayTeam;
      loser = match.homeTeam;
    } else {
      // Tie in knockout - check penalties
      const homePens = match.homePenalties ?? 0;
      const awayPens = match.awayPenalties ?? 0;
      if (homePens > awayPens) {
        winner = match.homeTeam;
        loser = match.awayTeam;
      } else if (homePens < awayPens) {
        winner = match.awayTeam;
        loser = match.homeTeam;
      }
    }

    if (!winner) return;

    // Handle Semi-finals specially because they flow to both Final and Third-Place Play-off
    if (matchId === 'SF_1') {
      // Winner to Final home, loser to Third Place home
      const f1 = matches['FINAL'];
      const tp1 = matches['3RD_PLACE'];
      if (f1.homeTeam?.code !== winner.code) {
        f1.homeTeam = winner;
        f1.homeScore = null;
        f1.awayScore = null;
        f1.isCompleted = false;
        resetDownstreamMatches('FINAL', matches);
      }
      if (tp1.homeTeam?.code !== loser?.code) {
        tp1.homeTeam = loser;
        tp1.homeScore = null;
        tp1.awayScore = null;
        tp1.isCompleted = false;
        resetDownstreamMatches('3RD_PLACE', matches);
      }
      return;
    }

    if (matchId === 'SF_2') {
      // Winner to Final away, loser to Third Place away
      const f1 = matches['FINAL'];
      const tp1 = matches['3RD_PLACE'];
      if (f1.awayTeam?.code !== winner.code) {
        f1.awayTeam = winner;
        f1.homeScore = null;
        f1.awayScore = null;
        f1.isCompleted = false;
        resetDownstreamMatches('FINAL', matches);
      }
      if (tp1.awayTeam?.code !== loser?.code) {
        tp1.awayTeam = loser;
        tp1.homeScore = null;
        tp1.awayScore = null;
        tp1.isCompleted = false;
        resetDownstreamMatches('3RD_PLACE', matches);
      }
      return;
    }

    const flow = BRACKET_FLOW[matchId];
    if (!flow) return;

    const targetMatch = matches[flow.target];
    if (targetMatch) {
      const currentTeam = flow.slot === 'home' ? targetMatch.homeTeam : targetMatch.awayTeam;
      if (currentTeam?.code !== winner.code) {
        if (flow.slot === 'home') {
          targetMatch.homeTeam = winner;
        } else {
          targetMatch.awayTeam = winner;
        }
        targetMatch.homeScore = null;
        targetMatch.awayScore = null;
        targetMatch.isCompleted = false;
        targetMatch.homePenalties = null;
        targetMatch.awayPenalties = null;
        resetDownstreamMatches(targetMatch.id, matches);
      }
    }
  };

  // Re-run the entire Round of 32 assignment based on current standings
  const updateRoundOf32Matchups = (
    matches: Record<string, Match>,
    groups: Record<string, GroupState>
  ) => {
    // 1. Calculate advanced pairings using the programmatic utility engine
    const r32Pairings = calculateAdvancedTeams(groups);

    // 2. Update each of the 16 Round of 32 slots
    Object.entries(r32Pairings).forEach(([id, teams]) => {
      const match = matches[id];
      let changed = false;

      if (match.homeTeam?.code !== teams.home?.code) {
        match.homeTeam = teams.home;
        changed = true;
      }
      if (match.awayTeam?.code !== teams.away?.code) {
        match.awayTeam = teams.away;
        changed = true;
      }

      if (changed) {
        match.homeScore = null;
        match.awayScore = null;
        match.isCompleted = false;
        match.homePenalties = null;
        match.awayPenalties = null;
        resetDownstreamMatches(id, matches);
      }
    });
  };

  return {
    matches: {
      ...generateGroupMatches(),
      ...generateKnockoutMatches()
    },
    groups: calculateInitialGroups(),
    thirdPlaceLadder: [],
    awards: {
      goldenBall: null,
      goldenBoot: null,
      goldenGlove: null,
      bestYoungPlayer: null
    },

    updateMatchScore: (matchId, homeScore, awayScore, homePens = null, awayPens = null) => {
      const state = get();
      // Deep copy to prevent side effects and trigger state updates correctly
      const newMatches = JSON.parse(JSON.stringify(state.matches)) as Record<string, Match>;
      const newGroups = JSON.parse(JSON.stringify(state.groups)) as Record<string, GroupState>;

      const match = newMatches[matchId];
      if (!match) return;

      const isCompleted = homeScore !== null && awayScore !== null;
      match.homeScore = homeScore;
      match.awayScore = awayScore;
      match.isCompleted = isCompleted;

      if (match.stage !== 'group') {
        match.homePenalties = homePens;
        match.awayPenalties = awayPens;
      }

      if (match.stage === 'group') {
        // Group stage match update:
        // 1. Find group
        const groupId = matchId.split('-')[1];
        // 2. Recalculate standings for that group
        recalculateGroup(groupId, newMatches, newGroups);
        // 3. Recalculate third-place ladder rankings
        const newLadder = calculateThirdPlaceLadder(newGroups);
        // 4. Update the Round of 32 matches and propagate invalidations
        updateRoundOf32Matchups(newMatches, newGroups);

        set({
          matches: newMatches,
          groups: newGroups,
          thirdPlaceLadder: newLadder
        });
      } else {
        // Knockout stage match update:
        // 1. Propagate winner or clear downstream
        if (isCompleted) {
          propagateMatchWinner(matchId, newMatches);
        } else {
          resetDownstreamMatches(matchId, newMatches);
        }

        set({
          matches: newMatches
        });
      }
    },

    setAwardPrediction: (awardType, value) => {
      set(state => ({
        awards: {
          ...state.awards,
          [awardType]: value
        }
      }));
    },

    importPredictions: (serialized) => {
      const initialMatches = {
        ...generateGroupMatches(),
        ...generateKnockoutMatches()
      };
      const initialGroups = calculateInitialGroups();
      
      const newMatches = JSON.parse(JSON.stringify(initialMatches)) as Record<string, Match>;
      const newGroups = JSON.parse(JSON.stringify(initialGroups)) as Record<string, GroupState>;
      
      // 2. Set group matches first
      Object.entries(serialized.m).forEach(([id, scores]) => {
        if (id.startsWith('G-') && newMatches[id]) {
          newMatches[id].homeScore = scores[0];
          newMatches[id].awayScore = scores[1];
          newMatches[id].isCompleted = true;
        }
      });
      
      // 3. Recalculate group tables and Round of 32 pairings
      Object.keys(newGroups).forEach(groupId => {
        recalculateGroup(groupId, newMatches, newGroups);
      });
      const newLadder = calculateThirdPlaceLadder(newGroups);
      updateRoundOf32Matchups(newMatches, newGroups);
      
      // 4. Set knockout round matches in chronological order
      const roundOrder = ['R32_', 'R16_', 'QF_', 'SF_', '3RD_PLACE', 'FINAL'];
      
      roundOrder.forEach(roundPrefix => {
        Object.entries(serialized.m).forEach(([id, scores]) => {
          if (id.startsWith(roundPrefix) && newMatches[id]) {
            newMatches[id].homeScore = scores[0];
            newMatches[id].awayScore = scores[1];
            newMatches[id].isCompleted = true;
            if (scores[2] !== undefined) {
              newMatches[id].homePenalties = scores[2];
            }
            if (scores[3] !== undefined) {
              newMatches[id].awayPenalties = scores[3];
            }
            propagateMatchWinner(id, newMatches);
          }
        });
      });
      
      set({
        matches: newMatches,
        groups: newGroups,
        thirdPlaceLadder: newLadder,
        awards: {
          goldenBall: serialized.a.gb,
          goldenBoot: serialized.a.gt,
          goldenGlove: serialized.a.gv,
          bestYoungPlayer: serialized.a.by
        }
      });
    },

    resetTournament: () => {
      set({
        matches: {
          ...generateGroupMatches(),
          ...generateKnockoutMatches()
        },
        groups: calculateInitialGroups(),
        thirdPlaceLadder: [],
        awards: {
          goldenBall: null,
          goldenBoot: null,
          goldenGlove: null,
          bestYoungPlayer: null
        }
      });
    },

    loadPredictions: (matches, awards) => {
      const initialGroups = calculateInitialGroups();
      const newGroups = JSON.parse(JSON.stringify(initialGroups)) as Record<string, GroupState>;
      
      Object.keys(newGroups).forEach(groupId => {
        recalculateGroup(groupId, matches, newGroups);
      });
      const newLadder = calculateThirdPlaceLadder(newGroups);
      
      set({
        matches,
        groups: newGroups,
        thirdPlaceLadder: newLadder,
        awards
      });
    }
  };
});

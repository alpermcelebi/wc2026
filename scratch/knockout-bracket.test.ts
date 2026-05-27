import { describe, it, expect, beforeEach } from 'vitest';
import { useTournamentStore } from '../store/useTournamentStore';

describe('FIFA World Cup 2026 Knockout Bracket Pathway & State Cascade', () => {
  beforeEach(() => {
    useTournamentStore.getState().resetTournament();
  });

  it('should initialize 16 Round of 32 matches and downstream rounds with exact underscore IDs', () => {
    const { matches } = useTournamentStore.getState();

    // Verify R32 Match IDs
    for (let i = 1; i <= 16; i++) {
      expect(matches[`R32_${i}`]).toBeDefined();
      expect(matches[`R32_${i}`].stage).toBe('r32');
    }

    // Verify downstream match IDs
    const r16Ids = ['R16_1', 'R16_2', 'R16_3', 'R16_4', 'R16_5', 'R16_6', 'R16_7', 'R16_8'];
    r16Ids.forEach(id => {
      expect(matches[id]).toBeDefined();
      expect(matches[id].stage).toBe('r16');
    });

    const qfIds = ['QF_1', 'QF_2', 'QF_3', 'QF_4'];
    qfIds.forEach(id => {
      expect(matches[id]).toBeDefined();
      expect(matches[id].stage).toBe('qf');
    });

    expect(matches['SF_1']).toBeDefined();
    expect(matches['SF_2']).toBeDefined();
    expect(matches['FINAL']).toBeDefined();
    expect(matches['3RD_PLACE']).toBeDefined();
  });

  it('should assign correct teams to R32 slots after group stage simulation and verify R16 matching', () => {
    const store = useTournamentStore.getState();

    // Predict group stage matches to complete the group stage
    Object.keys(store.matches).forEach(id => {
      if (id.startsWith('G-')) {
        // Complete the match (Home wins)
        useTournamentStore.getState().updateMatchScore(id, 2, 1);
      }
    });

    const stateAfterGroups = useTournamentStore.getState();
    
    // Winner of Group E
    const winnerE = stateAfterGroups.groups['E'].standings[0].team;
    expect(stateAfterGroups.matches['R32_1'].homeTeam?.code).toBe(winnerE.code);

    // Winner of Group I
    const winnerI = stateAfterGroups.groups['I'].standings[0].team;
    expect(stateAfterGroups.matches['R32_2'].homeTeam?.code).toBe(winnerI.code);

    // Predict R32_1 and R32_2 winner progression
    useTournamentStore.getState().updateMatchScore('R32_1', 3, 0); // Home wins (Winner Group E)
    useTournamentStore.getState().updateMatchScore('R32_2', 1, 2); // Away wins (3rd Group C/D/F/G/H)

    const stateAfterR32 = useTournamentStore.getState();

    // R16_1 should feature Winner R32_1 vs Winner R32_2
    const r16_1 = stateAfterR32.matches['R16_1'];
    expect(r16_1.homeTeam?.code).toBe(winnerE.code);
    expect(r16_1.awayTeam?.code).toBe(stateAfterR32.matches['R32_2'].awayTeam?.code);
    expect(r16_1.date).toBe('July 4');
    expect(r16_1.stadium_city).toBe('Philadelphia');
  });

  it('should recursively reset downstream nodes on team slot updates (state cascading check)', () => {
    const store = useTournamentStore.getState();

    // 1. Predict all group matches
    Object.keys(store.matches).forEach(id => {
      if (id.startsWith('G-')) {
        useTournamentStore.getState().updateMatchScore(id, 1, 0);
      }
    });

    // 2. Predict R32_1 and R32_2
    useTournamentStore.getState().updateMatchScore('R32_1', 2, 1);
    useTournamentStore.getState().updateMatchScore('R32_2', 1, 0);

    // 3. Predict R16_1
    useTournamentStore.getState().updateMatchScore('R16_1', 3, 2);

    let state = useTournamentStore.getState();
    expect(state.matches['R16_1'].isCompleted).toBe(true);

    // 4. Change Group E scores to flip the winner of Group E
    // Winner of Group E was Germany. Let's make Ecuador win Group E by predicting Ecuador wins big.
    useTournamentStore.getState().updateMatchScore('G-E-1', 0, 5); // Ecuador beats Germany 5-0

    state = useTournamentStore.getState();
    
    // Check if the team in R32_1 changed, and consequently R16_1 is reset
    expect(state.matches['R16_1'].homeTeam).toBeNull();
    expect(state.matches['R16_1'].isCompleted).toBe(false);
    expect(state.matches['R16_1'].homeScore).toBeNull();
    expect(state.matches['R16_1'].awayScore).toBeNull();
  });

  it('should propagate winners of SF to FINAL and losers of SF to 3RD_PLACE', () => {
    const store = useTournamentStore.getState();

    // 1. Predict all group matches
    Object.keys(store.matches).forEach(id => {
      if (id.startsWith('G-')) {
        useTournamentStore.getState().updateMatchScore(id, 1, 0);
      }
    });

    // 2. Predict all knockout matches up to SF
    const matchIds = [
      'R32_1', 'R32_2', 'R32_3', 'R32_4', 'R32_5', 'R32_6', 'R32_7', 'R32_8',
      'R32_9', 'R32_10', 'R32_11', 'R32_12', 'R32_13', 'R32_14', 'R32_15', 'R32_16',
      'R16_1', 'R16_2', 'R16_3', 'R16_4', 'R16_5', 'R16_6', 'R16_7', 'R16_8',
      'QF_1', 'QF_2', 'QF_3', 'QF_4'
    ];

    matchIds.forEach(id => {
      useTournamentStore.getState().updateMatchScore(id, 2, 1); // Home wins
    });

    let state = useTournamentStore.getState();
    const sf1 = state.matches['SF_1'];
    const sf2 = state.matches['SF_2'];

    expect(sf1.homeTeam).not.toBeNull();
    expect(sf1.awayTeam).not.toBeNull();
    expect(sf2.homeTeam).not.toBeNull();
    expect(sf2.awayTeam).not.toBeNull();

    // 3. Predict SF_1 (Home: SF_1.homeTeam wins, Away: SF_1.awayTeam loses)
    const sf1Winner = sf1.homeTeam;
    const sf1Loser = sf1.awayTeam;
    useTournamentStore.getState().updateMatchScore('SF_1', 3, 2);

    // 4. Predict SF_2 (Home: SF_2.homeTeam loses, Away: SF_2.awayTeam wins)
    const sf2Winner = sf2.awayTeam;
    const sf2Loser = sf2.homeTeam;
    useTournamentStore.getState().updateMatchScore('SF_2', 1, 4);

    state = useTournamentStore.getState();

    // Verify Final slots
    expect(state.matches['FINAL'].homeTeam?.code).toBe(sf1Winner?.code);
    expect(state.matches['FINAL'].awayTeam?.code).toBe(sf2Winner?.code);

    // Verify 3rd Place slots
    expect(state.matches['3RD_PLACE'].homeTeam?.code).toBe(sf1Loser?.code);
    expect(state.matches['3RD_PLACE'].awayTeam?.code).toBe(sf2Loser?.code);
  });
});


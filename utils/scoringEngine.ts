import { Match, AwardsState } from '../types/tournament';

export interface ScoringResult {
  totalScore: number;
  groupPoints: number;
  knockoutPoints: number;
  awardsPoints: number;
  correctGroupScores: number;
  correctGroupOutcomes: number;
  correctKnockouts: number;
  correctAwards: number;
}

// Helper to determine the winner code of a match
export function getMatchWinner(match: Match | null | undefined): string | null {
  if (!match || !match.isCompleted || match.homeScore === null || match.awayScore === null) return null;
  if (match.homeScore > match.awayScore) return match.homeTeam?.code || null;
  if (match.homeScore < match.awayScore) return match.awayTeam?.code || null;
  
  // Check penalties for draws in knockout
  const hp = match.homePenalties ?? 0;
  const ap = match.awayPenalties ?? 0;
  if (hp > ap) return match.homeTeam?.code || null;
  if (hp < ap) return match.awayTeam?.code || null;
  return null;
}

// Calculate the score of user predictions compared to actual results
export function calculateBracketScore(
  userPreds: { matches: Record<string, Match>; awards: AwardsState },
  actualResults: { matches: Record<string, Match>; awards: AwardsState }
): ScoringResult {
  let groupPoints = 0;
  let knockoutPoints = 0;
  let awardsPoints = 0;
  
  let correctGroupScores = 0;
  let correctGroupOutcomes = 0;
  let correctKnockouts = 0;
  let correctAwards = 0;

  // 1. Score Group Stage Matches
  Object.keys(actualResults.matches).forEach(id => {
    const actual = actualResults.matches[id];
    const user = userPreds.matches[id];
    
    // Only evaluate if the actual match has finished (status === 'FINISHED')
    if (!actual || !user || actual.stage !== 'group' || actual.status !== 'FINISHED' || actual.homeScore === null || actual.awayScore === null) return;

    if (user.isCompleted && user.homeScore !== null && user.awayScore !== null) {
      // Correct Exact Score (2 points)
      if (user.homeScore === actual.homeScore && user.awayScore === actual.awayScore) {
        groupPoints += 2;
        correctGroupScores++;
      } else {
        // Correct Outcome (1 point)
        const actualWinner = actual.homeScore > actual.awayScore ? 'home' : actual.homeScore < actual.awayScore ? 'away' : 'draw';
        const userWinner = user.homeScore > user.awayScore ? 'home' : user.homeScore < user.awayScore ? 'away' : 'draw';
        if (actualWinner === userWinner) {
          groupPoints += 1;
          correctGroupOutcomes++;
        }
      }
    }
  });

  // 2. Score Knockout Matches (R32, R16, QF, SF, 3RD_PLACE, FINAL)
  Object.keys(actualResults.matches).forEach(id => {
    const actual = actualResults.matches[id];
    const user = userPreds.matches[id];
    
    // Only evaluate if the actual match has finished (status === 'FINISHED')
    if (!actual || !user || actual.stage === 'group' || actual.status !== 'FINISHED') return;

    const actualWinner = getMatchWinner(actual);
    const userWinner = getMatchWinner(user);

    if (actualWinner && userWinner && actualWinner === userWinner) {
      correctKnockouts++;
      if (id === 'FINAL') {
        knockoutPoints += 10; // 10 points for correct Champion
      } else {
        knockoutPoints += 5; // 5 points for advanced winner
      }
    }
  });

  // 3. Score Individual Awards
  const awardKeys: Array<keyof AwardsState> = ['goldenBall', 'goldenBoot', 'goldenGlove', 'bestYoungPlayer'];
  awardKeys.forEach(key => {
    const actualVal = actualResults.awards[key];
    const userVal = userPreds.awards[key];

    if (actualVal && userVal && actualVal === userVal) {
      awardsPoints += 8; // 8 points for correct award prediction
      correctAwards++;
    }
  });

  return {
    totalScore: groupPoints + knockoutPoints + awardsPoints,
    groupPoints,
    knockoutPoints,
    awardsPoints,
    correctGroupScores,
    correctGroupOutcomes,
    correctKnockouts,
    correctAwards
  };
}

// Generate static simulated results for comparing
export function generateMockActualResults(
  userPreds: { matches: Record<string, Match>; awards: AwardsState },
  mode: 'simulation' | 'perfect'
): { matches: Record<string, Match>; awards: AwardsState } {
  if (mode === 'perfect') {
    const cloned = JSON.parse(JSON.stringify(userPreds)) as { matches: Record<string, Match>; awards: AwardsState };
    Object.values(cloned.matches).forEach(m => {
      m.status = 'FINISHED';
    });
    return cloned;
  }

  // Create simulated copy of base matches
  const simulatedMatches = JSON.parse(JSON.stringify(userPreds.matches)) as Record<string, Match>;

  // Simulate group stage matches as completed with realistic scores
  Object.keys(simulatedMatches).forEach(id => {
    const match = simulatedMatches[id];
    match.status = 'FINISHED';
    if (match.stage === 'group') {
      match.isCompleted = true;
      // We vary some scores from user's predictions, and match some exactly
      const seed = parseInt(id.replace(/\D/g, '') || '5', 10);
      if (seed % 3 === 0 && match.homeScore !== null) {
        // Match user score exactly
      } else {
        // Set fixed realistic score
        match.homeScore = (seed % 2) + 1;
        match.awayScore = (seed % 3) === 0 ? 0 : (seed % 2);
      }
    }
  });

  // For simplicity, knockout matches in simulated results will match the user's knockout structure but with 75% correct outcomes
  Object.keys(simulatedMatches).forEach(id => {
    const match = simulatedMatches[id];
    match.status = 'FINISHED';
    if (match.stage !== 'group') {
      const seed = id.charCodeAt(id.length - 1);
      match.isCompleted = true;
      if (seed % 4 !== 0 && match.homeScore !== null && match.awayScore !== null) {
        // Match user's predicted score and penalties
      } else {
        // Swap winner
        const oldHome = match.homeScore ?? 2;
        const oldAway = match.awayScore ?? 1;
        match.homeScore = oldAway;
        match.awayScore = oldHome;
        if (match.homeScore === match.awayScore) {
          const oldHomePens = match.homePenalties ?? 4;
          const oldAwayPens = match.awayPenalties ?? 3;
          match.homePenalties = oldAwayPens;
          match.awayPenalties = oldHomePens;
        }
      }
    }
  });

  // Simulated awards (e.g. Mbappé, Maignan, Yamal)
  const simulatedAwards: AwardsState = {
    goldenBall: userPreds.awards.goldenBall || 'p-mbappe',
    goldenBoot: 'p-haaland',
    goldenGlove: userPreds.awards.goldenGlove || 'p-maignan',
    bestYoungPlayer: 'p-yamal'
  };

  return {
    matches: simulatedMatches,
    awards: simulatedAwards
  };
}

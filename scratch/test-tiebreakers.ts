import { useTournamentStore } from '../store/useTournamentStore';
import { serializePredictions, deserializePredictions } from '../utils/shareCompression';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
}

async function runTests() {
  console.log('--- Starting Tournament Store Validation Tests ---');

  const store = useTournamentStore.getState();

  // Test 1: Initial state validation
  assert(
    Object.keys(store.groups).length === 12,
    'Should initialize with 12 groups (A to L)'
  );
  assert(
    Object.keys(store.matches).length === 72 + 16 + 8 + 4 + 2 + 1 + 1, // 72 group + 32 knockout matches
    'Should initialize with 104 matches total'
  );

  // Test 2: Predict Group A matches and check standings calculations
  // Group A teams: Mexico (MEX), South Korea (KOR), South Africa (RSA), Czechia (CZE)
  // G-A-1: Mexico vs South Korea
  // G-A-2: South Africa vs Czechia
  
  // Predict Mexico 3 - 0 South Korea
  store.updateMatchScore('G-A-1', 3, 0);
  let updatedStore = useTournamentStore.getState();
  let mexicoStanding = updatedStore.groups['A'].standings.find(s => s.team.name === 'Mexico');
  let koreaStanding = updatedStore.groups['A'].standings.find(s => s.team.name === 'South Korea');
  
  assert(mexicoStanding?.pts === 3, 'Mexico should have 3 points');
  assert(mexicoStanding?.gd === 3, 'Mexico should have +3 goal difference');
  assert(koreaStanding?.pts === 0, 'South Korea should have 0 points');
  assert(koreaStanding?.gd === -3, 'South Korea should have -3 goal difference');

  // Test 3: Test Head-to-Head Tiebreaker
  // Let's make South Africa and Czechia tie on Pts, GD, GF but have a H2H match result
  // G-A-2: South Africa vs Czechia -> South Africa 2 - 1 Czechia
  // G-A-3: Mexico vs South Africa -> Mexico 0 - 0 South Africa
  // G-A-4: Czechia vs South Korea -> Czechia 1 - 0 South Korea
  // G-A-5: Czechia vs Mexico -> Czechia 0 - 0 Mexico
  // G-A-6: South Korea vs South Africa -> South Korea 1 - 0 South Africa
  store.updateMatchScore('G-A-2', 2, 1); // RSA 2, CZE 1
  store.updateMatchScore('G-A-3', 0, 0); // MEX 0, RSA 0
  store.updateMatchScore('G-A-4', 1, 0); // CZE 1, KOR 0
  store.updateMatchScore('G-A-5', 0, 0); // CZE 0, MEX 0
  store.updateMatchScore('G-A-6', 1, 0); // KOR 1, RSA 0

  updatedStore = useTournamentStore.getState();
  
  // Let's check Czechia and South Africa standings
  // RSA played: G-A-2 (win 2-1), G-A-3 (draw 0-0), G-A-6 (lose 0-1) => Pts = 4, GF = 2, GA = 2, GD = 0
  // CZE played: G-A-2 (lose 1-2), G-A-4 (win 1-0), G-A-5 (draw 0-0) => Pts = 4, GF = 2, GA = 2, GD = 0
  // Since Pts, GD, GF are identical, Head-to-Head is checked: RSA beat CZE 2-1, so RSA should be ranked above CZE!
  
  const rsaPos = updatedStore.groups['A'].standings.find(s => s.team.name === 'South Africa')?.pos ?? 0;
  const czePos = updatedStore.groups['A'].standings.find(s => s.team.name === 'Czechia')?.pos ?? 0;
  
  assert(
    rsaPos < czePos,
    `South Africa (pos ${rsaPos}) should rank above Czechia (pos ${czePos}) due to head-to-head win`
  );

  // Test 4: Check if Third Place Ladder ranks teams correctly
  // Currently Group A's 3rd place team should be in the ladder
  assert(
    updatedStore.thirdPlaceLadder.length === 12,
    'Third place ladder should have exactly 12 teams'
  );
  
  const qualifiedThirds = updatedStore.thirdPlaceLadder.filter(t => t.isQualified);
  assert(
    qualifiedThirds.length === 8,
    'Should have exactly 8 qualified third place teams'
  );

  // Test 5: Verify that no team plays their own group winner in R32
  // We can scan all R32 matches and verify that for any match with a 3rd place team, 
  // that team's group does not match the winner's group.
  const r32Matches = Object.values(updatedStore.matches).filter(m => m.stage === 'r32');
  let ownGroupMatchFound = false;

  r32Matches.forEach(m => {
    if (m.homeTeam && m.awayTeam) {
      if (m.homeTeam.group === m.awayTeam.group) {
        ownGroupMatchFound = true;
      }
    }
  });

  assert(
    !ownGroupMatchFound,
    'No Round of 32 match should feature teams from the same group'
  );

  // Test 6: Knockout propagation and invalidation
  // R32_3: Runner-up A vs Runner-up B. Let's predict scores.
  // Group A runner up is RSA/CZE. Let's find it.
  const r2a = updatedStore.groups['A'].standings[1]?.team;
  const r2b = updatedStore.groups['B'].standings[1]?.team;

  assert(
    updatedStore.matches['R32_3'].homeTeam?.code === r2a?.code,
    'R32_3 home team should be Runner-up of Group A'
  );
  assert(
    updatedStore.matches['R32_3'].awayTeam?.code === r2b?.code,
    'R32_3 away team should be Runner-up of Group B'
  );

  // Predict R32_3 score: Home 2 - 1 Away
  store.updateMatchScore('R32_3', 2, 1);
  updatedStore = useTournamentStore.getState();
  
  // It should propagate to R16_2 as homeTeam
  assert(
    updatedStore.matches['R16_2'].homeTeam?.code === r2a?.code,
    'Winner of R32_3 should propagate to R16_2'
  );

  // Test 7: Invalidation / Reset downstream
  // If we change R32_3 score to Home 1 - 2 Away, the winner changes to Runner-up B.
  // R16_2 home team should update to Runner-up B, and score should reset to null
  store.updateMatchScore('R32_3', 1, 2);
  updatedStore = useTournamentStore.getState();

  assert(
    updatedStore.matches['R16_2'].homeTeam?.code === r2b?.code,
    'Winner of R32_3 should change to Runner-up B in R16_2'
  );
  assert(
    updatedStore.matches['R16_2'].homeScore === null,
    'R16_2 score should reset to null on parent winner change'
  );

  // Test 8: Individual Awards predictions store actions
  store.setAwardPrediction('goldenBall', 'p-mbappe');
  store.setAwardPrediction('goldenBoot', 'p-haaland');
  store.setAwardPrediction('goldenGlove', 'p-maignan');
  store.setAwardPrediction('bestYoungPlayer', 'write-in:Lamine Yamal Extra');

  updatedStore = useTournamentStore.getState();
  assert(updatedStore.awards.goldenBall === 'p-mbappe', 'Golden Ball should be set to p-mbappe');
  assert(updatedStore.awards.goldenBoot === 'p-haaland', 'Golden Boot should be set to p-haaland');
  assert(updatedStore.awards.goldenGlove === 'p-maignan', 'Golden Glove should be set to p-maignan');
  assert(updatedStore.awards.bestYoungPlayer === 'write-in:Lamine Yamal Extra', 'Best Young Player should support write-ins');

  // Test 9: Resetting the tournament should wipe the awards predictions
  store.resetTournament();
  updatedStore = useTournamentStore.getState();
  assert(updatedStore.awards.goldenBall === null, 'Golden Ball should reset to null');
  assert(updatedStore.awards.bestYoungPlayer === null, 'Best Young Player write-in should reset to null');

  // Test 10: Serialization & Import Integration Test
  console.log('Setting up predictions for serialization test...');
  // Predict group matches
  store.updateMatchScore('G-A-1', 2, 1);
  store.updateMatchScore('G-A-2', 1, 1);
  store.updateMatchScore('G-B-1', 3, 0);
  store.setAwardPrediction('goldenBall', 'p-mbappe');
  store.setAwardPrediction('goldenBoot', 'p-haaland');
  store.setAwardPrediction('goldenGlove', 'p-maignan');
  store.setAwardPrediction('bestYoungPlayer', 'write-in:Lamine Yamal');

  const beforeMatches = JSON.parse(JSON.stringify(useTournamentStore.getState().matches));
  const beforeAwards = JSON.parse(JSON.stringify(useTournamentStore.getState().awards));

  console.log('Serializing predictions...');
  const code = serializePredictions(beforeMatches, beforeAwards);
  assert(typeof code === 'string' && code.length > 20, 'Should generate a valid base64 code string');
  console.log(`Generated code: ${code} (length: ${code.length})`);

  console.log('Deserializing predictions...');
  const deserialized = deserializePredictions(code);

  console.log('Resetting tournament...');
  store.resetTournament();
  let resetStore = useTournamentStore.getState();
  assert(resetStore.matches['G-A-1'].homeScore === null, 'After reset, G-A-1 home score should be null');
  assert(resetStore.awards.goldenBall === null, 'After reset, goldenBall should be null');

  console.log('Importing predictions...');
  store.importPredictions(deserialized);
  const afterStore = useTournamentStore.getState();

  // Verify match scores imported correctly
  assert(afterStore.matches['G-A-1'].homeScore === 2, 'G-A-1 home score should be 2 after import');
  assert(afterStore.matches['G-A-1'].awayScore === 1, 'G-A-1 away score should be 1 after import');
  assert(afterStore.matches['G-A-2'].homeScore === 1, 'G-A-2 home score should be 1 after import');
  assert(afterStore.matches['G-A-2'].awayScore === 1, 'G-A-2 away score should be 1 after import');
  assert(afterStore.matches['G-B-1'].homeScore === 3, 'G-B-1 home score should be 3 after import');
  assert(afterStore.matches['G-B-1'].awayScore === 0, 'G-B-1 away score should be 0 after import');

  // Verify awards imported correctly
  assert(afterStore.awards.goldenBall === 'p-mbappe', 'Golden Ball should be p-mbappe after import');
  assert(afterStore.awards.goldenBoot === 'p-haaland', 'Golden Boot should be p-haaland after import');
  assert(afterStore.awards.goldenGlove === 'p-maignan', 'Golden Glove should be p-maignan after import');
  assert(afterStore.awards.bestYoungPlayer === 'write-in:Lamine Yamal', 'Best Young Player should be Lamine Yamal after import');

  console.log('--- All Tests Completed Successfully ---');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});

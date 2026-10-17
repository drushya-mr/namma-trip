const test = require('node:test');
const assert = require('node:assert');
const { validateAndEnrichPlan } = require('../src/services/planValidator');
const db = require('../src/data/db');

test('Plan Validation - Rejects non-existent place IDs', () => {
  const allPlaces = db.getRawPlaces();
  const rawPlanWithFakePlace = {
    title: 'Test Plan',
    starting_city: 'Bengaluru',
    days: [
      {
        day_number: 1,
        theme: 'Day 1',
        stops: [
          { place_id: 'fake-monument-xyz', timings: '10:00 - 12:00' }
        ]
      }
    ]
  };

  const candidatePlaces = allPlaces.slice(0, 5);
  const result = validateAndEnrichPlan(rawPlanWithFakePlace, allPlaces, candidatePlaces, 'kn');

  assert.strictEqual(result.isValid, false);
  assert.match(result.error, /does not exist in the database/);
});

test('Plan Validation - Enforces candidate cluster constraints', () => {
  const allPlaces = db.getRawPlaces();
  // Bengaluru place
  const bengaluruCandidates = allPlaces.filter(p => p.cluster === '1. Bengaluru Belt');
  // Hampi place (in cluster 8)
  const hampiPlace = allPlaces.find(p => p.id === 'virupaksha-temple-hampi');

  const rawPlanWithOutOfClusterPlace = {
    title: 'Test Plan',
    starting_city: 'Bengaluru',
    days: [
      {
        day_number: 1,
        theme: 'Day 1',
        stops: [
          { place_id: hampiPlace.id, timings: '10:00 - 12:00' }
        ]
      }
    ]
  };

  const result = validateAndEnrichPlan(rawPlanWithOutOfClusterPlace, allPlaces, bengaluruCandidates, 'kn');
  assert.strictEqual(result.isValid, false);
  assert.match(result.error, /not in the allowed geographic clusters/);
});

test('Plan Validation - Enforces authentic database fees and unverified warnings', () => {
  const allPlaces = db.getRawPlaces();
  const lalbagh = allPlaces.find(p => p.id === 'lalbagh-botanical-garden'); // fee_inr: 30, verified
  const devanahalli = allPlaces.find(p => p.id === 'devanahalli-fort'); // fee_inr: null, unverified

  const candidates = [lalbagh, devanahalli];

  const rawValidPlan = {
    title: 'Valid Bengaluru Plan',
    starting_city: 'Bengaluru',
    days: [
      {
        day_number: 1,
        stops: [
          { place_id: lalbagh.id, timings: '08:00 - 10:00' },
          { place_id: devanahalli.id, timings: '11:00 - 13:00' }
        ]
      }
    ]
  };

  const result = validateAndEnrichPlan(rawValidPlan, allPlaces, candidates, 'kn');
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.plan.days[0].stops[0].fee_inr, 30);
  assert.strictEqual(result.plan.days[0].stops[0].verificationBadge.status, 'verified');
  assert.strictEqual(result.plan.days[0].stops[0].verificationBadge.color, 'green');

  // Second stop has null fee -> amber badge
  assert.strictEqual(result.plan.days[0].stops[1].fee_inr, null);
  assert.strictEqual(result.plan.days[0].stops[1].verificationBadge.status, 'unverified');
  assert.strictEqual(result.plan.days[0].stops[1].verificationBadge.color, 'amber');

  // Budget breakdown must flag unconfirmed fees
  assert.strictEqual(result.plan.budget_breakdown.has_unverified_fees, true);
  assert.match(result.plan.budget_breakdown.budget_note, /ಕನಿಷ್ಠ ಅಂದಾಜು; ಕೆಲವು ಪ್ರವೇಶ ಶುಲ್ಕಗಳು ದೃಢಪಟ್ಟಿಲ್ಲ/);
});

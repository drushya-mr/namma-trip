const test = require('node:test');
const assert = require('node:assert');
const { generateGroundedAnswer, containsKannada } = require('../src/services/askAiService');
const db = require('../src/data/db');

test('Ask-AI Grounding - Correctly identifies Kannada script in questions', () => {
  assert.strictEqual(containsKannada('ಪ್ರವೇಶ ಶುಲ್ಕ ಎಷ್ಟು?'), true);
  assert.strictEqual(containsKannada('What is the entry fee?'), false);
  assert.strictEqual(containsKannada('Is it free? ಧನ್ಯವಾದ'), true);
});

test('Ask-AI Grounding - Unverified place with null fee explicitly states fee is not confirmed', () => {
  const mysorePalace = db.places.getById('mysore-palace'); // fee_inr is null, conflicting fee_text
  assert.strictEqual(mysorePalace.fee_inr, null);

  const answerKn = generateGroundedAnswer(mysorePalace, [], 'ಪ್ರವೇಶ ಶುಲ್ಕ ಎಷ್ಟು?', 'kn');
  assert.match(answerKn.answer, /ದೃಢಪಡಿಸಲಾಗಿಲ್ಲ|ಪರಸ್ಪರ ವಿರೋಧಾತ್ಮಕ/);
  assert.strictEqual(answerKn.is_verified, true); // verified_on is present for Mysore Palace (checked 2026-10-17)

  const devanahalli = db.places.getById('devanahalli-fort'); // fee_inr null, verified_on null
  const answerEn = generateGroundedAnswer(devanahalli, [], 'What is the ticket price?', 'en');
  assert.match(answerEn.answer, /NOT confirmed/i);
  assert.match(answerEn.answer, /Caution: This fee has not been recently verified online/i);
  assert.strictEqual(answerEn.is_verified, false);
});

test('Ask-AI Grounding - Verified place cites source and verified date', () => {
  const lalbagh = db.places.getById('lalbagh-botanical-garden'); // verified_on: "2026-10-17 (online source check)"
  const answer = generateGroundedAnswer(lalbagh, [], 'What is the entry ticket price?', 'en');

  assert.strictEqual(answer.is_verified, true);
  assert.match(answer.answer, /₹30/);
  assert.match(answer.answer, /2026-10-17/);
  assert.ok(answer.sources.length > 0);
  assert.ok(answer.source_url.includes('karnatakatourism.org'));
});

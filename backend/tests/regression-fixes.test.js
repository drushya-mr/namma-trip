const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/server');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

test('Regression - District filtering returns matching places for every supported district', async () => {
  // Test partial match like "Bengaluru"
  const resBng = await fetch(`${baseUrl}/places?district=Bengaluru`);
  assert.equal(resBng.status, 200);
  const dataBng = await resBng.json();
  assert.equal(dataBng.success, true);
  assert.ok(dataBng.count > 0, 'Bengaluru should return places');

  // Test exact match like "Mysuru"
  const resMys = await fetch(`${baseUrl}/places?district=Mysuru`);
  assert.equal(resMys.status, 200);
  const dataMys = await resMys.json();
  assert.equal(dataMys.success, true);
  assert.ok(dataMys.count > 0, 'Mysuru should return places');

  // Test case insensitivity
  const resCase = await fetch(`${baseUrl}/places?district=shivamogga`);
  assert.equal(resCase.status, 200);
  const dataCase = await resCase.json();
  assert.equal(dataCase.success, true);
  assert.ok(dataCase.count > 0, 'shivamogga should return places');
});

test('Regression - Plan generation succeeds with coerced parameters and locale string', async () => {
  const payload = {
    startingCity: 'Bengaluru',
    days: '3', // string instead of number
    budget: '7500', // string instead of number
    travelStyle: 'relaxed',
    groupType: 'friends',
    interests: ['heritage'],
    language: 'kn-IN' // regional locale string
  };

  const res = await fetch(`${baseUrl}/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.plan, 'Plan object should exist');
  assert.equal(data.plan.days.length, 3, 'Should generate 3 days');
  assert.ok(data.plan.budget_breakdown, 'Should have budget breakdown');
});

test('Regression - Plan generation succeeds across all gateway cities', async () => {
  const cities = ['Mysuru', 'Mangaluru', 'Badami / Vijayapura', 'Chikkamagaluru'];
  for (const city of cities) {
    const res = await fetch(`${baseUrl}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startingCity: city,
        days: 2,
        language: 'kn'
      })
    });
    assert.equal(res.status, 200, `Plan generation for ${city} should return 200`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.plan.days.length, 2);
  }
});

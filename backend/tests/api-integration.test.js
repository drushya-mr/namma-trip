const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/server');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('API Integration - Health check', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'ok');
  assert.strictEqual(data.places_count, 84);
  assert.strictEqual(data.districts_covered, 31);
});

test('API Integration - GET /api/places and bilingual search', async () => {
  const res = await fetch(`${baseUrl}/api/places`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.places.length, 84);

  // Search in Kannada for Hampi
  const knSearchRes = await fetch(`${baseUrl}/api/places?q=${encodeURIComponent('ಹಂಪಿ')}`);
  const knSearchData = await knSearchRes.json();
  assert.ok(knSearchData.places.some(p => p.id === 'virupaksha-temple-hampi'));

  // Search in English for Hampi
  const enSearchRes = await fetch(`${baseUrl}/api/places?q=Hampi`);
  const enSearchData = await enSearchRes.json();
  assert.ok(enSearchData.places.some(p => p.id === 'virupaksha-temple-hampi'));
});

test('API Integration - GET /api/places/:id', async () => {
  const res = await fetch(`${baseUrl}/api/places/virupaksha-temple-hampi`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.place.id, 'virupaksha-temple-hampi');
  assert.strictEqual(data.place.district, 'Vijayanagara');
});

test('API Integration - GET /api/feed', async () => {
  const res = await fetch(`${baseUrl}/api/feed`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.posts));
  assert.ok(data.posts.length > 0);
});

test('API Integration - POST /api/plan and POST /api/plan/:id/regenerate-day', async () => {
  const planRes = await fetch(`${baseUrl}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startingCity: 'Bengaluru',
      days: 2,
      travelStyle: 'relaxed',
      interests: ['heritage'],
      language: 'kn'
    })
  });

  assert.strictEqual(planRes.status, 200);
  const planData = await planRes.json();
  assert.strictEqual(planData.success, true);
  assert.strictEqual(planData.plan.days.length, 2);

  // Regenerate Day 1
  const regenRes = await fetch(`${baseUrl}/api/plan/trip-123/regenerate-day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan: planData.plan,
      dayNumber: 1,
      language: 'kn'
    })
  });

  assert.strictEqual(regenRes.status, 200);
  const regenData = await regenRes.json();
  assert.strictEqual(regenData.success, true);
  assert.strictEqual(regenData.plan.days.length, 2);
});

test('API Integration - Posts flow (create, like, save, comment)', async () => {
  // Create post
  const createRes = await fetch(`${baseUrl}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      place_id: 'badami-cave-temples',
      title: 'Amazing Badami Caves',
      review_text: 'The rock-cut architecture of Badami is spectacular. Highly recommended!',
      rating: 5,
      month_visited: 'October 2026',
      spend_inr: 1500
    })
  });
  assert.strictEqual(createRes.status, 201);
  const createData = await createRes.json();
  assert.strictEqual(createData.success, true);
  const newPostId = createData.post.id;

  // Like
  const likeRes = await fetch(`${baseUrl}/api/posts/${newPostId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'demo-user-id' })
  });
  assert.strictEqual(likeRes.status, 200);
  const likeData = await likeRes.json();
  assert.strictEqual(likeData.success, true);
  assert.strictEqual(likeData.liked, true);

  // Save
  const saveRes = await fetch(`${baseUrl}/api/posts/${newPostId}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'demo-user-id' })
  });
  assert.strictEqual(saveRes.status, 200);
  const saveData = await saveRes.json();
  assert.strictEqual(saveData.success, true);
  assert.strictEqual(saveData.saved, true);

  // Comment
  const commentRes = await fetch(`${baseUrl}/api/posts/${newPostId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'demo-user-id',
      text: 'Great review! Which cave was your favorite?'
    })
  });
  assert.strictEqual(commentRes.status, 201);
  const commentData = await commentRes.json();
  assert.strictEqual(commentData.success, true);
  assert.strictEqual(commentData.comment.text, 'Great review! Which cave was your favorite?');
});

test('API Integration - Questions and Answers flow (ask, answer, vote)', async () => {
  // Ask question
  const qRes = await fetch(`${baseUrl}/api/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      place_id: 'jog-falls',
      question_text: 'Are guide services available at Jog Falls?',
      userId: 'demo-user-id'
    })
  });
  assert.strictEqual(qRes.status, 201);
  const qData = await qRes.json();
  assert.strictEqual(qData.success, true);
  const qId = qData.question.id;

  // Answer question
  const ansRes = await fetch(`${baseUrl}/api/questions/${qId}/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user-ananya-id',
      answer_text: 'Yes, certified local guides are available near the main gate.'
    })
  });
  assert.strictEqual(ansRes.status, 201);
  const ansData = await ansRes.json();
  assert.strictEqual(ansData.success, true);
  const ansId = ansData.answer.id;

  // Vote on answer via POST /api/answers/:id/vote
  const voteRes = await fetch(`${baseUrl}/api/answers/${ansId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'demo-user-id', vote: 1 })
  });
  assert.strictEqual(voteRes.status, 200);
  const voteData = await voteRes.json();
  assert.strictEqual(voteData.success, true);
  assert.strictEqual(voteData.votes_count, 1);
});

test('API Integration - POST /api/ask-ai', async () => {
  const res = await fetch(`${baseUrl}/api/ask-ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      placeId: 'lalbagh-botanical-garden',
      question: 'What is the entry fee?',
      language: 'en'
    })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.answer.includes('30'));
  assert.strictEqual(data.is_verified, true);
});

test('API Integration - POST /api/translate', async () => {
  const res = await fetch(`${baseUrl}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Beautiful waterfall and pleasant weather',
      targetLang: 'kn'
    })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.translated_text);
  assert.ok(data.attribution);
});

test('API Integration - GET /api/notifications', async () => {
  const res = await fetch(`${baseUrl}/api/notifications?userId=demo-user-id`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.notifications));
});

test('API Integration - PATCH /api/profile', async () => {
  const res = await fetch(`${baseUrl}/api/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'demo-user-id',
      bio: 'Updated traveler bio for Karnataka',
      home_city: 'Bengaluru'
    })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.profile.bio, 'Updated traveler bio for Karnataka');
});

test('API Integration - POST /api/report', async () => {
  const res = await fetch(`${baseUrl}/api/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_type: 'post',
      target_id: 'post-1',
      reason: 'Inappropriate content testing'
    })
  });
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.success, true);
});

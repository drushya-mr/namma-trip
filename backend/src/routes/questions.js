const express = require('express');
const router = express.Router();
const { z } = require('zod');
const db = require('../data/db');
const { validateContent } = require('../services/moderationService');

// GET /api/questions?place_id=... - Get questions and community answers for a place
router.get('/', (req, res) => {
  try {
    const { place_id } = req.query;
    if (!place_id) {
      return res.status(400).json({ success: false, error: 'place_id query parameter is required' });
    }
    const questions = db.questions.getByPlace(place_id);
    res.json({ success: true, count: questions.length, questions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/questions - Ask community question
router.post('/', (req, res) => {
  try {
    const { place_id, question_text, userId = 'demo-user-id' } = req.body;
    if (!place_id) return res.status(400).json({ success: false, error: 'place_id is required' });

    const check = validateContent(question_text, { minLength: 3, maxLength: 500, fieldName: 'Question' });
    if (!check.valid) return res.status(400).json({ success: false, error: check.error });

    const question = db.questions.create({
      place_id,
      user_id: userId,
      question_text: check.text
    });

    res.status(201).json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/questions/:id/answers - Submit an answer
router.post('/:id/answers', (req, res) => {
  try {
    const { answer_text, userId = 'demo-user-id' } = req.body;
    const check = validateContent(answer_text, { minLength: 2, maxLength: 1000, fieldName: 'Answer' });
    if (!check.valid) return res.status(400).json({ success: false, error: check.error });

    const answer = db.questions.addAnswer(req.params.id, userId, check.text);
    if (!answer) return res.status(404).json({ success: false, error: 'Question not found' });

    res.status(201).json({ success: true, answer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/questions/answers/:id/vote - Vote on an answer
router.post('/answers/:id/vote', (req, res) => {
  try {
    const { userId = 'demo-user-id', vote = 1 } = req.body;
    const result = db.questions.voteAnswer(req.params.id, userId, vote);
    if (!result) return res.status(404).json({ success: false, error: 'Answer not found' });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/questions/:id/accept-answer - Accept an answer
router.post('/:id/accept-answer', (req, res) => {
  try {
    const { answerId, userId = 'demo-user-id' } = req.body;
    if (!answerId) return res.status(400).json({ success: false, error: 'answerId is required' });

    const updatedQ = db.questions.acceptAnswer(req.params.id, answerId, userId);
    if (!updatedQ) return res.status(400).json({ success: false, error: 'Could not accept answer. Make sure you are the question owner.' });

    res.json({ success: true, question: updatedQ });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

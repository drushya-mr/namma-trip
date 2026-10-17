const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { answerPlaceQuestion } = require('../services/askAiService');

const askAiSchema = z.object({
  placeId: z.string().min(1, 'Place ID is required'),
  question: z.string().min(2, 'Question must be at least 2 characters').max(500, 'Question cannot exceed 500 characters'),
  language: z.enum(['kn', 'en']).default('kn')
});

// POST /api/ask-ai - Strictly grounded AI Q&A for a place
router.post('/', async (req, res) => {
  try {
    const parseResult = askAiSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0].message
      });
    }

    const { placeId, question, language } = parseResult.data;
    const response = await answerPlaceQuestion({ placeId, question, language });

    res.json({
      success: true,
      ...response
    });
  } catch (err) {
    console.error('Ask-AI error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

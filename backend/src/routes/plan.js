const express = require('express');
const router = express.Router();
const { z } = require('zod');
const aiService = require('../services/aiService');
const db = require('../data/db');

const planSchema = z.object({
  interests: z.array(z.string()).optional().default([]),
  days: z.number().min(1).max(7).default(2),
  budget: z.number().min(500).max(500000).default(5000),
  travelStyle: z.enum(['relaxed', 'packed']).default('relaxed'),
  groupType: z.enum(['solo', 'friends', 'family']).default('friends'),
  startingCity: z.string().min(2).default('Bengaluru'),
  language: z.enum(['kn', 'en']).default('kn')
});

// POST /api/plan - Generate a plan
router.post('/', async (req, res) => {
  try {
    const parseResult = planSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input parameters',
        details: parseResult.error.errors
      });
    }

    const planParams = parseResult.data;
    const plan = await aiService.generatePlan(planParams);

    res.json({
      success: true,
      plan
    });
  } catch (err) {
    console.error('Plan generation route error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/plan/regenerate-day or /api/plan/:id/regenerate-day - Regenerate a specific day
const handleRegenerateDay = async (req, res) => {
  try {
    let { plan, dayNumber, language = 'kn' } = req.body;
    const planId = req.params.id;

    // If plan was not sent in body but id is provided, fetch from db
    if (!plan && planId && planId !== 'regenerate-day') {
      plan = db.trips.getById(planId);
    }

    if (!plan || !dayNumber) {
      return res.status(400).json({ success: false, error: 'Current plan and dayNumber are required' });
    }

    const updatedPlan = await aiService.regenerateDay(plan, parseInt(dayNumber), language);
    res.json({ success: true, plan: updatedPlan });
  } catch (err) {
    console.error('Regenerate day error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

router.post('/regenerate-day', handleRegenerateDay);
router.post('/:id/regenerate-day', handleRegenerateDay);

// POST /api/plan/save - Save trip
router.post('/save', (req, res) => {
  try {
    const { plan, userId = 'demo-user-id' } = req.body;
    if (!plan) return res.status(400).json({ success: false, error: 'Plan is required' });

    const savedTrip = db.trips.save({
      user_id: userId,
      ...plan
    });

    res.json({ success: true, trip: savedTrip });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/plan/:id - Get saved trip
router.get('/:id', (req, res) => {
  try {
    const trip = db.trips.getById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, error: 'Trip not found' });
    res.json({ success: true, trip });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

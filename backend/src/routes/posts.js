const express = require('express');
const router = express.Router();
const { z } = require('zod');
const db = require('../data/db');
const { validateContent } = require('../services/moderationService');

const createPostSchema = z.object({
  place_id: z.string().min(1, 'Place ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(150),
  review_text: z.string().min(5, 'Review must be at least 5 characters').max(2000),
  rating: z.number().int().min(1).max(5),
  month_visited: z.string().optional().default('October 2026'),
  spend_inr: z.number().nonnegative().optional().default(0),
  photos: z.array(z.string()).max(5).optional().default([]),
  user_id: z.string().optional().default('demo-user-id')
});

// GET /api/posts - Get feed (all or filtered by place_id or user_id)
router.get('/', (req, res) => {
  try {
    const { place_id, user_id, limit, currentUserId = 'demo-user-id' } = req.query;
    const posts = db.posts.getAll({
      place_id,
      user_id,
      limit: limit ? parseInt(limit) : 50,
      currentUserId
    });
    res.json({ success: true, count: posts.length, posts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/posts/:id - Single post details
router.get('/:id', (req, res) => {
  try {
    const currentUserId = req.query.currentUserId || 'demo-user-id';
    const post = db.posts.getById(req.params.id, currentUserId);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/posts - Create post
router.post('/', (req, res) => {
  try {
    const parseResult = createPostSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0].message
      });
    }

    const data = parseResult.data;

    // Content moderation
    const titleCheck = validateContent(data.title, { minLength: 3, maxLength: 150, fieldName: 'Title' });
    if (!titleCheck.valid) return res.status(400).json({ success: false, error: titleCheck.error });

    const reviewCheck = validateContent(data.review_text, { minLength: 5, maxLength: 2000, fieldName: 'Review' });
    if (!reviewCheck.valid) return res.status(400).json({ success: false, error: reviewCheck.error });

    // Validate place exists in dataset
    const place = db.places.getById(data.place_id);
    if (!place) {
      return res.status(400).json({ success: false, error: 'Selected place does not exist in dataset' });
    }

    const post = db.posts.create({
      user_id: data.user_id,
      place_id: data.place_id,
      title: titleCheck.text,
      review_text: reviewCheck.text,
      rating: data.rating,
      month_visited: data.month_visited,
      spend_inr: data.spend_inr,
      photos: data.photos
    });

    res.status(201).json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/posts/:id/like - Toggle like
router.post('/:id/like', (req, res) => {
  try {
    const { userId = 'demo-user-id' } = req.body;
    const result = db.posts.toggleLike(req.params.id, userId);
    if (!result) return res.status(404).json({ success: false, error: 'Post not found' });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/posts/:id/save - Toggle save (bookmark)
router.post('/:id/save', (req, res) => {
  try {
    const { userId = 'demo-user-id' } = req.body;
    const result = db.posts.toggleSave(req.params.id, userId);
    if (!result) return res.status(404).json({ success: false, error: 'Post not found' });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/posts/:id/comments - Add comment
router.post('/:id/comments', (req, res) => {
  try {
    const { userId = 'demo-user-id', text } = req.body;
    const check = validateContent(text, { minLength: 1, maxLength: 500, fieldName: 'Comment' });
    if (!check.valid) return res.status(400).json({ success: false, error: check.error });

    const comment = db.posts.addComment(req.params.id, userId, check.text);
    if (!comment) return res.status(404).json({ success: false, error: 'Post not found' });

    res.status(201).json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

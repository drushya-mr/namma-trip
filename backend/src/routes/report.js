const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { validateContent } = require('../services/moderationService');

// POST /api/report - Flag content for review
router.post('/', (req, res) => {
  try {
    const { reporterId = 'demo-user-id', target_type, target_id, reason } = req.body;
    if (!target_type || !target_id) {
      return res.status(400).json({ success: false, error: 'target_type and target_id are required' });
    }

    const check = validateContent(reason, { minLength: 3, maxLength: 500, fieldName: 'Reason' });
    if (!check.valid) return res.status(400).json({ success: false, error: check.error });

    const report = db.reports.create({
      reporter_id: reporterId,
      target_type,
      target_id,
      reason: check.text
    });

    res.status(201).json({
      success: true,
      message: 'ವರದಿಯನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ಪರಿಶೀಲಿಸಲಾಗುವುದು. / Report submitted for review.',
      report
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../data/db');

// GET /api/notifications - List user's notifications
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || 'demo-user-id';
    const notifications = db.notifications.getByUser(userId);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.json({
      success: true,
      unread_count: unreadCount,
      notifications
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', (req, res) => {
  try {
    const updated = db.notifications.markRead(req.params.id);
    if (!updated) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true, notification: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

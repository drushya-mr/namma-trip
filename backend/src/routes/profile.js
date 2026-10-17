const express = require('express');
const router = express.Router();
const db = require('../data/db');
const { normalizeSocialLinks } = require('../services/moderationService');

// GET /api/profile/demo - Demo account for judges
router.get('/demo', (req, res) => {
  const profile = db.profiles.getById('demo-user-id');
  const normalizedLinks = normalizeSocialLinks({
    instagram: profile.instagram_handle,
    youtube: profile.youtube_handle,
    x: profile.x_handle,
    facebook: profile.facebook_handle,
    website: profile.website_url
  });

  res.json({
    success: true,
    profile: {
      ...profile,
      social_urls: normalizedLinks
    }
  });
});

// GET /api/profile/:id - Get user profile
router.get('/:id', (req, res) => {
  try {
    const profile = db.profiles.getById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, error: 'User profile not found' });

    const normalizedLinks = normalizeSocialLinks({
      instagram: profile.instagram_handle,
      youtube: profile.youtube_handle,
      x: profile.x_handle,
      facebook: profile.facebook_handle,
      website: profile.website_url
    });

    const userPosts = db.posts.getAll({ user_id: req.params.id, currentUserId: req.params.id });
    const userTrips = db.trips.getByUser(req.params.id);

    res.json({
      success: true,
      profile: {
        ...profile,
        social_urls: normalizedLinks,
        posts_count: userPosts.length,
        trips_count: userTrips.length
      },
      posts: userPosts,
      trips: userTrips
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/profile - Update user profile
router.patch('/', (req, res) => {
  try {
    const {
      userId = 'demo-user-id',
      display_name,
      bio,
      home_city,
      preferred_language,
      instagram_handle,
      youtube_handle,
      x_handle,
      facebook_handle,
      website_url,
      show_social_links,
      avatar_url
    } = req.body;

    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (home_city !== undefined) updates.home_city = home_city.trim();
    if (preferred_language !== undefined && ['kn', 'en'].includes(preferred_language)) {
      updates.preferred_language = preferred_language;
    }
    if (instagram_handle !== undefined) updates.instagram_handle = instagram_handle.trim();
    if (youtube_handle !== undefined) updates.youtube_handle = youtube_handle.trim();
    if (x_handle !== undefined) updates.x_handle = x_handle.trim();
    if (facebook_handle !== undefined) updates.facebook_handle = facebook_handle.trim();
    if (website_url !== undefined) updates.website_url = website_url.trim();
    if (show_social_links !== undefined) updates.show_social_links = Boolean(show_social_links);
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    const updated = db.profiles.update(userId, updates);
    if (!updated) return res.status(404).json({ success: false, error: 'Profile not found' });

    const normalizedLinks = normalizeSocialLinks({
      instagram: updated.instagram_handle,
      youtube: updated.youtube_handle,
      x: updated.x_handle,
      facebook: updated.facebook_handle,
      website: updated.website_url
    });

    res.json({
      success: true,
      profile: {
        ...updated,
        social_urls: normalizedLinks
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

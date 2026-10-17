const express = require('express');
const router = express.Router();
const db = require('../data/db');

// GET /api/places - List places with filters (district, cluster, category, bilingual search)
router.get('/', (req, res) => {
  try {
    const { district, cluster, category, q } = req.query;
    const places = db.places.getAll({ district, cluster, category, q });

    // Summary statistics
    const totalDistricts = new Set(db.getRawPlaces().map(p => p.district)).size;
    const coveredDistricts = new Set(places.map(p => p.district)).size;

    res.json({
      success: true,
      count: places.length,
      districts_covered: totalDistricts, // 31
      places
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/places/:id - Single place details
router.get('/:id', (req, res) => {
  try {
    const place = db.places.getById(req.params.id);
    if (!place) {
      return res.status(404).json({ success: false, error: 'Place not found' });
    }
    res.json({ success: true, place });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

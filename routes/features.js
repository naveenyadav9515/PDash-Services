const express = require('express');
const router = express.Router();
const Feature = require('../models/Feature');

// GET /api/features — Fetch all features
router.get('/', async (req, res) => {
  try {
    const features = await Feature.find();
    res.json({ status: 'success', count: features.length, data: features });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/features/seed — Seed initial sample data
router.post('/seed', async (req, res) => {
  try {
    // Clear existing features to allow clean re-seeding
    await Feature.deleteMany({});

    const sampleFeatures = [
      { name: 'Notes', description: 'Quick notes and bookmarks', icon: 'sticky_note_2', enabled: true },
      { name: 'Kitchen', description: 'Track utility levels like gas, water, and power', icon: 'countertops', enabled: true },
      { name: 'Finance Tracker', description: 'Track income, expenses, and budgets', icon: 'account_balance', enabled: true },
      { name: 'Travel', description: 'Journal past journeys and plan future trips', icon: 'flight_takeoff', enabled: true },
      { name: 'Reminders', description: 'Central console for automated and manual alerts', icon: 'notifications_active', enabled: true },
      { name: 'Purchases', description: 'Track savings goals and big purchase plans', icon: 'shopping_bag', enabled: true },
      { name: 'Kirana', description: 'Plan weekly grocery shopping lists', icon: 'shopping_cart', enabled: true },
      { name: 'Plans', description: 'Organize social plans and events with family', icon: 'event', enabled: true },
      { name: 'Rules', description: 'Rule of the Day flip cards and guidelines', icon: 'gavel', enabled: true },
      { name: 'Movies', description: 'Track watchlist status boards and ratings', icon: 'movie', enabled: true },
      { name: 'Streak Loggers', description: 'Track daily consistency streaks and activities', icon: 'grid_on', enabled: true }
    ];

    const created = await Feature.insertMany(sampleFeatures);
    res.status(201).json({ status: 'success', message: `Successfully seeded ${created.length} features`, data: created });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;

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
    const existing = await Feature.countDocuments();
    if (existing > 0) {
      return res.json({ status: 'skipped', message: `Database already has ${existing} features. Delete them first to re-seed.` });
    }

    const sampleFeatures = [
      { name: 'Finance Tracker', description: 'Track income, expenses and budgets', icon: 'account_balance', enabled: true },
      { name: 'Task Manager', description: 'Manage your daily to-do lists', icon: 'task_alt', enabled: true },
      { name: 'Notes', description: 'Quick notes and bookmarks', icon: 'sticky_note_2', enabled: true },
      { name: 'Calendar', description: 'Schedule and plan events', icon: 'calendar_month', enabled: true },
      { name: 'Health Log', description: 'Track fitness and health metrics', icon: 'monitor_heart', enabled: false }
    ];

    const created = await Feature.insertMany(sampleFeatures);
    res.status(201).json({ status: 'success', message: `Seeded ${created.length} features`, data: created });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;

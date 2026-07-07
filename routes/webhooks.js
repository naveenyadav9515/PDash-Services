const express = require('express');
const router = express.Router();
const webhooksController = require('../controllers/webhooksController');

// Google Cloud Pub/Sub Push Notification Webhook
router.post('/gmail', webhooksController.handleGmailPushNotification);

// Setup route to initiate the watch (can be hit from browser)
router.get('/setup-watch', webhooksController.setupGmailWatch);

module.exports = router;

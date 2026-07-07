const express = require('express');
const router = express.Router();
const webhooksController = require('../controllers/webhooksController');

// Google Cloud Pub/Sub Push Notification Webhook
router.post('/gmail', webhooksController.handleGmailPushNotification);

module.exports = router;

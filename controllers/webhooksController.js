/**
 * Webhooks Controller — Handles incoming Pub/Sub push notifications for Gmail.
 *
 * This controller is now a thin delegate. All email processing logic has been
 * moved to the Automation Engine (automation/engine.js).
 */

const User = require('../models/User');
const config = require('../config/index');
const engine = require('../automation/engine');

/**
 * @desc    Handle incoming Google Cloud Pub/Sub Push Notifications for Gmail
 * @route   POST /api/webhooks/gmail
 */
const handleGmailPushNotification = async (req, res, next) => {
  try {
    // ── 1. Verify Pub/Sub token ──
    if (
      config.app.pubsubVerificationToken &&
      req.get('x-onespace-webhook-token') !== config.app.pubsubVerificationToken &&
      req.query.token !== config.app.pubsubVerificationToken
    ) {
      return res.status(401).send('Unauthorized');
    }

    // ── 2. Validate message format ──
    if (!req.body || !req.body.message || !req.body.message.data) {
      return res.status(400).send('Invalid Pub/Sub message format');
    }

    // ── 3. Decode Pub/Sub message ──
    const messageData = Buffer.from(req.body.message.data, 'base64').toString('utf-8');
    const parsedData = JSON.parse(messageData);
    const emailAddress = parsedData.emailAddress;

    if (!emailAddress) {
      return res.status(400).send('Missing email address');
    }

    // ── 4. Find eligible user ──
    const user = await User.findOne({
      email: emailAddress,
      gmailConnected: true,
      expenseAutomationEnabled: true,
    }).select('+googleRefreshToken');

    if (!user || !user.googleRefreshToken) {
      return res.status(200).send('Ignored');
    }

    // ── 5. Delegate to Automation Engine ──
    await engine.processUserEmails(user);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  handleGmailPushNotification,
};

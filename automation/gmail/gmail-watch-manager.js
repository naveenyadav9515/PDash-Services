/**
 * Gmail Watch Manager — Manages Gmail push notification subscriptions.
 *
 * Handles:
 * - Activating Gmail Watch (Pub/Sub push notifications) for individual users
 * - Renewing watches for all eligible users (scheduled job)
 * - Tracking watch expiry in the User model
 *
 * Gmail Watch expires every 7 days — we renew every 6 days for safety.
 */

const { google } = require('googleapis');
const User = require('../../models/User');
const config = require('../../config/index');
const { decryptSecret } = require('../../utils/crypto.util');

/**
 * Activates Gmail Watch (push notifications) for a single user.
 * @param {object} user - User document with googleRefreshToken
 * @returns {Promise<object>} Gmail Watch response (contains historyId and expiration)
 */
async function activateWatch(user) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: decryptSecret(user.googleRefreshToken),
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const response = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      labelIds: ['INBOX'],
      labelFilterAction: 'include',
      topicName: `projects/${config.app.gcpProjectId}/topics/${config.app.pubsubTopic}`,
    },
  });

  // Update the user's watch expiry and history ID
  if (response.data) {
    const updateData = {};
    if (response.data.expiration) {
      updateData.gmailWatchExpiry = new Date(parseInt(response.data.expiration));
    }
    if (response.data.historyId) {
      updateData.gmailHistoryId = response.data.historyId;
    }
    if (Object.keys(updateData).length > 0) {
      await User.findByIdAndUpdate(user._id, updateData);
    }
  }

  return response.data;
}

/**
 * Renews Gmail Watch for all eligible users.
 * Eligible = gmailConnected + expenseAutomationEnabled + has refresh token.
 * Called by the scheduled job every 6 days.
 * @returns {Promise<{renewed: number, failed: number, skipped: number}>}
 */
async function renewAllWatches() {
  const stats = { renewed: 0, failed: 0, skipped: 0 };

  const users = await User.find({
    gmailConnected: true,
    expenseAutomationEnabled: true,
  }).select('+googleRefreshToken');

  for (const user of users) {
    if (!user.googleRefreshToken) {
      stats.skipped++;
      continue;
    }

    try {
      await activateWatch(user);
      stats.renewed++;
      console.log(`[GmailWatch] Renewed watch for ${user.email}`);
    } catch (err) {
      stats.failed++;
      console.error(`[GmailWatch] Failed to renew watch for ${user.email}:`, err.message);

      // If the refresh token is revoked/expired, mark the user as disconnected
      if (err.code === 401 || err.message?.includes('invalid_grant')) {
        await User.findByIdAndUpdate(user._id, {
          gmailConnected: false,
          expenseAutomationEnabled: false,
        });
        console.warn(`[GmailWatch] Disabled automation for ${user.email} — token revoked.`);
      }
    }
  }

  console.log(`[GmailWatch] Renewal complete: ${stats.renewed} renewed, ${stats.failed} failed, ${stats.skipped} skipped`);
  return stats;
}

module.exports = {
  activateWatch,
  renewAllWatches,
};

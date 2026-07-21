/**
 * Gmail Monitor — Gmail API fetch and email retrieval logic.
 *
 * Handles:
 * - OAuth2 client setup with refresh token decryption
 * - Email list fetching with pagination
 * - Individual email content retrieval
 * - Email body extraction using base-parser utilities
 *
 * Does NOT parse emails — that's the parser's job.
 */

const { google } = require('googleapis');
const config = require('../../config/index');
const { decryptSecret } = require('../../utils/crypto.util');
const { extractEmailBody } = require('../parsers/base-parser');

/**
 * Formats a Date object into Gmail query format (YYYY/MM/DD).
 * @param {Date} date
 * @returns {string}
 */
function formatGmailQueryDate(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

/**
 * Calculates the sync cutoff date (start of previous month in IST).
 * This ensures we look back far enough to catch late-arriving emails.
 * @returns {Date}
 */
function getSyncCutoffDate() {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istNow = new Date(utcTime + (3600000 * 5.5));

  let year = istNow.getFullYear();
  let prevMonth = istNow.getMonth() - 1;
  if (prevMonth < 0) {
    prevMonth = 11;
    year -= 1;
  }

  return new Date(`${year}-${String(prevMonth + 1).padStart(2, '0')}-01T00:00:00.000+05:30`);
}

/**
 * Creates an authenticated OAuth2 client using the user's refresh token.
 * @param {object} user - User document with googleRefreshToken
 * @returns {object} Authenticated OAuth2 client
 */
function createOAuth2Client(user) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: decryptSecret(user.googleRefreshToken),
  });
  return oauth2Client;
}

/**
 * Fetches all matching emails from Gmail, handling pagination.
 * @param {object} gmail - Authenticated Gmail API client
 * @param {string} query - Gmail search query
 * @returns {Promise<Array<{id: string, threadId: string}>>} List of message stubs
 */
async function fetchEmailList(gmail, query) {
  let pageToken = null;
  let allMessages = [];

  do {
    const listParams = {
      userId: 'me',
      q: query,
      maxResults: 100,
    };
    if (pageToken) listParams.pageToken = pageToken;

    const response = await gmail.users.messages.list(listParams);
    const messages = response.data.messages || [];
    allMessages = allMessages.concat(messages);
    pageToken = response.data.nextPageToken || null;
  } while (pageToken);

  return allMessages;
}

/**
 * Fetches the full content of a single email and extracts subject, body, and metadata.
 * @param {object} gmail - Authenticated Gmail API client
 * @param {string} messageId - Gmail message ID
 * @returns {Promise<object>} { subject, body, metadata: { id, internalDate } }
 */
async function fetchEmailContent(gmail, messageId) {
  const msgData = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  const payload = msgData.data.payload;
  const subjectHeader = payload.headers?.find(h => h.name.toLowerCase() === 'subject');
  const fromHeader = payload.headers?.find(h => h.name.toLowerCase() === 'from');

  return {
    subject: subjectHeader?.value || '',
    from: fromHeader?.value || '',
    body: extractEmailBody(payload),
    metadata: {
      id: messageId,
      internalDate: msgData.data.internalDate,
    },
  };
}

/**
 * Builds a Gmail search query for bank transaction emails.
 * @param {string[]} senderEmails - List of bank sender email addresses
 * @param {Date} cutoffDate - Only fetch emails after this date
 * @returns {string} Gmail API query string
 */
function buildQuery(senderEmails, cutoffDate) {
  const dateStr = formatGmailQueryDate(cutoffDate);
  if (senderEmails.length === 1) {
    return `after:${dateStr} from:${senderEmails[0]}`;
  }
  // Multiple senders: from:(addr1 OR addr2 OR addr3)
  const fromClause = senderEmails.map(e => e).join(' OR ');
  return `after:${dateStr} from:(${fromClause})`;
}

module.exports = {
  formatGmailQueryDate,
  getSyncCutoffDate,
  createOAuth2Client,
  fetchEmailList,
  fetchEmailContent,
  buildQuery,
};

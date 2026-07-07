const User = require('../models/User');
const PendingTransaction = require('../models/PendingTransaction');
const Expense = require('../models/Expense');
const { google } = require('googleapis');
const config = require('../config/index');
const { decryptSecret } = require('../utils/crypto.util');

/**
 * Amount extraction patterns for Axis Bank alert emails.
 * Each pattern is tried in order; first successful match wins.
 */
const AMOUNT_PATTERNS = [
  // "Amount Debited: INR 1,234.56" or "Amount Debited: Rs. 1,234.56"
  /Amount\s*Debited\s*[:\-]?\s*(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  // "debited with INR 500.00" / "debited with Rs 500"
  /debited\s+(?:with|for|by)\s+(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  // "INR 1234.56 has been debited" / "Rs. 1234 was debited"
  /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+(?:has been|was|is)\s+debited/i,
  // "debited by INR 500 from"
  /debited\s+(?:by\s+)?(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+from/i,
  // "Transaction of INR 500" / "Transaction of Rs 500"
  /(?:Transaction|Txn)\s+(?:of|for)\s+(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  // "Rs 500 debited" / "INR 500 debited" (simpler pattern)
  /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+(?:debited|withdrawn)/i,
  // "spent Rs. 500" / "spent INR 500"
  /spent\s+(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  // "Your a/c xxxxxxx debited for Rs 1234.56"
  /a\/c\s*[xX*\d]+\s*(?:is\s+)?debited\s+(?:for|with)\s+(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  // Generic: "INR 500.00" or "Rs.500" or "₹500" anywhere in email (last resort)
  /(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
];

/**
 * Comprehensive merchant/payee extraction patterns.
 */
const MERCHANT_PATTERNS = [
  /Transaction\s*Info\s*[:\-]\s*(.+)/i,
  /(?:Paid\s+to|Payee|Beneficiary|Merchant|To)\s*[:\-]\s*(.+)/i,
  /(?:UPI|IMPS|NEFT)\s*[/\-]\s*(.+)/i,
  /(?:at|@)\s+([A-Za-z][\w\s&.-]+)/i,
];

/**
 * Date extraction patterns for bank emails.
 */
const DATE_PATTERNS = [
  // "Date & Time: 30-06-26, 14:30:00" (DD-MM-YY)
  /Date\s*(?:&|and)?\s*Time\s*[:\-]\s*(\d{2})-(\d{2})-(\d{2,4}),?\s*(\d{2}):(\d{2}):?(\d{2})?/i,
  // "on 30/06/2026 at 14:30" (DD/MM/YYYY)
  /on\s+(\d{2})[/\-](\d{2})[/\-](\d{2,4})\s+(?:at\s+)?(\d{2}):(\d{2})/i,
  // "Date: 30-Jun-2026"
  /Date\s*[:\-]\s*(\d{1,2})[/\-](\w{3})[/\-](\d{2,4})/i,
];

/**
 * Gmail sender filter for bank transaction alerts.
 * Currently configured for Axis Bank only.
 */
const BANK_SENDER = 'alerts@axis.bank.in';

function formatGmailQueryDate(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

function getSyncCutoffDate() {
  // Calculate start of the previous month in IST (UTC+5:30)
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istNow = new Date(utcTime + (3600000 * 5.5));
  
  let year = istNow.getFullYear();
  let prevMonth = istNow.getMonth() - 1; // 0-indexed, so if current is Jan (0), prev is -1
  if (prevMonth < 0) {
    prevMonth = 11;
    year -= 1;
  }
  
  // Return 1st of the previous month at midnight IST
  return new Date(`${year}-${String(prevMonth + 1).padStart(2, '0')}-01T00:00:00.000+05:30`);
}

/**
 * Extracts amount from email body using multiple regex patterns.
 * @param {string} body - The email body text
 * @returns {number} Extracted amount, or 0 if no match
 */
function extractAmount(body) {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = body.match(pattern);
    if (match && match[1]) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }
  return 0;
}

/**
 * Extracts merchant name from email body.
 * @param {string} body - The email body text
 * @returns {string} Merchant name
 */
function extractMerchant(body) {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = body.match(pattern);
    if (match && match[1]) {
      let rawInfo = match[1].trim();
      // Clean up UPI-style merchant paths: "UPI/P2M/merchant_name/ref"
      if (rawInfo.includes('/')) {
        const parts = rawInfo.split('/');
        // Try to find the most descriptive part (not UPI/P2M/P2P/ref numbers)
        const descriptive = parts.find(p =>
          p.length > 3 &&
          !/^(UPI|P2M|P2P|IMPS|NEFT|RTGS|\d+)$/i.test(p)
        );
        if (descriptive) {
          rawInfo = descriptive;
        } else {
          rawInfo = parts[parts.length - 1] || rawInfo;
        }
      }
      // Clean trailing spaces and punctuation
      rawInfo = rawInfo.replace(/[.\s]+$/, '').trim();
      if (rawInfo.length > 2) {
        return rawInfo;
      }
    }
  }
  return 'Bank Transaction';
}

/**
 * Extracts transaction date from email body.
 * @param {string} body - The email body text
 * @param {object} msgData - Gmail message data (for internalDate fallback)
 * @returns {Date} Extracted date
 */
function extractDate(body, msgData) {
  // Pattern 1: "Date & Time: DD-MM-YY, HH:MM:SS"
  const p1 = body.match(/Date\s*(?:&|and)?\s*Time\s*[:\-]\s*(\d{2})-(\d{2})-(\d{2,4}),?\s*(\d{2}):(\d{2}):?(\d{2})?/i);
  if (p1) {
    const [_, day, month, year, hours, minutes, seconds] = p1;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const sec = seconds || '00';
    return new Date(`${fullYear}-${month}-${day}T${hours}:${minutes}:${sec}+05:30`);
  }

  // Pattern 2: "on DD/MM/YYYY at HH:MM"
  const p2 = body.match(/on\s+(\d{2})[/\-](\d{2})[/\-](\d{2,4})\s+(?:at\s+)?(\d{2}):(\d{2})/i);
  if (p2) {
    const [_, day, month, year, hours, minutes] = p2;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return new Date(`${fullYear}-${month}-${day}T${hours}:${minutes}:00+05:30`);
  }

  // Fallback: use Gmail's internal date
  if (msgData && msgData.data && msgData.data.internalDate) {
    return new Date(parseInt(msgData.data.internalDate));
  }

  return new Date();
}

/**
 * Decodes base64 encoded email body parts.
 * @param {string} data - base64url encoded string
 * @returns {string} Decoded UTF-8 string
 */
function decodeBase64(data) {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

/**
 * Extracts the full text body from a Gmail message payload.
 * Handles multipart and single-part messages.
 * @param {object} payload - Gmail message payload
 * @returns {string} Email body text
 */
function extractEmailBody(payload) {
  let emailBody = '';

  // Try multipart payloads first
  if (payload.parts) {
    // Try text/plain first
    const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
    if (textPart && textPart.body && textPart.body.data) {
      emailBody = decodeBase64(textPart.body.data);
    }
    // Fallback to text/html if no plain text
    if (!emailBody) {
      const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
      if (htmlPart && htmlPart.body && htmlPart.body.data) {
        // Strip HTML tags for basic text extraction
        emailBody = decodeBase64(htmlPart.body.data).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      }
    }
    // Last resort: first part
    if (!emailBody && payload.parts[0] && payload.parts[0].body && payload.parts[0].body.data) {
      emailBody = decodeBase64(payload.parts[0].body.data);
    }
    
    // Handle nested multipart (multipart/alternative inside multipart/mixed)
    if (!emailBody) {
      for (const part of payload.parts) {
        if (part.parts) {
          const nestedText = part.parts.find(p => p.mimeType === 'text/plain');
          if (nestedText && nestedText.body && nestedText.body.data) {
            emailBody = decodeBase64(nestedText.body.data);
            break;
          }
        }
      }
    }
  } else if (payload.body && payload.body.data) {
    emailBody = decodeBase64(payload.body.data);
  }

  return emailBody;
}

/**
 * Determines if an email is a valid debit/expense transaction.
 * Filters out credit alerts, promotional content, etc.
 * @param {string} body - Email body text
 * @param {string} subject - Email subject
 * @returns {boolean}
 */
/**
 * Checks if an email subject indicates a debit transaction.
 * Per business rule: if the subject from alerts@axis.bank.in
 * contains "debited", it is a valid expense email.
 * @param {string} subject - Email subject line
 * @returns {boolean}
 */
function isDebitSubject(subject) {
  return subject.toLowerCase().includes('debited');
}

/**
 * Reusable logic to fetch and parse bank transaction emails from Gmail.
 * This function:
 * 1. Authenticates with Gmail API using the user's refresh token
 * 2. Searches for bank transaction emails
 * 3. Parses amounts, merchants, and dates using robust regex patterns
 * 4. Creates PendingTransaction records with deduplication
 * 5. Marks processed emails as read
 *
 * @param {Object} user - User document with googleRefreshToken
 */
const syncRecentBankEmails = async (user) => {
  try {
    if (!user || !user.googleRefreshToken) return;

    const refreshToken = decryptSecret(user.googleRefreshToken);
    const cutoffDate = getSyncCutoffDate();

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Query: ALL emails from Axis Bank alerts since start of current month
    const query = `after:${formatGmailQueryDate(cutoffDate)} from:${BANK_SENDER}`;

    // ── Paginate to fetch the COMPLETE list of matching emails ──
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

    console.log(`[Expense Sync] Found ${allMessages.length} emails from ${BANK_SENDER} for current month.`);

    for (const msg of allMessages) {
      try {
        // ── 1. Skip if this exact Gmail message was already processed ──
        const alreadyProcessed = await PendingTransaction.findOne({
          user: user._id,
          gmailMessageId: msg.id
        });

        if (alreadyProcessed) {
          await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id,
            requestBody: { removeLabelIds: ['UNREAD'] }
          });
          continue;
        }

        // ── 2. Fetch full email content ──
        const msgData = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full'
        });

        const payload = msgData.data.payload;
        const subjectHeader = payload.headers?.find(h => h.name.toLowerCase() === 'subject');
        const subject = subjectHeader?.value || '';

        // ── 3. Subject MUST contain "debited" — the single validation rule ──
        if (!isDebitSubject(subject)) {
          await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id,
            requestBody: { removeLabelIds: ['UNREAD'] }
          });
          continue;
        }

        // ── 4. Extract structured data from email body ──
        const emailBody = extractEmailBody(payload);
        const extractedAmount = extractAmount(emailBody);
        const extractedMerchant = extractMerchant(emailBody);
        const extractedDate = extractDate(emailBody, msgData);

        // Skip if we couldn't extract a valid amount
        if (extractedAmount <= 0) {
          console.warn(`[Expense Sync] Could not parse amount from email ${msg.id}. Skipping.`);
          await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id,
            requestBody: { removeLabelIds: ['UNREAD'] }
          });
          continue;
        }

        // Skip if parsed date falls before current month
        if (extractedDate < cutoffDate) {
          await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id,
            requestBody: { removeLabelIds: ['UNREAD'] }
          });
          continue;
        }

        // ── 5. Deduplication: Compare against Expense history ──
        // Rule: same date + same hour + same minute + same amount + same merchant
        //       = duplicate → reject. Even 1 minute apart = distinct → allow.
        // Uses TRANSACTION time (extractedDate), NOT mail-received time.
        const minuteStart = new Date(extractedDate);
        minuteStart.setSeconds(0, 0); // truncate to start of the minute
        const minuteEnd = new Date(minuteStart.getTime() + 59999); // end of same minute

        const duplicateInHistory = await Expense.findOne({
          user: user._id,
          amount: extractedAmount,
          merchant: extractedMerchant,
          date: { $gte: minuteStart, $lte: minuteEnd }
        });

        const duplicateInPending = await PendingTransaction.findOne({
          user: user._id,
          amount: extractedAmount,
          merchant: extractedMerchant,
          date: { $gte: minuteStart, $lte: minuteEnd }
        });

        if (duplicateInHistory || duplicateInPending) {
          console.log(`[Expense Sync] Duplicate found (History/Pending): ₹${extractedAmount} to "${extractedMerchant}" at ${extractedDate.toISOString()}. Skipping.`);
          await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id,
            requestBody: { removeLabelIds: ['UNREAD'] }
          });
          continue;
        }

        // ── 6. Create Pending Transaction ──
        await PendingTransaction.create({
          user: user._id,
          amount: extractedAmount,
          merchant: extractedMerchant,
          paymentMethod: 'UPI',
          status: 'Pending',
          date: extractedDate,
          notes: `Auto-detected from email: "${subject.substring(0, 80)}"`,
          gmailMessageId: msg.id,
          source: 'gmail_auto'
        });

        // Mark email as read
        await gmail.users.messages.modify({
          userId: 'me',
          id: msg.id,
          requestBody: { removeLabelIds: ['UNREAD'] }
        });
      } catch (emailErr) {
        // Log individual email errors but continue processing remaining emails
        console.error(`[Expense Sync] Error processing email ${msg.id}:`, emailErr.message);
      }
    }
  } catch (err) {
    console.error('[Expense Sync] Error during bank email sync:', err.message);
  }
};

/**
 * @desc    Handle incoming Google Cloud Pub/Sub Push Notifications for Gmail
 * @route   POST /api/webhooks/gmail
 */
const handleGmailPushNotification = async (req, res, next) => {
  try {
    if (
      config.app.pubsubVerificationToken &&
      req.get('x-pdash-webhook-token') !== config.app.pubsubVerificationToken &&
      req.query.token !== config.app.pubsubVerificationToken
    ) {
      return res.status(401).send('Unauthorized');
    }

    if (!req.body || !req.body.message || !req.body.message.data) {
      return res.status(400).send('Invalid Pub/Sub message format');
    }

    const messageData = Buffer.from(req.body.message.data, 'base64').toString('utf-8');
    const parsedData = JSON.parse(messageData);
    const emailAddress = parsedData.emailAddress; 

    if (!emailAddress) {
      return res.status(400).send('Missing email address');
    }

    const user = await User.findOne({ 
      email: emailAddress, 
      gmailConnected: true,
      expenseAutomationEnabled: true 
    }).select('+googleRefreshToken');

    if (!user || !user.googleRefreshToken) {
      return res.status(200).send('Ignored');
    }

    // Call the exact same logic we use for initial sync
    await syncRecentBankEmails(user);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Internal Server Error'); 
  }
};

const activateGmailWatch = async (user) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({ refresh_token: decryptSecret(user.googleRefreshToken) });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  return await gmail.users.watch({
    userId: 'me',
    requestBody: {
      labelIds: ['INBOX'],
      labelFilterAction: 'include',
      topicName: 'projects/pdash-1997/topics/gmail-expenses-topic'
    }
  });
};

module.exports = {
  handleGmailPushNotification,
  syncRecentBankEmails,
  activateGmailWatch
};

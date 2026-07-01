const User = require('../models/User');
const PendingTransaction = require('../models/PendingTransaction');
const Expense = require('../models/Expense');
const { google } = require('googleapis');
const config = require('../config/index');
const { decryptSecret } = require('../utils/crypto.util');

/**
 * Comprehensive bank email amount extraction patterns.
 * Supports Axis Bank, HDFC, SBI, ICICI, and generic UPI/NEFT/IMPS formats.
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
 * Gmail search queries for Indian bank transaction emails.
 * Covers major banks: Axis, HDFC, SBI, ICICI, Kotak, and generic patterns.
 */
const BANK_QUERIES = [
  'from:alerts@axisbank.com',
  'from:transaction@axisbank.com',
  'from:alerts@hdfcbank.net',
  'from:noreply@hdfcbank.net',
  'from:noreply@sbi.co.in',
  'from:alerts@icicibank.com',
  'from:alerts@kotak.com',
  'subject:"Transaction Alert"',
  'subject:"Debit Alert"',
  'subject:"UPI Transaction"',
  'subject:"Account debited"',
  'subject:"Amount Debited"',
];

function formatGmailQueryDate(date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

function getSyncCutoffDate() {
  const cutoffDate = new Date();
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - config.app.gmailSyncLookbackDays);
  cutoffDate.setUTCHours(0, 0, 0, 0);
  return cutoffDate;
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
function isDebitTransaction(body, subject) {
  const combined = `${subject} ${body}`.toLowerCase();

  // Must contain some debit-related keyword
  const debitKeywords = ['debited', 'debit', 'spent', 'withdrawn', 'paid', 'purchase', 'transaction'];
  const hasDebitKeyword = debitKeywords.some(kw => combined.includes(kw));

  // Must NOT be a credit transaction
  const creditKeywords = ['credited', 'credit alert', 'received', 'refund', 'cashback'];
  const isCreditTransaction = creditKeywords.some(kw => combined.includes(kw));

  return hasDebitKeyword && !isCreditTransaction;
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

    const query = `after:${formatGmailQueryDate(cutoffDate)} (${BANK_QUERIES.join(' OR ')})`;

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20, // Increased from 5 to avoid missing emails
    });

    const messages = response.data.messages || [];

    for (const msg of messages) {
      try {
        // ── 1. Primary Deduplication Check: Gmail Message ID ──
        // Check if we have already processed this exact email message ID
        const msgIdExistsInExpense = await Expense.findOne({
          user: user._id,
          gmailMessageId: msg.id
        });

        const msgIdExistsInPending = await PendingTransaction.findOne({
          user: user._id,
          gmailMessageId: msg.id
        });

        if (msgIdExistsInExpense || msgIdExistsInPending) {
          // Already exists, just mark email as read to keep inbox clean
          await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id,
            requestBody: { removeLabelIds: ['UNREAD'] }
          });
          continue;
        }

        const msgData = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full'
        });

        const payload = msgData.data.payload;
        const emailBody = extractEmailBody(payload);

        // Get the email subject for debit vs credit filtering
        const subjectHeader = payload.headers?.find(h => h.name.toLowerCase() === 'subject');
        const subject = subjectHeader?.value || '';

        // Skip if not a debit transaction
        if (!isDebitTransaction(emailBody, subject)) {
          // Mark as read to avoid re-processing
          await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id,
            requestBody: { removeLabelIds: ['UNREAD'] }
          });
          continue;
        }

        // Extract structured data
        const extractedAmount = extractAmount(emailBody);
        const extractedMerchant = extractMerchant(emailBody);
        const extractedDate = extractDate(emailBody, msgData);

        // ── CRITICAL: Skip if we couldn't extract a valid amount ──
        // Never create a transaction with a fake/default amount
        if (extractedAmount <= 0) {
          console.warn(`[Expense Sync] Could not parse amount from email ${msg.id}. Skipping.`);
          // Still mark as read to prevent infinite retry loop
          await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id,
            requestBody: { removeLabelIds: ['UNREAD'] }
          });
          continue;
        }

        // Keep sync bounded so old emails are not repeatedly reconsidered.
        if (extractedDate < cutoffDate) {
          await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id,
            requestBody: { removeLabelIds: ['UNREAD'] }
          });
          continue;
        }

        // ── 2. Fallback Deduplication Check: Exact overlapping manual entries ──
        // Check within ±5 minutes window for exact amount + merchant overlap
        const fiveMins = 5 * 60 * 1000;
        const minDate = new Date(extractedDate.getTime() - fiveMins);
        const maxDate = new Date(extractedDate.getTime() + fiveMins);

        const duplicateExpenseFallback = await Expense.findOne({
          user: user._id,
          amount: extractedAmount,
          merchant: extractedMerchant,
          date: { $gte: minDate, $lte: maxDate }
        });

        const duplicatePendingFallback = await PendingTransaction.findOne({
          user: user._id,
          amount: extractedAmount,
          merchant: extractedMerchant,
          date: { $gte: minDate, $lte: maxDate }
        });

        if (duplicateExpenseFallback || duplicatePendingFallback) {
          // It's likely a duplicate of a manually entered transaction or already processed record.
          // Save the message ID reference if possible, and skip
          if (duplicateExpenseFallback && !duplicateExpenseFallback.gmailMessageId) {
            duplicateExpenseFallback.gmailMessageId = msg.id;
            await duplicateExpenseFallback.save();
          } else if (duplicatePendingFallback && !duplicatePendingFallback.gmailMessageId) {
            duplicatePendingFallback.gmailMessageId = msg.id;
            await duplicatePendingFallback.save();
          }

          await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id,
            requestBody: { removeLabelIds: ['UNREAD'] }
          });
          continue;
        }

        // ── Create Pending Transaction ──
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

module.exports = {
  handleGmailPushNotification,
  syncRecentBankEmails
};

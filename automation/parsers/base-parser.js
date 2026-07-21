/**
 * Base Parser — Shared utilities used by all bank-specific email parsers.
 *
 * Provides common functions for decoding email payloads, extracting body text,
 * cleaning merchant names, and parsing Indian currency amounts.
 */

/**
 * Decodes base64url encoded email body parts.
 * @param {string} data - base64url encoded string
 * @returns {string} Decoded UTF-8 string
 */
function decodeBase64(data) {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

/**
 * Extracts the full text body from a Gmail message payload.
 * Handles multipart and single-part messages, including nested multipart payloads.
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
 * Cleans up a raw merchant name extracted from an email.
 * Handles UPI-style paths (UPI/P2M/merchant_name/ref) and trailing punctuation.
 * @param {string} raw - Raw merchant string
 * @returns {string} Cleaned merchant name
 */
function cleanMerchantName(raw) {
  let cleaned = raw.trim();
  // Clean up UPI-style merchant paths
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    const descriptive = parts.find(p =>
      p.length > 3 &&
      !/^(UPI|P2M|P2P|IMPS|NEFT|RTGS|\d+)$/i.test(p)
    );
    if (descriptive) {
      cleaned = descriptive;
    } else {
      cleaned = parts[parts.length - 1] || cleaned;
    }
  }
  // Clean trailing spaces and punctuation
  cleaned = cleaned.replace(/[.\s]+$/, '').trim();
  return cleaned.length > 2 ? cleaned : 'Bank Transaction';
}

/**
 * Parses an Indian currency amount string to a float.
 * Handles comma-separated amounts like "1,234.56".
 * @param {string} str - Amount string (e.g., "1,234.56")
 * @returns {number} Parsed amount, or 0 if invalid
 */
function parseIndianAmount(str) {
  if (!str) return 0;
  const amount = parseFloat(str.replace(/,/g, ''));
  return (!isNaN(amount) && amount > 0) ? amount : 0;
}

module.exports = {
  decodeBase64,
  extractEmailBody,
  cleanMerchantName,
  parseIndianAmount,
};

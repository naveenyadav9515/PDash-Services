/**
 * Parser Registry — Extensible bank parser registration system.
 *
 * Provides a registry pattern where bank parsers self-register their sender emails.
 * The engine looks up the correct parser by email sender address.
 *
 * Adding a new bank: create a new file in `banks/`, export { bankId, senderEmails, isRelevant, parse }.
 * It will be auto-registered on load.
 */

const path = require('path');
const fs = require('fs');

/** Map of sender email → parser module */
const senderToParser = new Map();

/** Map of bankId → parser module */
const bankToParser = new Map();

/** List of all registered sender emails for Gmail query building */
const allSenderEmails = [];

/**
 * Registers a bank parser.
 * @param {object} parser - Parser module with { bankId, senderEmails, isRelevant, parse }
 */
function registerParser(parser) {
  if (!parser.bankId || !parser.senderEmails || !parser.isRelevant || !parser.parse) {
    console.error(`[ParserRegistry] Invalid parser: missing required exports (bankId, senderEmails, isRelevant, parse)`);
    return;
  }

  bankToParser.set(parser.bankId, parser);

  for (const email of parser.senderEmails) {
    senderToParser.set(email.toLowerCase(), parser);
    allSenderEmails.push(email.toLowerCase());
  }

  console.log(`[ParserRegistry] Registered parser: ${parser.bankId} (${parser.senderEmails.join(', ')})`);
}

/**
 * Gets the parser for a given sender email address.
 * @param {string} senderEmail - Email address of the sender
 * @returns {object|null} Parser module or null
 */
function getParserBySender(senderEmail) {
  return senderToParser.get(senderEmail.toLowerCase()) || null;
}

/**
 * Gets the parser for a given bank ID.
 * @param {string} bankId - Bank identifier (e.g., 'Axis')
 * @returns {object|null} Parser module or null
 */
function getParserByBank(bankId) {
  return bankToParser.get(bankId) || null;
}

/**
 * Returns all registered sender email addresses (for building Gmail queries).
 * @returns {string[]}
 */
function getAllSenderEmails() {
  return [...allSenderEmails];
}

/**
 * Returns all registered bank IDs (for the frontend settings UI).
 * @returns {string[]}
 */
function getSupportedBanks() {
  return Array.from(bankToParser.keys());
}

// ── Auto-register all parsers from the banks/ directory ──
function autoRegisterParsers() {
  const banksDir = path.join(__dirname, 'banks');
  if (!fs.existsSync(banksDir)) return;

  const files = fs.readdirSync(banksDir).filter(f => f.endsWith('.parser.js'));
  for (const file of files) {
    try {
      const parser = require(path.join(banksDir, file));
      registerParser(parser);
    } catch (err) {
      console.error(`[ParserRegistry] Failed to load parser ${file}:`, err.message);
    }
  }
}

// Auto-register on module load
autoRegisterParsers();

module.exports = {
  registerParser,
  getParserBySender,
  getParserByBank,
  getAllSenderEmails,
  getSupportedBanks,
};

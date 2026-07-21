/**
 * Expense Processor — Deduplication and PendingTransaction creation.
 *
 * Receives parsed transaction objects from the engine and:
 * 1. Checks for duplicates using gmailMessageId (primary key)
 * 2. Checks for duplicates using amount+merchant+date (secondary, same-minute window)
 * 3. Creates PendingTransaction records for new, unique transactions
 */

const PendingTransaction = require('../../models/PendingTransaction');
const Expense = require('../../models/Expense');

/**
 * Checks if a transaction is a duplicate.
 * Uses two deduplication strategies:
 *   1. gmailMessageId (exact match — guaranteed unique per email)
 *   2. amount + merchant + date within the same minute window
 *
 * @param {string} userId - User's MongoDB ObjectId
 * @param {object} transaction - Parsed transaction { amount, merchant, date, gmailMessageId }
 * @returns {Promise<boolean>} true if duplicate
 */
async function isDuplicate(userId, transaction) {
  // Strategy 1: Check by Gmail Message ID (most reliable)
  if (transaction.gmailMessageId) {
    const byMessageId = await PendingTransaction.findOne({
      user: userId,
      gmailMessageId: transaction.gmailMessageId,
    });
    if (byMessageId) return true;

    // Also check Expense collection (in case it was already approved)
    const inExpenses = await Expense.findOne({
      user: userId,
      gmailMessageId: transaction.gmailMessageId,
    });
    if (inExpenses) return true;
  }

  // Strategy 2: Check by amount + merchant + same minute window
  const minuteStart = new Date(transaction.date);
  minuteStart.setSeconds(0, 0);
  const minuteEnd = new Date(minuteStart.getTime() + 59999);

  const duplicateInHistory = await Expense.findOne({
    user: userId,
    amount: transaction.amount,
    merchant: transaction.merchant,
    date: { $gte: minuteStart, $lte: minuteEnd },
  });
  if (duplicateInHistory) return true;

  const duplicateInPending = await PendingTransaction.findOne({
    user: userId,
    amount: transaction.amount,
    merchant: transaction.merchant,
    date: { $gte: minuteStart, $lte: minuteEnd },
  });
  if (duplicateInPending) return true;

  return false;
}

/**
 * Creates a PendingTransaction from a parsed transaction.
 * @param {string} userId - User's MongoDB ObjectId
 * @param {object} transaction - Parsed transaction data
 * @returns {Promise<object>} Created PendingTransaction document
 */
async function createPendingTransaction(userId, transaction) {
  return PendingTransaction.create({
    user: userId,
    amount: transaction.amount,
    merchant: transaction.merchant,
    paymentMethod: transaction.paymentMethod || 'UPI',
    status: 'Pending',
    date: transaction.date,
    notes: transaction.rawSubject
      ? `Auto-detected from email: "${transaction.rawSubject.substring(0, 80)}"`
      : 'Auto-detected bank transaction',
    gmailMessageId: transaction.gmailMessageId,
    source: 'gmail_auto',
    bank: transaction.bank || 'Unknown',
    transactionType: transaction.transactionType || 'Debit',
    parsedSuccessfully: transaction.parsedSuccessfully !== false,
    rawSubject: transaction.rawSubject || '',
  });
}

module.exports = {
  isDuplicate,
  createPendingTransaction,
};

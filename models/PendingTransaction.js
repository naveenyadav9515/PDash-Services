const mongoose = require('mongoose');

const pendingTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
  },
  merchant: {
    type: String,
    required: [true, 'Please provide a merchant or reason'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Health', 'Other'],
    default: 'Other',
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'],
    default: 'UPI',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: '',
  },
  tags: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },

  // ── Gmail Deduplication Fields ──

  /**
   * Gmail's immutable message ID. This is the PRIMARY deduplication key.
   * Each bank transaction email has a unique msg.id in Gmail.
   * Before creating a PendingTransaction, we check if this gmailMessageId
   * already exists. If it does, we skip — guaranteed no duplicates.
   */
  gmailMessageId: {
    type: String,
    default: null,
    index: true,
  },

  /**
   * Source of the transaction record.
   * 'gmail_auto' = parsed from Gmail bank email
   * 'manual'     = manually entered by user
   * 'simulated'  = created by the simulator endpoint
   */
  source: {
    type: String,
    enum: ['gmail_auto', 'manual', 'simulated'],
    default: 'manual',
  }
}, {
  timestamps: true,
});

/**
 * Compound unique index: one Gmail message can only create one pending transaction per user.
 * This is the DATABASE-LEVEL guarantee against duplicates.
 * The sparse option allows multiple null values (for manual entries without gmailMessageId).
 */
pendingTransactionSchema.index(
  { user: 1, gmailMessageId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { gmailMessageId: { $ne: null } } }
);

module.exports = mongoose.model('PendingTransaction', pendingTransactionSchema);

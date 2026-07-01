const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: [0, 'Amount cannot be negative'],
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Health', 'Other'],
    default: 'Other',
  },
  merchant: {
    type: String,
    required: [true, 'Please provide a merchant or reason'],
    trim: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other'],
    default: 'UPI',
  },
  gmailMessageId: {
    type: String,
    default: null,
    index: true,
  }
}, {
  timestamps: true,
});

expenseSchema.index(
  { user: 1, gmailMessageId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { gmailMessageId: { $ne: null } } }
);

module.exports = mongoose.model('Expense', expenseSchema);

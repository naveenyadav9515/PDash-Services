const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: 'widgets' },
  enabled: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Feature', featureSchema);

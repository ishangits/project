const mongoose = require('mongoose');

const tokenUsageLogSchema = new mongoose.Schema({
  domainId: {
    type: String,
    required: true,
    index: true
  },
  tokensUsed: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  requestType: {
    type: String,
    enum: ['chat', 'completion', 'embedding', 'fine-tuning'],
    default: 'chat'
  },
  model: {
    type: String,
    default: 'gpt-3.5-turbo'
  },
  endpoint: {
    type: String,
    trim: true
  },
  userQuery: {
    type: String,
    trim: true
  },
  responseLength: {
    type: Number,
    min: 0
  },
  processingTime: {
    type: Number, // in milliseconds
    min: 0
  },
  status: {
    type: String,
    enum: ['success', 'error', 'timeout'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for better query performance
tokenUsageLogSchema.index({ domainId: 1, createdAt: -1 });
tokenUsageLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('TokenUsageLog', tokenUsageLogSchema);
const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  apiEndpoint: {
    type: String,
    required: true
  },
  authToken: {
    type: String,
    required: true,
    unique: true
  },
  domainId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  description: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  plan: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    default: 'basic'
  },
  tokenLimit: {
    type: Number,
    default: 10000
  },
  tokensUsed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate unique domain ID
domainSchema.pre('save', function(next) {
  if (!this.domainId) {
    this.domainId = 'DOM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
  next();
});

module.exports = mongoose.model('Domain', domainSchema);
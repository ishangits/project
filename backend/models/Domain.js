import mongoose from 'mongoose';

const domainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  domainId: {
    type: String,
    required: true,
    unique: true
  },
  apiEndpoint: {
    type: String,
    required: true
  },
  authToken: {
    type: String,
    required: true
  },
  kbSettings: {
    autoUpdate: {
      type: Boolean,
      default: false
    },
    lastUpdated: {
      type: Date,
      default: null
    },
    crawlEnabled: {
      type: Boolean,
      default: false
    },
    updateInterval: {
      type: Number,
      default: 24 // hours
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate domain ID and auth token before saving
domainSchema.pre('save', function(next) {
  if (this.isNew) {
    this.domainId = 'dom_' + Math.random().toString(36).substring(2, 15);
    this.authToken = 'tok_' + Math.random().toString(36).substring(2, 25) + Math.random().toString(36).substring(2, 25);
    this.apiEndpoint = `https://api.server.com/chatbot/${this.domainId}`;
  }
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Domain', domainSchema);
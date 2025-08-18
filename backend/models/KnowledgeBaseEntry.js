const mongoose = require('mongoose');

const knowledgeBaseEntrySchema = new mongoose.Schema({
  domainId: {
    type: String,
    required: true,
    index: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  tags: [{
    type: String,
    trim: true
  }],
  source: {
    type: String,
    enum: ['manual', 'upload', 'crawl'],
    default: 'manual'
  },
  sourceFile: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better search performance
knowledgeBaseEntrySchema.index({ domainId: 1, question: 'text', answer: 'text' });

module.exports = mongoose.model('KnowledgeBaseEntry', knowledgeBaseEntrySchema);
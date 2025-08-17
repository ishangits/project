import mongoose from 'mongoose';

const knowledgeBaseEntrySchema = new mongoose.Schema({
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true
  },
  type: {
    type: String,
    enum: ['faq', 'manual', 'crawled', 'upload'],
    required: true
  },
  question: {
    type: String,
    trim: true
  },
  answer: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    trim: true
  },
  metadata: {
    filename: String,
    fileSize: Number,
    uploadDate: Date,
    crawlDate: Date,
    url: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
knowledgeBaseEntrySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('KnowledgeBaseEntry', knowledgeBaseEntrySchema);
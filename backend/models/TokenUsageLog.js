import mongoose from 'mongoose';

const tokenUsageLogSchema = new mongoose.Schema({
domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true
  },
  date: {
    type: Date,
required: true,
    default: Date.now
},
tokensUsed: {
type: Number,
required: true,
min: 0
},
requestType: {
type: String,
    enum: ['chat', 'kb_update', 'crawl', 'training'],
default: 'chat'
},
  cost: {
type: Number,
    required: true,
min: 0
},
metadata: {
    userQuery: String,
    responseLength: Number,
    sessionId: String,
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
}
});

// Calculate cost before saving
tokenUsageLogSchema.pre('save', function(next) {
  const costPer1K = parseFloat(process.env.TOKEN_COST_PER_1K) || 0.002;
  this.cost = (this.tokensUsed / 1000) * costPer1K;
  next();
});

export default mongoose.model('TokenUsageLog', tokenUsageLogSchema);
import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true,
    unique: true
  },
  domainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed', 'cancelled'],
    default: 'pending'
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  metadata: {
    tokenUsage: Number,
    billingPeriod: {
      start: Date,
      end: Date
    },
    paymentMethod: String,
    transactionId: String
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

// Generate invoice ID before saving
invoiceSchema.pre('save', function(next) {
  if (this.isNew) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.invoiceId = `INV-${timestamp}-${random}`;
  }
  this.updatedAt = new Date();
  next();
});

// Set due date to 30 days from issue date if not provided
invoiceSchema.pre('save', function(next) {
  if (this.isNew && !this.dueDate) {
    this.dueDate = new Date(this.issueDate.getTime() + (30 * 24 * 60 * 60 * 1000));
  }
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
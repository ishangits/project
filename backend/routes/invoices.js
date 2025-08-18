import express from 'express';
import Invoice from '../models/Invoice.js';
import Domain from '../models/Domain.js';
import TokenUsageLog from '../models/TokenUsageLog.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all invoices for a client/domain
router.get('/clients/:domainId/invoices', authenticateToken, async (req, res) => {
  try {
    const { domainId } = req.params;
    const { page = 1, limit = 10, status = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Verify domain exists
    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({ message: 'Domain not found' });
    }

    const query = { domainId };
    if (status) {
      query.status = status;
    }

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const invoices = await Invoice.find(query)
      .populate('domainId', 'name url domainId')
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invoice.countDocuments(query);

    res.json({
      invoices,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get client invoices error:', error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

// Create new invoice for a client
router.post('/clients/:domainId/invoices', authenticateToken, async (req, res) => {
  try {
    const { domainId } = req.params;
    const { amount, currency = 'USD', description, dueDate, metadata } = req.body;

    // Verify domain exists
    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({ message: 'Domain not found' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    // Calculate token usage for this domain if not provided
    let tokenUsage = 0;
    if (metadata?.billingPeriod) {
      const usage = await TokenUsageLog.aggregate([
        {
          $match: {
            domainId: domain._id,
            date: {
              $gte: new Date(metadata.billingPeriod.start),
              $lte: new Date(metadata.billingPeriod.end)
            }
          }
        },
        {
          $group: {
            _id: null,
            totalTokens: { $sum: '$tokensUsed' },
            totalCost: { $sum: '$cost' }
          }
        }
      ]);
      
      if (usage.length > 0) {
        tokenUsage = usage[0].totalTokens;
      }
    }

    const invoice = new Invoice({
      domainId,
      amount,
      currency,
      description: description || `Invoice for ${domain.name}`,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      metadata: {
        ...metadata,
        tokenUsage
      }
    });

    await invoice.save();
    await invoice.populate('domainId', 'name url domainId');

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Error creating invoice' });
  }
});

// Update invoice status
router.put('/invoices/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { status, metadata } = req.body;

    if (!status || !['pending', 'paid', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required' });
    }

    const updateData = { status };
    if (metadata) {
      updateData.metadata = metadata;
    }

    const invoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      updateData,
      { new: true, runValidators: true }
    ).populate('domainId', 'name url domainId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Error updating invoice' });
  }
});

// Get single invoice
router.get('/invoices/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
      .populate('domainId', 'name url domainId');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Error fetching invoice' });
  }
});

// Delete invoice
router.delete('/invoices/:invoiceId', authenticateToken, async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Error deleting invoice' });
  }
});

// Get invoice statistics
router.get('/invoices/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { domainId } = req.query;
    
    const matchQuery = {};
    if (domainId) {
      matchQuery.domainId = domainId;
    }

    const stats = await Invoice.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const summary = {
      total: 0,
      totalAmount: 0,
      paid: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
      cancelled: { count: 0, amount: 0 }
    };

    stats.forEach(stat => {
      summary.total += stat.count;
      summary.totalAmount += stat.totalAmount;
      summary[stat._id] = {
        count: stat.count,
        amount: stat.totalAmount
      };
    });

    res.json(summary);
  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({ message: 'Error fetching invoice statistics' });
  }
});

export default router;
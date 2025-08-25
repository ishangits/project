// import express from 'express';
// import { Op, fn, col } from 'sequelize';
// import Invoice from '../models/Invoice.js';
// import Domain from '../models/Domain.js';
// import TokenUsageLog from '../models/TokenUsageLog.js';
// import { authenticateToken } from '../middleware/auth.js';

// const router = express.Router();

// // Get all invoices for a client/domain
// router.get('/clients/:domainId/invoices', authenticateToken, async (req, res) => {
//   try {
//     const { domainId } = req.params;
//     const { page = 1, limit = 10, status = '', sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
//     const offset = (page - 1) * limit;

//     const domain = await Domain.findByPk(domainId);
//     if (!domain) return res.status(404).json({ message: 'Domain not found' });

//     const where = { domainId };
//     if (status) where.status = status;

//     const { rows: invoices, count: total } = await Invoice.findAndCountAll({
//       where,
//       include: [{ model: Domain, attributes: ['id', 'name', 'url', 'domainId'] }],
//       order: [[sortBy, sortOrder.toUpperCase()]],
//       limit: parseInt(limit),
//       offset: parseInt(offset),
//     });

//     res.json({
//       invoices,
//       totalPages: Math.ceil(total / limit),
//       currentPage: parseInt(page),
//       total,
//     });
//   } catch (error) {
//     console.error('Get client invoices error:', error);
//     res.status(500).json({ message: 'Error fetching invoices' });
//   }
// });

// // Create new invoice
// router.post('/clients/:domainId/invoices', authenticateToken, async (req, res) => {
//   try {
//     const { domainId } = req.params;
//     const { amount, currency = 'USD', description, dueDate, metadata } = req.body;

//     const domain = await Domain.findByPk(domainId);
//     if (!domain) return res.status(404).json({ message: 'Domain not found' });

//     if (!amount || amount <= 0) return res.status(400).json({ message: 'Valid amount is required' });

//     let tokenUsage = 0;
//     if (metadata?.billingPeriod) {
//       tokenUsage = await TokenUsageLog.sum('tokensUsed', {
//         where: {
//           domainId,
//           date: {
//             [Op.between]: [new Date(metadata.billingPeriod.start), new Date(metadata.billingPeriod.end)],
//           },
//         },
//       }) || 0;
//     }

//     const invoice = await Invoice.create({
//       domainId,
//       amount,
//       currency,
//       description: description || `Invoice for ${domain.name}`,
//       dueDate: dueDate ? new Date(dueDate) : undefined,
//       metadata: { ...metadata, tokenUsage },
//     });

//     const invoiceWithDomain = await Invoice.findByPk(invoice.id, {
//       include: [{ model: Domain, attributes: ['id', 'name', 'url', 'domainId'] }],
//     });

//     res.status(201).json(invoiceWithDomain);
//   } catch (error) {
//     console.error('Create invoice error:', error);
//     res.status(500).json({ message: 'Error creating invoice' });
//   }
// });

// // Update invoice status
// router.put('/invoices/:invoiceId', authenticateToken, async (req, res) => {
//   try {
//     const { invoiceId } = req.params;
//     const { status, metadata } = req.body;

//     if (!status || !['pending', 'paid', 'failed', 'cancelled'].includes(status))
//       return res.status(400).json({ message: 'Valid status is required' });

//     const invoice = await Invoice.findByPk(invoiceId);
//     if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

//     await invoice.update({
//       status,
//       ...(metadata && { metadata }),
//     });

//     const updatedInvoice = await Invoice.findByPk(invoice.id, {
//       include: [{ model: Domain, attributes: ['id', 'name', 'url', 'domainId'] }],
//     });

//     res.json(updatedInvoice);
//   } catch (error) {
//     console.error('Update invoice error:', error);
//     res.status(500).json({ message: 'Error updating invoice' });
//   }
// });

// // Get single invoice
// router.get('/invoices/:invoiceId', authenticateToken, async (req, res) => {
//   try {
//     const invoice = await Invoice.findByPk(req.params.invoiceId, {
//       include: [{ model: Domain, attributes: ['id', 'name', 'url', 'domainId'] }],
//     });
//     if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
//     res.json(invoice);
//   } catch (error) {
//     console.error('Get invoice error:', error);
//     res.status(500).json({ message: 'Error fetching invoice' });
//   }
// });

// // Delete invoice
// router.delete('/invoices/:invoiceId', authenticateToken, async (req, res) => {
//   try {
//     const invoice = await Invoice.findByPk(req.params.invoiceId);
//     if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

//     await invoice.destroy();
//     res.json({ message: 'Invoice deleted successfully' });
//   } catch (error) {
//     console.error('Delete invoice error:', error);
//     res.status(500).json({ message: 'Error deleting invoice' });
//   }
// });

// // Get invoice statistics
// router.get('/invoices/stats/summary', authenticateToken, async (req, res) => {
//   try {
//     const { domainId } = req.query;

//     const where = {};
//     if (domainId) where.domainId = domainId;

//     const stats = await Invoice.findAll({
//       where,
//       attributes: ['status', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('amount')), 'totalAmount']],
//       group: ['status'],
//       raw: true,
//     });

//     const summary = {
//       total: 0,
//       totalAmount: 0,
//       paid: { count: 0, amount: 0 },
//       pending: { count: 0, amount: 0 },
//       failed: { count: 0, amount: 0 },
//       cancelled: { count: 0, amount: 0 },
//     };

//     stats.forEach(stat => {
//       summary.total += parseInt(stat.count);
//       summary.totalAmount += parseFloat(stat.totalAmount);
//       summary[stat.status] = { count: parseInt(stat.count), amount: parseFloat(stat.totalAmount) };
//     });

//     res.json(summary);
//   } catch (error) {
//     console.error('Get invoice stats error:', error);
//     res.status(500).json({ message: 'Error fetching invoice statistics' });
//   }
// });

// export default router;

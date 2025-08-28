import express from 'express';
import fs from 'fs';
import path from 'path';
import createCsvWriter from 'csv-writer';
import jsPDF from 'jspdf';
import { format, subDays } from 'date-fns';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Demo domains
const demoDomains = [
  { id: '1', name: 'Alpha', url: 'alpha.com', domainId: '1' },
  { id: '2', name: 'Beta', url: 'beta.com', domainId: '2' },
  { id: '3', name: 'Gamma', url: 'gamma.com', domainId: '3' },
];

// Demo token logs
const demoLogs = [];
for (let i = 0; i < 50; i++) {
  const domain = demoDomains[i % demoDomains.length];
  demoLogs.push({
    id: i + 1,
    domain,
    date: subDays(new Date(), i % 30),
    tokensUsed: Math.floor(Math.random() * 500) + 50,
    requestType: ['chat', 'kb_update', 'training', 'crawl'][i % 4],
    cost: parseFloat((Math.random() * 5).toFixed(4)),
    metadata: {
      userQuery: `Query ${i + 1}`,
      responseLength: Math.floor(Math.random() * 1000),
      sessionId: `sess_${i + 1}`,
      model: 'gpt-3.5-turbo',
    },
  });
}

// CSV report
router.get('/csv', authenticateToken, async (req, res) => {
  try {
    const { domainId, startDate, endDate } = req.query;
    let filtered = demoLogs;

    if (domainId) filtered = filtered.filter(log => log.domain.id === domainId);
    if (startDate) filtered = filtered.filter(log => log.date >= new Date(startDate));
    if (endDate) filtered = filtered.filter(log => log.date <= new Date(endDate));

    const csvData = filtered.map(log => ({
      date: format(log.date, 'yyyy-MM-dd'),
      domain: log.domain.name,
      domainId: log.domain.domainId,
      tokensUsed: log.tokensUsed,
      requestType: log.requestType,
      cost: log.cost.toFixed(4),
      model: log.metadata.model
    }));

    const filename = `token-usage-report-${Date.now()}.csv`;
    const filepath = path.join('temp', filename);
    if (!fs.existsSync('temp')) fs.mkdirSync('temp', { recursive: true });

    const csvWriter = createCsvWriter.createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'domain', title: 'Name' },
        { id: 'domainId', title: 'Domain ID' },
        { id: 'tokensUsed', title: 'Tokens Used' },
        { id: 'requestType', title: 'Request Type' },
        { id: 'cost', title: 'Cost ($)' },
        { id: 'model', title: 'Model' }
      ]
    });

    await csvWriter.writeRecords(csvData);
    res.download(filepath, filename, () => fs.unlinkSync(filepath));
  } catch (err) {
    console.error('CSV report error:', err);
    res.status(500).json({ message: 'Error generating CSV report' });
  }
});

// PDF report
router.get('/pdf', authenticateToken, async (req, res) => {
  try {
    const { domainId, startDate, endDate } = req.query;
    let filtered = demoLogs;

    if (domainId) filtered = filtered.filter(log => log.domain.id === domainId);
    if (startDate) filtered = filtered.filter(log => log.date >= new Date(startDate));
    if (endDate) filtered = filtered.filter(log => log.date <= new Date(endDate));

    const totalTokens = filtered.reduce((sum, log) => sum + log.tokensUsed, 0);
    const totalCost = filtered.reduce((sum, log) => sum + log.cost, 0);
    const totalRequests = filtered.length;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Token Usage Report', 20, 30);

    doc.setFontSize(12);
    doc.text(`Period: ${startDate || 'All'} to ${endDate || 'All'}`, 20, 45);

    doc.setFontSize(14);
    doc.text('Summary', 20, 65);
    doc.setFontSize(10);
    doc.text(`Total Requests: ${totalRequests}`, 20, 80);
    doc.text(`Total Tokens: ${totalTokens}`, 20, 90);
    doc.text(`Total Cost: $${totalCost.toFixed(4)}`, 20, 100);

    let y = 120;
    doc.setFontSize(12);
    doc.text('Recent Usage', 20, y);
    y += 15;
    doc.setFontSize(8);
    filtered.slice(0, 20).forEach(log => {
      const line = `${format(log.date, 'yyyy-MM-dd')} - ${log.domain.name} - ${log.tokensUsed} tokens - $${log.cost.toFixed(4)}`;
      doc.text(line, 20, y);
      y += 10;
      if (y > 280) { doc.addPage(); y = 20; }
    });

    const filename = `token-usage-report-${Date.now()}.pdf`;
    const filepath = path.join('temp', filename);
    if (!fs.existsSync('temp')) fs.mkdirSync('temp', { recursive: true });

    doc.save(filepath);
    res.download(filepath, filename, () => fs.unlinkSync(filepath));
  } catch (err) {
    console.error('PDF report error:', err);
    res.status(500).json({ message: 'Error generating PDF report' });
  }
});

// Invoice placeholder
router.post('/invoice', authenticateToken, (req, res) => {
  const { invoiceNumber } = req.body;
  res.json({
    message: 'Invoice generated successfully (placeholder)',
    invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
    generatedAt: new Date()
  });
});

export default router;

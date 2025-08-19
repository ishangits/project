import express from 'express';
import fs from 'fs';
import path from 'path';
import createCsvWriter from 'csv-writer';
import jsPDF from 'jspdf';
import TokenUsageLog from '../models/TokenUsageLog.js';
import Domain from '../models/Domain.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Generate CSV report
router.get('/csv', authenticateToken, async (req, res) => {
  try {
    const { domainId, startDate, endDate } = req.query;

    const query = {};
    if (domainId) query.domainId = domainId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const logs = await TokenUsageLog.find(query)
      .populate('domainId', 'name url domainId')
      .sort({ date: -1 });

    // Create CSV file
    const csvData = logs.map(log => ({
      date: log.date.toISOString().split('T')[0],
      domain: log.domainId.name,
      domainId: log.domainId.domainId,
      tokensUsed: log.tokensUsed,
      requestType: log.requestType,
      cost: log.cost.toFixed(4),
      model: log.metadata.model || 'N/A'
    }));

    const filename = `token-usage-report-${Date.now()}.csv`;
    const filepath = path.join('temp', filename);

    // Ensure temp directory exists
    if (!fs.existsSync('temp')) {
      fs.mkdirSync('temp', { recursive: true });
    }

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

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) console.error('File cleanup error:', unlinkErr);
      });
    });
  } catch (error) {
    console.error('CSV report error:', error);
    res.status(500).json({ message: 'Error generating CSV report' });
  }
});

// Generate PDF report
router.get('/pdf', authenticateToken, async (req, res) => {
  try {
    const { domainId, startDate, endDate } = req.query;

    const query = {};
    if (domainId) query.domainId = domainId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const logs = await TokenUsageLog.find(query)
      .populate('domainId', 'name url domainId')
      .sort({ date: -1 });

    // Calculate summary statistics
    const totalTokens = logs.reduce((sum, log) => sum + log.tokensUsed, 0);
    const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
    const totalRequests = logs.length;

    // Create PDF
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Token Usage Report', 20, 30);
    
    // Date range
    const dateRange = `${startDate || 'All'} to ${endDate || 'All'}`;
    doc.setFontSize(12);
    doc.text(`Period: ${dateRange}`, 20, 45);
    
    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 20, 65);
    doc.setFontSize(10);
    doc.text(`Total Requests: ${totalRequests}`, 20, 80);
    doc.text(`Total Tokens: ${totalTokens.toLocaleString()}`, 20, 90);
    doc.text(`Total Cost: $${totalCost.toFixed(4)}`, 20, 100);
    
    // Add some sample data (simplified for PDF)
    let yPosition = 120;
    doc.setFontSize(12);
    doc.text('Recent Usage', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(8);
    logs.slice(0, 20).forEach((log) => {
      const line = `${log.date.toLocaleDateString()} - ${log.domainId.name} - ${log.tokensUsed} tokens - $${log.cost.toFixed(4)}`;
      doc.text(line, 20, yPosition);
      yPosition += 10;
      
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
    });

    const filename = `token-usage-report-${Date.now()}.pdf`;
    const filepath = path.join('temp', filename);

    // Ensure temp directory exists
    if (!fs.existsSync('temp')) {
      fs.mkdirSync('temp', { recursive: true });
    }

    doc.save(filepath);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up file after download
      setTimeout(() => {
        fs.unlink(filepath, (unlinkErr) => {
          if (unlinkErr) console.error('File cleanup error:', unlinkErr);
        });
      }, 1000);
    });
  } catch (error) {
    console.error('PDF report error:', error);
    res.status(500).json({ message: 'Error generating PDF report' });
  }
});

// Generate invoice (placeholder)
router.post('/invoice', authenticateToken, async (req, res) => {
  try {
    const { domainId, startDate, endDate, invoiceNumber } = req.body;

    // This is a placeholder for invoice generation
    // In a real implementation, this would create a professional invoice

    res.json({ 
      message: 'Invoice generated successfully (placeholder)', 
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ message: 'Error generating invoice' });
  }
});

export default router;
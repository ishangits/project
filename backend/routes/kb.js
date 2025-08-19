import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import KnowledgeBaseEntry from '../models/KnowledgeBaseEntry.js';
import Domain from '../models/Domain.js';
import { authenticateToken } from '../middleware/auth.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeEntry, insertOrUpdateEntries } from '../utils/kbHelper.js';



const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get KB entries for a domain
router.get('/:domainId', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type = '' } = req.query;
    
    const query = { domainId: req.params.domainId };
    
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: 'i' } },
        { answer: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) {
      query.type = type;
    }

    const entries = await KnowledgeBaseEntry.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await KnowledgeBaseEntry.countDocuments(query);

    res.json({
      entries,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get KB entries error:', error);
    res.status(500).json({ message: 'Error fetching KB entries' });
  }
});

// Create manual KB entry
router.post('/:domainId/manual', authenticateToken, async (req, res) => {
  try {
    const { question, answer, tags } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const entry = new KnowledgeBaseEntry({
      domainId: req.params.domainId,
      type: 'manual',
      question,
      answer,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await entry.save();

    // Update domain's KB timestamp
    await Domain.findByIdAndUpdate(req.params.domainId, {
      'kbSettings.lastUpdated': new Date()
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Create manual KB entry error:', error);
    res.status(500).json({ message: 'Error creating KB entry' });
  }
});

// Upload KB file (CSV/Excel)
router.post('/:domainId/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const filePath = req.file.path;
    let entries = [];

    if (req.file.mimetype === 'text/csv') {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv({ separator: '\t' }))
        .on('data', row => results.push(row))
        .on('end', async () => {
          entries = results.map(row => normalizeEntry(row, req.file.originalname, req.params.domainId));
          const count = await insertOrUpdateEntries(entries);

          await Domain.findByIdAndUpdate(req.params.domainId, { 'kbSettings.lastUpdated': new Date() });
          fs.unlinkSync(filePath);
          res.json({ message: `Uploaded ${count} entries from CSV`, count });
        });

    } else if (req.file.mimetype.includes('excel')) {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      entries = data.map(row => normalizeEntry(row, req.file.originalname, req.params.domainId));
      const count = await insertOrUpdateEntries(entries);

      await Domain.findByIdAndUpdate(req.params.domainId, { 'kbSettings.lastUpdated': new Date() });
      fs.unlinkSync(filePath);
      res.json({ message: `Uploaded ${count} entries from Excel`, count });

    } else if (req.file.mimetype === 'application/pdf') {
      const buffer = fs.readFileSync(filePath);
      const data = await pdf(buffer);
      const lines = data.text.split('\n').map(l => l.trim()).filter(Boolean);

      entries = lines.map(line => {
        const [question, answer] = line.split('\t'); // adapt separator
        return { suburbname: question, postcode: '', response: answer };
      }).map(row => normalizeEntry(row, req.file.originalname, req.params.domainId));

      const count = await insertOrUpdateEntries(entries);

      await Domain.findByIdAndUpdate(req.params.domainId, { 'kbSettings.lastUpdated': new Date() });
      fs.unlinkSync(filePath);
      res.json({ message: `Uploaded ${count} entries from PDF`, count });
    }

  } catch (error) {
    console.error('Upload KB file error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Error processing uploaded file', error: error.message });
  }
});


// Delete KB entry
router.delete('/:domainId/entries/:entryId', authenticateToken, async (req, res) => {
  try {
    const entry = await KnowledgeBaseEntry.findOneAndDelete({
      _id: req.params.entryId,
      domainId: req.params.domainId
    });

    if (!entry) {
      return res.status(404).json({ message: 'KB entry not found' });
    }

    res.json({ message: 'KB entry deleted successfully' });
  } catch (error) {
    console.error('Delete KB entry error:', error);
    res.status(500).json({ message: 'Error deleting KB entry' });
  }
});

// Crawl domain (placeholder)


router.post('/:domainId/crawl', authenticateToken, async (req, res) => {
  try {
    const { domainId } = req.params;

    // 1. Fetch domain URL from DB
    const domain = await Domain.findById(domainId);
    if (!domain) {
      return res.status(404).json({ message: 'Domain not found' });
    }

    const url = domain.url;
    if (!url) {
      return res.status(400).json({ message: 'Domain URL is empty' });
    }

    // 2. Fetch page content
    const response = await axios.get(url);
    const html = response.data;

    // 3. Parse HTML with cheerio
    const $ = cheerio.load(html);
    const entries = [];

    // Extract headings and paragraphs
    $('h1,h2,h3,p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) { // skip very short content
        entries.push({
          domainId,
          type: 'crawled',
          content: text,
          metadata: {
            url,
            crawlDate: new Date()
          }
        });
      }
    });

    // 4. Save to KnowledgeBaseEntry
    if (entries.length > 0) {
      await KnowledgeBaseEntry.insertMany(entries);
    }

    // 5. Update domain's KB timestamp
    await Domain.findByIdAndUpdate(domainId, {
      'kbSettings.lastUpdated': new Date()
    });

    res.json({
      message: `Domain crawl completed successfully. ${entries.length} entries added.`,
      count: entries.length
    });

  } catch (error) {
    console.error('Crawl domain error:', error);
    res.status(500).json({ message: 'Error crawling domain', error: error.message });
  }
});


export default router;
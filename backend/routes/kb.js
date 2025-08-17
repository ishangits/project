import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import KnowledgeBaseEntry from '../models/KnowledgeBaseEntry.js';
import Domain from '../models/Domain.js';
import { authenticateToken } from '../middleware/auth.js';

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
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const entries = [];
    const filePath = req.file.path;

    if (req.file.mimetype === 'text/csv') {
      // Process CSV file
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          for (const row of results) {
            if (row.question && row.answer) {
              entries.push({
                domainId: req.params.domainId,
                type: 'upload',
                question: row.question,
                answer: row.answer,
                metadata: {
                  filename: req.file.originalname,
                  fileSize: req.file.size,
                  uploadDate: new Date()
                }
              });
            }
          }
          
          await KnowledgeBaseEntry.insertMany(entries);
          
          // Update domain's KB timestamp
          await Domain.findByIdAndUpdate(req.params.domainId, {
            'kbSettings.lastUpdated': new Date()
          });

          // Clean up uploaded file
          fs.unlinkSync(filePath);
          
          res.json({ message: `Successfully uploaded ${entries.length} entries`, count: entries.length });
        });
    } else {
      // Process Excel file
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet);

      for (const row of data) {
        if (row.question && row.answer) {
          entries.push({
            domainId: req.params.domainId,
            type: 'upload',
            question: row.question,
            answer: row.answer,
            metadata: {
              filename: req.file.originalname,
              fileSize: req.file.size,
              uploadDate: new Date()
            }
          });
        }
      }

      await KnowledgeBaseEntry.insertMany(entries);
      
      // Update domain's KB timestamp
      await Domain.findByIdAndUpdate(req.params.domainId, {
        'kbSettings.lastUpdated': new Date()
      });

      // Clean up uploaded file
      fs.unlinkSync(filePath);
      
      res.json({ message: `Successfully uploaded ${entries.length} entries`, count: entries.length });
    }
  } catch (error) {
    console.error('Upload KB file error:', error);
    // Clean up file if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error processing uploaded file' });
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
    // This is a placeholder for domain crawling functionality
    // In a real implementation, this would crawl the domain and extract content
    
    // Update domain's KB timestamp
    await Domain.findByIdAndUpdate(req.params.domainId, {
      'kbSettings.lastUpdated': new Date()
    });

    res.json({ message: 'Domain crawl initiated successfully (placeholder)' });
  } catch (error) {
    console.error('Crawl domain error:', error);
    res.status(500).json({ message: 'Error crawling domain' });
  }
});

export default router;
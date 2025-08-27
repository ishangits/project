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

// Multer setup
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

// ==================== GET KB ENTRIES ====================
router.get('/:domainId', authenticateToken, async (req, res) => {
  try {
    const { domainId } = req.params;
    const { page = 1, limit = 10, search = '', type = '' } = req.query;

    // Build query params to forward to external API
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search,
      type
    }).toString();

    // Call external API instead of local DB
    const response = await axios.get(
      `${process.env.TENANT_API_BASE}/api/kb/${domainId}?${query}`,
      {
        headers: {
          "X-API-Key": process.env.TENANT_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data); // forward external API response
  } catch (error) {
    console.error("Get KB entries error:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to fetch KB entries" });
  }
});


// ==================== CREATE MANUAL KB ENTRY ====================
// /api/kb
router.post("/", async (req, res) => {
  try {
    const { tenantId, title, content } = req.body;

    if (!tenantId || !title || !content) {
      return res.status(400).json({ error: "tenantId, title, and content are required" });
    }

    const payload = { tenantId, title, content };
    const response = await axios.post(`${process.env.TENANT_API_BASE}/api/kb/`, payload, {
      headers: { "X-API-Key": process.env.TENANT_API_KEY }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error creating KB entry:", error);
    res.status(500).json({ error: "Failed to create KB entry" });
  }
});



// ==================== UPLOAD KB FILE ====================
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { tenantId } = req.body;
    if (!tenantId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'tenantId is required in body' });
    }

    const filePath = req.file.path;
    const results = [];

    // Read CSV (comma separated, can change to \t if needed)
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', row => results.push(row))
      .on('end', async () => {
        let successCount = 0;

        for (const row of results) {
          const question = row.question || row.Question;
          const answer = row.answer || row.Answer;

          if (!question || !answer) continue;

          try {
            await axios.post(`${process.env.TENANT_API_BASE}/api/kb/`, {
              tenantId,
              title: question,
              content: answer,
            }, {
              headers: { "X-API-Key": process.env.TENANT_API_KEY }
            });

            successCount++;
          } catch (err) {
            console.error("❌ Failed to push entry:", row, err.message);
          }
        }

        fs.unlinkSync(filePath);
        res.json({ message: `Uploaded ${successCount} KB entries from CSV`, count: successCount });
      });

  } catch (error) {
    console.error('Upload KB file error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Error processing uploaded file', error: error.message });
  }
});



// Delete KB entry
router.delete('/:domainId/entries/:entryId', authenticateToken, async (req, res) => {
  try {
    const { domainId, entryId } = req.params;

    const deleted = await KnowledgeBaseEntry.destroy({
      where: { id: entryId, domainId }
    });

    if (!deleted) {
      return res.status(404).json({ message: "KB entry not found" });
    }

    res.json({ message: "KB entry deleted successfully" });
  } catch (error) {
    console.error("Delete KB entry error:", error);
    res.status(500).json({ message: "Error deleting KB entry" });
  }
});

// Crawl domain
// router.post('/:domainId/crawl', authenticateToken, async (req, res) => {
//   try {
//     const { domainId } = req.params;
//     const domain = await Domain.findByPk(domainId);
//     if (!domain) {
//       return res.status(404).json({ message: "Domain not found" });
//     }

//     const url = domain.url;
//     if (!url) {
//       return res.status(400).json({ message: "Domain URL is empty" });
//     }

//     const response = await axios.get(url);
//     const $ = cheerio.load(response.data);
//     const entries = [];

//     $('h1,h2,h3,p').each((i, el) => {
//       const text = $(el).text().trim();
//       if (text.length > 20) {
//         entries.push({
//           domainId,
//           type: "crawled",
//           content: text,
//           metadata: { url, crawlDate: new Date() },
//         });
//       }
//     });

//     if (entries.length > 0) {
//       await KnowledgeBaseEntry.bulkCreate(entries);
//     }

//     await Domain.update(
//       { kbSettings: { lastUpdated: new Date() } },
//       { where: { id: domainId } }
//     );

//     res.json({ message: `Crawl completed. ${entries.length} entries added.`, count: entries.length });
//   } catch (error) {
//     console.error("Crawl domain error:", error);
//     res.status(500).json({ message: "Error crawling domain", error: error.message });
//   }
// });



export default router;

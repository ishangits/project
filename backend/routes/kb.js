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
    const { page = 1, limit = 10, search = '', type = '' } = req.query;
    const { domainId } = req.params;

    const where = { domainId };

    if (search) {
      where[Op.or] = [
        { question: { [Op.like]: `%${search}%` } },
        { answer: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } },
      ];
    }

    if (type) {
      where.type = type;
    }

    const { count, rows } = await KnowledgeBaseEntry.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });

    res.json({
      entries: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count,
    });
  } catch (error) {
    console.error("Get KB entries error:", error);
    res.status(500).json({ message: "Error fetching KB entries" });
  }
});

// ==================== CREATE MANUAL KB ENTRY ====================

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
router.post('/:domainId/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const filePath = req.file.path;
    let entries = [];

    const domainId = req.params.domainId;
    const fileName = req.file.originalname;

    // ---- CSV ----
    if (req.file.mimetype === 'text/csv') {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv({ separator: '\t' }))
        .on('data', row => results.push(row))
        .on('end', async () => {
          entries = results.map(row => normalizeEntry(row, req.file.originalname, req.params.domainId));
          const count = await insertOrUpdateEntries(entries);

const domain = await Domain.findByPk(req.params.domainId);
if (!domain) return res.status(404).json({ message: 'Domain not found' });

await Domain.update(
  { kbSettings: { ...domain.kbSettings, lastUpdated: new Date() } },
  { where: { id: req.params.domainId } }
);  
        fs.unlinkSync(filePath);
          res.json({ message: `Uploaded ${count} entries from CSV`, count });
        });

    // ---- Excel ----
    } else if (req.file.mimetype.includes('excel')) {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      entries = data.map(row => normalizeEntry(row, req.file.originalname, req.params.domainId));
      const count = await insertOrUpdateEntries(entries);

      await Domain.findByIdAndUpdate(req.params.domainId, { 'kbSettings.lastUpdated': new Date() });
      fs.unlinkSync(filePath);
      res.json({ message: `Uploaded ${count} entries from Excel`, count });

    // ---- PDF ----
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


// Crawl domain (placeholder)


// Crawl domain
router.post('/:domainId/crawl', authenticateToken, async (req, res) => {
  try {
    const { domainId } = req.params;
    const domain = await Domain.findByPk(domainId);
    if (!domain) {
      return res.status(404).json({ message: "Domain not found" });
    }

    const url = domain.url;
    if (!url) {
      return res.status(400).json({ message: "Domain URL is empty" });
    }

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const entries = [];

    $('h1,h2,h3,p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
        entries.push({
          domainId,
          type: "crawled",
          content: text,
          metadata: { url, crawlDate: new Date() },
        });
      }
    });

    if (entries.length > 0) {
      await KnowledgeBaseEntry.bulkCreate(entries);
    }

    await Domain.update(
      { kbSettings: { lastUpdated: new Date() } },
      { where: { id: domainId } }
    );

    res.json({ message: `Crawl completed. ${entries.length} entries added.`, count: entries.length });
  } catch (error) {
    console.error("Crawl domain error:", error);
    res.status(500).json({ message: "Error crawling domain", error: error.message });
  }
});



export default router;

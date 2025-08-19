import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import fs from 'fs';
import { Op } from 'sequelize';
import KnowledgeBaseEntry from '../models/KnowledgeBaseEntry.js';
import Domain from '../models/Domain.js';
import { authenticateToken } from '../middleware/auth.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { normalizeEntry, insertOrUpdateEntries } from '../utils/kbHelper.js';


const router = express.Router();

// Multer setup (same as before)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Get KB entries with pagination/search
router.get('/:domainId', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = { domainId: req.params.domainId };
    if (search) {
      where[Op.or] = [
        { question: { [Op.like]: `%${search}%` } },
        { answer: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }
    if (type) where.type = type;

    const { rows: entries, count: total } = await KnowledgeBaseEntry.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      entries,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
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
    if (!question || !answer) return res.status(400).json({ message: 'Question and answer are required' });

    const entry = await KnowledgeBaseEntry.create({
      domainId: req.params.domainId,
      type: 'manual',
      question,
      answer,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    });

    await Domain.update({ kbSettings: { lastUpdated: new Date() } }, { where: { id: req.params.domainId } });

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
    const entries = [];
    const filePath = req.file.path;
    let entries = [];

    const processRow = row => {
      if (row.question && row.answer) {
        entries.push({
          domainId: req.params.domainId,
          type: 'upload',
          question: row.question,
          answer: row.answer,
          metadata: { filename: req.file.originalname, fileSize: req.file.size, uploadDate: new Date() }
        });
      }
    };

    if (req.file.mimetype === 'text/csv') {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', row => results.push(row))
        .on('end', async () => {
          results.forEach(processRow);
          await KnowledgeBaseEntry.bulkCreate(entries);
          await Domain.update({ kbSettings: { lastUpdated: new Date() } }, { where: { id: req.params.domainId } });
          fs.unlinkSync(filePath);
          res.json({ message: `Uploaded ${entries.length} entries`, count: entries.length });
        });
    } else {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet);
      data.forEach(processRow);
      await KnowledgeBaseEntry.bulkCreate(entries);
      await Domain.update({ kbSettings: { lastUpdated: new Date() } }, { where: { id: req.params.domainId } });
      fs.unlinkSync(filePath);
      res.json({ message: `Uploaded ${entries.length} entries`, count: entries.length });

    }

  } catch (error) {
    console.error('Upload KB file error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Error processing uploaded file' });

  }
});


// Delete KB entry
router.delete('/:domainId/entries/:entryId', authenticateToken, async (req, res) => {
  try {
    const deleted = await KnowledgeBaseEntry.destroy({
      where: { id: req.params.entryId, domainId: req.params.domainId }
    });
    if (!deleted) return res.status(404).json({ message: 'KB entry not found' });
    res.json({ message: 'KB entry deleted successfully' });
  } catch (error) {
    console.error('Delete KB entry error:', error);
    res.status(500).json({ message: 'Error deleting KB entry' });
  }
});

// Crawl domain
router.post('/:domainId/crawl', authenticateToken, async (req, res) => {
  try {
    const domain = await Domain.findByPk(req.params.domainId);
    if (!domain) return res.status(404).json({ message: 'Domain not found' });
    if (!domain.url) return res.status(400).json({ message: 'Domain URL is empty' });

    const response = await axios.get(domain.url);
    const $ = cheerio.load(response.data);
    const entries = [];

    $('h1,h2,h3,p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) entries.push({
        domainId: domain.id,
        type: 'crawled',
        content: text,
        metadata: { url: domain.url, crawlDate: new Date() }
      });
    });

    if (entries.length > 0) await KnowledgeBaseEntry.bulkCreate(entries);
    await Domain.update({ kbSettings: { lastUpdated: new Date() } }, { where: { id: domain.id } });

    res.json({ message: `Crawl completed, ${entries.length} entries added.`, count: entries.length });
  } catch (error) {
    console.error('Crawl domain error:', error);
    res.status(500).json({ message: 'Error crawling domain', error: error.message });
  }
});

export default router;

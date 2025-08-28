import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import { connectDB, sequelize } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import domainRoutes from './routes/domains.js';
import kbRoutes from './routes/kb.js';
import tokenRoutes from './routes/tokens.js';
import reportRoutes from './routes/reports.js';
import trainRoutes from './routes/train.js'
// import invoiceRoutes from './routes/invoices.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MySQL
// connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', domainRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/train', trainRoutes);

// app.use('/api', invoiceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'AI Chatbot Admin Panel API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Sync Sequelize models & start server
// sequelize.sync({ alter: false }) // alter: true updates tables to match models
//   .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  // })
  // .catch((err) => {
  //   console.error('Failed to sync database:', err);
  // });

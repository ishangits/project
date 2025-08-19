import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import Domain from './models/Domain.js';
import KnowledgeBaseEntry from './models/KnowledgeBaseEntry.js';
import TokenUsageLog from './models/TokenUsageLog.js';
import Invoice from './models/Invoice.js';
import { connectDB } from './config/database.js';
import crypto from 'crypto';


dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Admin.deleteMany({});
    await Domain.deleteMany({});
    await KnowledgeBaseEntry.deleteMany({});
    await TokenUsageLog.deleteMany({});
    await Invoice.deleteMany({});

    console.log('Cleared existing data');

    // Create admin user
    const admin = new Admin({
      email: process.env.ADMIN_EMAIL || 'admin@chatbot.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      name: 'Admin User',
      role: 'admin'
    });

    await admin.save();
    console.log('Created admin user');

    // Create sample domains
   const domain1 = new Domain({
  name: 'TechCorp Website',
  url: 'https://techcorp.com',
  domainId: crypto.randomUUID(), // unique domain ID
  apiEndpoint: `https://api.yourserver.com/chatbot/${crypto.randomUUID()}`, // generated API endpoint
  authToken: crypto.randomBytes(32).toString('hex'), // secure random token
  createdAt: new Date()
});

const domain2 = new Domain({
  name: 'E-Commerce Store',
  url: 'https://mystore.com',
  domainId: crypto.randomUUID(),
  apiEndpoint: `https://api.yourserver.com/chatbot/${crypto.randomUUID()}`,
  authToken: crypto.randomBytes(32).toString('hex'),
  createdAt: new Date()
});

    await domain1.save();
    await domain2.save();
    console.log('Created sample domains');

    // Create sample KB entries
    const kbEntries = [
      {
        domainId: domain1._id,
        type: 'manual',
        question: 'What are your business hours?',
        answer: 'We are open Monday to Friday, 9 AM to 6 PM EST.',
        tags: ['hours', 'business']
      },
      {
        domainId: domain1._id,
        type: 'manual',
        question: 'How do I contact support?',
        answer: 'You can contact our support team at support@techcorp.com or call (555) 123-4567.',
        tags: ['support', 'contact']
      },
      {
        domainId: domain2._id,
        type: 'manual',
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for all items in original condition.',
        tags: ['returns', 'policy']
      },
      {
        domainId: domain2._id,
        type: 'manual',
        question: 'Do you offer free shipping?',
        answer: 'Yes, we offer free shipping on orders over $50.',
        tags: ['shipping', 'free']
      }
    ];

    await KnowledgeBaseEntry.insertMany(kbEntries);
    console.log('Created sample KB entries');

    // Create sample token usage logs
    const tokenLogs = [];
    const requestTypes = ['chat', 'kb_update', 'training'];
    
    for (let i = 0; i < 50; i++) {
      const randomDomain = Math.random() < 0.5 ? domain1._id : domain2._id;
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
      
     const tokenCostPer1K = parseFloat(process.env.TOKEN_COST_PER_1K) || 0.002;

tokenLogs.push({
  domainId: randomDomain,
  date: randomDate,
  tokensUsed: Math.floor(Math.random() * 1000) + 100,
  cost: Math.round(((Math.floor(Math.random() * 1000) + 100) / 1000) * tokenCostPer1K * 10000) / 10000, // calculate cost
  requestType: requestTypes[Math.floor(Math.random() * requestTypes.length)],
  metadata: {
    userQuery: 'Sample user query',
    responseLength: Math.floor(Math.random() * 500) + 50,
    sessionId: 'session_' + Math.random().toString(36).substring(7),
    model: 'gpt-3.5-turbo'
  }
});

    }

    await TokenUsageLog.insertMany(tokenLogs);
    console.log('Created sample token usage logs');

    // Create sample invoices
    const invoices = [
      {
            invoiceId: crypto.randomUUID(), 

        domainId: domain1._id,
        amount: 150.00,
        currency: 'USD',
        status: 'paid',
        description: 'Monthly token usage - March 2024',
        issueDate: new Date('2024-03-01'),
        dueDate: new Date('2024-03-31'),
        metadata: {
          tokenUsage: 75000,
          billingPeriod: {
            start: new Date('2024-03-01'),
            end: new Date('2024-03-31')
          }
        }
      },
      {
            invoiceId: crypto.randomUUID(), 

        domainId: domain1._id,
        amount: 200.50,
        currency: 'USD',
        status: 'pending',
        description: 'Monthly token usage - April 2024',
        issueDate: new Date('2024-04-01'),
        dueDate: new Date('2024-04-30'),
        metadata: {
          tokenUsage: 100250,
          billingPeriod: {
            start: new Date('2024-04-01'),
            end: new Date('2024-04-30')
          }
        }
      },
      {
            invoiceId: crypto.randomUUID(), 

        domainId: domain2._id,
        amount: 89.99,
        currency: 'USD',
        status: 'paid',
        description: 'Monthly token usage - March 2024',
        issueDate: new Date('2024-03-01'),
        dueDate: new Date('2024-03-31'),
        metadata: {
          tokenUsage: 44995,
          billingPeriod: {
            start: new Date('2024-03-01'),
            end: new Date('2024-03-31')
          }
        }
      },
      {
            invoiceId: crypto.randomUUID(), 

        domainId: domain2._id,
        amount: 125.75,
        currency: 'USD',
        status: 'failed',
        description: 'Monthly token usage - April 2024',
        issueDate: new Date('2024-04-01'),
        dueDate: new Date('2024-04-30'),
        metadata: {
          tokenUsage: 62875,
          billingPeriod: {
            start: new Date('2024-04-01'),
            end: new Date('2024-04-30')
          }
        }
      }
    ];

    await Invoice.insertMany(invoices);
    console.log('Created sample invoices');

    console.log('Seed data created successfully!');
    console.log(`Admin credentials: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
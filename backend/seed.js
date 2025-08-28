import dotenv from "dotenv";
import crypto from "crypto";
import { sequelize } from "./config/database.js";
import Admin from "./models/Admin.js";
import Domain from "./models/Domain.js";
import KnowledgeBaseEntry from "./models/KnowledgeBaseEntry.js";
import TokenUsageLog from "./models/TokenUsageLog.js";
import Invoice from "./models/Invoice.js";

dotenv.config();

const seedData = async () => {
  try {
    await sequelize.sync({ force: true }); // Drops and recreates tables
    console.log("Database synced");

    // Create admin user
    const admin = await Admin.create({
      email: process.env.ADMIN_EMAIL || "admin@chatbot.com",
      password: process.env.ADMIN_PASSWORD || "admin123",
      name: "Admin User",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    });
    console.log("Created admin user");

    // Create sample domains
    const domain1 = await Domain.create({
      name: "TechCorp Website",
      url: "https://techcorp.com",
      domainId: crypto.randomUUID(),
      apiEndpoint: `https://api.yourserver.com/chatbot/${crypto.randomUUID()}`,
      authToken: crypto.randomBytes(32).toString("hex"),
      createdAt: new Date(),
      updatedAt: new Date(),
      openAIKey: "sk-xxxx",
      dbHost: "localhost",
      dbUser: "root",
      dbPassword: "password",
      dbDatabase: "test_db",
      dbPort: "3306",
    });

    const domain2 = await Domain.create({
      name: "E-Commerce Store",
      url: "https://mystore.com",
      domainId: crypto.randomUUID(),
      apiEndpoint: `https://api.yourserver.com/chatbot/${crypto.randomUUID()}`,
      authToken: crypto.randomBytes(32).toString("hex"),
      createdAt: new Date(),
      updatedAt: new Date(),
      openAIKey: "sk-xxxx",
      dbHost: "localhost",
      dbUser: "root",
      dbPassword: "password",
      dbDatabase: "test_db",
      dbPort: "3306",
    });

    console.log("Created sample domains");

    // Create sample KB entries
    const kbEntries = [
      {
        domainId: domain1.id,
        type: "manual",
        question: "What are your business hours?",
        answer: "We are open Monday to Friday, 9 AM to 6 PM EST.",
        tags: JSON.stringify(["hours", "business"]),
        metadata: JSON.stringify({}),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        domainId: domain1.id,
        type: "manual",
        question: "How do I contact support?",
        answer:
          "You can contact our support team at support@techcorp.com or call (555) 123-4567.",
        tags: JSON.stringify(["support", "contact"]),
        metadata: JSON.stringify({}),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        domainId: domain2.id,
        type: "manual",
        question: "What is your return policy?",
        answer:
          "We offer a 30-day return policy for all items in original condition.",
        tags: JSON.stringify(["returns", "policy"]),
        metadata: JSON.stringify({}),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        domainId: domain2.id,
        type: "manual",
        question: "Do you offer free shipping?",
        answer: "Yes, we offer free shipping on orders over $50.",
        tags: JSON.stringify(["shipping", "free"]),
        metadata: JSON.stringify({}),
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await KnowledgeBaseEntry.bulkCreate(kbEntries);
    console.log("Created sample KB entries");

    // Create sample token usage logs
    const tokenLogs = [];
    const requestTypes = ["chat", "kb_update", "training"];
    const tokenCostPer1K = parseFloat(process.env.TOKEN_COST_PER_1K) || 0.002;

    for (let i = 0; i < 50; i++) {
      const randomDomain = Math.random() < 0.5 ? domain1.id : domain2.id;
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));

      const tokensUsed = Math.floor(Math.random() * 1000) + 100;

      tokenLogs.push({
        domainId: randomDomain,
        date: randomDate,
        tokensUsed,
        requestType:
          requestTypes[Math.floor(Math.random() * requestTypes.length)],
        cost:
          Math.round((tokensUsed / 1000) * tokenCostPer1K * 1000000) / 1000000, // 6 decimals
        metadata: JSON.stringify({
          userQuery: "Sample user query",
          responseLength: Math.floor(Math.random() * 500) + 50,
          sessionId: "session_" + Math.random().toString(36).substring(7),
          model: "gpt-3.5-turbo",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await TokenUsageLog.bulkCreate(tokenLogs);
    console.log("Created sample token usage logs");

    console.log("Seed data created successfully!");
    console.log(
      `Admin credentials: ${admin.email} / ${
        process.env.ADMIN_PASSWORD || "admin123"
      }`
    );

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedData();

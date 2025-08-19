import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Create a Sequelize instance (MySQL connection)
export const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'rag_chatbot_admin',  // Database name
  process.env.MYSQL_USER || 'root',                   // MySQL username
  process.env.MYSQL_PASSWORD || '',                   // MySQL password
  {
    host: process.env.MYSQL_HOST || 'localhost',
    dialect: 'mysql',
    logging: false, // set to true if you want SQL logs
  }
);

// Function to connect and authenticate MySQL
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connected Successfully!');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// models/Domain.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import crypto from 'crypto';
import { ObjectId } from 'bson';

class Domain extends Model {}

Domain.init(
  {
    id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => new ObjectId().toHexString(),
    },
    name: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    openAIKey: { type: DataTypes.STRING },
    
    // New database connection fields
    dbHost: { type: DataTypes.STRING },
    dbUser: { type: DataTypes.STRING },
    dbPort: { type: DataTypes.STRING },
    dbPassword: { 
      type: DataTypes.TEXT,
      set(value) {
        if (value) {
          try {
            // Use a more robust encryption method
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(
              process.env.DB_ENCRYPTION_KEY || 'default-backup-key-32-chars-long!', 
              'salt', 
              32
            );
            const iv = crypto.randomBytes(16);
            
            const cipher = crypto.createCipheriv(algorithm, key, iv);
            let encrypted = cipher.update(value, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Store IV with encrypted data (required for decryption)
            this.setDataValue('dbPassword', iv.toString('hex') + ':' + encrypted);
          } catch (error) {
            console.error('Error encrypting password:', error);
            this.setDataValue('dbPassword', null);
          }
        } else {
          this.setDataValue('dbPassword', null);
        }
      },
      get() {
        const encryptedData = this.getDataValue('dbPassword');
        if (!encryptedData) return null;
        
        try {
          const algorithm = 'aes-256-cbc';
          const parts = encryptedData.split(':');
          const iv = Buffer.from(parts[0], 'hex');
          const encrypted = parts[1];
          
          const key = crypto.scryptSync(
            process.env.DB_ENCRYPTION_KEY || 'default-backup-key-32-chars-long!', 
            'salt', 
            32
          );
          
          const decipher = crypto.createDecipheriv(algorithm, key, iv);
          let decrypted = decipher.update(encrypted, 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          return decrypted;
        } catch (error) {
          console.error('Error decrypting password:', error);
          return null;
        }
      }
    },
    dbDatabase: { type: DataTypes.STRING },

    apiEndpoint: { type: DataTypes.STRING },
    authToken: { type: DataTypes.STRING },

    kbSettings: {
      type: DataTypes.JSON,
      defaultValue: {
        autoUpdate: false,
        lastUpdated: null,
        crawlEnabled: false,
        updateInterval: 24,
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    modelName: 'Domain',
    tableName: 'domains',
    timestamps: true,
    hooks: {
      beforeCreate: (domain) => {
        if (!domain.id) {
          domain.id = new ObjectId().toHexString();
        }
        if (!domain.authToken) {
          domain.authToken = 'tok_' + crypto.randomBytes(32).toString('hex');
        }
        if (!domain.apiEndpoint) {
          domain.apiEndpoint = `https://api.server.com/chatbot/${domain.id}`;
        }
      },
    },
  }
);

export default Domain;
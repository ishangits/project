// models/Domain.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import crypto from 'crypto';
import { ObjectId } from 'bson';

class Domain extends Model {}

Domain.init(
  {
    id: {
      type: DataTypes.STRING(24), // 24 hex chars
      primaryKey: true,
      defaultValue: () => new ObjectId().toHexString(),
    },
    name: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    openAIKey: { type: DataTypes.STRING },

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

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

class Domain extends Model {}

Domain.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    domainId: { type: DataTypes.STRING, allowNull: false, unique: true },
    apiEndpoint: { type: DataTypes.STRING, allowNull: false },
    authToken: { type: DataTypes.STRING, allowNull: false },
    kbSettings: { 
      type: DataTypes.JSON,
      defaultValue: {
        autoUpdate: false,
        lastUpdated: null,
        crawlEnabled: false,
        updateInterval: 24
      }
    },
    status: { 
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'Domain',
    tableName: 'domains',
    timestamps: true, // automatically handles createdAt & updatedAt
    hooks: {
      beforeCreate: (domain) => {
        domain.domainId = 'dom_' + Math.random().toString(36).substring(2, 15);
        domain.authToken = 'tok_' + Math.random().toString(36).substring(2, 25) + Math.random().toString(36).substring(2, 25);
        domain.apiEndpoint = `https://api.server.com/chatbot/${domain.domainId}`;
      },
      beforeUpdate: (domain) => {
        domain.updatedAt = new Date();
      },
    },
  }
);

export default Domain;

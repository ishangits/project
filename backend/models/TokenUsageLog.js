import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import Domain from './Domain.js';

class TokenUsageLog extends Model {}

TokenUsageLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    domainId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Domain,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    tokensUsed: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
    requestType: { 
      type: DataTypes.ENUM('chat', 'kb_update', 'crawl', 'training'),
      defaultValue: 'chat'
    },
    cost: { type: DataTypes.DECIMAL(12, 6), allowNull: false, defaultValue: 0 },
    metadata: { 
      type: DataTypes.JSON, 
      defaultValue: { 
        userQuery: null,
        responseLength: null,
        sessionId: null,
        model: 'gpt-3.5-turbo'
      } 
    },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'TokenUsageLog',
    tableName: 'token_usage_logs',
    timestamps: true,
    hooks: {
      beforeCreate: (log) => {
        const costPer1K = parseFloat(process.env.TOKEN_COST_PER_1K) || 0.002;
        log.cost = (log.tokensUsed / 1000) * costPer1K;
      },
    },
  }
);

// Define association
TokenUsageLog.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

export default TokenUsageLog;

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';
import Domain from './Domain.js';

class KnowledgeBaseEntry extends Model {}

KnowledgeBaseEntry.init(
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
    type: { 
      type: DataTypes.ENUM('faq', 'manual', 'crawled', 'upload'),
      allowNull: false
    },
    question: { type: DataTypes.TEXT },
    answer: { type: DataTypes.TEXT },
    content: { type: DataTypes.TEXT },
    source: { type: DataTypes.STRING },
    metadata: { type: DataTypes.JSON, defaultValue: {} },
    status: { 
      type: DataTypes.ENUM('active', 'inactive', 'pending'), 
      defaultValue: 'active' 
    },
    tags: { type: DataTypes.JSON, defaultValue: [] },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'KnowledgeBaseEntry',
    tableName: 'knowledge_base_entries',
    timestamps: true,
    hooks: {
      beforeUpdate: (entry) => {
        entry.updatedAt = new Date();
      },
    },
  }
);

// Define association
KnowledgeBaseEntry.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

export default KnowledgeBaseEntry;

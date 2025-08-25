// import { DataTypes, Model } from 'sequelize';
// import { sequelize } from '../config/database.js';
// import Domain from './Domain.js';

// class Invoice extends Model {}

// Invoice.init(
//   {
//     id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
//     invoiceId: { type: DataTypes.STRING, allowNull: false, unique: true },
//     domainId: {
//       type: DataTypes.STRING(24),   // FIXED: match Domain.id
//       allowNull: false,
//       references: {
//         model: Domain,
//         key: 'id',
//       },
//       onDelete: 'CASCADE',
//     },
//     amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
//     currency: { 
//       type: DataTypes.ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD'), 
//       defaultValue: 'USD', 
//       allowNull: false 
//     },
//     status: { 
//       type: DataTypes.ENUM('pending', 'paid', 'failed', 'cancelled'), 
//       defaultValue: 'pending',
//       allowNull: false
//     },
//     issueDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
//     dueDate: { type: DataTypes.DATE, allowNull: false },
//     description: { type: DataTypes.TEXT },
//     metadata: { type: DataTypes.JSON, defaultValue: {} },
//     createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
//     updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
//   },
//   {
//     sequelize,
//     modelName: 'Invoice',
//     tableName: 'invoices',
//     timestamps: true,
//     hooks: {
//       beforeCreate: (invoice) => {
//         // Generate invoiceId
//         const timestamp = Date.now().toString().slice(-6);
//         const random = Math.random().toString(36).substring(2, 6).toUpperCase();
//         invoice.invoiceId = `INV-${timestamp}-${random}`;

//         // Set dueDate if not provided
//         if (!invoice.dueDate) {
//           invoice.dueDate = new Date(invoice.issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
//         }
//       },
//       beforeUpdate: (invoice) => {
//         invoice.updatedAt = new Date();
//       },
//     },
//   }
// );

// // Define association
// Invoice.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

// export default Invoice;

// import { DataTypes, Model } from 'sequelize';
// import bcrypt from 'bcryptjs';
// import { sequelize } from '../config/database.js';
// import { ObjectId } from 'bson';

// class Admin extends Model {
//   async comparePassword(password) {
//     return await bcrypt.compare(password, this.password);
//   }
// }

// Admin.init(
//   {
//     id: { 
//       type: DataTypes.INTEGER, 
//       autoIncrement: true, 
//       primaryKey: true 
//     },
//     email: { 
//       type: DataTypes.STRING, 
//       allowNull: false, 
//       unique: true, 
//       validate: { isEmail: true }
//     },
//     password: { 
//       type: DataTypes.STRING, 
//       allowNull: false, 
//       validate: { len: [6, 255] } 
//     },
//     name: { 
//       type: DataTypes.STRING, 
//       allowNull: false 
//     },
//     role: { 
//       type: DataTypes.ENUM('admin', 'super_admin'), 
//       defaultValue: 'admin' 
//     },
//     lastLogin: { 
//       type: DataTypes.DATE, 
//       allowNull: true 
//     },
//     // REMOVE the manual createdAt definition since timestamps: true handles it
//   },
//   {
//     sequelize,
//     modelName: 'Admin',
//     tableName: 'admins',
//     timestamps: true, // This automatically adds createdAt & updatedAt
//     hooks: {
//       beforeCreate: async (admin) => {
//         if (admin.password) {
//           const salt = await bcrypt.genSalt(10);
//           admin.password = await bcrypt.hash(admin.password, salt);
//         }
//       },
//       beforeUpdate: async (admin) => {
//         if (admin.changed('password')) {
//           const salt = await bcrypt.genSalt(10);
//           admin.password = await bcrypt.hash(admin.password, salt);
//         }
//       },
//     },
//   }
// );

// export default Admin;
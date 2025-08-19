import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database.js';

class Admin extends Model {
  // Instance method to compare password
  async comparePassword(password) {
    return await bcrypt.compare(password, this.password);
  }
}

Admin.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true, 
      validate: { isEmail: true }
    },
    password: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      validate: { len: [6, 255] } 
    },
    name: { type: DataTypes.STRING, allowNull: false },
    role: { 
      type: DataTypes.ENUM('admin', 'super_admin'), 
      defaultValue: 'admin' 
    },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    lastLogin: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Admin',
    tableName: 'admins',
    timestamps: true, // automatically adds createdAt & updatedAt
    hooks: {
      // Hash password before creating or updating
      beforeCreate: async (admin, options) => {
        if (admin.password) {
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash(admin.password, salt);
        }
      },
      beforeUpdate: async (admin, options) => {
        if (admin.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash(admin.password, salt);
        }
      },
    },
  }
);

export default Admin;

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../modules/user/user.model';
import { UserRole, UpgradeStatus } from '../modules/user/user.types';
import { connectDatabase } from '../config/database';
import { logger } from '../config/logger';

const seedAdmin = async () => {
  try {
    await connectDatabase();

    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'Admin@1234';

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      logger.info('Admin user already exists. Updating password and ensuring role...');
      const salt = await bcrypt.genSalt(10);
      existingAdmin.passwordHash = await bcrypt.hash(adminPassword, salt);
      existingAdmin.role = UserRole.ADMIN;
      existingAdmin.isVerified = true;
      existingAdmin.upgradeStatus = UpgradeStatus.NONE;
      await existingAdmin.save();
      logger.info('Admin user updated successfully');
    } else {
      logger.info('Creating new admin user...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      const newAdmin = new User({
        name: 'System Admin',
        email: adminEmail,
        passwordHash,
        role: UserRole.ADMIN,
        isVerified: true,
        upgradeStatus: UpgradeStatus.NONE,
      });

      await newAdmin.save();
      logger.info('Admin user created successfully');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();

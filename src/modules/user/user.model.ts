import mongoose, { Schema } from 'mongoose';
import { IUser, UserRole, UpgradeStatus } from './user.types';

export { IUser, UserRole, UpgradeStatus };

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: UserRole, default: UserRole.ATTENDEE },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
    refreshTokens: { type: [String], default: [] },
    
    upgradeStatus: { type: String, enum: UpgradeStatus, default: UpgradeStatus.NONE },
    upgradeRequestDate: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);

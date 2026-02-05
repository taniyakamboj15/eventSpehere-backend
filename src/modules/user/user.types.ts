import { Document } from 'mongoose';

export enum UserRole {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  ATTENDEE = 'ATTENDEE',
}

export enum UpgradeStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  refreshTokens: string[];
  
  upgradeStatus: UpgradeStatus;
  upgradeRequestDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

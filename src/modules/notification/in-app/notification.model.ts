import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
    COMMUNITY_INVITE = 'COMMUNITY_INVITE',
    EVENT_INVITE = 'EVENT_INVITE',
    GENERAL = 'GENERAL'
}

export enum NotificationStatus {
    PENDING = 'PENDING', // User not yet registered
    DELIVERED = 'DELIVERED', // User exists, notification available
    READ = 'READ'
}

export interface INotification extends Document {
    recipient?: mongoose.Types.ObjectId;
    recipientEmail: string; // Required for handling unregistered users
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    isRead: boolean;
    status: NotificationStatus;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
    recipient: { type: Schema.Types.ObjectId, ref: 'User' },
    recipientEmail: { type: String, required: true, index: true }, 
    type: { type: String, enum: NotificationType, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    status: { type: String, enum: NotificationStatus, default: NotificationStatus.DELIVERED }
}, { timestamps: true });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);

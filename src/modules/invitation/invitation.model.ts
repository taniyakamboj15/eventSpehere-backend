import mongoose, { Schema } from 'mongoose';
import { IInvitation, InvitationStatus } from './invitation.types';

export { IInvitation, InvitationStatus };

const invitationSchema = new Schema<IInvitation>({
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    email: { type: String, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: InvitationStatus, default: InvitationStatus.PENDING },
    token: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

invitationSchema.index({ event: 1, email: 1 }, { unique: true });
invitationSchema.index({ event: 1, userId: 1 });
invitationSchema.index({ email: 1 });
invitationSchema.index({ userId: 1 });

export const Invitation = mongoose.model<IInvitation>('Invitation', invitationSchema);

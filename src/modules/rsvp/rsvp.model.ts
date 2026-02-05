import mongoose, { Schema } from 'mongoose';
import { IRsvp, RsvpStatus } from './rsvp.types';

export { IRsvp, RsvpStatus };

const rsvpSchema = new Schema<IRsvp>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: RsvpStatus, required: true },
    ticketCode: { type: String, unique: true, sparse: true },
    checkedIn: { type: Boolean, default: false },
}, { timestamps: true });

rsvpSchema.index({ user: 1, event: 1 }, { unique: true });

export const Rsvp = mongoose.model<IRsvp>('Rsvp', rsvpSchema);

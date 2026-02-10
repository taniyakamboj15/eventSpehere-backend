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

// Indexes for performance optimization
rsvpSchema.index({ user: 1, event: 1 }, { unique: true }); // Prevent duplicate RSVPs
rsvpSchema.index({ event: 1, status: 1 }); // Event attendee list by status
rsvpSchema.index({ user: 1, status: 1 }); // User's RSVPs by status
rsvpSchema.index({ ticketCode: 1 }, { sparse: true }); // Ticket lookup
rsvpSchema.index({ event: 1, checkedIn: 1 }); // Check-in status

export const Rsvp = mongoose.model<IRsvp>('Rsvp', rsvpSchema);

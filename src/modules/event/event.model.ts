import mongoose, { Schema } from 'mongoose';
import { IEvent, EventCategory, EventVisibility, RecurringRule } from './event.types';

export { IEvent, EventCategory, EventVisibility, RecurringRule };

const eventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: EventCategory, required: true },
  visibility: { type: String, enum: EventVisibility, default: EventVisibility.PUBLIC },
  organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  community: { type: Schema.Types.ObjectId, ref: 'Community' },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  location: {
    address: { type: String, required: true },
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  capacity: { type: Number, required: true, min: 1 },
  attendeeCount: { type: Number, default: 0 },
  recurringRule: { type: String, enum: RecurringRule, default: RecurringRule.NONE },
  photos: [String],
}, { timestamps: true });

// Indexes for performance optimization
eventSchema.index({ location: '2dsphere' }); // Geospatial queries
eventSchema.index({ startDateTime: 1 }); // Sort by date
eventSchema.index({ organizer: 1 }); // Filter by organizer
eventSchema.index({ community: 1 }); // Filter by community
eventSchema.index({ recurringRule: 1 }); // Filter recurring events

// Compound indexes for common query patterns
eventSchema.index({ organizer: 1, startDateTime: -1 }); // Organizer's events by date
eventSchema.index({ community: 1, startDateTime: -1 }); // Community events by date
eventSchema.index({ category: 1, startDateTime: 1 }); // Events by category and date
eventSchema.index({ visibility: 1, startDateTime: 1 }); // Public events by date
eventSchema.index({ startDateTime: 1, attendeeCount: -1 }); // Popular upcoming events

// Text search index for title and description
eventSchema.index({ title: 'text', description: 'text' });

export const Event = mongoose.model<IEvent>('Event', eventSchema);

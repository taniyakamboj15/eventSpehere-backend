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

eventSchema.index({ location: '2dsphere' });
eventSchema.index({ startDateTime: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ community: 1 });

export const Event = mongoose.model<IEvent>('Event', eventSchema);

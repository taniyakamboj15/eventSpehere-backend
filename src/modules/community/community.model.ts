import mongoose, { Schema } from 'mongoose';
import { ICommunity, CommunityType } from './community.types';

export { ICommunity, CommunityType };

const communitySchema = new Schema<ICommunity>({
    name: { type: String, required: true },
    type: { type: String, enum: CommunityType, required: true },
    description: { type: String },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
    },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Indexes for performance optimization
communitySchema.index({ location: '2dsphere' }); // Geospatial queries
communitySchema.index({ name: 1 }); // Search by name
communitySchema.index({ type: 1 }); // Filter by type
communitySchema.index({ members: 1 }); // Member lookup
communitySchema.index({ admins: 1 }); // Admin lookup

// Text search index
communitySchema.index({ name: 'text', description: 'text' });

export const Community = mongoose.model<ICommunity>('Community', communitySchema);

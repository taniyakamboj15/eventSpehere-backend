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

communitySchema.index({ location: '2dsphere' });

export const Community = mongoose.model<ICommunity>('Community', communitySchema);

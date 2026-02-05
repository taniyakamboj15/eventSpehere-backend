import { Document, Types } from 'mongoose';

export enum CommunityType {
    NEIGHBORHOOD = 'NEIGHBORHOOD',
    HOBBY = 'HOBBY',
    BUSINESS = 'BUSINESS',
}

export interface ICommunity extends Document {
    name: string;
    type: CommunityType;
    description: string;
    location: {
        type: 'Point';
        coordinates: number[]; // [longitude, latitude]
    };
    members: Types.ObjectId[];
    admins: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

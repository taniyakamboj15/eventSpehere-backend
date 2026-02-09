import { Document, Types } from 'mongoose';

export enum InvitationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    DECLINED = 'DECLINED',
}

export interface IInvitation extends Document {
    event: Types.ObjectId;
    email: string;
    invitedBy: Types.ObjectId;
    status: InvitationStatus;
    token: string;
    userId?: Types.ObjectId; 
    createdAt: Date;
    updatedAt: Date;
}

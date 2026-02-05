import { Document, Types } from 'mongoose';

export enum RsvpStatus {
    GOING = 'GOING',
    MAYBE = 'MAYBE',
    NOT_GOING = 'NOT_GOING'
}

export interface IRsvp extends Document {
    user: Types.ObjectId;
    event: Types.ObjectId;
    status: RsvpStatus;
    ticketCode?: string;
    checkedIn: boolean;
    createdAt: Date;
    updatedAt: Date;
}

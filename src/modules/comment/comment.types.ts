import { Document, Types } from 'mongoose';

export interface IComment extends Document {
    user: Types.ObjectId;
    event: Types.ObjectId;
    message: string;
    parentId?: Types.ObjectId | null;
    replies?: IComment[];
    createdAt: Date;
    updatedAt: Date;
}

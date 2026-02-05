import mongoose, { Schema } from 'mongoose';
import { IComment } from './comment.types';

export { IComment };

const commentSchema = new Schema<IComment>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    message: { type: String, required: true },
}, { timestamps: true });

export const Comment = mongoose.model<IComment>('Comment', commentSchema);

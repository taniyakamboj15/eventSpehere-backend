import { Comment } from './comment.model';
import { IComment } from './comment.types';

export class CommentService {
    async create(data: Partial<IComment>) {
        const comment = await Comment.create(data);
        return comment.populate('user', 'name');
    }

    async delete(commentId: string, userId: string, userRole: string) {
        const comment = await Comment.findById(commentId);
        if (!comment) return null; // Or throw error

        const { Event } = await import('../event/event.model');
        const event = await Event.findById(comment.event);

        const isAuthor = comment.user.toString() === userId;
        const isAdmin = userRole === 'ADMIN';
        const isOrganizer = event && event.organizer.toString() === userId;

        if (!isAuthor && !isAdmin && !isOrganizer) {
            throw new Error('Unauthorized to delete this comment');
        }

        await comment.deleteOne();
        return true;
    }

    async getByEvent(eventId: string, page: number = 1, limit: number = 20) {
        // Fetch all comments for this event to build a tree efficiently
        // In a very large app, you might want to only fetch top level and load replies on demand
        const allComments = await Comment.find({ event: eventId })
            .sort('createdAt')
            .populate('user', 'name');

        const commentMap = new Map();
        type ICommentWithReplies = ReturnType<typeof allComments[0]['toObject']> & { replies: ICommentWithReplies[] };
        const topLevelComments: ICommentWithReplies[] = [];

        allComments.forEach(comment => {
            const commentObj = { ...comment.toObject(), replies: [] };
            commentMap.set(comment._id.toString(), commentObj);
        });

        allComments.forEach(comment => {
            const commentObj = commentMap.get(comment._id.toString());
            if (comment.parentId) {
                const parent = commentMap.get(comment.parentId.toString());
                if (parent) {
                    parent.replies.push(commentObj);
                } else {
                    // Parent might be deleted or from another event (shouldn't happen)
                    topLevelComments.push(commentObj);
                }
            } else {
                topLevelComments.push(commentObj);
            }
        });

        // Apply pagination to top-level comments
        const total = topLevelComments.length;
        const startIndex = (page - 1) * limit;
        const paginatedComments = topLevelComments
            .reverse() // Most recent first for top level
            .slice(startIndex, startIndex + limit);

        return {
            comments: paginatedComments,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalComments: total
        };
    }
}

export const commentService = new CommentService();

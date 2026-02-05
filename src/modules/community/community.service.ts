import { Document, Types } from 'mongoose';
import { Community } from './community.model';
import { ICommunity } from './community.types';
import { AppError } from '../../common/errors/app-error';
import { notificationService } from '../notification/in-app/notification.service';
import { NotificationType } from '../notification/in-app/notification.model';
import { User } from '../user/user.model';

export class CommunityService {
    async create(data: Partial<ICommunity>, creatorId: string) {
        const community = await Community.create({
            ...data,
            admins: [creatorId],
            members: [creatorId],
        });
        return community;
    }

    async join(communityId: string, userId: string) {
        const community = await Community.findById(communityId);
        if (!community) {
            throw new AppError('Community not found', 404);
        }
        if (community.members.map(m => m.toString()).includes(userId)) {
            throw new AppError('Already a member', 400);
        }

        community.members.push(new Types.ObjectId(userId));
        await community.save();
        return community;
    }

    async leave(communityId: string, userId: string) {
        const community = await Community.findById(communityId);
        if (!community) {
            throw new AppError('Community not found', 404);
        }
        
        const memberIndex = community.members.findIndex((m: Types.ObjectId) => m.toString() === userId);
        if (memberIndex === -1) {
            throw new AppError('Not a member of this community', 400);
        }

        community.members.splice(memberIndex, 1);
        
        // Should also remove from admins if present
        const adminIndex = community.admins.findIndex((a: Types.ObjectId) => a.toString() === userId);
        if (adminIndex !== -1) {
            community.admins.splice(adminIndex, 1);
        }

        await community.save();
        return community;
    }

    async getMembers(communityId: string) {
        const community = await Community.findById(communityId).populate('members', 'name email').populate('admins', 'name email');
        if (!community) {
            throw new AppError('Community not found', 404);
        }
        return {
            members: community.members,
            admins: community.admins
        };
    }

    async removeMember(communityId: string, memberId: string, activeUserId: string) {
        const community = await Community.findById(communityId);
        if (!community) {
            throw new AppError('Community not found', 404);
        }
        
        // Check if activeUser is admin
        if (!community.admins.some((a: Types.ObjectId) => a.toString() === activeUserId)) {
            throw new AppError('Only admins can remove members', 403);
        }

        const memberIndex = community.members.findIndex((m: Types.ObjectId) => m.toString() === memberId);
        if (memberIndex !== -1) {
            community.members.splice(memberIndex, 1);
        }
        
        const adminIndex = community.admins.findIndex((a: Types.ObjectId) => a.toString() === memberId);
        if (adminIndex !== -1) {
            community.admins.splice(adminIndex, 1);
        }

        await community.save();
        return community;
    }

    async inviteMember(communityId: string, email: string, invitedByUserId: string) {
        const community = await Community.findById(communityId);
        if (!community) throw new AppError('Community not found', 404);

        if (!community.admins.some((a: Types.ObjectId) => a.toString() === invitedByUserId)) {
            throw new AppError('Only admins can invite members', 403);
        }

        // 1. Send Email (Generic or specific template)
        try {
            const { sendCommunityInviteEmail } = await import('../notification/notification.queue');
            const inviter = await User.findById(invitedByUserId);
            await sendCommunityInviteEmail(email, community.name, inviter?.name || 'An Admin');
        } catch (e) {
            console.error('Failed to send invite email', e);
        }

        // 2. Create In-App Notification
        const inviter = await User.findById(invitedByUserId);
        await notificationService.create(
            email,
            NotificationType.COMMUNITY_INVITE,
            `Invitation to join ${community.name}`,
            `${inviter?.name} invited you to join the community "${community.name}".`,
            { communityId: community._id }
        );

        return { success: true, message: `Invitation sent to ${email}` };
    }

    async getAll(longitude?: number, latitude?: number, maxDistanceInMeters = 5000) {
        if (longitude && latitude) {
            return Community.find({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude],
                        },
                        $maxDistance: maxDistanceInMeters,
                    },
                },
            });
        }
        return Community.find().sort('-createdAt');
    }
    async getAllByMember(userId: string) {
        return Community.find({ members: userId }).sort('-createdAt');
    }
    async isMember(communityId: string, userId: string): Promise<boolean> {
        if (!userId) return false;
        const community = await Community.findById(communityId);
        if (!community) return false;
        return community.members.map(m => m.toString()).includes(userId);
    }
}

export const communityService = new CommunityService();

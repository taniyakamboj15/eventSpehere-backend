import { Invitation, InvitationStatus } from './invitation.model';
import { User } from '../user/user.model';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../config/logger';

export class InvitationService {
    async inviteUsers(eventId: string, emails: string[], invitedByUserId: string) {
        if (!emails || emails.length === 0) return;

        const invitationsToCreate = [];
        
        // Optimize: Bulk find existing users
        const existingUsers = await User.find({ email: { $in: emails } });
        const emailToUserIdMap = new Map(existingUsers.map(u => [u.email, u._id]));

        for (const email of emails) {
            const normalizedEmail = email.trim().toLowerCase();
        
            const existingInvite = await Invitation.findOne({ event: eventId, email: normalizedEmail });
            if (!existingInvite) {
                await Invitation.create({
                    event: eventId,
                    email: normalizedEmail,
                    invitedBy: invitedByUserId,
                    token: uuidv4(),
                    userId: emailToUserIdMap.get(normalizedEmail) || undefined
                });
                
                try {
                    const { sendInvitationEmail } = await import('../notification/notification.queue');
                
                    const { Event } = await import('../event/event.model');
                    const { User } = await import('../user/user.model');
                    
                    const eventDoc = await Event.findById(eventId).select('title');
                    const inviterDoc = await User.findById(invitedByUserId).select('name');
                    
                    if (eventDoc && inviterDoc) {
                        await sendInvitationEmail(
                            normalizedEmail,
                            'Guest', // We don't know the name of the invited person usually if they are not signed up, or we could check existingUsers map
                            inviterDoc.name,
                            eventDoc.title,
                            eventId
                        );
                    }
                } catch (e) {
                     logger.error(`Failed to queue invitation email for ${normalizedEmail}`, e);
                }
            }
        }
    }

    async getUserInvitations(userId: string) {
        // Find invitations linked to userId OR email (if we had email in session context, but usually userId is enough if we link it on signup/signin or invite creation)
        return Invitation.find({ userId }).populate('event').populate('invitedBy', 'name');
    }

    async getEventInvitations(eventId: string) {
        return Invitation.find({ event: eventId });
    }
}

export const invitationService = new InvitationService();

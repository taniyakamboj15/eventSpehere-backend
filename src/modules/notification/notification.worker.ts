import { Worker } from 'bullmq';
import { redisConnection } from '../../config/redis';
import { rsvpService } from '../rsvp/rsvp.service';
import { logger } from '../../config/logger';
import QRCode from 'qrcode';
import { IUser } from '../user/user.types';

import { emailService } from '../../services/email.service';
import { Event } from '../event/event.model';

export const notificationWorker = new Worker('email-notifications', async job => {
    if (job.name === 'event-update') {
        const { eventId, changes } = job.data;
        
    
        const event = await Event.findById(eventId);
        if (!event) return;

        const attendees = await rsvpService.getAttendees(eventId);
        
        logger.info(`[Event Update] Fanning out ${attendees.length} emails for event ${eventId}`);
        

        const { sendEventUpdateEmailSingle } = await import('./notification.queue');
        
        const batchSize = 50;
        for (let i = 0; i < attendees.length; i += batchSize) {
            const batch = attendees.slice(i, i + batchSize);
            await Promise.all(batch.map(async (attendee) => {
                const user = attendee.user as unknown as IUser;
                if (user && user.email) {
                    await sendEventUpdateEmailSingle(user.email, user.name, event.title, changes, eventId);
                }
            }));
        }
    } else if (job.name === 'event-update-single') {
        const { email, name, eventTitle, changes, eventId } = job.data;
        await emailService.sendEventUpdateEmail(email, name, eventTitle, changes, eventId);
        logger.info(`[Email Sent] Event Update to ${email}`);
    } else if (job.name === 'rsvp-confirmation') {
        const { email, name, eventTitle, ticketCode } = job.data;
        
        let qrCodeData: string | undefined;
        if (ticketCode) {
            try {
                qrCodeData = await QRCode.toDataURL(ticketCode);
            } catch (err) {
                logger.error(`Failed to generate QR code for ${ticketCode}`, err);
            }
        }

        await emailService.sendRsvpConfirmationEmail(email, name, eventTitle, ticketCode, qrCodeData);
        logger.info(`[Email Sent] RSVP Confirmation to ${email} for ${eventTitle}`);
    } else if (job.name === 'welcome') {
        const { email, name } = job.data;
        await emailService.sendWelcomeEmail(email, name);
        logger.info(`[Email Sent] Welcome to ${email}`);
    } else if (job.name === 'verification') {
        const { email, name, token } = job.data;
        await emailService.sendVerificationEmail(email, name, token);
        logger.info(`[Email Sent] Verification to ${email}`);
    } else if (job.name === 'invitation') {
        const { email, name, inviterName, eventTitle, eventId } = job.data;
        await emailService.sendInvitationEmail(email, name, inviterName, eventTitle, eventId);
        logger.info(`[Email Sent] Invitation to ${email} for ${eventTitle}`);
    } else if (job.name === 'recurring-created') {
        const { email, name, eventTitle, date } = job.data;
        await emailService.sendRecurringEventCreatedEmail(email, name, eventTitle, date);
        logger.info(`[Email Sent] Recurring Event Notification to ${email}`);
    } else if (job.name === 'community-event-new') {
        const { communityId, eventId, eventTitle } = job.data;
        
        try {
            const { Community } = await import('../community/community.model');
            const community = await Community.findById(communityId).populate('members');
            
            if (community && community.members && community.members.length > 0) {
                 for (const member of community.members) {
                     const user = member as unknown as IUser; 
                     if (user.email && user.name) {
                         await emailService.sendCommunityEventEmail(user.email, user.name, community.name, eventTitle, eventId);
                         logger.info(`[Email Sent] Community Event Notification to ${user.email}`); 
                     }
                 }
            }
        } catch (error) {
            logger.error(`Failed to process community event notification for event ${eventId}`, error);
        }
    } else if (job.name === 'community-invite') {
        const { email, communityName, inviterName } = job.data;
        await emailService.sendCommunityInviteEmail(email, communityName, inviterName);
        logger.info(`[Email Sent] Community Invitation to ${email}`);
    }
}, { connection: redisConnection });

notificationWorker.on('completed', job => {
    logger.info(`Notification job ${job.id} completed`);
});

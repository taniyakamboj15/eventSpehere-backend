import { Worker } from 'bullmq';
import { redisConnection } from '../../config/redis';
import { rsvpService } from '../rsvp/rsvp.service';
import { logger } from '../../config/logger';
import QRCode from 'qrcode';
import { IUser } from '../user/user.types';

import { emailService } from '../../services/email.service';
import { Event } from '../event/event.model';
import { sendEventUpdateEmailSingle } from './notification.queue';
import { Community } from '../community/community.model';

const notificationHandlers: Record<string, (data: any) => Promise<void>> = {
    'event-update': async ({ eventId, changes }) => {
        const event = await Event.findById(eventId);
        if (!event) return;

        const attendees = await rsvpService.getAttendees(eventId);
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
    },
    'event-update-single': async ({ email, name, eventTitle, changes, eventId }) => {
        await emailService.sendEventUpdateEmail(email, name, eventTitle, changes, eventId);
        logger.info(`[Email Sent] Event Update to ${email}`);
    },
    'rsvp-confirmation': async ({ email, name, eventTitle, ticketCode }) => {
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
    },
    'welcome': async ({ email, name }) => {
        await emailService.sendWelcomeEmail(email, name);
        logger.info(`[Email Sent] Welcome to ${email}`);
    },
    'verification': async ({ email, name, token }) => {
        await emailService.sendVerificationEmail(email, name, token);
        logger.info(`[Email Sent] Verification to ${email}`);
    },
    'invitation': async ({ email, name, inviterName, eventTitle, eventId }) => {
        await emailService.sendInvitationEmail(email, name, inviterName, eventTitle, eventId);
        logger.info(`[Email Sent] Invitation to ${email} for ${eventTitle}`);
    },
    'recurring-created': async ({ email, name, eventTitle, date }) => {
        await emailService.sendRecurringEventCreatedEmail(email, name, eventTitle, date);
        logger.info(`[Email Sent] Recurring Event Notification to ${email}`);
    },
    'community-event-new': async ({ communityId, eventId, eventTitle }) => {
        try {
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
    },
    'community-invite': async ({ email, communityName, inviterName }) => {
        await emailService.sendCommunityInviteEmail(email, communityName, inviterName);
        logger.info(`[Email Sent] Community Invitation to ${email}`);
    }
};

export const notificationWorker = new Worker('email-notifications', async job => {
    const handler = notificationHandlers[job.name];
    if (handler) {
        await handler(job.data);
    } else {
        logger.warn(`No handler found for job: ${job.name}`);
    }
}, { connection: redisConnection });

notificationWorker.on('completed', job => {
    logger.info(`Notification job ${job.id} completed`);
});

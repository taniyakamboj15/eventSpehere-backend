import { Queue } from 'bullmq';
import { redisConnection } from '../../config/redis';

interface JobData {
    email?: string;
    name?: string;
    [key: string]: unknown;
}

interface EventUpdateData {
    eventId: string;
    changes: Record<string, { old: Date | string, new: Date | string }>;
}

export const notificationQueue = new Queue('email-notifications', {
    connection: redisConnection,
});

export const sendEventUpdateEmail = async (eventId: string, changes: Record<string, { old: Date | string, new: Date | string }>) => {
    await notificationQueue.add('event-update', { eventId, changes });
};

export const sendEventUpdateEmailSingle = async (email: string, name: string, eventTitle: string, changes: Record<string, { old: Date | string, new: Date | string }>, eventId: string) => {
    await notificationQueue.add('event-update-single', { email, name, eventTitle, changes, eventId }, {
        removeOnComplete: true,
        removeOnFail: 100 // Keep last 100 failed for debugging
    });
};

export const sendRsvpConfirmation = async (email: string, name: string, eventTitle: string, ticketCode?: string) => {
    await notificationQueue.add('rsvp-confirmation', { email, name, eventTitle, ticketCode });
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    await notificationQueue.add('welcome', { email, name });
};

export const sendVerificationEmail = async (email: string, name: string, token: string) => {
    await notificationQueue.add('verification', { email, name, token });
};

export const sendInvitationEmail = async (email: string, name: string, inviterName: string, eventTitle: string, eventId: string) => {
    await notificationQueue.add('invitation', { email, name, inviterName, eventTitle, eventId });
};

export const sendRecurringEventCreatedEmail = async (email: string, name: string, eventTitle: string, date: string) => {
    await notificationQueue.add('recurring-created', { email, name, eventTitle, date });
};

export const sendNewCommunityEventEmail = async (communityId: string, eventId: string, eventTitle: string) => {
    await notificationQueue.add('community-event-new', { communityId, eventId, eventTitle });
};

export const sendCommunityInviteEmail = async (email: string, communityName: string, inviterName: string) => {
    await notificationQueue.add('community-invite', { email, communityName, inviterName });
};

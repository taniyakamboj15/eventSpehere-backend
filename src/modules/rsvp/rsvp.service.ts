import { Rsvp, IRsvp } from './rsvp.model';
import { RsvpStatus } from './rsvp.types';
import { Event } from '../event/event.model';
import { AppError, ForbiddenError } from '../../common/errors/app-error';
import { communityService } from '../community/community.service';
import { Invitation } from '../invitation/invitation.model';
import { sendRsvpConfirmation } from '../notification/notification.queue';
import { User } from '../user/user.model';
import { Community } from '../community/community.model';
import { v4 as uuidv4 } from 'uuid';

export class RsvpService {
    async createOrUpdate(eventId: string, userId: string, status: RsvpStatus) {
        const event = await Event.findById(eventId);
        if (!event) throw new AppError('Event not found', 404);

        const existingRsvp = await Rsvp.findOne({ event: eventId, user: userId });
        const oldStatus = existingRsvp?.status;

        if (existingRsvp && oldStatus === status) {
            return existingRsvp;
        }

        // Validate Access
        const visibilityValidators: Record<string, () => Promise<void>> = {
            'COMMUNITY_ONLY': async () => {
                if (!event.community) throw new AppError('Community event missing community ID', 500);
                const isMember = await communityService.isMember(event.community.toString(), userId);
                if (!isMember) throw new ForbiddenError('You must be a member of the community to join this event');
            },
            'PRIVATE_INVITE': async () => {
                if (event.organizer.toString() !== userId) {
                    const invitation = await Invitation.findOne({ event: eventId, userId });
                    if (!invitation) throw new ForbiddenError('This is a private event. You must be invited to join.');
                }
            },
            'PUBLIC': async () => {} // No validation needed for public events
        };

        const validator = visibilityValidators[event.visibility];
        if (validator) {
            await validator();
        }

        if (status === RsvpStatus.GOING) {
            if (oldStatus !== RsvpStatus.GOING) {
                const updatedEvent = await Event.findOneAndUpdate(
                    { _id: eventId, attendeeCount: { $lt: event.capacity } },
                    { $inc: { attendeeCount: 1 } },
                    { new: true }
                );
                
                if (!updatedEvent) {
                    throw new AppError('Event is full', 400);
                }
            }
        } else {
            if (oldStatus === RsvpStatus.GOING) {
                await Event.findByIdAndUpdate(eventId, { $inc: { attendeeCount: -1 } });
            }
        }

        let rsvp;

        if (existingRsvp) {
            existingRsvp.status = status;
            await existingRsvp.save();
            rsvp = existingRsvp;
        } else {
            // Generate simple unique ticket code
            rsvp = await Rsvp.create({ event: eventId, user: userId, status, ticketCode: uuidv4() });
        }

        // Send Confirmation Email if GOING
        if (status === RsvpStatus.GOING && (oldStatus !== RsvpStatus.GOING)) {
            try {
                const userDoc = await User.findById(userId);
                
                if (userDoc) {
                    await sendRsvpConfirmation(
                        userDoc.email, 
                        userDoc.name, 
                        event.title, 
                        rsvp.ticketCode || undefined
                    );
                }
            } catch (error) {
                // Non-blocking error for email
                console.error('Failed to queue RSVP confirmation email', error);
            }
        }

        return rsvp;
    }

    async getAttendees(eventId: string) {
        return Rsvp.find({ event: eventId, status: RsvpStatus.GOING }).populate('user', 'name email');
    }

    async checkIn(eventId: string, identifiers: { userId?: string, ticketCode?: string }, organizerId: string) {
        const event = await Event.findById(eventId);
        if (!event) throw new AppError('Event not found', 404);
        
        let hasPermission = event.organizer.toString() === organizerId;
        if (!hasPermission && event.community) {
             const comm = await Community.findById(event.community);
             if (comm && comm.admins.map(String).includes(organizerId)) {
                 hasPermission = true;
             }
        }

        if (!hasPermission) {
             throw new ForbiddenError('Only organizer or community admin can check in attendees');
        }

        let rsvp;
        const lookupStrategies: Array<[keyof typeof identifiers, () => Promise<IRsvp | null>]> = [
            ['ticketCode', () => Rsvp.findOne({ ticketCode: identifiers.ticketCode })],
            ['userId', () => Rsvp.findOne({ event: eventId, user: identifiers.userId })]
        ];

        for (const [key, strategy] of lookupStrategies) {
            if (identifiers[key]) {
                rsvp = await strategy();
                if (rsvp) break;
            }
        }

        if (!rsvp) {
            throw new AppError('RSVP not found', 404);
        }

        if (rsvp.event.toString() !== eventId) {
             throw new AppError('Ticket is for a different event', 400);
        }

        if (rsvp.status !== RsvpStatus.GOING) {
            throw new AppError('User is not marked as GOING', 400);
        }

        if (rsvp.checkedIn) {
             throw new AppError('User is already checked in', 400);
        }

        rsvp.checkedIn = true;
        await rsvp.save();
        return rsvp;
    }

    async getUserRsvps(userId: string) {
        return Rsvp.find({ user: userId })
            .populate('event') // Populate full event details
            .sort({ createdAt: -1 });
    }
}

export const rsvpService = new RsvpService();

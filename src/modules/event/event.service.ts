import { Event } from './event.model';
import { IEvent, EventVisibility, IEventFilters } from './event.types';
import { AppError, ForbiddenError } from '../../common/errors/app-error';
import { FilterQuery } from 'mongoose';
import { invitationService } from '../invitation/invitation.service';
import { Community } from '../community/community.model';
import { Invitation } from '../invitation/invitation.model';
import { User } from '../user/user.model';
import { Rsvp } from '../rsvp/rsvp.model';
import { sendNewCommunityEventEmail, sendEventUpdateEmail } from '../notification/notification.queue';

export class EventService {
    async create(data: Partial<IEvent>, userId: string, inviteEmails?: string[]) {
        const event = await Event.create({
            ...data,
            organizer: userId,
        });

        if (inviteEmails && inviteEmails.length > 0) {
            await invitationService.inviteUsers(event._id.toString(), inviteEmails, userId);
        }

        // Send Community Notification
        if (event.community) {
             try {
                 await sendNewCommunityEventEmail(event.community.toString(), event._id.toString(), event.title);
             } catch (e) {
                 console.error('Failed to queue community event email', e);
             }
        }

        return event;
    }

    async getEvents(filters: IEventFilters, userId?: string) {
        const query: FilterQuery<IEvent> = {};
        const now = new Date();

        if (filters.time === 'PAST') {
            query.endDateTime = { $lt: now };
        } else if (filters.time !== 'ALL') {
            // Default to upcoming unless 'ALL' is specified
            query.startDateTime = { $gte: now };
        }

        if (filters.category) {
            query.category = filters.category;
        }

        if (filters.lat && filters.lng) {
            query.location = {
                $geoWithin: {
                    $centerSphere: [
                        [parseFloat(filters.lng), parseFloat(filters.lat)],
                        (parseFloat(filters.radius || '10') || 10) / 6378.1 // radius in km converted to radians
                    ]
                }
            };
        } else if (filters.latitude && filters.longitude) {
             query.location = {
                $geoWithin: {
                    $centerSphere: [
                        [parseFloat(filters.longitude), parseFloat(filters.latitude)],
                        10 / 6378.1 // Default 10km in radians
                    ]
                }
            };
        }

        const visibilityConditions: FilterQuery<IEvent>[] = [{ visibility: EventVisibility.PUBLIC }];

        if (userId) {
            // Lazy load dependencies removed (moved to top)

            const userCommunities = await Community.find({ members: userId }).select('_id');
            const communityIds = userCommunities.map(c => c._id);

            if (communityIds.length > 0) {
                 visibilityConditions.push({
                     visibility: EventVisibility.COMMUNITY_ONLY,
                     community: { $in: communityIds }
                 });
            }
         
            const currentUser = await User.findById(userId).select('email');
            const userEmail = currentUser?.email;

            const invitationQuery: { $or: Array<{ userId?: string; email?: string }> } = { $or: [{ userId: userId }] };
            if (userEmail) {
                invitationQuery.$or.push({ email: userEmail });
            }

            const userInvitations = await Invitation.find(invitationQuery).select('event');
            const invitedEventIds = userInvitations.map(i => i.event);
            
            if (invitedEventIds.length > 0) {
                visibilityConditions.push({
                    _id: { $in: invitedEventIds }
                });
            }
            
            visibilityConditions.push({ organizer: userId });
        }
        
        let organizerQuery: FilterQuery<IEvent> = {};
        if (filters.organizer) {
            if (userId && filters.organizer === userId) {
                 const adminCommunities = await Community.find({ admins: userId }).select('_id');
                 const adminCommunityIds = adminCommunities.map(c => c._id);
                 
                 organizerQuery = {
                     $or: [
                         { organizer: userId },
                         { community: { $in: adminCommunityIds } }
                     ]
                 };
            } else {
                organizerQuery.organizer = filters.organizer;
            }
        }

        query.$and = [];
        if (Object.keys(organizerQuery).length > 0) {
            query.$and.push(organizerQuery);
        }
        query.$and.push({ $or: visibilityConditions });

        const page = parseInt(filters.page as string) || 1;
        const limit = parseInt(filters.limit as string) || 20; // Default limit
        const skip = (page - 1) * limit;

        const events = await Event.find(query)
            .sort('startDateTime')
            .skip(skip)
            .limit(limit)
            .populate('organizer', 'name');
            
        const total = await Event.countDocuments(query);
        
        return {
            data: events,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getById(id: string) {
        return Event.findById(id).populate('organizer', 'name').populate('community');
    }

    // Adding this helper method to keep service logic clean
    async getUserEventRsvp(eventId: string, userId: string) {
        return Rsvp.findOne({ event: eventId, user: userId });
    }

    async update(id: string, userId: string, data: Partial<IEvent>) {
        const event = await Event.findById(id);
        if (!event) throw new AppError('Event not found', 404);
        
        let hasPermission = event.organizer.toString() === userId;
        if (!hasPermission && event.community) {
             const comm = await Community.findById(event.community);
             if (comm && comm.admins.map(a => a.toString()).includes(userId)) hasPermission = true;
        }

        if (!hasPermission) {
            throw new ForbiddenError('Only organizer or community admin can update event');
        }

        const originalStart = new Date(event.startDateTime).getTime();
        const originalLocation = event.location?.address;

        Object.assign(event, data);
        await event.save();

        // Check for critical updates
        if (data.startDateTime || data.location) {
            const newStart = new Date(event.startDateTime).getTime();
            const newLocation = event.location?.address;

            if (originalStart !== newStart || originalLocation !== newLocation) {
                try {
                    const changes: Record<string, { old: Date | string, new: Date | string }> = {};
                    if (originalStart !== newStart) {
                        changes.time = { old: new Date(originalStart), new: new Date(newStart) };
                    }
                    if (originalLocation !== newLocation) {
                        changes.location = { old: originalLocation, new: newLocation };
                    }

                    if (Object.keys(changes).length > 0) {
                        await sendEventUpdateEmail(event._id.toString(), changes);
                    }
                } catch (e) {
                    console.error('Failed to queue event update email', e);
                }
            }
        }

        return event;
    }

    async delete(id: string, user: { userId: string, role: string }) {
        const event = await Event.findById(id);
        if (!event) throw new AppError('Event not found', 404);

        let hasPermission = event.organizer.toString() === user.userId || user.role === 'ADMIN';
        if (!hasPermission && event.community) {
             const comm = await Community.findById(event.community);
             if (comm && comm.admins.map(a => a.toString()).includes(user.userId)) hasPermission = true;
        }

        if (!hasPermission) {
            throw new ForbiddenError('Only organizer or community/system admin can delete event');
        }
        
        await event.deleteOne();
    }

    async getEventsByCommunity(communityId: string) {
        return Event.find({ community: communityId }).sort('startDateTime').populate('organizer', 'name');
    }

    async addPhoto(eventId: string, userId: string, photoUrl: string) {
        const event = await Event.findById(eventId);
        if (!event) throw new AppError('Event not found', 404);
        
        const isOrganizer = event.organizer.toString() === userId;
        const isEventEnded = new Date() > new Date(event.endDateTime);

        if (!isOrganizer) {
            // If not organizer, check if attendee AND event ended
            if (!isEventEnded) {
                throw new ForbiddenError('Only organizer can upload photos before the event ends');
            }

            const rsvp = await Rsvp.findOne({ event: eventId, user: userId, status: 'GOING' });
            
            if (!rsvp) {
                throw new ForbiddenError('Only attendees can upload photos to the shared gallery');
            }
        }

        if (!event.photos) event.photos = [];
        event.photos.push(photoUrl);
        await event.save();
        return event;
    }
}

export const eventService = new EventService();

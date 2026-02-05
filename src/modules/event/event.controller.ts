import { Request, Response, NextFunction } from 'express';
import { eventService } from './event.service';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { ApiResponse } from '../../common/utils/ApiResponse';
import { generateGoogleCalendarLink, generateICS } from '../../common/utils/calendar.utils';
import { ApiError } from '../../common/utils/ApiError';
import { validationResult } from 'express-validator';
import { ValidationError } from '../../common/errors/app-error';
import { AuthenticatedRequest } from '../../common/middlewares/auth.middleware';
import { IEvent } from './event.types';

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) throw new ValidationError(errors.array()[0].msg);
        
        const { title, description, category, visibility, startDateTime, endDateTime, address, latitude, longitude, capacity, communityId, recurringRule, photos, inviteEmails } = req.body;
        const userId = (req as AuthenticatedRequest).user.userId;

        const eventData: Partial<IEvent> = {
            title, description, category, visibility, startDateTime, endDateTime,
            location: { address, type: 'Point', coordinates: [longitude, latitude] },
            capacity, community: communityId, recurringRule, photos
        };

        const event = await eventService.create(eventData, userId, inviteEmails);

        res.status(201).json({ success: true, data: event });
    } catch (error) { next(error); }
};

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query; // { category, latitude, longitude, time: 'PAST' | 'UPCOMING' }
    const userId = (req as AuthenticatedRequest).user?.userId;
    
   
    const { data: events, meta } = await eventService.getEvents(filters, userId); 
    
    // Use a simpler type mapping strategy
    let eventsWithRsvp: (Partial<IEvent> & { userRsvpStatus?: string | null })[] = events.map(e => e.toObject ? e.toObject() : e);
    
    if (userId) {
        const { Rsvp } = await import('../rsvp/rsvp.model');
        
        const userRsvps = await Rsvp.find({ user: userId, event: { $in: events.map((e) => e._id) } });
        const rsvpMap = new Map(userRsvps.map(r => [r.event.toString(), r.status]));
        
        eventsWithRsvp = eventsWithRsvp.map((event) => {
            return {
                ...event,
                userRsvpStatus: rsvpMap.get(event._id!.toString()) || null
            };
        });
    }
    
    res.status(200).json(
        new ApiResponse(200, { data: eventsWithRsvp, meta }, 'Events retrieved successfully')
    );
});

export const getEventById = asyncHandler(async (req: Request, res: Response) => {
    const event = await eventService.getById(req.params.id);
    if (!event) {
        throw new ApiError(404, 'Event not found');
    }
    
    const eventData = event.toObject();
    const googleCalendarLink = generateGoogleCalendarLink(event);
    
    let userRsvpStatus = null;
    const userId = (req as AuthenticatedRequest).user?.userId;
    if (userId) {
        const rsvp = await eventService.getUserEventRsvp(req.params.id, userId);
        userRsvpStatus = rsvp?.status || null;
    }
    
    res.status(200).json(
        new ApiResponse(200, { ...eventData, googleCalendarLink, userRsvpStatus }, 'Event details')
    );
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
    const { inviteEmails, ...updateDataRaw } = req.body;
    // Explicitly define update data
    const userId = (req as AuthenticatedRequest).user.userId;
    
    const event = await eventService.update(req.params.id, userId, updateDataRaw);
    
    if (inviteEmails && inviteEmails.length > 0) {
         const { invitationService } = await import('../invitation/invitation.service');
         await invitationService.inviteUsers(event._id.toString(), inviteEmails, userId);
    }

    res.status(200).json(new ApiResponse(200, event, 'Event updated successfully'));
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
    await eventService.delete(req.params.id, (req as AuthenticatedRequest).user);
    res.status(200).json(new ApiResponse(200, null, 'Event deleted successfully'));
});

export const checkInUser = asyncHandler(async (req: Request, res: Response) => {
    const { id, userId } = req.params;
    const { ticketCode } = req.body;
    const organizerId = (req as AuthenticatedRequest).user.userId;
    
    const { rsvpService } = await import('../rsvp/rsvp.service');
    
    const result = await rsvpService.checkIn(id, { userId, ticketCode }, organizerId);
    
    res.status(200).json(new ApiResponse(200, result, 'User checked in successfully'));
});

export const scanTicket = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { ticketCode } = req.body;
    const organizerId = (req as AuthenticatedRequest).user.userId;

    if (!ticketCode) throw new ApiError(400, 'Ticket code is required');

    const { rsvpService } = await import('../rsvp/rsvp.service');

    const result = await rsvpService.checkIn(id, { ticketCode }, organizerId);

    res.status(200).json(new ApiResponse(200, result, 'Ticket scanned and user checked in successfully'));
});

export const uploadEventPhoto = asyncHandler(async (req: Request, res: Response) => {
    const { url } = req.body; 
    if (!url) throw new ApiError(400, 'Photo URL is required');
    
    const event = await eventService.addPhoto(req.params.id, (req as AuthenticatedRequest).user.userId, url);
    res.status(200).json(new ApiResponse(200, event, 'Photo uploaded successfully'));
});

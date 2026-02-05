import cron from 'node-cron';
import { Event, RecurringRule } from '../modules/event/event.model';
import { IEvent } from '../modules/event/event.types';
import { logger } from '../config/logger';

export const startRecurringEventsJob = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        logger.info('Running recurring events job');
        try {
            const events = await Event.find({ recurringRule: { $ne: RecurringRule.NONE } });
            
            for (const event of events) {
                const nextDate = new Date(event.startDateTime);
                if (event.recurringRule === RecurringRule.WEEKLY) {
                    nextDate.setDate(nextDate.getDate() + 7);
                } else if (event.recurringRule === RecurringRule.MONTHLY) {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }
                
             
                const exists = await Event.findOne({
                    organizer: event.organizer,
                    title: event.title,
                    startDateTime: nextDate
                });
                
                if (!exists) {
                    const duration = event.endDateTime.getTime() - event.startDateTime.getTime();
                    const nextEndDate = new Date(nextDate.getTime() + duration);
                    
                    const eventObject = event.toObject<IEvent>();
                    const { _id, createdAt, updatedAt, ...eventData } = eventObject as any; // Temporary destructuring workaround or use strict Omit
                    
                    const newEventPayload: Partial<IEvent> = {
                        ...eventData,
                        startDateTime: nextDate,
                        endDateTime: nextEndDate,
                        attendeeCount: 0,
                        photos: [],
                    };
                    
                    await Event.create(newEventPayload);
                     logger.info(`Created recurring event for ${event.title} at ${nextDate}`);

                     // Notify Organizer
                     try {
                        const { sendRecurringEventCreatedEmail } = await import('../modules/notification/notification.queue');
                        const { User } = await import('../modules/user/user.model');
                        const organizer = await User.findById(event.organizer);
                        
                        if (organizer) {
                            await sendRecurringEventCreatedEmail(
                                organizer.email, 
                                organizer.name, 
                                event.title, 
                                nextDate.toDateString()
                            );
                        }
                     } catch (e) {
                         logger.error('Failed to queue recurring event email', e);
                     }
                }
            }
        } catch (error) {
            logger.error('Error in recurring events job', error);
        }
    });
};

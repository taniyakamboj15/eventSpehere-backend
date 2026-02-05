import { IEvent } from '../../modules/event/event.types';

export const generateGoogleCalendarLink = (event: IEvent) => {
    const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const start = format(event.startDateTime);
    const end = format(event.endDateTime);
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location.address)}&sf=true&output=xml`;
};

export const generateICS = (event: IEvent) => {
    const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EventSphere//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${event._id}
DTSTAMP:${format(new Date())}
DTSTART:${format(event.startDateTime)}
DTEND:${format(event.endDateTime)}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location.address}
END:VEVENT
END:VCALENDAR`;
};

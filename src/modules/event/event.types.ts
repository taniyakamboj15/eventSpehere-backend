import { Document, Types } from 'mongoose';

export enum EventVisibility {
  PUBLIC = 'PUBLIC',
  COMMUNITY_ONLY = 'COMMUNITY_ONLY',
  PRIVATE_INVITE = 'PRIVATE_INVITE',
}

export enum EventCategory {
  MUSIC = 'MUSIC',
  TECH = 'TECH',
  SPORTS = 'SPORTS',
  EDUCATION = 'EDUCATION',
  SOCIAL = 'SOCIAL',
  MEETUP = 'MEETUP',
  BUSINESS = 'BUSINESS',
  NEIGHBORHOOD = 'NEIGHBORHOOD',
  OTHER = 'OTHER',
}

export enum RecurringRule {
    NONE = 'NONE',
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
}

export interface IEvent extends Document {
  title: string;
  description: string;
  category: EventCategory;
  visibility: EventVisibility;
  organizer: Types.ObjectId;
  community?: Types.ObjectId;
  startDateTime: Date;
  endDateTime: Date;
  location: {
    address: string;
    type: 'Point';
    coordinates: number[];
  };
  capacity: number;
  attendeeCount: number;
  recurringRule: RecurringRule;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventFilters {
    time?: 'PAST' | 'UPCOMING' | 'ALL';
    category?: string;
    lat?: string;
    lng?: string;
    latitude?: string;
    longitude?: string;
    radius?: string;
    page?: string;
    limit?: string;
    organizer?: string;
}

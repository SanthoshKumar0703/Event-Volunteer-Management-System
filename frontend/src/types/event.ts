// ============================================
// EVENT TYPES
// ============================================

import { ObjectId } from 'mongodb';
import { UserSummary } from './user';
import { EventRole } from './application';
import { Shift } from './shift';

export type EventStatus = 
  | 'DRAFT'
  | 'PENDING'
  | 'OPEN_FOR_REGISTRATION'
  | 'REGISTRATION_CLOSED'
  | 'UPCOMING'
  | 'LIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'POSTPONED';

export const EventStatus = {
  DRAFT: 'DRAFT' as EventStatus,
  PENDING: 'PENDING' as EventStatus,
  OPEN_FOR_REGISTRATION: 'OPEN_FOR_REGISTRATION' as EventStatus,
  REGISTRATION_CLOSED: 'REGISTRATION_CLOSED' as EventStatus,
  UPCOMING: 'UPCOMING' as EventStatus,
  LIVE: 'LIVE' as EventStatus,
  COMPLETED: 'COMPLETED' as EventStatus,
  CANCELLED: 'CANCELLED' as EventStatus,
  POSTPONED: 'POSTPONED' as EventStatus,
};

export type EventCategory = 
  | 'CONFERENCE'
  | 'CONCERT'
  | 'FESTIVAL'
  | 'SPORTS'
  | 'CHARITY'
  | 'COMMUNITY'
  | 'CORPORATE'
  | 'EDUCATION'
  | 'HEALTH'
  | 'ENVIRONMENT'
  | 'ARTS'
  | 'TECHNOLOGY'
  | 'FOOD'
  | 'OTHER';

export const EventCategory = {
  CONFERENCE: 'CONFERENCE' as EventCategory,
  CONCERT: 'CONCERT' as EventCategory,
  FESTIVAL: 'FESTIVAL' as EventCategory,
  SPORTS: 'SPORTS' as EventCategory,
  CHARITY: 'CHARITY' as EventCategory,
  COMMUNITY: 'COMMUNITY' as EventCategory,
  CORPORATE: 'CORPORATE' as EventCategory,
  EDUCATION: 'EDUCATION' as EventCategory,
  HEALTH: 'HEALTH' as EventCategory,
  ENVIRONMENT: 'ENVIRONMENT' as EventCategory,
  ARTS: 'ARTS' as EventCategory,
  TECHNOLOGY: 'TECHNOLOGY' as EventCategory,
  FOOD: 'FOOD' as EventCategory,
  OTHER: 'OTHER' as EventCategory,
};

export interface EventLocation {
  venue: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface EventImage {
  _id?: string | ObjectId;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  isPrimary: boolean;
  order: number;
  createdAt?: Date | string;
}

export interface Event {
  _id: string | ObjectId;
  title: string;
  description: string;
  shortDescription?: string;
  category: EventCategory;
  status: EventStatus;
  eventId: string;
  organizer: string | ObjectId | UserSummary;
  location: EventLocation;
  date: Date | string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  registrationDeadline?: Date | string;
  requiredVolunteers: number;
  maximumVolunteers?: number;
  images: EventImage[];
  image?: string | EventImage; // Legacy property for backwards compatibility
  thumbnailUrl?: string;
  bannerUrl?: string;
  tags: string[];
  website?: string;
  socialMediaLinks?: string[];
  socialLinks?: string[];
  contactEmail: string;
  contactPhone?: string;
  qrToken: string;
  roles: EventRole[];
  shifts: Shift[];
  applicationsCount: number;
  approvedVolunteersCount: number;
  assignedVolunteersCount: number;
  checkedInCount: number;
  tasksCount: number;
  completedTasksCount: number;
  announcementsCount: number;
  totalVolunteerHours: number;
  expectedAttendees?: number;
  actualAttendees?: number;
  budget?: number;
  expenses?: number;
  notes?: string;
  cancellationReason?: string;
  postponementReason?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt?: Date | string;
  requestId?: string | ObjectId; // Reference to event request
}

export interface CreateEvent {
  title: string;
  description: string;
  shortDescription?: string;
  category: EventCategory;
  location: Partial<EventLocation>;
  date: Date | string;
  startTime: string;
  endTime: string;
  registrationDeadline?: Date | string;
  requiredVolunteers: number;
  maximumVolunteers?: number;
  tags?: string[];
  website?: string;
  socialMediaLinks?: string[];
  contactEmail: string;
  contactPhone?: string;
  images?: File[] | string[];
  thumbnailUrl?: string;
  bannerUrl?: string;
  expectedAttendees?: number;
  budget?: number;
  notes?: string;
}

export interface UpdateEvent {
  title?: string;
  description?: string;
  shortDescription?: string;
  category?: EventCategory;
  location?: Partial<EventLocation>;
  date?: Date | string;
  startTime?: string;
  endTime?: string;
  registrationDeadline?: Date | string;
  requiredVolunteers?: number;
  maximumVolunteers?: number;
  tags?: string[];
  website?: string;
  socialMediaLinks?: string[];
  contactEmail?: string;
  contactPhone?: string;
  images?: EventImage[];
  thumbnailUrl?: string;
  bannerUrl?: string;
  status?: EventStatus;
  expectedAttendees?: number;
  budget?: number;
  expenses?: number;
  notes?: string;
  cancellationReason?: string;
  postponementReason?: string;
}

export interface EventFilter {
  status?: EventStatus[];
  category?: EventCategory[];
  organizer?: string | ObjectId;
  search?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  city?: string;
  tags?: string[];
  isFeatured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'createdAt' | 'title' | 'applicationsCount' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

export interface EventSummary {
  _id: string | ObjectId;
  title: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  location: {
    city: string;
    venue: string;
  };
  category: EventCategory;
  status: EventStatus;
  thumbnailUrl?: string;
  organizer: UserSummary;
  requiredVolunteers: number;
  applicationsCount: number;
  eventId: string;
}

export interface EventStats {
  totalEvents: number;
  draft: number;
  openForRegistration: number;
  upcoming: number;
  live: number;
  completed: number;
  cancelled: number;
  totalVolunteers: number;
  totalVolunteerHours: number;
  averageRating: number;
}

export interface EventLifecycle {
  currentStage: EventStatus;
  stages: {
    name: string;
    status: 'COMPLETED' | 'CURRENT' | 'PENDING' | 'SKIPPED';
    completedAt?: Date | string;
    duration?: number; // in days
  }[];
  progress: number; // percentage
}

export interface EventDashboardData {
  event: Event;
  lifecycle: EventLifecycle;
  statistics: {
    applications: number;
    approved: number;
    assigned: number;
    checkedIn: number;
    tasks: number;
    completedTasks: number;
    announcements: number;
    reviews: number;
    averageRating: number;
  };
  recentActivity: any[]; // ActivityLog[]
  upcomingDeadlines: any[];
}

export interface RegenerateQR {
  eventId: string | ObjectId;
}

export interface EventQR {
  eventId: string | ObjectId;
  qrToken: string;
  qrCode: string; // base64 encoded QR code
}

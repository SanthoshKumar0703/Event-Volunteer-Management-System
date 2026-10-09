// ============================================
// EVENT REQUEST TYPES
// ============================================

import { ObjectId } from 'mongodb';
import { UserSummary } from './user';

export type EventRequestStatus = 
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ORGANIZER_ASSIGNED'
  | 'PLANNING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

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

export interface EventRequest {
  _id: string | ObjectId;
  eventName: string;
  organizationName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  category: EventCategory;
  description: string;
  venue: string;
  venueAddress?: string;
  venueCity?: string;
  venueState?: string;
  venuePostalCode?: string;
  venueCountry?: string;
  eventDate: Date | string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  expectedAttendees: number;
  requiredVolunteers: number;
  requiredSkills: string[];
  additionalRequirements: string;
  budget?: number;
  website?: string;
  socialMediaLinks?: string[];
  status: EventRequestStatus;
  requestId: string;
  notes?: string[];
  internalNotes?: {
    note: string;
    createdBy: string | ObjectId;
    createdAt: Date | string;
  }[];
  createdBy?: string | ObjectId;
  createdAt: Date | string;
  updatedAt: Date | string;
  reviewedBy?: string | ObjectId;
  reviewedAt?: Date | string;
  assignedOrganizer?: string | ObjectId | UserSummary;
  assignedAt?: Date | string;
  eventId?: string | ObjectId; // Reference to created event
}

export interface CreateEventRequest {
  eventName: string;
  organizationName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  category: EventCategory;
  description: string;
  venue: string;
  venueAddress?: string;
  venueCity?: string;
  venueState?: string;
  venuePostalCode?: string;
  venueCountry?: string;
  eventDate: Date | string;
  startTime: string;
  endTime: string;
  expectedAttendees: number;
  requiredVolunteers: number;
  requiredSkills: string[];
  additionalRequirements: string;
  budget?: number;
  website?: string;
  socialMediaLinks?: string[];
}

export interface UpdateEventRequest {
  status?: EventRequestStatus;
  notes?: string;
  internalNotes?: {
    note: string;
    createdBy: string | ObjectId;
  };
  assignedOrganizer?: string | ObjectId;
}

export interface EventRequestFilter {
  status?: EventRequestStatus[];
  category?: EventCategory[];
  search?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'eventDate' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

export interface EventRequestStats {
  totalRequests: number;
  pending: number;
  approved: number;
  rejected: number;
  assigned: number;
  completed: number;
  conversionRate: number;
}

export interface AssignOrganizerToRequest {
  requestId: string | ObjectId;
  organizerId: string | ObjectId;
  notes?: string;
}

export interface ApproveEventRequest {
  requestId: string | ObjectId;
  status: 'APPROVED' | 'REJECTED';
  notes?: string;
  rejectionReason?: string;
}

// ============================================
// APPLICATION TYPES
// ============================================

import { ObjectId } from 'mongodb';
import { UserSummary } from './user';
import { EventSummary } from './event';

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
export const ApplicationStatus = {
  PENDING: 'PENDING' as ApplicationStatus,
  APPROVED: 'APPROVED' as ApplicationStatus,
  REJECTED: 'REJECTED' as ApplicationStatus,
  WITHDRAWN: 'WITHDRAWN' as ApplicationStatus,
  EXPIRED: 'EXPIRED' as ApplicationStatus,
};

export interface EventRole {
  _id: string | ObjectId;
  name: string;
  description: string;
  requiredCount: number;
  requiredSkills: string[];
  filledCount: number;
  order: number;
  color?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Application {
  _id: string | ObjectId;
  applicationId: string;
  event: string | ObjectId | EventSummary;
  eventId?: string | ObjectId;
  volunteer: string | ObjectId | UserSummary;
  volunteerId?: string | ObjectId;
  role: string | ObjectId | EventRole;
  roleId?: string | ObjectId;
  status: ApplicationStatus;
  matchScore: number;
  matchReasons: MatchReason[];
  applicationDate: Date | string;
  reviewedDate?: Date | string;
  reviewedBy?: string | ObjectId | UserSummary;
  notes?: string;
  rejectionReason?: string;
  customMessage?: string;
  coverLetter?: string;
  availabilityConfirmed: boolean;
  skillsConfirmed: string[];
  experienceConfirmed: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  answers?: ApplicationAnswer[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ApplicationAnswer {
  question: string;
  answer: string;
}

export interface MatchReason {
  type: 'SKILL' | 'AVAILABILITY' | 'EXPERIENCE' | 'PERFORMANCE' | 'LOCATION';
  description: string;
  matched: boolean;
  score: number;
  details?: any;
}

export interface MatchScore {
  total: number;
  breakdown: {
    skills: number;
    availability: number;
    experience: number;
    performance: number;
  };
  reasons: MatchReason[];
}

export interface CreateApplication {
  eventId: string | ObjectId;
  roleId: string | ObjectId;
  customMessage?: string;
  availabilityConfirmed: boolean;
  skillsConfirmed: string[];
  experienceConfirmed: string[];
}

export interface UpdateApplication {
  status?: ApplicationStatus;
  notes?: string;
  rejectionReason?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ApplicationFilter {
  eventId?: string | ObjectId;
  volunteerId?: string | ObjectId;
  status?: ApplicationStatus[];
  roleId?: string | ObjectId;
  search?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  minMatchScore?: number;
  maxMatchScore?: number;
  page?: number;
  limit?: number;
  sortBy?: 'applicationDate' | 'matchScore' | 'status' | 'priority';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ApplicationStats {
  totalApplications: number;
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  averageMatchScore: number;
  highMatchApplications: number; // > 80%
  mediumMatchApplications: number; // 50-80%
  lowMatchApplications: number; // < 50%
}

export interface ApplicationWithEvent extends Application {
  eventDetails: EventSummary;
  roleDetails: EventRole;
}

export interface BulkApplicationAction {
  applicationIds: (string | ObjectId)[];
  action: 'APPROVE' | 'REJECT';
  notes?: string;
  rejectionReason?: string;
}

// ============================================
// ASSIGNMENT TYPES
// ============================================

import { ObjectId } from 'mongodb';
import { UserSummary } from './user';
import { EventSummary } from './event';
import { EventRole } from './application';
import { Shift } from './shift';

export type AssignmentStatus = 'PENDING' | 'ASSIGNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export interface Assignment {
  _id: string | ObjectId;
  assignmentId: string;
  event: string | ObjectId | EventSummary;
  volunteer: string | ObjectId | UserSummary;
  role: string | ObjectId | EventRole;
  shift: string | ObjectId | Shift;
  status: AssignmentStatus;
  confirmedAt?: Date | string;
  cancelledAt?: Date | string;
  cancellationReason?: string;
  notes?: string;
  organizerNotes?: string;
  volunteerNotes?: string;
  checkInTime?: Date | string;
  checkOutTime?: Date | string;
  totalHours?: number;
  rating?: number;
  feedback?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy: string | ObjectId | UserSummary;
}

export interface CreateAssignment {
  eventId: string | ObjectId;
  volunteerId: string | ObjectId;
  roleId: string | ObjectId;
  shiftId: string | ObjectId;
  notes?: string;
  status?: AssignmentStatus;
}

export interface UpdateAssignment {
  roleId?: string | ObjectId;
  shiftId?: string | ObjectId;
  status?: AssignmentStatus;
  notes?: string;
  organizerNotes?: string;
  volunteerNotes?: string;
  cancellationReason?: string;
}

export interface AssignmentFilter {
  eventId?: string | ObjectId;
  volunteerId?: string | ObjectId;
  roleId?: string | ObjectId;
  shiftId?: string | ObjectId;
  status?: AssignmentStatus[];
  search?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'status' | 'totalHours';
  sortOrder?: 'ASC' | 'DESC';
}

export interface AssignmentStats {
  totalAssignments: number;
  assigned: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  totalHours: number;
  averageHoursPerVolunteer: number;
}

export interface AssignmentWithDetails extends Assignment {
  eventDetails: EventSummary;
  roleDetails: EventRole;
  shiftDetails: Shift;
  volunteerDetails: UserSummary;
}

export interface BulkAssignment {
  eventId: string | ObjectId;
  volunteerIds: (string | ObjectId)[];
  roleId: string | ObjectId;
  shiftId: string | ObjectId;
  notes?: string;
}

export interface ConfirmAssignment {
  assignmentId: string | ObjectId;
  confirmed: boolean;
  notes?: string;
}

export interface ReassignVolunteer {
  assignmentId: string | ObjectId;
  newVolunteerId: string | ObjectId;
  notes?: string;
}

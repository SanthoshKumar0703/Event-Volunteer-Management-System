// ============================================
// SHIFT TYPES
// ============================================

import { ObjectId } from 'mongodb';
import { UserSummary } from './user';

export interface Shift {
  _id: string | ObjectId;
  shiftId: string;
  name: string;
  description?: string;
  eventId: string | ObjectId;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  date: Date | string; // The date this shift occurs
  capacity: number;
  assignedCount: number;
  availableSlots: number;
  status: 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED';
  color?: string;
  isRecurring: boolean;
  recurrencePattern?: ShiftRecurrence;
  breakDuration?: number; // in minutes
  checkInStart?: string; // HH:mm format - when check-in opens
  checkInEnd?: string; // HH:mm format - when check-in closes
  volunteers?: ShiftVolunteer[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ShiftRecurrence {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  interval: number; // every X days/weeks/months
  endDate?: Date | string;
  maxOccurrences?: number;
  daysOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 6 = Saturday
  daysOfMonth?: number[];
}

export interface ShiftVolunteer {
  volunteerId: string | ObjectId | UserSummary;
  assignmentId: string | ObjectId;
  roleId: string | ObjectId;
  checkInTime?: Date | string;
  checkOutTime?: Date | string;
  status: 'ASSIGNED' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_SHOW';
  totalHours?: number;
}

export interface CreateShift {
  name: string;
  description?: string;
  eventId: string | ObjectId;
  startTime: string;
  endTime: string;
  date: Date | string;
  capacity: number;
  color?: string;
  isRecurring?: boolean;
  recurrencePattern?: ShiftRecurrence;
  breakDuration?: number;
  checkInStart?: string;
  checkInEnd?: string;
}

export interface UpdateShift {
  name?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  date?: Date | string;
  capacity?: number;
  color?: string;
  isRecurring?: boolean;
  recurrencePattern?: ShiftRecurrence;
  breakDuration?: number;
  checkInStart?: string;
  checkInEnd?: string;
  status?: 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED';
}

export interface ShiftFilter {
  eventId?: string | ObjectId;
  search?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  status?: ('OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED')[];
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'startTime' | 'assignedCount';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ShiftStats {
  totalShifts: number;
  open: number;
  full: number;
  closed: number;
  totalAssignedVolunteers: number;
  totalHours: number;
}

export interface ShiftWithVolunteers extends Shift {
  volunteers: ShiftVolunteer[];
}

export interface AssignToShift {
  shiftId: string | ObjectId;
  volunteerId: string | ObjectId;
  roleId: string | ObjectId;
  assignmentId: string | ObjectId;
}

export interface RemoveFromShift {
  shiftId: string | ObjectId;
  volunteerId: string | ObjectId;
  reason?: string;
}

export interface VolunteerShiftSchedule {
  volunteerId: string | ObjectId;
  shifts: {
    shift: Shift;
    role: string;
    status: string;
    checkInTime?: Date | string;
    checkOutTime?: Date | string;
  }[];
  totalHours: number;
  upcomingShifts: number;
  completedShifts: number;
}

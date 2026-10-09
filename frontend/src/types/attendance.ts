// ============================================
// ATTENDANCE TYPES
// ============================================

import { ObjectId } from 'mongodb';
import { UserSummary } from './user';
import { EventSummary } from './event';
import { Shift } from './shift';

export type AttendanceStatus = 'REGISTERED' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NO_SHOW' | 'CANCELLED';
export type CheckInMethod = 'QR' | 'MANUAL' | 'AUTO';

export interface Attendance {
  _id: string | ObjectId;
  attendanceId: string;
  event: string | ObjectId | EventSummary;
  volunteer: string | ObjectId | UserSummary;
  shift: string | ObjectId | Shift;
  status: AttendanceStatus;
  checkInTime?: Date | string;
  checkInMethod?: CheckInMethod;
  checkInBy?: string | ObjectId | UserSummary;
  checkOutTime?: Date | string;
  checkOutMethod?: CheckInMethod;
  checkOutBy?: string | ObjectId | UserSummary;
  totalHours?: number;
  notes?: string;
  qrToken?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface QRCheckIn {
  eventId: string | ObjectId;
  volunteerId: string | ObjectId;
  qrToken: string;
  shiftId?: string | ObjectId;
  method?: CheckInMethod;
}

export interface ManualCheckIn {
  eventId: string | ObjectId;
  volunteerId: string | ObjectId;
  shiftId?: string | ObjectId;
  notes?: string;
}

export interface QRCheckOut {
  eventId: string | ObjectId;
  volunteerId: string | ObjectId;
  qrToken: string;
  shiftId?: string | ObjectId;
  method?: CheckInMethod;
}

export interface ManualCheckOut {
  eventId: string | ObjectId;
  volunteerId: string | ObjectId;
  shiftId?: string | ObjectId;
  notes?: string;
}

export interface AttendanceFilter {
  eventId?: string | ObjectId;
  volunteerId?: string | ObjectId;
  shiftId?: string | ObjectId;
  status?: AttendanceStatus[];
  dateFrom?: Date | string;
  dateTo?: Date | string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'checkInTime' | 'checkOutTime' | 'totalHours' | 'status';
  sortOrder?: 'ASC' | 'DESC';
}

export interface AttendanceStats {
  totalAttendance: number;
  checkedIn: number;
  checkedOut: number;
  noShow: number;
  totalHours: number;
  averageHours: number;
  peakCheckInTime: string;
  attendanceRate: number; // percentage
}

export interface AttendanceWithDetails extends Attendance {
  eventDetails: EventSummary;
  volunteerDetails: UserSummary;
  shiftDetails: Shift;
}

export interface QRCodeData {
  eventId: string | ObjectId;
  qrToken: string;
  qrCode: string; // base64 encoded
  expiresAt?: Date | string;
}

export interface RegenerateQR {
  eventId: string | ObjectId;
}

export interface VerifyQR {
  qrToken: string;
  eventId: string | ObjectId;
  volunteerId: string | ObjectId;
}

export interface AttendanceSummary {
  eventId: string | ObjectId;
  totalRegistered: number;
  totalCheckedIn: number;
  totalCheckedOut: number;
  checkInRate: number;
  totalHours: number;
  averageHours: number;
  volunteers: {
    volunteerId: string | ObjectId;
    name: string;
    status: AttendanceStatus;
    checkInTime?: Date | string;
    checkOutTime?: Date | string;
    totalHours?: number;
  }[];
}

export interface VolunteerAttendanceHistory {
  volunteerId: string | ObjectId;
  totalEvents: number;
  totalHours: number;
  averageHours: number;
  attendanceRate: number;
  events: {
    eventId: string | ObjectId;
    eventTitle: string;
    date: Date | string;
    status: AttendanceStatus;
    checkInTime?: Date | string;
    checkOutTime?: Date | string;
    totalHours?: number;
  }[];
}

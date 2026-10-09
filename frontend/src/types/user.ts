// ============================================
// USER TYPES
// ============================================

import { ObjectId } from 'mongodb';

export type UserRole = 'ADMIN' | 'ORGANIZER' | 'VOLUNTEER';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'ACTIVE' | 'INACTIVE';
export type AccountType = 'EMAIL' | 'GOOGLE' | 'GUEST';

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

export interface OTPVerification {
  email: string;
  otp: string;
}

export interface ResetPassword {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface UserSkill {
  _id?: string | ObjectId;
  name: string;
  category: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsOfExperience?: number;
  certified?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface UserExperience {
  _id?: string | ObjectId;
  title: string;
  organization: string;
  role: string;
  description: string;
  startDate: Date | string;
  endDate?: Date | string;
  currentlyWorking: boolean;
  createdAt?: Date | string;
}

export interface UserAvailability {
  _id?: string | ObjectId;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
}

export interface UserPreferences {
  notificationSettings: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  language: string;
  timezone: string;
}

export interface UserProfile {
  _id?: string | ObjectId;
  bio: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  dateOfBirth?: Date | string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  profileImage?: string;
  coverImage?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    website?: string;
  };
}

export interface User {
  _id: string | ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  password?: string; // Only for registration, not returned from API
  role: UserRole;
  status: UserStatus;
  accountType: AccountType;
  isVerified: boolean;
  isActive: boolean;
  skills: UserSkill[];
  experience: UserExperience[];
  availability: UserAvailability[];
  preferences: UserPreferences;
  profile: UserProfile;
  performanceScore?: number;
  totalVolunteerHours?: number;
  eventsCompleted?: number;
  tasksCompleted?: number;
  badges?: string[] | ObjectId[];
  createdAt: Date | string;
  updatedAt: Date | string;
  lastLoginAt?: Date | string;
  googleId?: string;
  resetToken?: string;
  resetTokenExpires?: Date | string;
  verificationToken?: string;
  verifiedAt?: Date | string;
}

export interface UserSummary {
  _id: string | ObjectId;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profileImage?: string;
  performanceScore?: number;
  totalVolunteerHours?: number;
  eventsCompleted?: number;
}

export interface UserStats {
  totalUsers: number;
  admins: number;
  organizers: number;
  volunteers: number;
  activeUsers: number;
  pendingUsers: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
}

export interface UserFilter {
  role?: UserRole[];
  status?: UserStatus[];
  search?: string;
  isVerified?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'lastLoginAt' | 'fullName' | 'performanceScore';
  sortOrder?: 'ASC' | 'DESC';
}

export interface UserUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  skills?: UserSkill[];
  experience?: UserExperience[];
  availability?: UserAvailability[];
  preferences?: Partial<UserPreferences>;
  profile?: Partial<UserProfile>;
  isActive?: boolean;
  status?: UserStatus;
}

export interface OrganizerApproval {
  organizerId: string | ObjectId;
  status: 'APPROVED' | 'REJECTED';
  notes?: string;
  approvedBy: string | ObjectId;
}

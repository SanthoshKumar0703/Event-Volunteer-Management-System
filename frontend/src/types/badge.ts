// ============================================
// BADGE TYPES
// ============================================

import { ObjectId } from 'mongodb';
import { UserSummary } from './user';

export type BadgeRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
export type BadgeCategory = 'PARTICIPATION' | 'PERFORMANCE' | 'SKILLS' | 'TIME' | 'ACHIEVEMENT' | 'SPECIAL';

export interface Badge {
  _id: string | ObjectId;
  badgeId: string;
  name: string;
  description: string;
  shortDescription?: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon: string; // Icon name or URL
  iconColor: string;
  backgroundColor: string;
  borderColor: string;
  image?: string; // URL to badge image
  criteria: BadgeCriteria;
  points: number;
  isActive: boolean;
  order: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BadgeCriteria {
  type: 'EVENT_COUNT' | 'VOLUNTEER_HOURS' | 'TASKS_COMPLETED' | 'PERFORMANCE_SCORE' | 'SPECIAL_ACHIEVEMENT' | 'SKILLS_MASTERED' | 'TEAMWORK' | 'PUNCTUALITY';
  target: number;
  operator: 'GTE' | 'LTE' | 'EQ' | 'GT' | 'LT';
  timeframe?: 'ALL_TIME' | 'MONTHLY' | 'YEARLY' | 'WEEKLY';
  conditions?: BadgeCondition[];
}

export interface BadgeCondition {
  type: 'AND' | 'OR';
  conditions: BadgeCriteria[];
}

export interface BadgeProgress {
  badge: Badge;
  currentValue: number;
  targetValue: number;
  progress: number; // percentage
  isEarned: boolean;
  earnedAt?: Date | string;
  lastUpdatedAt?: Date | string;
}

export interface VolunteerBadge {
  _id: string | ObjectId;
  volunteer: string | ObjectId | UserSummary;
  badge: string | ObjectId | Badge;
  earnedAt: Date | string;
  expiresAt?: Date | string;
  isActive: boolean;
  level?: number; // For badges that can be earned multiple times
  data?: any; // Additional data related to the badge
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateBadge {
  name: string;
  description: string;
  shortDescription?: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon: string;
  iconColor: string;
  backgroundColor: string;
  borderColor: string;
  image?: File | string;
  criteria: BadgeCriteria;
  points: number;
  isActive?: boolean;
  order?: number;
}

export interface UpdateBadge {
  name?: string;
  description?: string;
  shortDescription?: string;
  category?: BadgeCategory;
  rarity?: BadgeRarity;
  icon?: string;
  iconColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  image?: File | string;
  criteria?: BadgeCriteria;
  points?: number;
  isActive?: boolean;
  order?: number;
}

export interface BadgeFilter {
  category?: BadgeCategory[];
  rarity?: BadgeRarity[];
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'rarity' | 'points' | 'order';
  sortOrder?: 'ASC' | 'DESC';
}

export interface BadgeStats {
  totalBadges: number;
  byCategory: Record<BadgeCategory, number>;
  byRarity: Record<BadgeRarity, number>;
  totalPoints: number;
  earnedBadges: number;
  unearnedBadges: number;
}

export interface VolunteerBadgeSummary {
  volunteerId: string | ObjectId;
  totalBadges: number;
  totalPoints: number;
  byCategory: Record<BadgeCategory, number>;
  byRarity: Record<BadgeRarity, number>;
  earnedBadges: VolunteerBadge[];
  progress: BadgeProgress[];
  nextAchievable: Badge[];
}

export interface AwardBadge {
  volunteerId: string | ObjectId;
  badgeId: string | ObjectId;
  level?: number;
  data?: any;
}

export interface RevokeBadge {
  volunteerBadgeId: string | ObjectId;
  reason?: string;
}

export interface BadgeNotification {
  badge: Badge;
  volunteer: UserSummary;
  level: number;
  message: string;
  earnedAt: Date | string;
}

// Predefined Badge Definitions
export const PREDEFINED_BADGES: Partial<Badge>[] = [
  {
    badgeId: 'first-event',
    name: 'First Event',
    description: 'Successfully completed your first volunteer event',
    category: 'PARTICIPATION',
    rarity: 'COMMON',
    criteria: { type: 'EVENT_COUNT', target: 1, operator: 'GTE' },
    points: 10,
    icon: 'medal',
    iconColor: '#FF7A33',
    backgroundColor: '#FFF7F0',
    borderColor: '#FF9559',
  },
  {
    badgeId: 'quick-responder',
    name: 'Quick Responder',
    description: 'Applied to an event within 24 hours of it being posted',
    category: 'ACHIEVEMENT',
    rarity: 'UNCOMMON',
    criteria: { type: 'SPECIAL_ACHIEVEMENT', target: 1, operator: 'GTE' },
    points: 20,
    icon: 'zap',
    iconColor: '#B064FF',
    backgroundColor: '#F9F7FF',
    borderColor: '#C28CFF',
  },
  {
    badgeId: 'perfect-attendance',
    name: 'Perfect Attendance',
    description: 'Checked in and out for every assigned shift in an event',
    category: 'PARTICIPATION',
    rarity: 'RARE',
    criteria: { type: 'SPECIAL_ACHIEVEMENT', target: 1, operator: 'GTE' },
    points: 30,
    icon: 'check-circle',
    iconColor: '#10B981',
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
  },
  {
    badgeId: 'team-player',
    name: 'Team Player',
    description: 'Consistently receives high teamwork scores in reviews',
    category: 'PERFORMANCE',
    rarity: 'RARE',
    criteria: { type: 'PERFORMANCE_SCORE', target: 4.5, operator: 'GTE' },
    points: 40,
    icon: 'users',
    iconColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    borderColor: '#60A5FA',
  },
  {
    badgeId: '10-events',
    name: '10 Events Completed',
    description: 'Successfully completed 10 volunteer events',
    category: 'PARTICIPATION',
    rarity: 'UNCOMMON',
    criteria: { type: 'EVENT_COUNT', target: 10, operator: 'GTE' },
    points: 50,
    icon: 'calendar',
    iconColor: '#FFAB33',
    backgroundColor: '#FFFBF0',
    borderColor: '#FFC166',
  },
  {
    badgeId: '50-hours',
    name: '50 Volunteer Hours',
    description: 'Completed 50 hours of volunteer service',
    category: 'TIME',
    rarity: 'RARE',
    criteria: { type: 'VOLUNTEER_HOURS', target: 50, operator: 'GTE' },
    points: 60,
    icon: 'clock',
    iconColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
    borderColor: '#A78BFA',
  },
  {
    badgeId: 'top-volunteer',
    name: 'Top Volunteer',
    description: 'Completed 100+ hours with excellent performance',
    category: 'ACHIEVEMENT',
    rarity: 'EPIC',
    criteria: { type: 'VOLUNTEER_HOURS', target: 100, operator: 'GTE' },
    points: 100,
    icon: 'trophy',
    iconColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
    borderColor: '#FBBF24',
  },
  {
    badgeId: 'skill-master',
    name: 'Skill Master',
    description: 'Mastered 5 different skills',
    category: 'SKILLS',
    rarity: 'RARE',
    criteria: { type: 'SKILLS_MASTERED', target: 5, operator: 'GTE' },
    points: 45,
    icon: 'award',
    iconColor: '#10B981',
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
  },
];

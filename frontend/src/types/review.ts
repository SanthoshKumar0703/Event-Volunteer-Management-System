// ============================================
// REVIEW TYPES
// ============================================

import { ObjectId } from 'mongodb';
import { UserSummary } from './user';
import { EventSummary } from './event';
import { Assignment } from './assignment';

export type ReviewDimension = 'COMMUNICATION' | 'TEAMWORK' | 'PUNCTUALITY' | 'TASK_COMPLETION' | 'RESPONSIBILITY' | 'LEADERSHIP' | 'ADAPTABILITY';
export const ReviewDimension = {
  COMMUNICATION: 'COMMUNICATION' as ReviewDimension,
  TEAMWORK: 'TEAMWORK' as ReviewDimension,
  PUNCTUALITY: 'PUNCTUALITY' as ReviewDimension,
  TASK_COMPLETION: 'TASK_COMPLETION' as ReviewDimension,
  RESPONSIBILITY: 'RESPONSIBILITY' as ReviewDimension,
  LEADERSHIP: 'LEADERSHIP' as ReviewDimension,
  ADAPTABILITY: 'ADAPTABILITY' as ReviewDimension,
};

export type ReviewType = 'VOLUNTEER' | 'ORGANIZER' | 'EVENT' | 'PEER';
export const ReviewType = {
  VOLUNTEER: 'VOLUNTEER' as ReviewType,
  ORGANIZER: 'ORGANIZER' as ReviewType,
  EVENT: 'EVENT' as ReviewType,
  PEER: 'PEER' as ReviewType,
};

export type ReviewStatus = 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' | 'ARCHIVED';
export const ReviewStatus = {
  DRAFT: 'DRAFT' as ReviewStatus,
  SUBMITTED: 'SUBMITTED' as ReviewStatus,
  PUBLISHED: 'PUBLISHED' as ReviewStatus,
  ARCHIVED: 'ARCHIVED' as ReviewStatus,
};

export interface ReviewDimensionScore {
  dimension: ReviewDimension;
  score: number; // 1-5
  comment?: string;
}

export interface Review {
  _id: string | ObjectId;
  reviewId: string;
  reviewer: string | ObjectId | UserSummary;
  reviewee: string | ObjectId | UserSummary;
  event: string | ObjectId | EventSummary;
  assignment: string | ObjectId | Assignment;
  type: ReviewType;
  status: ReviewStatus;
  dimensions: ReviewDimensionScore[];
  overallScore: number; // 1-5
  comments: string;
  strengths: string[];
  improvements: string[];
  rating: number; // Overall rating 1-5
  recommendation: 'STRONGLY_RECOMMEND' | 'RECOMMEND' | 'NEUTRAL' | 'DO_NOT_RECOMMEND';
  isAnonymous: boolean;
  isPublic: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  submittedAt?: Date | string;
  publishedAt?: Date | string;
}

export interface CreateReview {
  revieweeId: string | ObjectId;
  eventId: string | ObjectId;
  assignmentId: string | ObjectId;
  type: ReviewType;
  dimensions: ReviewDimensionScore[];
  comments?: string;
  strengths?: string[];
  improvements?: string[];
  rating: number;
  recommendation: 'STRONGLY_RECOMMEND' | 'RECOMMEND' | 'NEUTRAL' | 'DO_NOT_RECOMMEND';
  isAnonymous?: boolean;
  isPublic?: boolean;
}

export interface UpdateReview {
  dimensions?: ReviewDimensionScore[];
  comments?: string;
  strengths?: string[];
  improvements?: string[];
  rating?: number;
  recommendation?: 'STRONGLY_RECOMMEND' | 'RECOMMEND' | 'NEUTRAL' | 'DO_NOT_RECOMMEND';
  isAnonymous?: boolean;
  isPublic?: boolean;
  status?: ReviewStatus;
}

export interface ReviewFilter {
  reviewerId?: string | ObjectId;
  revieweeId?: string | ObjectId;
  eventId?: string | ObjectId;
  type?: ReviewType[];
  status?: ReviewStatus[];
  ratingMin?: number;
  ratingMax?: number;
  search?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page?: number;
  limit?: number;
  sortBy?: 'overallScore' | 'rating' | 'createdAt' | 'submittedAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface ReviewStats {
  totalReviews: number;
  submitted: number;
  published: number;
  averageRating: number;
  byType: Record<ReviewType, number>;
  byRating: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  byRecommendation: {
    STRONGLY_RECOMMEND: number;
    RECOMMEND: number;
    NEUTRAL: number;
    DO_NOT_RECOMMEND: number;
  };
}

export interface ReviewWithDetails extends Review {
  reviewerDetails: UserSummary;
  revieweeDetails: UserSummary;
  eventDetails: EventSummary;
  assignmentDetails: Assignment;
}

export interface VolunteerReviewSummary {
  volunteerId: string | ObjectId;
  totalReviews: number;
  averageRating: number;
  overallScore: number;
  dimensionScores: Record<ReviewDimension, number>;
  strengths: string[];
  improvements: string[];
  recommendations: {
    STRONGLY_RECOMMEND: number;
    RECOMMEND: number;
    NEUTRAL: number;
    DO_NOT_RECOMMEND: number;
  };
  reviews: Review[];
}

export interface SubmitReview {
  reviewId: string | ObjectId;
  submit: boolean;
}

export interface PublishReview {
  reviewId: string | ObjectId;
  publish: boolean;
}

export interface DeleteReview {
  reviewId: string | ObjectId;
  hardDelete?: boolean;
}

export interface ReviewDimensionConfig {
  name: ReviewDimension;
  label: string;
  description: string;
  weight: number; // for calculating overall score
}

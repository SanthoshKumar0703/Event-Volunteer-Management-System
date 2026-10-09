// ============================================
// ANNOUNCEMENT TYPES
// ============================================

import { ObjectId } from 'mongodb';
import { UserSummary } from './user';
import { EventSummary } from './event';

export type AnnouncementPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';

export interface Announcement {
  _id: string | ObjectId;
  announcementId: string;
  event: string | ObjectId | EventSummary;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  content: string; // Rich text/HTML content
  attachments?: AnnouncementAttachment[];
  tags?: string[];
  isPinned: boolean;
  publishedAt?: Date | string;
  scheduledAt?: Date | string;
  expiresAt?: Date | string;
  createdBy: string | ObjectId | UserSummary;
  readBy: (string | ObjectId | UserSummary)[];
  readCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AnnouncementAttachment {
  _id?: string | ObjectId;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string | ObjectId | UserSummary;
  uploadedAt: Date | string;
}

export interface AnnouncementComment {
  _id?: string | ObjectId;
  announcementId: string | ObjectId;
  comment: string;
  postedBy: string | ObjectId | UserSummary;
  postedAt: Date | string;
  updatedAt?: Date | string;
  likes: (string | ObjectId)[];
  replies: AnnouncementComment[];
}

export interface CreateAnnouncement {
  eventId: string | ObjectId;
  title: string;
  message: string;
  content?: string;
  priority: AnnouncementPriority;
  status?: AnnouncementStatus;
  attachments?: File[] | AnnouncementAttachment[];
  tags?: string[];
  isPinned?: boolean;
  scheduledAt?: Date | string;
  expiresAt?: Date | string;
}

export interface UpdateAnnouncement {
  title?: string;
  message?: string;
  content?: string;
  priority?: AnnouncementPriority;
  status?: AnnouncementStatus;
  attachments?: AnnouncementAttachment[];
  tags?: string[];
  isPinned?: boolean;
  scheduledAt?: Date | string;
  expiresAt?: Date | string;
}

export interface AnnouncementFilter {
  eventId?: string | ObjectId;
  priority?: AnnouncementPriority[];
  status?: AnnouncementStatus[];
  search?: string;
  isPinned?: boolean;
  tags?: string[];
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page?: number;
  limit?: number;
  sortBy?: 'publishedAt' | 'priority' | 'readCount' | 'likeCount';
  sortOrder?: 'ASC' | 'DESC';
}

export interface AnnouncementStats {
  totalAnnouncements: number;
  published: number;
  draft: number;
  archived: number;
  byPriority: Record<AnnouncementPriority, number>;
  totalReads: number;
  totalLikes: number;
  totalComments: number;
}

export interface AnnouncementWithDetails extends Announcement {
  eventDetails: EventSummary;
  creatorDetails: UserSummary;
  isRead: boolean;
  isLiked: boolean;
}

export interface MarkAnnouncementAsRead {
  announcementId: string | ObjectId;
  userId: string | ObjectId;
}

export interface LikeAnnouncement {
  announcementId: string | ObjectId;
  userId: string | ObjectId;
  isLiked: boolean;
}

export interface CommentOnAnnouncement {
  announcementId: string | ObjectId;
  comment: string;
  parentCommentId?: string | ObjectId; // For replies
}

export interface PinAnnouncement {
  announcementId: string | ObjectId;
  isPinned: boolean;
}

export interface PublishAnnouncement {
  announcementId: string | ObjectId;
  publish: boolean;
}

export interface DeleteAnnouncement {
  announcementId: string | ObjectId;
  hardDelete?: boolean; // false = archive, true = permanent delete
}

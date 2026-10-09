// ============================================
// NOTIFICATION TYPES
// ============================================

import { ObjectId } from 'mongodb';
import { UserSummary } from './user';
import { EventSummary } from './event';

export type NotificationType = 
  | 'EVENT'
  | 'APPLICATION'
  | 'ASSIGNMENT'
  | 'TASK'
  | 'ANNOUNCEMENT'
  | 'ATTENDANCE'
  | 'BADGE'
  | 'REVIEW'
  | 'SYSTEM'
  | 'MESSAGE';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Notification {
  _id: string | ObjectId;
  notificationId: string;
  userId: string | ObjectId | UserSummary;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: NotificationData;
  isRead: boolean;
  isArchived: boolean;
  relatedEntityId: string | ObjectId;
  relatedEntityType: 'USER' | 'EVENT' | 'APPLICATION' | 'ASSIGNMENT' | 'TASK' | 'SHIFT' | 'ANNOUNCEMENT' | 'BADGE' | 'REVIEW';
  actionUrl?: string;
  icon?: string;
  color?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  readAt?: Date | string;
  expiresAt?: Date | string;
}

export interface NotificationData {
  eventId?: string | ObjectId;
  eventTitle?: string;
  eventDate?: Date | string;
  applicationId?: string | ObjectId;
  assignmentId?: string | ObjectId;
  taskId?: string | ObjectId;
  taskTitle?: string;
  shiftId?: string | ObjectId;
  announcementId?: string | ObjectId;
  badgeId?: string | ObjectId;
  reviewId?: string | ObjectId;
  fromUserId?: string | ObjectId;
  fromUserName?: string;
  fromUserRole?: string;
  status?: string;
  count?: number;
  [key: string]: any;
}

export interface CreateNotification {
  userId: string | ObjectId;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  data?: NotificationData;
  relatedEntityId: string | ObjectId;
  relatedEntityType: 'USER' | 'EVENT' | 'APPLICATION' | 'ASSIGNMENT' | 'TASK' | 'SHIFT' | 'ANNOUNCEMENT' | 'BADGE' | 'REVIEW';
  actionUrl?: string;
  icon?: string;
  color?: string;
  expiresIn?: number; // in hours
}

export interface NotificationFilter {
  userId?: string | ObjectId;
  type?: NotificationType[];
  priority?: NotificationPriority[];
  isRead?: boolean;
  isArchived?: boolean;
  search?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'priority' | 'isRead';
  sortOrder?: 'ASC' | 'DESC';
}

export interface NotificationStats {
  total: number;
  unread: number;
  archived: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

export interface MarkAsRead {
  notificationId: string | ObjectId;
  userId: string | ObjectId;
}

export interface MarkAllAsRead {
  userId: string | ObjectId;
}

export interface ArchiveNotification {
  notificationId: string | ObjectId;
  userId: string | ObjectId;
  isArchived: boolean;
}

export interface DeleteNotification {
  notificationId: string | ObjectId;
  userId: string | ObjectId;
}

export interface WebSocketNotification {
  type: 'NEW_NOTIFICATION' | 'NOTIFICATION_READ' | 'NOTIFICATION_ARCHIVED' | 'NOTIFICATION_DELETED';
  data: Notification;
  timestamp: Date | string;
}

export interface BrowserNotificationOptions {
  title: string;
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: any;
    vibrate?: number[];
    sound?: string;
  };
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    types: NotificationType[];
  };
  push: {
    enabled: boolean;
    types: NotificationType[];
  };
  inApp: {
    enabled: boolean;
    types: NotificationType[];
  };
  sound: boolean;
  vibration: boolean;
}

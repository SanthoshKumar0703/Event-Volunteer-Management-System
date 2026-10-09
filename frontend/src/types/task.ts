// ============================================
// TASK TYPES
// ============================================

import { ObjectId } from 'mongodb';
import { UserSummary } from './user';
import { EventSummary } from './event';
import { Assignment } from './assignment';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export const TaskPriority = {
  LOW: 'LOW' as TaskPriority,
  MEDIUM: 'MEDIUM' as TaskPriority,
  HIGH: 'HIGH' as TaskPriority,
  URGENT: 'URGENT' as TaskPriority,
};

export type TaskType = 
  | 'SETUP'
  | 'REGISTRATION'
  | 'COORDINATION'
  | 'LOGISTICS'
  | 'TECHNICAL'
  | 'MARKETING'
  | 'CATERING'
  | 'CLEANUP'
  | 'SECURITY'
  | 'OTHER';

export const TaskType = {
  SETUP: 'SETUP' as TaskType,
  REGISTRATION: 'REGISTRATION' as TaskType,
  COORDINATION: 'COORDINATION' as TaskType,
  LOGISTICS: 'LOGISTICS' as TaskType,
  TECHNICAL: 'TECHNICAL' as TaskType,
  MARKETING: 'MARKETING' as TaskType,
  CATERING: 'CATERING' as TaskType,
  CLEANUP: 'CLEANUP' as TaskType,
  SECURITY: 'SECURITY' as TaskType,
  OTHER: 'OTHER' as TaskType,
};

export type TaskStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
export const TaskStatus = {
  PENDING: 'PENDING' as TaskStatus,
  ASSIGNED: 'ASSIGNED' as TaskStatus,
  IN_PROGRESS: 'IN_PROGRESS' as TaskStatus,
  COMPLETED: 'COMPLETED' as TaskStatus,
  CANCELLED: 'CANCELLED' as TaskStatus,
  OVERDUE: 'OVERDUE' as TaskStatus,
};

export interface Task {
  _id: string | ObjectId;
  taskId: string;
  title: string;
  description: string;
  event: string | ObjectId | EventSummary;
  volunteer: string | ObjectId | UserSummary;
  assignment: string | ObjectId | Assignment;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date | string;
  dueTime?: string; // HH:mm format
  startDate?: Date | string;
  estimatedHours?: number;
  actualHours?: number;
  category?: string;
  taskType?: string;
  tags?: string[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  createdBy: string | ObjectId | UserSummary;
  assignedBy?: string | ObjectId | UserSummary;
  completedAt?: Date | string;
  startedAt?: Date | string;
  notes?: string;
  checklist?: TaskChecklistItem[];
  checklists?: TaskChecklistItem[];
  dependencies?: (string | ObjectId)[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TaskAttachment {
  _id?: string | ObjectId;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string | ObjectId | UserSummary;
  uploadedAt: Date | string;
}

export interface TaskComment {
  _id?: string | ObjectId;
  comment: string;
  postedBy: string | ObjectId | UserSummary;
  postedAt: Date | string;
  editedAt?: Date | string;
}

export interface TaskChecklistItem {
  _id?: string | ObjectId;
  title: string;
  isCompleted: boolean;
  completedAt?: Date | string;
  completedBy?: string | ObjectId | UserSummary;
  order: number;
}

export interface CreateTask {
  title: string;
  description: string;
  eventId: string | ObjectId;
  volunteerId: string | ObjectId;
  assignmentId: string | ObjectId;
  priority: TaskPriority;
  dueDate: Date | string;
  dueTime?: string;
  startDate?: Date | string;
  estimatedHours?: number;
  category?: string;
  tags?: string[];
  attachments?: File[] | TaskAttachment[];
  checklist?: Omit<TaskChecklistItem, '_id'>[];
  dependencies?: (string | ObjectId)[];
  notes?: string;
}

export interface UpdateTask {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: Date | string;
  dueTime?: string;
  startDate?: Date | string;
  estimatedHours?: number;
  actualHours?: number;
  category?: string;
  tags?: string[];
  attachments?: TaskAttachment[];
  checklist?: TaskChecklistItem[];
  dependencies?: (string | ObjectId)[];
  notes?: string;
}

export interface TaskFilter {
  eventId?: string | ObjectId;
  volunteerId?: string | ObjectId;
  assignmentId?: string | ObjectId;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  search?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  dueDateFrom?: Date | string;
  dueDateTo?: Date | string;
  category?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'dueDate' | 'priority' | 'status' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

export interface TaskStats {
  totalTasks: number;
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  overdue: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  totalHours: number;
  averageCompletionTime: number;
}

export interface TaskWithDetails extends Task {
  eventDetails: EventSummary;
  volunteerDetails: UserSummary;
  assignmentDetails: Assignment;
  creatorDetails: UserSummary;
}

export interface StartTask {
  taskId: string | ObjectId;
  startedAt?: Date | string;
}

export interface CompleteTask {
  taskId: string | ObjectId;
  actualHours?: number;
  notes?: string;
  completedAt?: Date | string;
}

export interface UpdateTaskStatus {
  taskId: string | ObjectId;
  status: TaskStatus;
  notes?: string;
}

export interface BulkTaskAction {
  taskIds: (string | ObjectId)[];
  action: 'ASSIGN' | 'REASSIGN' | 'CANCEL' | 'SET_PRIORITY';
  volunteerId?: string | ObjectId;
  priority?: TaskPriority;
  notes?: string;
}

export interface TaskProgress {
  task: Task;
  progress: number; // percentage
  timeRemaining?: string;
  isOverdue: boolean;
  daysUntilDue?: number;
}

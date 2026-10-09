// ============================================
// API TYPES
// ============================================

import { User } from './user';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
  errors?: ApiError[];
  meta?: ApiMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface ApiMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: ApiMetadata;
}

export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface SearchRequest extends PaginatedRequest {
  search?: string;
}

export interface FilterRequest extends SearchRequest {
  [key: string]: any;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  deletedId: string;
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
  deletedIds: string[];
}

export interface ExportResponse {
  success: boolean;
  message: string;
  downloadUrl: string;
  fileName: string;
  fileType: string;
}

export interface HealthCheckResponse {
  success: boolean;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  timestamp: string;
  version: string;
  services: {
    database: 'UP' | 'DOWN';
    cache: 'UP' | 'DOWN';
    queue: 'UP' | 'DOWN';
    storage: 'UP' | 'DOWN';
  };
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface StatsResponse {
  success: boolean;
  message: string;
  data: {
    users: number;
    events: number;
    applications: number;
    assignments: number;
    tasks: number;
    announcements: number;
    notifications: number;
    reviews: number;
    badges: number;
  };
}

export interface DashboardStatsResponse {
  success: boolean;
  message: string;
  data: {
    overview: any;
    charts: any;
    recentActivity: any;
    quickActions: any;
  };
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  from?: string;
  to?: string;
}

export interface WebSocketError {
  type: 'ERROR';
  code: string;
  message: string;
  timestamp: string;
}

export interface WebSocketEvent {
  type: 'EVENT';
  event: string;
  data: any;
  timestamp: string;
}

export interface RateLimitResponse {
  success: false;
  message: 'Rate limit exceeded';
  error: {
    code: 'RATE_LIMIT_EXCEEDED';
    message: string;
    retryAfter: number; // seconds
  };
}

export interface ValidationErrorResponse {
  success: false;
  message: 'Validation error';
  errors: {
    field: string;
    message: string;
    code: string;
  }[];
}

export interface AuthenticationErrorResponse {
  success: false;
  message: 'Authentication failed';
  error: {
    code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'TOKEN_EXPIRED' | 'INVALID_TOKEN';
    message: string;
  };
}

export interface NotFoundErrorResponse {
  success: false;
  message: 'Resource not found';
  error: {
    code: 'NOT_FOUND';
    message: string;
    resource: string;
    id: string;
  };
}

export interface ConflictErrorResponse {
  success: false;
  message: 'Conflict';
  error: {
    code: 'CONFLICT';
    message: string;
    resource: string;
    field: string;
  };
}

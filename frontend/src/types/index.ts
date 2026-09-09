/**
 * Authenticated User Profile
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  createdAt: string;
}

/**
 * Email Status Enum matching Prisma backend schema
 */
export enum EmailStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

/**
 * Scheduled or Sent Email Record
 */
export interface EmailRecord {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  jobId: string | null;
  userId: string;
  senderId: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * Single Email Schedule Payload matching backend scheduleEmailSchema
 */
export interface ScheduleEmailPayload {
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string; // ISO-8601 string
}

/**
 * Batch Email Schedule Payload matching backend scheduleBatchEmailSchema
 */
export interface ScheduleBatchPayload {
  recipients: string[];
  subject: string;
  body: string;
  startTime?: string; // ISO-8601 string
  delayBetweenEmailsMs?: number;
}

/**
 * Pagination Metadata from backend
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated API Response matching backend emailController
 */
export interface PaginatedListResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  error?: string;
}

/**
 * Slack Integration Connection Status
 */
export interface SlackStatus {
  connected: boolean;
  teamName: string | null;
  channelName: string | null;
  connectedAt: string | null;
}

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface AuthMeResponse {
  success: boolean;
  authenticated?: boolean;
  user?: User;
  data?: { user: User };
  error?: string;
}

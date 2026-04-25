// ─── Standard API Response Wrapper ────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>; // field-level validation errors
  stack?: string;                      // only in development
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Common Error Codes ────────────────────────────────────────────────────

export enum ErrorCode {
  // Auth
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Business logic
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  PRODUCT_ALREADY_SOLD = 'PRODUCT_ALREADY_SOLD',
  CANNOT_BUY_OWN_PRODUCT = 'CANNOT_BUY_OWN_PRODUCT',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  ORDER_NOT_CANCELLABLE = 'ORDER_NOT_CANCELLABLE',

  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',
}

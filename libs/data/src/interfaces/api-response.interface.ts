/**
 * ============================================
 * API RESPONSE INTERFACES
 * ============================================
 * 
 * Standardized response formats for all API endpoints.
 * Ensures consistent response structure across the application.
 * 
 * RESPONSE STRUCTURE:
 * -------------------
 * 
 * SUCCESS RESPONSE:
 * {
 *   success: true,
 *   data: { ... },
 *   message: "Operation successful",
 *   timestamp: "2024-01-01T00:00:00Z"
 * }
 * 
 * ERROR RESPONSE:
 * {
 *   success: false,
 *   error: {
 *     code: "VALIDATION_ERROR",
 *     message: "Invalid input",
 *     details: [...]
 *   },
 *   timestamp: "2024-01-01T00:00:00Z"
 * }
 * 
 * PAGINATED RESPONSE:
 * {
 *   success: true,
 *   data: [...],
 *   meta: {
 *     page: 1,
 *     limit: 10,
 *     total: 100,
 *     totalPages: 10
 *   }
 * }
 */

/**
 * Base API response interface
 */
export interface IApiResponse<T = any> {
  /**
   * Whether the request was successful
   */
  success: boolean;

  /**
   * Response payload (on success)
   */
  data?: T;

  /**
   * Success message
   */
  message?: string;

  /**
   * Error details (on failure)
   */
  error?: IApiError;

  /**
   * Response timestamp
   */
  timestamp: string;
}

/**
 * Error details structure
 */
export interface IApiError {
  /**
   * Error code for programmatic handling
   */
  code: string;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Additional error details (e.g., validation errors)
   */
  details?: any[];

  /**
   * Stack trace (only in development)
   */
  stack?: string;
}

/**
 * Pagination metadata
 */
export interface IPaginationMeta {
  /**
   * Current page number (1-indexed)
   */
  page: number;

  /**
   * Items per page
   */
  limit: number;

  /**
   * Total number of items
   */
  total: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Whether there's a next page
   */
  hasNext: boolean;

  /**
   * Whether there's a previous page
   */
  hasPrev: boolean;
}

/**
 * Paginated response interface
 */
export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  /**
   * Pagination metadata
   */
  meta: IPaginationMeta;
}

/**
 * Query parameters for pagination
 */
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Common error codes
 */
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // Authorization errors
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

/**
 * Helper function to create success response
 */
export function createSuccessResponse<T>(
  data: T, 
  message?: string
): IApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper function to create error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any[]
): IApiResponse {
  return {
    success: false,
    error: { code, message, details },
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper function to create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): IPaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    timestamp: new Date().toISOString()
  };
}

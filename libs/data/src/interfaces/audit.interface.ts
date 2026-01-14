/**
 * ============================================
 * AUDIT LOG INTERFACE
 * ============================================
 * 
 * Defines the structure for audit logs.
 * Tracks all important actions in the system for security and compliance.
 * 
 * WHAT GETS LOGGED:
 * -----------------
 * • Authentication events (login, logout, failed attempts)
 * • Task CRUD operations
 * • User management actions
 * • Permission changes
 * • Access denials
 * 
 * LOG ENTRY STRUCTURE:
 * --------------------
 * ┌─────────────────────────────────────┐
 * │            AUDIT_LOGS               │
 * ├─────────────────────────────────────┤
 * │ id           │ UUID (PK)            │
 * │ action       │ VARCHAR(50)          │
 * │ resource     │ VARCHAR(50)          │
 * │ resourceId   │ UUID                 │
 * │ userId       │ UUID (FK)            │
 * │ orgId        │ UUID (FK)            │
 * │ details      │ JSON                 │
 * │ ipAddress    │ VARCHAR(45)          │
 * │ userAgent    │ TEXT                 │
 * │ success      │ BOOLEAN              │
 * │ createdAt    │ TIMESTAMP            │
 * └─────────────────────────────────────┘
 * 
 * MOCK DATA EXAMPLE:
 * ------------------
 * ```typescript
 * const auditLog: IAuditLog = {
 *   id: 'log-001',
 *   action: AuditAction.CREATE,
 *   resource: AuditResource.TASK,
 *   resourceId: 'task-123',
 *   userId: 'user-456',
 *   organizationId: 'org-789',
 *   details: {
 *     title: 'New Task Created',
 *     previousValue: null,
 *     newValue: { title: 'Implement feature X' }
 *   },
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...',
 *   success: true,
 *   createdAt: new Date()
 * };
 * ```
 */

/**
 * Types of actions that can be audited
 */
export enum AuditAction {
  // CRUD Actions
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  
  // Auth Actions
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  
  // Access Control Actions
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  
  // Special Actions
  BULK_UPDATE = 'BULK_UPDATE',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT'
}

/**
 * Resources that can be audited
 */
export enum AuditResource {
  TASK = 'TASK',
  USER = 'USER',
  ORGANIZATION = 'ORGANIZATION',
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  AUTH = 'AUTH'
}

/**
 * Main Audit Log interface
 */
export interface IAuditLog {
  /**
   * Unique identifier for the log entry
   */
  id: string;

  /**
   * Type of action performed
   */
  action: AuditAction;

  /**
   * Type of resource affected
   */
  resource: AuditResource;

  /**
   * ID of the specific resource affected
   */
  resourceId?: string;

  /**
   * ID of the user who performed the action
   * Null for system-generated events or failed auth
   */
  userId?: string | null;

  /**
   * Email of the user (for quick reference)
   */
  userEmail?: string;

  /**
   * Organization context for the action
   */
  organizationId?: string | null;

  /**
   * Additional details about the action
   * Can include before/after values, error messages, etc.
   */
  details?: Record<string, any>;

  /**
   * IP address of the request
   */
  ipAddress?: string;

  /**
   * User agent string from the request
   */
  userAgent?: string;

  /**
   * Whether the action was successful
   */
  success: boolean;

  /**
   * Error message if action failed
   */
  errorMessage?: string;

  /**
   * Timestamp when the action occurred
   */
  createdAt: Date;
}

/**
 * Create audit log input
 */
export interface ICreateAuditLog {
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  userId?: string | null;
  userEmail?: string;
  organizationId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Audit log query filters
 */
export interface IAuditLogFilter {
  action?: AuditAction;
  resource?: AuditResource;
  userId?: string;
  organizationId?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

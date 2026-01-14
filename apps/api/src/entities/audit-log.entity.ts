/**
 * ============================================
 * AUDIT LOG ENTITY
 * ============================================
 * 
 * Database table: audit_logs
 * 
 * PRIMARY KEY: auditLogId (UUID)
 * 
 * PURPOSE:
 * Records all important actions in the system for:
 * - Security auditing
 * - Compliance requirements
 * - Debugging and troubleshooting
 * - Activity monitoring
 * 
 * WHAT GETS LOGGED:
 * - Login/logout attempts (success and failure)
 * - Task create/update/delete operations
 * - User management operations
 * - Permission denied events
 * 
 * COLUMNS:
 * - auditLogId: Primary key (UUID)
 * - action: What action was performed (LOGIN, TASK_CREATED, etc.)
 * - resource: What type of resource was affected (user, task, etc.)
 * - resourceId: ID of the affected resource
 * - userId: FK to users table (who performed the action)
 * - userEmail: Email for quick reference (denormalized)
 * - organizationId: FK to organizations table
 * - details: JSON string with additional details
 * - ipAddress: IP address of the request
 * - userAgent: Browser/client information
 * - success: Whether the action succeeded
 * - errorMessage: Error message if action failed
 * - createdAt: When the action occurred
 * 
 * NOTE: This table is append-only (write-only)
 * Records should never be updated or deleted
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['createdAt']) // For time-based queries
@Index(['userId']) // For user activity queries
@Index(['resource', 'resourceId']) // For resource history queries
export class AuditLog {
  /**
   * PRIMARY KEY
   * Auto-generated UUID for each audit log entry
   */
  @PrimaryGeneratedColumn('uuid', { name: 'audit_log_id' })
  auditLogId: string;

  /**
   * The action that was performed
   * Examples: LOGIN, LOGOUT, TASK_CREATED, TASK_UPDATED, 
   *           TASK_DELETED, USER_CREATED, ACCESS_DENIED
   */
  @Column()
  action: string;

  /**
   * The type of resource affected
   * Examples: user, task, organization, auth
   */
  @Column()
  resource: string;

  /**
   * The ID of the affected resource
   * Can be null for general actions like login
   */
  @Column({ name: 'resource_id', nullable: true })
  resourceId: string | null;

  /**
   * FOREIGN KEY: The user who performed the action
   * References: users.user_id
   * Can be null for anonymous actions
   */
  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  /**
   * Email of the user (denormalized for quick reference)
   * Stored so we have history even if user is deleted
   */
  @Column({ name: 'user_email', nullable: true })
  userEmail: string | null;

  /**
   * FOREIGN KEY: The organization context
   * References: organizations.organization_id
   */
  @Column({ name: 'organization_id', nullable: true })
  organizationId: string | null;

  /**
   * Additional details stored as JSON string
   * Examples:
   * - For updates: { before: {...}, after: {...} }
   * - For logins: { method: "password" }
   * - For errors: { reason: "..." }
   */
  @Column({ type: 'text', nullable: true })
  details: string | null;

  /**
   * IP address of the client
   */
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string | null;

  /**
   * User agent string (browser/client info)
   */
  @Column({ name: 'user_agent', nullable: true })
  userAgent: string | null;

  /**
   * Whether the action was successful
   */
  @Column({ default: true })
  success: boolean;

  /**
   * Error message if the action failed
   */
  @Column({ name: 'error_message', nullable: true })
  errorMessage: string | null;

  /**
   * Timestamp when the action occurred
   * Only created, never updated (append-only table)
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Parse the details JSON string
   */
  getDetailsObject(): Record<string, any> | null {
    if (!this.details) return null;
    try {
      return JSON.parse(this.details);
    } catch {
      return null;
    }
  }

  /**
   * Set details from an object
   */
  setDetailsObject(obj: Record<string, any>): void {
    this.details = JSON.stringify(obj);
  }
}

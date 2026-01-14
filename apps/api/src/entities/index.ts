/**
 * ============================================
 * ENTITIES INDEX (Barrel Export)
 * ============================================
 * 
 * Export all database entities from a single location.
 * 
 * Usage:
 * import { User, Task, Organization, AuditLog } from './entities';
 * 
 * PRIMARY KEY NAMING CONVENTION:
 * - User: userId
 * - Organization: organizationId
 * - Task: taskId
 * - AuditLog: auditLogId
 */

export * from './user.entity';
export * from './organization.entity';
export * from './task.entity';
export * from './audit-log.entity';

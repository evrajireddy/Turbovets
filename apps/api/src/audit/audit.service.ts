/**
 * ============================================
 * AUDIT SERVICE
 * ============================================
 * 
 * Logs all important actions in the system:
 * - Login/logout events
 * - CRUD operations on tasks, users, organizations
 * - Access denied events
 * - System errors
 * 
 * This is a GLOBAL service available to all modules.
 * 
 * LOGGED INFORMATION:
 * - What: action, resource, resourceId
 * - Who: userId, userEmail
 * - Where: organizationId, ipAddress
 * - When: createdAt (automatic)
 * - How: success/failure, details
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { IUser, Role } from '@libs/data';

export interface LogEntry {
  action: string;
  resource: string;
  resourceId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  organizationId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  success?: boolean;
  errorMessage?: string | null;
}

export interface AuditQueryOptions {
  action?: string;
  resource?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Log an action to the audit trail
   * 
   * @param entry - The log entry data
   */
  async log(entry: LogEntry): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId || null,
      userId: entry.userId || null,
      userEmail: entry.userEmail || null,
      organizationId: entry.organizationId || null,
      details: entry.details || null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      success: entry.success !== undefined ? entry.success : true,
      errorMessage: entry.errorMessage || null,
    });

    const saved = await this.auditLogRepository.save(auditLog);

    // Also log to console for development
    const emoji = entry.success !== false ? '✅' : '❌';
    console.log(
      `${emoji} AUDIT: ${entry.action} | ${entry.resource} | User: ${entry.userEmail || 'anonymous'}`,
    );

    return saved;
  }

  /**
   * Get audit logs with filters
   */
  async findAll(
    options: AuditQueryOptions,
    currentUser: IUser,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const { action, resource, userId, startDate, endDate, page = 1, limit = 50 } = options;

    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

    // Filter by accessible organizations (non-owners can only see their org's logs)
    if (currentUser.role !== Role.OWNER) {
      queryBuilder.where('audit.organization_id = :orgId', { orgId: currentUser.organizationId });
    }

    // Apply filters
    if (action) {
      queryBuilder.andWhere('audit.action = :action', { action });
    }
    if (resource) {
      queryBuilder.andWhere('audit.resource = :resource', { resource });
    }
    if (userId) {
      queryBuilder.andWhere('audit.user_id = :userId', { userId });
    }
    if (startDate) {
      queryBuilder.andWhere('audit.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('audit.created_at <= :endDate', { endDate });
    }

    // Order and paginate
    queryBuilder
      .orderBy('audit.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return { data: logs, total };
  }

  /**
   * Get audit logs for a specific resource
   */
  async findByResource(
    resourceType: string,
    resourceId: string,
    currentUser: IUser,
  ): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.resource = :resourceType', { resourceType })
      .andWhere('audit.resource_id = :resourceId', { resourceId });

    // Filter by organization for non-owners
    if (currentUser.role !== Role.OWNER) {
      queryBuilder.andWhere('audit.organization_id = :orgId', { 
        orgId: currentUser.organizationId 
      });
    }

    return queryBuilder.orderBy('audit.created_at', 'DESC').getMany();
  }

  /**
   * Get audit logs for a specific user
   */
  async findByUser(userId: string, currentUser: IUser): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.user_id = :userId', { userId });

    // Filter by organization for non-owners
    if (currentUser.role !== Role.OWNER) {
      queryBuilder.andWhere('audit.organization_id = :orgId', { 
        orgId: currentUser.organizationId 
      });
    }

    return queryBuilder.orderBy('audit.created_at', 'DESC').limit(100).getMany();
  }

  /**
   * Get login history for a user
   */
  async getLoginHistory(userId: string, currentUser: IUser): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.user_id = :userId', { userId })
      .andWhere('audit.action IN (:...actions)', { 
        actions: ['LOGIN', 'LOGOUT', 'LOGIN_FAILED'] 
      });

    // Filter by organization for non-owners
    if (currentUser.role !== Role.OWNER) {
      queryBuilder.andWhere('audit.organization_id = :orgId', { 
        orgId: currentUser.organizationId 
      });
    }

    return queryBuilder.orderBy('audit.created_at', 'DESC').limit(50).getMany();
  }

  /**
   * Get recent failed login attempts
   */
  async getFailedLogins(currentUser: IUser): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .where('audit.action = :action', { action: 'LOGIN_FAILED' })
      .andWhere('audit.success = :success', { success: false });

    // Filter by organization for non-owners
    if (currentUser.role !== Role.OWNER) {
      queryBuilder.andWhere('audit.organization_id = :orgId', { 
        orgId: currentUser.organizationId 
      });
    }

    return queryBuilder.orderBy('audit.created_at', 'DESC').limit(50).getMany();
  }
}

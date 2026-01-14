/**
 * ============================================
 * AUDIT CONTROLLER
 * ============================================
 * 
 * Exposes audit log endpoints to authorized users.
 * Only OWNER and ADMIN roles can access audit logs.
 * 
 * ENDPOINTS:
 * ----------
 * GET /audit-log         - Get audit logs (paginated)
 * GET /audit-log/:id     - Get specific audit entry
 * GET /audit-log/user/:userId - Get user's activity
 * GET /audit-log/resource/:type/:id - Get resource history
 * 
 * ACCESS CONTROL:
 * ---------------
 * • OWNER: Can see all audit logs in their organization hierarchy
 * • ADMIN: Can see audit logs in their organization
 * • VIEWER: No access to audit logs
 * 
 * MOCK EXAMPLE:
 * -------------
 * GET /audit-log?limit=20&offset=0&resource=TASK
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "data": [
 *       {
 *         "id": "audit-123",
 *         "action": "CREATE",
 *         "resource": "TASK",
 *         "resourceId": "task-456",
 *         "userId": "user-789",
 *         "userEmail": "admin@example.com",
 *         "success": true,
 *         "createdAt": "2024-01-15T10:30:00Z"
 *       }
 *     ],
 *     "total": 150,
 *     "limit": 20,
 *     "offset": 0
 *   }
 * }
 */

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe
} from '@nestjs/common';
import { AuditService, AuditLogQueryOptions } from './audit.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '@libs/auth';
import { Role, AuditResource, AuditAction, IApiResponse } from '@libs/data';

/**
 * Query DTO for audit log listing
 */
class AuditLogQueryDto {
  limit?: number;
  offset?: number;
  resource?: AuditResource;
  action?: AuditAction;
  userId?: string;
  startDate?: string;
  endDate?: string;
  success?: string;
}

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER, Role.ADMIN) // Only OWNER and ADMIN can access
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit-log
   * 
   * Get paginated audit logs
   * Filters applied based on query parameters
   */
  @Get()
  async findAll(
    @Query() query: AuditLogQueryDto,
    @CurrentUser() user: any
  ): Promise<IApiResponse<any>> {
    const options: AuditLogQueryOptions = {
      limit: query.limit ? parseInt(String(query.limit)) : 50,
      offset: query.offset ? parseInt(String(query.offset)) : 0
    };

    // Apply filters
    if (query.resource) options.resource = query.resource;
    if (query.action) options.action = query.action;
    if (query.userId) options.userId = query.userId;
    if (query.startDate) options.startDate = new Date(query.startDate);
    if (query.endDate) options.endDate = new Date(query.endDate);
    if (query.success !== undefined) {
      options.success = query.success === 'true';
    }

    // Scope to user's organization (unless OWNER of parent org)
    if (user.role !== Role.OWNER) {
      options.organizationId = user.organizationId;
    }

    const result = await this.auditService.findAll(options);

    return {
      success: true,
      data: result,
      message: 'Audit logs retrieved successfully'
    };
  }

  /**
   * GET /audit-log/user/:userId
   * 
   * Get audit logs for a specific user
   */
  @Get('user/:userId')
  async findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: any
  ): Promise<IApiResponse<any>> {
    const logs = await this.auditService.findByUser(userId);

    return {
      success: true,
      data: logs,
      message: 'User audit logs retrieved successfully'
    };
  }

  /**
   * GET /audit-log/resource/:type/:id
   * 
   * Get audit history for a specific resource
   */
  @Get('resource/:type/:id')
  async findByResource(
    @Param('type') resourceType: AuditResource,
    @Param('id', ParseUUIDPipe) resourceId: string
  ): Promise<IApiResponse<any>> {
    const logs = await this.auditService.findByResource(
      resourceType,
      resourceId
    );

    return {
      success: true,
      data: logs,
      message: 'Resource audit logs retrieved successfully'
    };
  }

  /**
   * GET /audit-log/login-history/:userId
   * 
   * Get login history for a user
   */
  @Get('login-history/:userId')
  async getLoginHistory(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('days') days?: string
  ): Promise<IApiResponse<any>> {
    const daysNum = days ? parseInt(days) : 30;
    const logs = await this.auditService.getLoginHistory(userId, daysNum);

    return {
      success: true,
      data: logs,
      message: 'Login history retrieved successfully'
    };
  }

  /**
   * GET /audit-log/failed-logins
   * 
   * Get recent failed login attempts (security monitoring)
   */
  @Get('failed-logins')
  @Roles(Role.OWNER) // Only OWNER can see all failed logins
  async getFailedLogins(
    @Query('email') email?: string,
    @Query('hours') hours?: string
  ): Promise<IApiResponse<any>> {
    const hoursNum = hours ? parseInt(hours) : 24;
    const logs = await this.auditService.getFailedLogins(email, hoursNum);

    return {
      success: true,
      data: logs,
      message: 'Failed login attempts retrieved successfully'
    };
  }
}

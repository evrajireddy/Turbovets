/**
 * ============================================
 * PERMISSIONS GUARD
 * ============================================
 * 
 * Checks if the user has specific permissions to access a route.
 * More granular than role-based checks.
 * 
 * PERMISSION CHECK LOGIC:
 * -----------------------
 * 
 *   1. Get required permissions from @RequirePermissions() decorator
 *   2. Get user's role from request
 *   3. Look up permissions for that role in ROLE_PERMISSIONS map
 *   4. Check if ALL required permissions are present
 *   5. Allow if all permissions present, deny otherwise
 * 
 * MOCK EXAMPLE:
 * -------------
 * ```typescript
 * // User with ADMIN role
 * const user = { role: Role.ADMIN };
 * 
 * // ADMIN permissions include: TASK_CREATE, TASK_READ, TASK_UPDATE, TASK_DELETE
 * 
 * // Endpoint requires TASK_DELETE
 * @RequirePermissions(Permission.TASK_DELETE)
 * deleteTask() { ... }
 * 
 * // Check: Does ADMIN have TASK_DELETE? YES → Allow
 * ```
 * 
 * USAGE:
 * ------
 * ```typescript
 * @Controller('audit')
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * export class AuditController {
 *   
 *   @Get()
 *   @RequirePermissions(Permission.AUDIT_READ)
 *   getAuditLogs() {
 *     // Only users with AUDIT_READ permission can access
 *     return this.auditService.findAll();
 *   }
 * }
 * ```
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, ROLE_PERMISSIONS, hasPermission } from '@libs/data';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Check if user has required permissions
   * 
   * @param context - Execution context
   * @returns boolean - true if allowed
   */
  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no permissions required, allow
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user's permissions based on role
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];

    // Check if user has ALL required permissions
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        p => !userPermissions.includes(p)
      );
      throw new ForbiddenException(
        `Missing permissions: ${missingPermissions.join(', ')}`
      );
    }

    return true;
  }
}

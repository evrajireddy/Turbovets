/**
 * ============================================
 * ROLES GUARD
 * ============================================
 * 
 * Checks if the authenticated user has the required role(s) to access a route.
 * Works with the @Roles() decorator.
 * 
 * ROLE HIERARCHY CHECK:
 * ---------------------
 * 
 *   User Role       Required Role     Result
 *   ─────────────────────────────────────────
 *   OWNER           VIEWER            ✓ Allow (higher role)
 *   OWNER           ADMIN             ✓ Allow (higher role)
 *   OWNER           OWNER             ✓ Allow (exact match)
 *   ADMIN           VIEWER            ✓ Allow (higher role)
 *   ADMIN           ADMIN             ✓ Allow (exact match)
 *   ADMIN           OWNER             ✗ Deny (lower role)
 *   VIEWER          VIEWER            ✓ Allow (exact match)
 *   VIEWER          ADMIN             ✗ Deny (lower role)
 *   VIEWER          OWNER             ✗ Deny (lower role)
 * 
 * USAGE EXAMPLE:
 * --------------
 * ```typescript
 * @Controller('users')
 * @UseGuards(JwtAuthGuard, RolesGuard)  // Apply both guards
 * export class UsersController {
 *   
 *   @Delete(':id')
 *   @Roles(Role.OWNER)  // Only owners can delete users
 *   deleteUser(@Param('id') id: string) {
 *     return this.userService.delete(id);
 *   }
 *   
 *   @Get()
 *   @Roles(Role.ADMIN, Role.OWNER)  // Admins and owners can list users
 *   listUsers() {
 *     return this.userService.findAll();
 *   }
 * }
 * ```
 * 
 * MOCK FLOW:
 * ----------
 * 1. Request: DELETE /users/123
 * 2. @Roles(Role.OWNER) requires OWNER role
 * 3. User has role ADMIN
 * 4. RolesGuard checks: ADMIN >= OWNER? No
 * 5. Throw ForbiddenException
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, isRoleHigherOrEqual } from '@libs/data';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Check if user has required role
   * 
   * @param context - Execution context
   * @returns boolean - true if allowed, false if denied
   */
  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (attached by JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user, deny access
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user's role matches any required role
    // Also check role hierarchy (e.g., OWNER can do anything ADMIN can do)
    const hasRole = requiredRoles.some(requiredRole => {
      // Exact match
      if (user.role === requiredRole) {
        return true;
      }
      
      // Hierarchy check - user's role is higher or equal
      return isRoleHigherOrEqual(user.role, requiredRole);
    });

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role: ${requiredRoles.join(' or ')}. Your role: ${user.role}`
      );
    }

    return true;
  }
}

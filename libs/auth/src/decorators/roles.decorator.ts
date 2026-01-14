/**
 * ============================================
 * ROLES DECORATOR
 * ============================================
 * 
 * Custom decorator to specify which roles can access an endpoint.
 * Works in conjunction with RolesGuard.
 * 
 * HOW IT WORKS:
 * -------------
 * 1. Decorator stores required roles as metadata on the route handler
 * 2. RolesGuard reads this metadata at runtime
 * 3. Guard checks if user's role matches any required role
 * 
 * USAGE EXAMPLE:
 * --------------
 * ```typescript
 * @Controller('tasks')
 * export class TasksController {
 *   
 *   // Only Owners and Admins can delete tasks
 *   @Delete(':id')
 *   @Roles(Role.OWNER, Role.ADMIN)
 *   deleteTask(@Param('id') id: string) {
 *     return this.taskService.delete(id);
 *   }
 *   
 *   // All authenticated users can read tasks
 *   @Get()
 *   @Roles(Role.OWNER, Role.ADMIN, Role.VIEWER)
 *   getTasks() {
 *     return this.taskService.findAll();
 *   }
 * }
 * ```
 * 
 * MOCK FLOW:
 * ----------
 * Request comes in → @Roles(ADMIN) → RolesGuard checks → 
 * If user.role === ADMIN → Allow
 * If user.role !== ADMIN → Throw ForbiddenException
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '@libs/data';

/**
 * Metadata key for storing roles
 * This key is used by RolesGuard to retrieve the required roles
 */
export const ROLES_KEY = 'roles';

/**
 * Roles decorator
 * 
 * @param roles - Array of roles that can access the endpoint
 * @returns Decorator function
 * 
 * @example
 * // Single role
 * @Roles(Role.ADMIN)
 * 
 * // Multiple roles
 * @Roles(Role.OWNER, Role.ADMIN)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

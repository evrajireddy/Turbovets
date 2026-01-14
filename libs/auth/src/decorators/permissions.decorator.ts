/**
 * ============================================
 * PERMISSIONS DECORATOR
 * ============================================
 * 
 * Custom decorator for fine-grained permission checks.
 * More specific than role-based checks.
 * 
 * ROLES vs PERMISSIONS:
 * ---------------------
 * 
 * ROLES (Coarse-grained):
 *   - User IS an Admin
 *   - User IS a Viewer
 *   
 * PERMISSIONS (Fine-grained):
 *   - User CAN create tasks
 *   - User CAN delete users
 *   - User CAN view audit logs
 * 
 * WHY USE PERMISSIONS?
 * --------------------
 * - More flexible than roles alone
 * - Can assign specific permissions without full role
 * - Easier to audit "who can do what"
 * - Supports future custom role creation
 * 
 * USAGE EXAMPLE:
 * --------------
 * ```typescript
 * @Controller('tasks')
 * export class TasksController {
 *   
 *   // Requires specific permission to create
 *   @Post()
 *   @RequirePermissions(Permission.TASK_CREATE)
 *   createTask(@Body() dto: CreateTaskDto) {
 *     return this.taskService.create(dto);
 *   }
 *   
 *   // Requires multiple permissions
 *   @Delete(':id')
 *   @RequirePermissions(Permission.TASK_DELETE, Permission.TASK_READ)
 *   deleteTask(@Param('id') id: string) {
 *     return this.taskService.delete(id);
 *   }
 * }
 * ```
 */

import { SetMetadata } from '@nestjs/common';
import { Permission } from '@libs/data';

/**
 * Metadata key for storing required permissions
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Permissions decorator
 * 
 * @param permissions - Array of permissions required
 * @returns Decorator function
 * 
 * @example
 * @RequirePermissions(Permission.TASK_CREATE)
 * @RequirePermissions(Permission.TASK_DELETE, Permission.AUDIT_READ)
 */
export const RequirePermissions = (...permissions: Permission[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

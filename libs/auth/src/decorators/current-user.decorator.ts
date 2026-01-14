/**
 * ============================================
 * CURRENT USER DECORATOR
 * ============================================
 * 
 * Extracts the authenticated user from the request object.
 * After JWT authentication, the user is attached to the request.
 * This decorator provides clean access to that user.
 * 
 * HOW IT WORKS:
 * -------------
 * 
 *   1. User sends request with JWT token
 *   2. JwtGuard validates token
 *   3. JwtStrategy extracts user from token payload
 *   4. User is attached to request.user
 *   5. @CurrentUser() decorator extracts request.user
 * 
 *   Request → JwtGuard → JwtStrategy → request.user → @CurrentUser()
 * 
 * USAGE EXAMPLE:
 * --------------
 * ```typescript
 * @Controller('tasks')
 * export class TasksController {
 *   
 *   @Post()
 *   createTask(
 *     @CurrentUser() user: IUser,  // ← Extracted user
 *     @Body() dto: CreateTaskDto
 *   ) {
 *     // user.id, user.role, user.organizationId available
 *     return this.taskService.create(dto, user);
 *   }
 *   
 *   // Can also extract specific property
 *   @Get('my-tasks')
 *   getMyTasks(@CurrentUser('id') userId: string) {
 *     return this.taskService.findByUser(userId);
 *   }
 * }
 * ```
 * 
 * MOCK EXAMPLE:
 * -------------
 * ```typescript
 * // The decorator extracts this from the request:
 * const user = {
 *   id: 'user-123',
 *   email: 'admin@example.com',
 *   role: Role.ADMIN,
 *   organizationId: 'org-456',
 *   firstName: 'John',
 *   lastName: 'Doe'
 * };
 * ```
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser decorator
 * 
 * @param data - Optional property name to extract (e.g., 'id', 'email')
 * @returns The user object or specific property
 * 
 * @example
 * // Get entire user object
 * @CurrentUser() user: IUser
 * 
 * // Get specific property
 * @CurrentUser('id') userId: string
 * @CurrentUser('role') role: Role
 * @CurrentUser('organizationId') orgId: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // Get the request object from the execution context
    const request = ctx.switchToHttp().getRequest();
    
    // Get the user object (attached by JwtStrategy)
    const user = request.user;
    
    // If no user, return undefined
    if (!user) {
      return undefined;
    }
    
    // If specific property requested, return just that property
    if (data) {
      return user[data];
    }
    
    // Return entire user object
    return user;
  }
);

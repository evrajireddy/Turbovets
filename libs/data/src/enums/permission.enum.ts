/**
 * ============================================
 * PERMISSION ENUM
 * ============================================
 * 
 * Defines granular permissions for RBAC (Role-Based Access Control).
 * Permissions are assigned to roles, and roles are assigned to users.
 * 
 * PERMISSION STRUCTURE:
 * ---------------------
 * Each permission follows the pattern: RESOURCE_ACTION
 * 
 * MOCK USAGE EXAMPLE:
 * -------------------
 * ```typescript
 * // Check if user has permission to delete a task
 * const userPermissions = [Permission.TASK_READ, Permission.TASK_UPDATE];
 * 
 * if (userPermissions.includes(Permission.TASK_DELETE)) {
 *   deleteTask(taskId);
 * } else {
 *   throw new Error('Permission denied');
 * }
 * ```
 */
export enum Permission {
  // ========== TASK PERMISSIONS ==========
  /**
   * Can create new tasks
   * Granted to: OWNER, ADMIN
   */
  TASK_CREATE = 'task:create',
  
  /**
   * Can read/view tasks
   * Granted to: OWNER, ADMIN, VIEWER
   */
  TASK_READ = 'task:read',
  
  /**
   * Can update existing tasks
   * Granted to: OWNER, ADMIN
   */
  TASK_UPDATE = 'task:update',
  
  /**
   * Can delete tasks
   * Granted to: OWNER, ADMIN
   */
  TASK_DELETE = 'task:delete',

  // ========== USER PERMISSIONS ==========
  /**
   * Can create new users in organization
   * Granted to: OWNER, ADMIN
   */
  USER_CREATE = 'user:create',
  
  /**
   * Can read user details
   * Granted to: OWNER, ADMIN
   */
  USER_READ = 'user:read',
  
  /**
   * Can update user details
   * Granted to: OWNER, ADMIN (only for users in their org)
   */
  USER_UPDATE = 'user:update',
  
  /**
   * Can delete users
   * Granted to: OWNER only
   */
  USER_DELETE = 'user:delete',

  // ========== ORGANIZATION PERMISSIONS ==========
  /**
   * Can read organization details
   * Granted to: All members
   */
  ORG_READ = 'org:read',
  
  /**
   * Can update organization settings
   * Granted to: OWNER only
   */
  ORG_UPDATE = 'org:update',
  
  /**
   * Can manage organization structure
   * Granted to: OWNER only
   */
  ORG_MANAGE = 'org:manage',

  // ========== AUDIT PERMISSIONS ==========
  /**
   * Can view audit logs
   * Granted to: OWNER, ADMIN
   */
  AUDIT_READ = 'audit:read'
}

/**
 * Maps roles to their permissions
 * This is the core RBAC configuration
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [
    // All task permissions
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    // All user permissions
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    // All org permissions
    Permission.ORG_READ,
    Permission.ORG_UPDATE,
    Permission.ORG_MANAGE,
    // Audit permission
    Permission.AUDIT_READ
  ],
  admin: [
    // Task permissions (all)
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    // User permissions (limited)
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    // Org permissions (read only)
    Permission.ORG_READ,
    // Audit permission
    Permission.AUDIT_READ
  ],
  viewer: [
    // Read-only permissions
    Permission.TASK_READ,
    Permission.USER_READ,
    Permission.ORG_READ
  ]
};

/**
 * Helper function to check if a role has a specific permission
 * 
 * @example
 * hasPermission('admin', Permission.TASK_DELETE) // true
 * hasPermission('viewer', Permission.TASK_DELETE) // false
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role.toLowerCase()];
  return permissions ? permissions.includes(permission) : false;
}

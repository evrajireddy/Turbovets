/**
 * ============================================
 * ROLE ENUM
 * ============================================
 * 
 * Defines the hierarchical roles in the system.
 * 
 * HIERARCHY (highest to lowest):
 * 1. OWNER   - Full control over organization and all tasks
 * 2. ADMIN   - Can manage users and tasks within org
 * 3. VIEWER  - Can only view tasks, no modifications
 * 
 * MOCK USAGE EXAMPLE:
 * -------------------
 * ```typescript
 * const user = {
 *   id: '123',
 *   name: 'John Doe',
 *   role: Role.ADMIN,  // This user is an admin
 *   organizationId: 'org-456'
 * };
 * 
 * // Check if user can delete tasks
 * if (user.role === Role.OWNER || user.role === Role.ADMIN) {
 *   console.log('User can delete tasks');
 * }
 * ```
 */
export enum Role {
  /**
   * OWNER - Highest privilege level
   * Can: Create/Read/Update/Delete all resources
   * Can: Manage organization settings
   * Can: Assign roles to other users
   * Can: View audit logs
   */
  OWNER = 'owner',

  /**
   * ADMIN - Mid privilege level
   * Can: Create/Read/Update/Delete tasks
   * Can: Manage users in organization
   * Can: View audit logs
   * Cannot: Delete organization
   * Cannot: Change owner
   */
  ADMIN = 'admin',

  /**
   * VIEWER - Lowest privilege level
   * Can: Read tasks assigned to them
   * Cannot: Create/Update/Delete tasks
   * Cannot: Manage users
   * Cannot: View audit logs
   */
  VIEWER = 'viewer'
}

/**
 * Role hierarchy mapping for permission inheritance
 * Higher number = higher privilege
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.OWNER]: 3,
  [Role.ADMIN]: 2,
  [Role.VIEWER]: 1
};

/**
 * Helper function to check if one role is higher than another
 * 
 * @example
 * isRoleHigherOrEqual(Role.OWNER, Role.ADMIN) // true
 * isRoleHigherOrEqual(Role.VIEWER, Role.ADMIN) // false
 */
export function isRoleHigherOrEqual(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

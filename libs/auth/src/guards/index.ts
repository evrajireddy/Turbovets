/**
 * ============================================
 * GUARDS BARREL EXPORT
 * ============================================
 * 
 * Guard execution order (when stacked):
 * 
 * 1. JwtAuthGuard     → Verify JWT token
 * 2. RolesGuard       → Check user role
 * 3. PermissionsGuard → Check specific permissions
 * 4. OrgAccessGuard   → Check organization access
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
 */

export * from './jwt-auth.guard';
export * from './roles.guard';
export * from './permissions.guard';
export * from './organization-access.guard';

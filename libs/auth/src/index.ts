/**
 * ============================================
 * AUTH LIBRARY - MAIN EXPORT
 * ============================================
 * 
 * Reusable authentication and authorization library.
 * Contains all RBAC logic, decorators, and guards.
 * 
 * USAGE:
 * ------
 * ```typescript
 * import {
 *   // Decorators
 *   Roles,
 *   RequirePermissions,
 *   CurrentUser,
 *   Public,
 *   
 *   // Guards
 *   JwtAuthGuard,
 *   RolesGuard,
 *   PermissionsGuard,
 *   
 *   // Strategy
 *   JwtStrategy,
 *   
 *   // Constants
 *   ROLES_KEY,
 *   PERMISSIONS_KEY,
 *   IS_PUBLIC_KEY
 * } from '@libs/auth';
 * ```
 * 
 * LIBRARY STRUCTURE:
 * ------------------
 * libs/auth/src/
 * ├── decorators/     → @Roles, @RequirePermissions, @CurrentUser, @Public
 * ├── guards/         → JwtAuthGuard, RolesGuard, PermissionsGuard
 * ├── strategies/     → JwtStrategy
 * └── index.ts        → This file
 */

// Export all decorators
export * from './decorators';

// Export all guards
export * from './guards';

// Export all strategies
export * from './strategies';

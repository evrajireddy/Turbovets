/**
 * ============================================
 * DATA LIBRARY - MAIN EXPORT
 * ============================================
 * 
 * This is the main entry point for the @libs/data library.
 * Import everything from this single location:
 * 
 * ```typescript
 * import { 
 *   // Interfaces
 *   IUser, 
 *   ITask, 
 *   IOrganization,
 *   IAuditLog,
 *   IApiResponse,
 *   
 *   // Enums
 *   Role, 
 *   Permission, 
 *   TaskStatus,
 *   TaskPriority,
 *   TaskCategory,
 *   
 *   // DTOs
 *   LoginDto,
 *   CreateTaskDto,
 *   UpdateTaskDto,
 *   
 *   // Helpers
 *   hasPermission,
 *   isRoleHigherOrEqual,
 *   createSuccessResponse
 * } from '@libs/data';
 * ```
 * 
 * LIBRARY STRUCTURE:
 * ------------------
 * libs/data/src/
 * ├── enums/           → Role, Permission, TaskStatus, etc.
 * ├── interfaces/      → IUser, ITask, IOrganization, etc.
 * ├── dto/            → LoginDto, CreateTaskDto, etc.
 * └── index.ts        → This file (barrel export)
 */

// Export all enums
export * from './enums';

// Export all interfaces
export * from './interfaces';

// Export all DTOs
export * from './dto';

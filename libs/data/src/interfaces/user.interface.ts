/**
 * ============================================
 * USER INTERFACE
 * ============================================
 * 
 * Defines the structure of a User in the system.
 * 
 * RELATIONSHIPS:
 * -------------
 * User ──belongs to──> Organization
 * User ──has──> Role
 * User ──creates──> Tasks
 * User ──is assigned──> Tasks
 * 
 * DATABASE SCHEMA VISUALIZATION:
 * -----------------------------
 * ┌─────────────────────────────────────┐
 * │              USERS                  │
 * ├─────────────────────────────────────┤
 * │ id           │ UUID (PK)            │
 * │ email        │ VARCHAR(255) UNIQUE  │
 * │ password     │ VARCHAR(255)         │
 * │ firstName    │ VARCHAR(100)         │
 * │ lastName     │ VARCHAR(100)         │
 * │ role         │ ENUM                 │
 * │ orgId        │ UUID (FK)            │
 * │ isActive     │ BOOLEAN              │
 * │ createdAt    │ TIMESTAMP            │
 * │ updatedAt    │ TIMESTAMP            │
 * └─────────────────────────────────────┘
 * 
 * MOCK DATA EXAMPLE:
 * ------------------
 * ```typescript
 * const user: IUser = {
 *   id: 'user-123',
 *   email: 'john.doe@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   role: Role.ADMIN,
 *   organizationId: 'org-456',
 *   isActive: true,
 *   createdAt: new Date('2024-01-01'),
 *   updatedAt: new Date('2024-01-01')
 * };
 * ```
 */

import { Role } from '../enums/role.enum';

export interface IUser {
  /**
   * Unique identifier for the user (UUID)
   * Generated automatically on creation
   */
  id: string;

  /**
   * User's email address
   * Must be unique across the system
   * Used for login authentication
   */
  email: string;

  /**
   * Hashed password (never stored in plain text)
   * Optional in interface as it should not be returned in API responses
   */
  password?: string;

  /**
   * User's first name
   */
  firstName: string;

  /**
   * User's last name
   */
  lastName: string;

  /**
   * User's role in the organization
   * Determines permissions and access levels
   */
  role: Role;

  /**
   * ID of the organization the user belongs to
   */
  organizationId: string;

  /**
   * Reference to the organization object (optional, for eager loading)
   */
  organization?: IOrganization;

  /**
   * Whether the user account is active
   * Inactive users cannot log in
   */
  isActive: boolean;

  /**
   * Timestamp when the user was created
   */
  createdAt: Date;

  /**
   * Timestamp when the user was last updated
   */
  updatedAt: Date;
}

/**
 * User without sensitive data (for API responses)
 */
export type IUserPublic = Omit<IUser, 'password'>;

/**
 * JWT Payload structure
 * Data stored in the JWT token
 */
export interface IJwtPayload {
  sub: string;          // User ID
  email: string;        // User email
  role: Role;           // User role
  organizationId: string; // Organization ID
  iat?: number;         // Issued at timestamp
  exp?: number;         // Expiration timestamp
}

/**
 * Login response structure
 */
export interface ILoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: IUserPublic;
  expiresIn: number;
}

// Forward declaration for Organization interface
export interface IOrganization {
  id: string;
  name: string;
  parentId?: string;
  parent?: IOrganization;
  children?: IOrganization[];
  createdAt: Date;
  updatedAt: Date;
}

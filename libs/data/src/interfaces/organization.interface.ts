/**
 * ============================================
 * ORGANIZATION INTERFACE
 * ============================================
 * 
 * Defines the structure of an Organization.
 * Supports 2-level hierarchy (Parent → Child organizations)
 * 
 * HIERARCHY VISUALIZATION:
 * ------------------------
 * 
 *              ┌─────────────────┐
 *              │  Parent Org     │
 *              │  (Level 1)      │
 *              └────────┬────────┘
 *                       │
 *         ┌─────────────┼─────────────┐
 *         │             │             │
 *    ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
 *    │ Child 1 │   │ Child 2 │   │ Child 3 │
 *    │(Level 2)│   │(Level 2)│   │(Level 2)│
 *    └─────────┘   └─────────┘   └─────────┘
 * 
 * ACCESS CONTROL RULES:
 * ---------------------
 * 1. Users in Parent Org can access Child Org resources
 * 2. Users in Child Org CANNOT access Parent Org resources
 * 3. Users in Child Org A CANNOT access Child Org B resources
 * 
 * DATABASE SCHEMA:
 * ----------------
 * ┌─────────────────────────────────────┐
 * │           ORGANIZATIONS             │
 * ├─────────────────────────────────────┤
 * │ id           │ UUID (PK)            │
 * │ name         │ VARCHAR(255)         │
 * │ description  │ TEXT                 │
 * │ parentId     │ UUID (FK, nullable)  │
 * │ createdAt    │ TIMESTAMP            │
 * │ updatedAt    │ TIMESTAMP            │
 * └─────────────────────────────────────┘
 * 
 * MOCK DATA EXAMPLE:
 * ------------------
 * ```typescript
 * // Parent Organization
 * const parentOrg: IOrganization = {
 *   id: 'org-parent',
 *   name: 'Acme Corporation',
 *   description: 'Main company',
 *   parentId: null,
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * 
 * // Child Organization
 * const childOrg: IOrganization = {
 *   id: 'org-child',
 *   name: 'Acme Engineering',
 *   description: 'Engineering department',
 *   parentId: 'org-parent',
 *   parent: parentOrg,
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */

export interface IOrganization {
  /**
   * Unique identifier for the organization (UUID)
   */
  id: string;

  /**
   * Name of the organization
   */
  name: string;

  /**
   * Optional description of the organization
   */
  description?: string;

  /**
   * ID of the parent organization (null for top-level orgs)
   * This enables the 2-level hierarchy
   */
  parentId?: string | null;

  /**
   * Reference to parent organization (for eager loading)
   */
  parent?: IOrganization | null;

  /**
   * Child organizations (for eager loading)
   */
  children?: IOrganization[];

  /**
   * Users belonging to this organization
   */
  users?: any[]; // Will be IUser[] when loaded

  /**
   * Timestamp when the organization was created
   */
  createdAt: Date;

  /**
   * Timestamp when the organization was last updated
   */
  updatedAt: Date;
}

/**
 * Helper type for creating new organizations
 */
export interface ICreateOrganization {
  name: string;
  description?: string;
  parentId?: string | null;
}

/**
 * Helper function to check if an org is a child of another
 * 
 * @example
 * isChildOrg(childOrg, 'parent-org-id') // true
 */
export function isChildOrg(org: IOrganization, parentId: string): boolean {
  return org.parentId === parentId;
}

/**
 * Helper function to get all accessible org IDs for a user
 * Returns the user's org ID plus any child org IDs
 */
export function getAccessibleOrgIds(
  userOrgId: string, 
  allOrgs: IOrganization[]
): string[] {
  const accessibleIds = [userOrgId];
  
  // Find all child organizations
  const childOrgs = allOrgs.filter(org => org.parentId === userOrgId);
  childOrgs.forEach(child => accessibleIds.push(child.id));
  
  return accessibleIds;
}

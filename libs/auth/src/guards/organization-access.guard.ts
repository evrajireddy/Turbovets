/**
 * ============================================
 * ORGANIZATION ACCESS GUARD
 * ============================================
 * 
 * Enforces organization-based access control.
 * Users can only access resources within their organization
 * (or child organizations if they're in a parent org).
 * 
 * ORGANIZATION HIERARCHY:
 * -----------------------
 * 
 *   ┌─────────────────────────────────────────────────────────┐
 *   │                                                         │
 *   │       ┌─────────────────┐                              │
 *   │       │  Parent Org     │                              │
 *   │       │  (Acme Corp)    │                              │
 *   │       └────────┬────────┘                              │
 *   │                │                                        │
 *   │      ┌─────────┼─────────┐                             │
 *   │      │         │         │                              │
 *   │  ┌───┴───┐ ┌───┴───┐ ┌───┴───┐                         │
 *   │  │Child A│ │Child B│ │Child C│                         │
 *   │  │(Sales)│ │ (Eng) │ │ (Mkt) │                         │
 *   │  └───────┘ └───────┘ └───────┘                         │
 *   │                                                         │
 *   └─────────────────────────────────────────────────────────┘
 * 
 * ACCESS RULES:
 * -------------
 * 1. Users in Parent Org CAN access Child A, B, C resources
 * 2. Users in Child A CANNOT access Child B or C resources
 * 3. Users in Child A CANNOT access Parent Org resources
 * 4. Owner/Admin of Parent can manage all child orgs
 * 
 * MOCK EXAMPLE:
 * -------------
 * ```typescript
 * // User in Parent Org (Acme Corp)
 * const parentUser = { organizationId: 'acme-corp' };
 * 
 * // Task in Child Org (Sales)
 * const task = { organizationId: 'sales-dept' };
 * 
 * // Check: Is Sales a child of Acme Corp? YES
 * // Result: Allow access
 * 
 * // User in Sales Dept
 * const salesUser = { organizationId: 'sales-dept' };
 * 
 * // Task in Engineering Dept
 * const engTask = { organizationId: 'eng-dept' };
 * 
 * // Check: Is Eng a child of Sales? NO (they're siblings)
 * // Result: Deny access
 * ```
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject
} from '@nestjs/common';

/**
 * Interface for the organization service
 * This allows for dependency injection
 */
export interface IOrganizationService {
  findById(id: string): Promise<any>;
  isAccessible(userOrgId: string, resourceOrgId: string): Promise<boolean>;
}

export const ORG_SERVICE_TOKEN = 'ORG_SERVICE';

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(
    @Inject(ORG_SERVICE_TOKEN) 
    private readonly orgService: IOrganizationService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get the resource's organization ID from request
    // Could be from params, body, or query
    const resourceOrgId = this.getResourceOrgId(request);

    // If no resource org ID in request, allow (let controller handle it)
    if (!resourceOrgId) {
      return true;
    }

    // Check if user can access the resource's organization
    const canAccess = await this.orgService.isAccessible(
      user.organizationId,
      resourceOrgId
    );

    if (!canAccess) {
      throw new ForbiddenException(
        'You do not have access to resources in this organization'
      );
    }

    return true;
  }

  /**
   * Extract resource organization ID from request
   * Checks params, body, then query
   */
  private getResourceOrgId(request: any): string | null {
    return (
      request.params?.organizationId ||
      request.body?.organizationId ||
      request.query?.organizationId ||
      null
    );
  }
}

/**
 * Factory function to check organization access
 * Use this in services for programmatic access checks
 */
export async function checkOrganizationAccess(
  userOrgId: string,
  resourceOrgId: string,
  orgService: IOrganizationService
): Promise<boolean> {
  // Same org - always accessible
  if (userOrgId === resourceOrgId) {
    return true;
  }

  // Check if resource org is a child of user's org
  return orgService.isAccessible(userOrgId, resourceOrgId);
}

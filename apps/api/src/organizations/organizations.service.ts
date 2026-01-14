/**
 * ============================================
 * ORGANIZATIONS SERVICE
 * ============================================
 * 
 * Manages organization hierarchy:
 * - List organizations
 * - Get organization by ID
 * - Create organizations
 * - Update organizations
 * - Delete organizations
 * - Get hierarchy tree
 * 
 * HIERARCHY RULES:
 * - Maximum 2 levels (Parent → Child)
 * - Child organizations cannot have children
 * - Parent org users can access child org resources
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { IUser, Role, IOrganization } from '@libs/data';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get all organizations
   */
  async findAll(currentUser: IUser): Promise<IOrganization[]> {
    let organizations: Organization[];

    if (currentUser.role === Role.OWNER) {
      // Owner can see all organizations
      organizations = await this.organizationRepository.find({
        relations: ['parent', 'children'],
        order: { createdAt: 'ASC' },
      });
    } else {
      // Others can see their org and related orgs
      const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);
      organizations = await this.organizationRepository.find({
        where: accessibleOrgIds.map(id => ({ organizationId: id })),
        relations: ['parent', 'children'],
      });
    }

    return organizations.map((org) => this.toOrganizationResponse(org));
  }

  /**
   * Get organization by ID
   */
  async findOne(organizationId: string, currentUser: IUser): Promise<IOrganization> {
    const organization = await this.organizationRepository.findOne({
      where: { organizationId },
      relations: ['parent', 'children'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check access
    if (currentUser.role !== Role.OWNER) {
      const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);
      if (!accessibleOrgIds.includes(organizationId)) {
        throw new ForbiddenException('You do not have access to this organization');
      }
    }

    return this.toOrganizationResponse(organization);
  }

  /**
   * Create a new organization
   */
  async create(
    data: { name: string; description?: string; parentId?: string },
    currentUser: IUser,
  ): Promise<IOrganization> {
    // Only OWNER can create organizations
    if (currentUser.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can create organizations');
    }

    // Validate parent if provided
    if (data.parentId) {
      const parent = await this.organizationRepository.findOne({
        where: { organizationId: data.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent organization not found');
      }

      // Check 2-level limit
      if (parent.parentId !== null) {
        throw new BadRequestException('Cannot create organization under a child organization (max 2 levels)');
      }
    }

    const organization = this.organizationRepository.create({
      name: data.name,
      description: data.description,
      parentId: data.parentId || null,
    });

    const savedOrg = await this.organizationRepository.save(organization);

    // Log the action
    await this.auditService.log({
      action: 'ORGANIZATION_CREATED',
      resource: 'organization',
      resourceId: savedOrg.organizationId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      organizationId: currentUser.organizationId,
      details: JSON.stringify({ name: savedOrg.name, parentId: savedOrg.parentId }),
      success: true,
    });

    return this.toOrganizationResponse(savedOrg);
  }

  /**
   * Update an organization
   */
  async update(
    organizationId: string,
    data: { name?: string; description?: string },
    currentUser: IUser,
  ): Promise<IOrganization> {
    // Only OWNER can update organizations
    if (currentUser.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can update organizations');
    }

    const organization = await this.organizationRepository.findOne({
      where: { organizationId },
      relations: ['parent', 'children'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Update
    if (data.name) organization.name = data.name;
    if (data.description !== undefined) organization.description = data.description;

    const updatedOrg = await this.organizationRepository.save(organization);

    // Log the action
    await this.auditService.log({
      action: 'ORGANIZATION_UPDATED',
      resource: 'organization',
      resourceId: organizationId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      organizationId: currentUser.organizationId,
      details: JSON.stringify({ name: updatedOrg.name }),
      success: true,
    });

    return this.toOrganizationResponse(updatedOrg);
  }

  /**
   * Delete an organization
   */
  async remove(organizationId: string, currentUser: IUser): Promise<void> {
    // Only OWNER can delete organizations
    if (currentUser.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can delete organizations');
    }

    const organization = await this.organizationRepository.findOne({
      where: { organizationId },
      relations: ['children'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if org has children
    if (organization.children && organization.children.length > 0) {
      throw new BadRequestException('Cannot delete organization with child organizations');
    }

    // Check if org has users
    const userCount = await this.userRepository.count({
      where: { organizationId },
    });

    if (userCount > 0) {
      throw new BadRequestException('Cannot delete organization with users');
    }

    await this.organizationRepository.remove(organization);

    // Log the action
    await this.auditService.log({
      action: 'ORGANIZATION_DELETED',
      resource: 'organization',
      resourceId: organizationId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      organizationId: currentUser.organizationId,
      details: JSON.stringify({ name: organization.name }),
      success: true,
    });
  }

  /**
   * Get organization hierarchy tree
   */
  async getHierarchy(currentUser: IUser): Promise<IOrganization[]> {
    // Get all parent organizations
    const parents = await this.organizationRepository.find({
      where: { parentId: IsNull() },
      relations: ['children'],
      order: { createdAt: 'ASC' },
    });

    if (currentUser.role !== Role.OWNER) {
      // Filter to accessible organizations only
      const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);
      return parents
        .filter((p) => accessibleOrgIds.includes(p.organizationId))
        .map((org) => this.toOrganizationResponse(org));
    }

    return parents.map((org) => this.toOrganizationResponse(org));
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async getAccessibleOrganizationIds(user: IUser): Promise<string[]> {
    const orgIds = [user.organizationId];

    // Get user's organization to check if it's a parent
    const userOrg = await this.organizationRepository.findOne({
      where: { organizationId: user.organizationId },
    });

    if (userOrg) {
      // If user is in parent org, add all children
      const children = await this.organizationRepository.find({
        where: { parentId: user.organizationId },
      });
      orgIds.push(...children.map((c) => c.organizationId));

      // If user is in child org, add parent
      if (userOrg.parentId) {
        orgIds.push(userOrg.parentId);
      }
    }

    return orgIds;
  }

  private toOrganizationResponse(org: Organization): IOrganization {
    return {
      id: org.organizationId,
      name: org.name,
      description: org.description,
      parentId: org.parentId,
      parent: org.parent ? {
        id: org.parent.organizationId,
        name: org.parent.name,
      } : undefined,
      children: org.children?.map((child) => ({
        id: child.organizationId,
        name: child.name,
      })),
      level: org.parentId === null ? 0 : 1,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }
}

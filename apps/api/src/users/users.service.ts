/**
 * ============================================
 * USERS SERVICE
 * ============================================
 * 
 * Handles user management operations:
 * - List users (with filters)
 * - Get user by ID
 * - Create new users
 * - Update users
 * - Delete users (soft delete)
 * 
 * ACCESS CONTROL:
 * - OWNER: Can manage all users
 * - ADMIN: Can list/view users in their org
 * - VIEWER: Can only view their own profile
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { AuditService } from '../audit/audit.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
  IUser,
  IUserPublic,
  Role,
} from '@libs/data';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get all users accessible by the current user
   */
  async findAll(query: UserQueryDto, currentUser: IUser): Promise<{ data: IUserPublic[]; total: number }> {
    const { role, organizationId, search, page = 1, limit = 20 } = query;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization');

    // Filter by accessible organizations
    if (currentUser.role === Role.OWNER) {
      // Owner can see all users
    } else if (currentUser.role === Role.ADMIN) {
      // Admin can see users in their org hierarchy
      const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);
      queryBuilder.where('user.organization_id IN (:...orgIds)', { orgIds: accessibleOrgIds });
    } else {
      // Viewer can only see themselves
      queryBuilder.where('user.user_id = :userId', { userId: currentUser.id });
    }

    // Apply filters
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }
    if (organizationId) {
      queryBuilder.andWhere('user.organization_id = :organizationId', { organizationId });
    }
    if (search) {
      queryBuilder.andWhere(
        '(user.email LIKE :search OR user.first_name LIKE :search OR user.last_name LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Paginate
    queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.created_at', 'DESC');

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users.map((user) => this.toPublicUser(user)),
      total,
    };
  }

  /**
   * Get a single user by ID
   */
  async findOne(userId: string, currentUser: IUser): Promise<IUserPublic> {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check access
    await this.checkUserAccess(user, currentUser, 'read');

    return this.toPublicUser(user);
  }

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto, currentUser: IUser): Promise<IUserPublic> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Only OWNER can create OWNER or ADMIN users
    if (createUserDto.role === Role.OWNER && currentUser.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can create owner accounts');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = this.userRepository.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Log the action
    await this.auditService.log({
      action: 'USER_CREATED',
      resource: 'user',
      resourceId: savedUser.userId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      organizationId: currentUser.organizationId,
      details: JSON.stringify({ 
        newUserEmail: savedUser.email,
        role: savedUser.role,
      }),
      success: true,
    });

    return this.toPublicUser(savedUser);
  }

  /**
   * Update a user
   */
  async update(userId: string, updateUserDto: UpdateUserDto, currentUser: IUser): Promise<IUserPublic> {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check access
    await this.checkUserAccess(user, currentUser, 'update');

    // Only OWNER can change roles
    if (updateUserDto.role && updateUserDto.role !== user.role) {
      if (currentUser.role !== Role.OWNER) {
        throw new ForbiddenException('Only owners can change user roles');
      }
    }

    // Store old values for audit
    const oldValues = { ...user };

    // Update user
    Object.assign(user, updateUserDto);

    // Hash password if changed
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    const updatedUser = await this.userRepository.save(user);

    // Log the action
    await this.auditService.log({
      action: 'USER_UPDATED',
      resource: 'user',
      resourceId: user.userId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      organizationId: currentUser.organizationId,
      details: JSON.stringify({
        before: { email: oldValues.email, role: oldValues.role },
        after: { email: updatedUser.email, role: updatedUser.role },
      }),
      success: true,
    });

    return this.toPublicUser(updatedUser);
  }

  /**
   * Delete a user (soft delete)
   */
  async remove(userId: string, currentUser: IUser): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only OWNER can delete users
    if (currentUser.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can delete users');
    }

    // Soft delete
    user.isActive = false;
    await this.userRepository.save(user);

    // Log the action
    await this.auditService.log({
      action: 'USER_DELETED',
      resource: 'user',
      resourceId: userId,
      userId: currentUser.id,
      userEmail: currentUser.email,
      organizationId: currentUser.organizationId,
      details: JSON.stringify({ deletedUserEmail: user.email }),
      success: true,
    });
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async getAccessibleOrganizationIds(user: IUser): Promise<string[]> {
    const orgIds = [user.organizationId];

    // Add child organizations
    const childOrgs = await this.organizationRepository.find({
      where: { parentId: user.organizationId },
    });
    orgIds.push(...childOrgs.map((org) => org.organizationId));

    return orgIds;
  }

  private async checkUserAccess(
    targetUser: User,
    currentUser: IUser,
    action: 'read' | 'update' | 'delete',
  ): Promise<void> {
    // Owner can do anything
    if (currentUser.role === Role.OWNER) {
      return;
    }

    // Users can always read/update their own profile
    if (targetUser.userId === currentUser.id) {
      return;
    }

    // Admin can read users in their org
    if (currentUser.role === Role.ADMIN && action === 'read') {
      const accessibleOrgIds = await this.getAccessibleOrganizationIds(currentUser);
      if (accessibleOrgIds.includes(targetUser.organizationId)) {
        return;
      }
    }

    throw new ForbiddenException('You do not have access to this user');
  }

  private toPublicUser(user: User): IUserPublic {
    return {
      id: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization?.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

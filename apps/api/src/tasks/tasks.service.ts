/**
 * ============================================
 * TASKS SERVICE
 * ============================================
 * 
 * Handles all task operations:
 * - Create, Read, Update, Delete tasks
 * - Filter and search
 * - Reorder (drag-and-drop)
 * - Statistics
 * 
 * ACCESS CONTROL:
 * - OWNER: Can access all tasks in all organizations
 * - ADMIN: Can access tasks in their organization
 * - VIEWER: Can only access their own tasks
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { AuditService } from '../audit/audit.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  ReorderTasksDto,
  ITask,
  IUser,
  Role,
  TaskStatus,
} from '@libs/data';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Create a new task
   */
  async create(createTaskDto: CreateTaskDto, user: IUser): Promise<ITask> {
    // Get next position for ordering
    const maxPosition = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.organization_id = :orgId', { orgId: user.organizationId })
      .select('MAX(task.position)', 'max')
      .getRawOne();

    const task = this.taskRepository.create({
      ...createTaskDto,
      userId: user.id,  // Foreign key to users table
      organizationId: user.organizationId,
      position: (maxPosition?.max || 0) + 1,
    });

    const savedTask = await this.taskRepository.save(task);

    // Log the action
    await this.auditService.log({
      action: 'TASK_CREATED',
      resource: 'task',
      resourceId: savedTask.taskId,
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organizationId,
      details: JSON.stringify({ title: savedTask.title }),
      success: true,
    });

    return this.toTaskResponse(savedTask);
  }

  /**
   * Get all tasks accessible by user
   */
  async findAll(query: TaskQueryDto, user: IUser): Promise<{ data: ITask[]; total: number }> {
    const { status, priority, category, search, page = 1, limit = 20 } = query;

    // Get accessible organization IDs
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(user);

    // Build query
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.user', 'user')
      .leftJoinAndSelect('task.organization', 'organization');

    // Filter by role
    if (user.role === Role.VIEWER) {
      // Viewers can only see their own tasks
      queryBuilder.where('task.user_id = :userId', { userId: user.id });
    } else {
      queryBuilder.where('task.organization_id IN (:...orgIds)', { orgIds: accessibleOrgIds });
    }

    // Apply filters
    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }
    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }
    if (category) {
      queryBuilder.andWhere('task.category = :category', { category });
    }
    if (search) {
      queryBuilder.andWhere(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Order and paginate
    queryBuilder
      .orderBy('task.position', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [tasks, total] = await queryBuilder.getManyAndCount();

    return {
      data: tasks.map((task) => this.toTaskResponse(task)),
      total,
    };
  }

  /**
   * Get single task by ID
   */
  async findOne(taskId: string, user: IUser): Promise<ITask> {
    const task = await this.taskRepository.findOne({
      where: { taskId },
      relations: ['user', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access
    await this.checkTaskAccess(task, user, 'read');

    return this.toTaskResponse(task);
  }

  /**
   * Update a task
   */
  async update(taskId: string, updateTaskDto: UpdateTaskDto, user: IUser): Promise<ITask> {
    const task = await this.taskRepository.findOne({
      where: { taskId },
      relations: ['user', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access
    await this.checkTaskAccess(task, user, 'update');

    // Store old values for audit
    const oldValues = { title: task.title, status: task.status };

    // Update task
    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);

    // Log the action
    await this.auditService.log({
      action: 'TASK_UPDATED',
      resource: 'task',
      resourceId: task.taskId,
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organizationId,
      details: JSON.stringify({
        before: oldValues,
        after: { title: updatedTask.title, status: updatedTask.status },
      }),
      success: true,
    });

    return this.toTaskResponse(updatedTask);
  }

  /**
   * Delete a task
   */
  async remove(taskId: string, user: IUser): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { taskId },
      relations: ['organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check access
    await this.checkTaskAccess(task, user, 'delete');

    const taskTitle = task.title;
    await this.taskRepository.remove(task);

    // Log the action
    await this.auditService.log({
      action: 'TASK_DELETED',
      resource: 'task',
      resourceId: taskId,
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organizationId,
      details: JSON.stringify({ title: taskTitle }),
      success: true,
    });
  }

  /**
   * Reorder tasks (for drag-and-drop)
   */
  async reorder(reorderDto: ReorderTasksDto, user: IUser): Promise<void> {
    const { taskIds } = reorderDto;

    for (let i = 0; i < taskIds.length; i++) {
      await this.taskRepository.update(taskIds[i], { position: i });
    }

    await this.auditService.log({
      action: 'TASKS_REORDERED',
      resource: 'task',
      resourceId: null,
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organizationId,
      details: JSON.stringify({ count: taskIds.length }),
      success: true,
    });
  }

  /**
   * Get task statistics
   */
  async getStats(user: IUser): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
  }> {
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(user);

    let queryBuilder = this.taskRepository.createQueryBuilder('task');

    if (user.role === Role.VIEWER) {
      queryBuilder = queryBuilder.where('task.user_id = :userId', { userId: user.id });
    } else {
      queryBuilder = queryBuilder.where('task.organization_id IN (:...orgIds)', { orgIds: accessibleOrgIds });
    }

    const tasks = await queryBuilder.getMany();

    const byStatus: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    const byPriority: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    let overdue = 0;
    const now = new Date();

    for (const task of tasks) {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
      
      if (task.dueDate && new Date(task.dueDate) < now && task.status !== TaskStatus.DONE) {
        overdue++;
      }
    }

    return { total: tasks.length, byStatus, byPriority, overdue };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async getAccessibleOrganizationIds(user: IUser): Promise<string[]> {
    if (user.role === Role.OWNER) {
      const orgs = await this.organizationRepository.find();
      return orgs.map((org) => org.organizationId);
    }

    const orgIds = [user.organizationId];
    const childOrgs = await this.organizationRepository.find({
      where: { parentId: user.organizationId },
    });
    orgIds.push(...childOrgs.map((org) => org.organizationId));

    return orgIds;
  }

  private async checkTaskAccess(task: Task, user: IUser, action: 'read' | 'update' | 'delete'): Promise<void> {
    if (user.role === Role.OWNER) return;

    if (user.role === Role.VIEWER) {
      if (task.userId !== user.id) {
        throw new ForbiddenException('You do not have access to this task');
      }
      if (action !== 'read') {
        throw new ForbiddenException('Viewers cannot modify tasks');
      }
      return;
    }

    const accessibleOrgIds = await this.getAccessibleOrganizationIds(user);
    if (!accessibleOrgIds.includes(task.organizationId)) {
      throw new ForbiddenException('You do not have access to this task');
    }
  }

  private toTaskResponse(task: Task): ITask {
    return {
      id: task.taskId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      position: task.position,
      dueDate: task.dueDate,
      userId: task.userId,
      user: task.user ? {
        id: task.user.userId,
        email: task.user.email,
        firstName: task.user.firstName,
        lastName: task.user.lastName,
      } : undefined,
      organizationId: task.organizationId,
      organization: task.organization ? {
        id: task.organization.organizationId,
        name: task.organization.name,
      } : undefined,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}

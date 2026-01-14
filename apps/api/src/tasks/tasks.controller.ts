/**
 * ============================================
 * TASKS CONTROLLER
 * ============================================
 * 
 * REST API endpoints for task management.
 * All endpoints require authentication.
 * 
 * ENDPOINT OVERVIEW:
 * ------------------
 * ┌────────────────────────────────────────────────────────────┐
 * │ Method │ Endpoint        │ Description      │ Auth        │
 * ├────────────────────────────────────────────────────────────┤
 * │ POST   │ /tasks          │ Create task      │ JWT         │
 * │ GET    │ /tasks          │ List tasks       │ JWT         │
 * │ GET    │ /tasks/stats    │ Get statistics   │ JWT         │
 * │ GET    │ /tasks/:id      │ Get single task  │ JWT         │
 * │ PUT    │ /tasks/:id      │ Update task      │ JWT         │
 * │ DELETE │ /tasks/:id      │ Delete task      │ JWT         │
 * │ PUT    │ /tasks/reorder  │ Reorder tasks    │ JWT         │
 * └────────────────────────────────────────────────────────────┘
 * 
 * REQUEST/RESPONSE EXAMPLES:
 * --------------------------
 * 
 * POST /tasks
 * Request:
 * ```json
 * {
 *   "title": "Complete project documentation",
 *   "description": "Write comprehensive docs",
 *   "priority": "HIGH",
 *   "category": "WORK",
 *   "dueDate": "2024-12-31T23:59:59Z"
 * }
 * ```
 * Response:
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": "task-123",
 *     "title": "Complete project documentation",
 *     "status": "TODO",
 *     "priority": "HIGH",
 *     "createdBy": { "id": "user-1", "email": "user@example.com" }
 *   }
 * }
 * ```
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  ReorderTasksDto,
  IApiResponse,
  ITask,
} from '@libs/data';
import {
  JwtAuthGuard,
  RolesGuard,
  CurrentUser,
} from '@libs/auth';

/**
 * User context from JWT
 */
interface RequestUser {
  id: string;
  email: string;
  role: any;
  organizationId: string;
}

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  /**
   * Create a new task
   * 
   * @example
   * POST /tasks
   * Headers: { Authorization: 'Bearer <token>' }
   * Body: { title: 'New task', priority: 'HIGH' }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<ITask>> {
    const task = await this.tasksService.create(dto, user);
    return {
      success: true,
      data: task as unknown as ITask,
      message: 'Task created successfully',
    };
  }

  /**
   * Get all tasks accessible to the user
   * 
   * @example
   * GET /tasks?status=TODO&priority=HIGH&page=1&limit=20
   * Headers: { Authorization: 'Bearer <token>' }
   */
  @Get()
  async findAll(
    @Query() query: TaskQueryDto,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<ITask[]>> {
    const { data, total } = await this.tasksService.findAll(user, query);
    return {
      success: true,
      data: data as unknown as ITask[],
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  /**
   * Get task statistics for dashboard
   * 
   * @example
   * GET /tasks/stats
   * Response: { total: 50, byStatus: { TODO: 20, DONE: 30 }, overdue: 5 }
   */
  @Get('stats')
  async getStats(
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<any>> {
    const stats = await this.tasksService.getStats(user);
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Get a single task by ID
   * 
   * @example
   * GET /tasks/123e4567-e89b-12d3-a456-426614174000
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<ITask>> {
    const task = await this.tasksService.findOne(id, user);
    return {
      success: true,
      data: task as unknown as ITask,
    };
  }

  /**
   * Update a task
   * 
   * @example
   * PUT /tasks/123e4567-e89b-12d3-a456-426614174000
   * Body: { status: 'IN_PROGRESS', priority: 'URGENT' }
   */
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<ITask>> {
    const task = await this.tasksService.update(id, dto, user);
    return {
      success: true,
      data: task as unknown as ITask,
      message: 'Task updated successfully',
    };
  }

  /**
   * Delete a task
   * 
   * @example
   * DELETE /tasks/123e4567-e89b-12d3-a456-426614174000
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<null>> {
    await this.tasksService.remove(id, user);
    return {
      success: true,
      data: null,
      message: 'Task deleted successfully',
    };
  }

  /**
   * Reorder tasks (for drag-and-drop)
   * 
   * @example
   * PUT /tasks/reorder
   * Body: { taskIds: ['task-3', 'task-1', 'task-2'] }
   */
  @Put('reorder')
  async reorder(
    @Body() dto: ReorderTasksDto,
    @CurrentUser() user: RequestUser,
  ): Promise<IApiResponse<ITask[]>> {
    const tasks = await this.tasksService.reorder(dto, user);
    return {
      success: true,
      data: tasks as unknown as ITask[],
      message: 'Tasks reordered successfully',
    };
  }
}

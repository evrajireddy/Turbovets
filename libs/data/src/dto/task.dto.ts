/**
 * ============================================
 * TASK DTOs
 * ============================================
 * 
 * Data Transfer Objects for Task operations.
 * 
 * API ENDPOINTS USING THESE DTOs:
 * -------------------------------
 * POST   /tasks      → CreateTaskDto
 * PUT    /tasks/:id  → UpdateTaskDto
 * GET    /tasks      → TaskQueryDto (query params)
 * PATCH  /tasks/reorder → ReorderTasksDto
 * 
 * MOCK USAGE EXAMPLE:
 * -------------------
 * ```typescript
 * // Creating a task
 * const createDto: CreateTaskDto = {
 *   title: 'Complete project documentation',
 *   description: 'Write comprehensive docs for the API',
 *   priority: TaskPriority.HIGH,
 *   category: TaskCategory.WORK,
 *   dueDate: '2024-02-15T00:00:00Z',
 *   assignedToId: 'user-456'
 * };
 * 
 * // Updating a task
 * const updateDto: UpdateTaskDto = {
 *   status: TaskStatus.IN_PROGRESS,
 *   priority: TaskPriority.URGENT
 * };
 * ```
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  MaxLength,
  IsArray,
  IsNumber,
  Min,
  Max,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus, TaskPriority, TaskCategory } from '../enums/task.enum';

/**
 * DTO for creating a new task
 * 
 * @example
 * {
 *   "title": "Implement user authentication",
 *   "description": "Add JWT-based auth to the API",
 *   "priority": "high",
 *   "category": "work",
 *   "dueDate": "2024-02-01T00:00:00Z"
 * }
 */
export class CreateTaskDto {
  /**
   * Task title (required)
   * Maximum 255 characters
   */
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title!: string;

  /**
   * Task description (optional)
   * Can be long text for detailed task info
   */
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  description?: string;

  /**
   * Task priority (optional, defaults to MEDIUM)
   */
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Invalid priority value' })
  priority?: TaskPriority;

  /**
   * Task category (optional, defaults to OTHER)
   */
  @IsOptional()
  @IsEnum(TaskCategory, { message: 'Invalid category value' })
  category?: TaskCategory;

  /**
   * Due date for the task (optional)
   * Must be ISO 8601 date string
   */
  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
  dueDate?: string;

  /**
   * ID of user to assign the task to (optional)
   */
  @IsOptional()
  @IsUUID('4', { message: 'Assigned user ID must be a valid UUID' })
  assignedToId?: string;
}

/**
 * DTO for updating an existing task
 * All fields are optional - only provided fields will be updated
 */
export class UpdateTaskDto {
  /**
   * Updated task title
   */
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty if provided' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title?: string;

  /**
   * Updated description
   */
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  description?: string;

  /**
   * Updated status
   */
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid status value' })
  status?: TaskStatus;

  /**
   * Updated priority
   */
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Invalid priority value' })
  priority?: TaskPriority;

  /**
   * Updated category
   */
  @IsOptional()
  @IsEnum(TaskCategory, { message: 'Invalid category value' })
  category?: TaskCategory;

  /**
   * Updated due date
   * Set to null to remove due date
   */
  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
  dueDate?: string | null;

  /**
   * Updated assignee
   * Set to null to unassign
   */
  @IsOptional()
  @IsUUID('4', { message: 'Assigned user ID must be a valid UUID' })
  assignedToId?: string | null;

  /**
   * Updated position (for drag-and-drop)
   */
  @IsOptional()
  @IsNumber({}, { message: 'Position must be a number' })
  @Min(0, { message: 'Position must be non-negative' })
  position?: number;
}

/**
 * DTO for task query parameters (filtering and pagination)
 */
export class TaskQueryDto {
  /**
   * Filter by status
   */
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid status value' })
  status?: TaskStatus;

  /**
   * Filter by priority
   */
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Invalid priority value' })
  priority?: TaskPriority;

  /**
   * Filter by category
   */
  @IsOptional()
  @IsEnum(TaskCategory, { message: 'Invalid category value' })
  category?: TaskCategory;

  /**
   * Filter by assigned user
   */
  @IsOptional()
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  assignedToId?: string;

  /**
   * Search by title (partial match)
   */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Page number (1-indexed)
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  /**
   * Items per page
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  /**
   * Sort field
   */
  @IsOptional()
  @IsString()
  sortBy?: string = 'position';

  /**
   * Sort order
   */
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}

/**
 * Single position update in reorder operation
 */
export class TaskPositionDto {
  @IsUUID('4')
  id!: string;

  @IsNumber()
  @Min(0)
  position!: number;
}

/**
 * DTO for bulk reordering tasks (drag-and-drop)
 */
export class ReorderTasksDto {
  /**
   * Array of task IDs with their new positions
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskPositionDto)
  tasks!: TaskPositionDto[];
}

/**
 * ============================================
 * TASK INTERFACES
 * ============================================
 * 
 * Defines the shape of Task data throughout the application.
 * Used by both frontend and backend.
 */

import { TaskStatus, TaskPriority, TaskCategory } from '../enums';

/**
 * Main Task interface
 * Represents a task in the system
 */
export interface ITask {
  /** Primary key - unique task identifier */
  id: string;
  
  /** Task title */
  title: string;
  
  /** Task description (optional) */
  description?: string;
  
  /** Current status: TODO, IN_PROGRESS, DONE */
  status: TaskStatus;
  
  /** Priority level: LOW, MEDIUM, HIGH, URGENT */
  priority: TaskPriority;
  
  /** Category: WORK, PERSONAL, SHOPPING, HEALTH, OTHER */
  category: TaskCategory;
  
  /** Position for ordering (drag-and-drop) */
  position: number;
  
  /** Optional due date */
  dueDate?: Date | null;
  
  /** Foreign key: User who owns this task */
  userId: string;
  
  /** User details (populated from relationship) */
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  
  /** Foreign key: Organization this task belongs to */
  organizationId: string;
  
  /** Organization details (populated from relationship) */
  organization?: {
    id: string;
    name: string;
  };
  
  /** When task was created */
  createdAt: Date;
  
  /** When task was last updated */
  updatedAt: Date;
}

/**
 * Task summary for lists and cards
 */
export interface ITaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: Date | null;
  userId: string;
}

/**
 * Task statistics
 */
export interface ITaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  overdue: number;
}

/**
 * ============================================
 * TASK STATUS ENUM
 * ============================================
 * 
 * Defines the lifecycle states of a task.
 * 
 * WORKFLOW:
 * ---------
 * TODO → IN_PROGRESS → DONE
 *   ↓        ↓
 *   └────────┴──→ CANCELLED (can be set from any state)
 * 
 * MOCK USAGE EXAMPLE:
 * -------------------
 * ```typescript
 * const task = {
 *   id: 'task-123',
 *   title: 'Complete documentation',
 *   status: TaskStatus.TODO
 * };
 * 
 * // Move task to in progress
 * task.status = TaskStatus.IN_PROGRESS;
 * 
 * // Check completion
 * if (task.status === TaskStatus.DONE) {
 *   console.log('Task completed!');
 * }
 * ```
 */
export enum TaskStatus {
  /**
   * Task is created but not started
   * Initial state for all new tasks
   */
  TODO = 'todo',
  
  /**
   * Task is currently being worked on
   * Indicates active progress
   */
  IN_PROGRESS = 'in_progress',
  
  /**
   * Task is completed
   * End state indicating success
   */
  DONE = 'done',
  
  /**
   * Task was cancelled
   * End state indicating task was abandoned
   */
  CANCELLED = 'cancelled'
}

/**
 * Valid status transitions map
 * Defines which status changes are allowed
 */
export const VALID_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.TODO, TaskStatus.DONE, TaskStatus.CANCELLED],
  [TaskStatus.DONE]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS], // Can reopen
  [TaskStatus.CANCELLED]: [TaskStatus.TODO] // Can reopen cancelled tasks
};

/**
 * ============================================
 * TASK PRIORITY ENUM
 * ============================================
 * 
 * Defines priority levels for tasks.
 * Used for sorting and filtering tasks.
 * 
 * MOCK USAGE EXAMPLE:
 * -------------------
 * ```typescript
 * const tasks = [
 *   { title: 'Urgent fix', priority: TaskPriority.URGENT },
 *   { title: 'Documentation', priority: TaskPriority.LOW }
 * ];
 * 
 * // Sort by priority
 * tasks.sort((a, b) => 
 *   PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
 * );
 * ```
 */
export enum TaskPriority {
  /**
   * Lowest priority - can be done when time permits
   */
  LOW = 'low',
  
  /**
   * Normal priority - standard tasks
   */
  MEDIUM = 'medium',
  
  /**
   * High priority - should be done soon
   */
  HIGH = 'high',
  
  /**
   * Urgent priority - needs immediate attention
   */
  URGENT = 'urgent'
}

/**
 * Priority ordering for sorting (higher number = higher priority)
 */
export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  [TaskPriority.LOW]: 1,
  [TaskPriority.MEDIUM]: 2,
  [TaskPriority.HIGH]: 3,
  [TaskPriority.URGENT]: 4
};

/**
 * ============================================
 * TASK CATEGORY ENUM
 * ============================================
 * 
 * Defines categories for organizing tasks.
 */
export enum TaskCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  SHOPPING = 'shopping',
  HEALTH = 'health',
  FINANCE = 'finance',
  OTHER = 'other'
}

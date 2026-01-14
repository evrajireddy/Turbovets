/**
 * ============================================
 * TASK ENTITY (SIMPLIFIED)
 * ============================================
 * 
 * Database table: tasks
 * 
 * PRIMARY KEY: taskId (UUID)
 * 
 * FOREIGN KEYS:
 * - userId → users.userId (who owns/created this task)
 * - organizationId → organizations.organizationId
 * 
 * NOTE: We use ONE userId foreign key to link task to its owner.
 * This is the user who created and owns the task.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskStatus, TaskPriority, TaskCategory } from '@libs/data';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity('tasks')
export class Task {
  /**
   * PRIMARY KEY
   * Unique identifier for each task
   */
  @PrimaryGeneratedColumn('uuid', { name: 'task_id' })
  taskId: string;

  /**
   * Task title (required)
   */
  @Column()
  title: string;

  /**
   * Task description (optional)
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Task status: TODO, IN_PROGRESS, DONE
   */
  @Column({
    type: 'varchar',
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  /**
   * Task priority: LOW, MEDIUM, HIGH, URGENT
   */
  @Column({
    type: 'varchar',
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  /**
   * Task category: WORK, PERSONAL, SHOPPING, HEALTH, OTHER
   */
  @Column({
    type: 'varchar',
    default: TaskCategory.WORK,
  })
  category: TaskCategory;

  /**
   * Position for ordering (drag-and-drop)
   */
  @Column({ type: 'int', default: 0 })
  position: number;

  /**
   * Optional due date
   */
  @Column({ name: 'due_date', type: 'datetime', nullable: true })
  dueDate: Date | null;

  // ============================================
  // FOREIGN KEY: User (Owner of this task)
  // ============================================

  /**
   * FOREIGN KEY: Links to the user who owns this task
   * References: users.user_id
   */
  @Column({ name: 'user_id' })
  userId: string;

  /**
   * Relationship: Many tasks belong to one user
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ============================================
  // FOREIGN KEY: Organization
  // ============================================

  /**
   * FOREIGN KEY: Links to the organization
   * References: organizations.organization_id
   */
  @Column({ name: 'organization_id' })
  organizationId: string;

  /**
   * Relationship: Many tasks belong to one organization
   */
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // ============================================
  // TIMESTAMPS
  // ============================================

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ============================================
  // HELPER METHODS
  // ============================================

  get isOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate && this.status !== TaskStatus.DONE;
  }

  get isCompleted(): boolean {
    return this.status === TaskStatus.DONE;
  }
}

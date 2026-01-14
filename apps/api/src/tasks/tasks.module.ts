/**
 * ============================================
 * TASKS MODULE
 * ============================================
 * 
 * Encapsulates all task-related functionality.
 * 
 * MODULE STRUCTURE:
 * -----------------
 *   ┌─────────────────────────────────────────┐
 *   │             TasksModule                 │
 *   ├─────────────────────────────────────────┤
 *   │  Controllers: TasksController           │
 *   │  Services:    TasksService              │
 *   │  Imports:     TypeOrmModule (entities)  │
 *   └─────────────────────────────────────────┘
 * 
 * DEPENDENCIES:
 * -------------
 * - Task entity for database operations
 * - Organization entity for access control
 * - AuditModule for logging operations
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Organization]),
    AuditModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

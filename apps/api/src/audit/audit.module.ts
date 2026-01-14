/**
 * ============================================
 * AUDIT MODULE
 * ============================================
 * 
 * Module for audit logging functionality.
 * Exports AuditService for use in other modules.
 * 
 * DEPENDENCIES:
 * -------------
 * • TypeOrmModule - For AuditLog entity
 * 
 * EXPORTS:
 * --------
 * • AuditService - For logging audit events from other modules
 */

import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';

@Global() // Make AuditService available globally
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService]
})
export class AuditModule {}

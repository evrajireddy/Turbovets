/**
 * ============================================
 * APP MODULE (ROOT MODULE)
 * ============================================
 * 
 * The root module that bootstraps the entire application.
 * Imports all feature modules and configures global providers.
 * 
 * MODULE ARCHITECTURE:
 * --------------------
 * 
 *                    ┌─────────────────────┐
 *                    │     AppModule       │
 *                    │   (Root Module)     │
 *                    └─────────┬───────────┘
 *                              │
 *          ┌───────────────────┼───────────────────┐
 *          │                   │                   │
 *          ▼                   ▼                   ▼
 *   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
 *   │ AuthModule  │     │ TasksModule │     │ UsersModule │
 *   │  - Login    │     │  - CRUD     │     │  - Manage   │
 *   │  - JWT      │     │  - Filter   │     │  - Roles    │
 *   └─────────────┘     └─────────────┘     └─────────────┘
 *          │                   │                   │
 *          └───────────────────┼───────────────────┘
 *                              │
 *                              ▼
 *                    ┌─────────────────────┐
 *                    │   Shared Modules    │
 *                    ├─────────────────────┤
 *                    │ • ConfigModule      │
 *                    │ • TypeOrmModule     │
 *                    │ • AuditModule       │
 *                    └─────────────────────┘
 * 
 * GLOBAL CONFIGURATION:
 * ---------------------
 * • ConfigModule - Loads environment variables
 * • TypeOrmModule - Database connection
 * • AuditModule - Global audit logging
 * • Validation Pipe - Input validation
 * • CORS - Cross-origin requests
 */

import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuditModule } from './audit/audit.module';

// Entities
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Task } from './entities/task.entity';
import { AuditLog } from './entities/audit-log.entity';

// Guards
import { JwtAuthGuard } from '@libs/auth';

@Module({
  imports: [
    // ==========================================
    // GLOBAL CONFIGURATION
    // ==========================================
    
    // Load environment variables from .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.development'],
    }),

    // ==========================================
    // DATABASE CONNECTION
    // ==========================================
    
    // TypeORM with SQLite (configurable for PostgreSQL)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'better-sqlite3',
        database: configService.get('DATABASE_PATH', './data/app.db'),
        entities: [User, Organization, Task, AuditLog],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('DB_LOGGING') === 'true',
      }),
    }),

    // ==========================================
    // FEATURE MODULES
    // ==========================================
    
    // Authentication (JWT, login, register)
    AuthModule,
    
    // Task management (CRUD, drag-drop)
    TasksModule,
    
    // User management (profiles, roles)
    UsersModule,
    
    // Organization management (hierarchy)
    OrganizationsModule,
    
    // Audit logging (global, imported first)
    AuditModule,
  ],

  providers: [
    // ==========================================
    // GLOBAL PROVIDERS
    // ==========================================
    
    // Global validation pipe for DTOs
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // Strip unknown properties
        forbidNonWhitelisted: true, // Error on unknown properties
        transform: true, // Transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },
    
    // Global JWT auth guard (protects all routes by default)
    // Use @Public() decorator to make routes public
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

/**
 * ============================================
 * DATABASE CONFIGURATION
 * ============================================
 * 
 * TypeORM configuration for SQLite database.
 * 
 * CONFIGURATION HIERARCHY:
 * ------------------------
 *   Environment Variables (.env)
 *          │
 *          ▼
 *   ┌─────────────────────┐
 *   │   ConfigModule      │ ─── Loads .env file
 *   └─────────────────────┘
 *          │
 *          ▼
 *   ┌─────────────────────┐
 *   │  TypeOrmModule      │ ─── Configures database
 *   │  .forRootAsync()    │
 *   └─────────────────────┘
 *          │
 *          ▼
 *   ┌─────────────────────┐
 *   │   SQLite Database   │
 *   │   (./data/app.db)   │
 *   └─────────────────────┘
 * 
 * FOR PRODUCTION:
 * ---------------
 * Switch to PostgreSQL by changing:
 * - type: 'postgres'
 * - host, port, username, password, database
 */

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Task } from './entities/task.entity';
import { AuditLog } from './entities/audit-log.entity';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    type: 'better-sqlite3',
    database: process.env.DATABASE_PATH || './data/app.db',
    entities: [User, Organization, Task, AuditLog],
    synchronize: !isProduction, // Auto-create tables in development
    logging: !isProduction,
    // For production, use migrations instead of synchronize
  };
};

/**
 * PostgreSQL configuration (for production)
 * Uncomment and modify when ready for production
 */
export const getPostgresConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'taskmanager',
  entities: [User, Organization, Task, AuditLog],
  synchronize: false, // Never use in production
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

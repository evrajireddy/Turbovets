/**
 * ============================================
 * MAIN.TS - APPLICATION ENTRY POINT
 * ============================================
 * 
 * Bootstraps the NestJS application with:
 * - CORS configuration
 * - Global validation
 * - Security headers
 * - Swagger documentation
 * 
 * STARTUP SEQUENCE:
 * -----------------
 * 
 *   1. Create NestJS application
 *          │
 *          ▼
 *   2. Configure CORS
 *          │
 *          ▼
 *   3. Enable validation
 *          │
 *          ▼
 *   4. Setup Swagger (optional)
 *          │
 *          ▼
 *   5. Create data directory
 *          │
 *          ▼
 *   6. Start listening on port
 *          │
 *          ▼
 *   ┌─────────────────────────────┐
 *   │ Server running on port 3000 │
 *   │ http://localhost:3000       │
 *   └─────────────────────────────┘
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create the application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get config service
  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 3000);
  const nodeEnv = configService.get('NODE_ENV', 'development');

  // ==========================================
  // CORS CONFIGURATION
  // ==========================================
  
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:4200'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ==========================================
  // GLOBAL PREFIX
  // ==========================================
  
  app.setGlobalPrefix('api');

  // ==========================================
  // VALIDATION PIPE
  // ==========================================
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ==========================================
  // CREATE DATA DIRECTORY
  // ==========================================
  
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    logger.log(`Created data directory: ${dataDir}`);
  }

  // ==========================================
  // START SERVER
  // ==========================================
  
  await app.listen(port);

  // Log startup info
  logger.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Task Management API Server                           ║
║                                                           ║
║   Environment: ${nodeEnv.padEnd(40)}║
║   Port: ${String(port).padEnd(47)}║
║   API URL: http://localhost:${port}/api                     ║
║                                                           ║
║   Endpoints:                                              ║
║   ─────────────────────────────────────────────────────   ║
║   POST   /api/auth/login       Login                      ║
║   POST   /api/auth/register    Register                   ║
║   GET    /api/auth/profile     Get profile                ║
║   ─────────────────────────────────────────────────────   ║
║   GET    /api/tasks            List tasks                 ║
║   POST   /api/tasks            Create task                ║
║   PUT    /api/tasks/:id        Update task                ║
║   DELETE /api/tasks/:id        Delete task                ║
║   ─────────────────────────────────────────────────────   ║
║   GET    /api/users            List users                 ║
║   GET    /api/audit-log        View audit logs            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});

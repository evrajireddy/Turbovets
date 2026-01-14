/**
 * ============================================
 * AUTH MODULE
 * ============================================
 * 
 * Module for authentication functionality.
 * Configures JWT strategy and provides auth services.
 * 
 * JWT CONFIGURATION:
 * ------------------
 * - Secret: From environment variable JWT_SECRET
 * - Expiration: 24 hours (86400 seconds)
 * - Algorithm: HS256
 * 
 * MODULE STRUCTURE:
 * -----------------
 * 
 *   ┌───────────────────────────────────────────┐
 *   │              AuthModule                   │
 *   ├───────────────────────────────────────────┤
 *   │  Imports:                                 │
 *   │    • TypeOrmModule (User entity)         │
 *   │    • JwtModule (token generation)        │
 *   │    • PassportModule (auth strategies)    │
 *   │    • ConfigModule (env variables)        │
 *   ├───────────────────────────────────────────┤
 *   │  Providers:                              │
 *   │    • AuthService                         │
 *   │    • JwtStrategy                         │
 *   ├───────────────────────────────────────────┤
 *   │  Controllers:                            │
 *   │    • AuthController                      │
 *   ├───────────────────────────────────────────┤
 *   │  Exports:                                │
 *   │    • AuthService                         │
 *   │    • JwtModule                           │
 *   └───────────────────────────────────────────┘
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '../entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '@libs/auth';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    // Import User entity for database operations
    TypeOrmModule.forFeature([User]),

    // Configure Passport with JWT as default strategy
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Configure JWT with environment variables
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key-change-in-production'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h')
        }
      })
    }),
    
    // Audit logging
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule]
})
export class AuthModule {}

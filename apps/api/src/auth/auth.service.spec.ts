/**
 * ============================================
 * AUTH SERVICE TESTS
 * ============================================
 * 
 * Tests for authentication functionality:
 * - Login validation
 * - Token generation
 * - Password hashing
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    role: 'viewer',
    organizationId: 'org-123',
    isActive: true,
    validatePassword: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'invalid@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(false);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should log successful login to audit', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);

      await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LOGIN',
          success: true,
        }),
      );
    });
  });

  describe('validateUser', () => {
    it('should return user for valid payload', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser({
        sub: 'user-123',
        email: 'test@example.com',
        role: 'viewer',
        organizationId: 'org-123',
      });

      expect(result).toEqual(mockUser);
    });

    it('should return null for inactive user', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser, isActive: false });

      const result = await service.validateUser({
        sub: 'user-123',
        email: 'test@example.com',
        role: 'viewer',
        organizationId: 'org-123',
      });

      expect(result).toBeNull();
    });
  });
});

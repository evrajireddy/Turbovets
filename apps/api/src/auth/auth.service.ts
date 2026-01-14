/**
 * ============================================
 * AUTHENTICATION SERVICE
 * ============================================
 * 
 * Handles all authentication operations:
 * - User login with email/password
 * - JWT token generation
 * - User registration
 * - Password validation
 * 
 * AUTHENTICATION FLOW:
 * 1. User sends email + password to /auth/login
 * 2. Service finds user by email
 * 3. Service validates password using bcrypt
 * 4. If valid, generates JWT token with user info
 * 5. Returns token + user data to client
 * 6. Client stores token and sends with future requests
 * 
 * JWT PAYLOAD STRUCTURE:
 * {
 *   sub: userId,           // Subject (user ID)
 *   email: user email,
 *   role: user role,
 *   organizationId: org ID
 * }
 */

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { LoginDto, RegisterDto, IJwtPayload, ILoginResponse, IUserPublic } from '@libs/data';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Authenticate user and return JWT token
   * 
   * @param loginDto - Email and password
   * @returns JWT token and user info
   * @throws UnauthorizedException if credentials invalid
   */
  async login(loginDto: LoginDto): Promise<ILoginResponse> {
    const { email, password } = loginDto;

    // 1. Find user by email
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['organization'],
    });

    // 2. Check if user exists
    if (!user) {
      // Log failed attempt
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        resourceId: null,
        userId: null,
        userEmail: email,
        organizationId: null,
        details: JSON.stringify({ reason: 'User not found' }),
        success: false,
        errorMessage: 'Invalid credentials',
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Check if user is active
    if (!user.isActive) {
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        resourceId: null,
        userId: user.userId,
        userEmail: user.email,
        organizationId: user.organizationId,
        details: JSON.stringify({ reason: 'Account deactivated' }),
        success: false,
        errorMessage: 'Account is deactivated',
      });
      throw new UnauthorizedException('Account is deactivated');
    }

    // 4. Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        resourceId: null,
        userId: user.userId,
        userEmail: user.email,
        organizationId: user.organizationId,
        details: JSON.stringify({ reason: 'Invalid password' }),
        success: false,
        errorMessage: 'Invalid credentials',
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // 5. Create JWT payload
    const payload: IJwtPayload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    // 6. Generate token
    const accessToken = this.jwtService.sign(payload);

    // 7. Log successful login
    await this.auditService.log({
      action: 'LOGIN',
      resource: 'auth',
      resourceId: null,
      userId: user.userId,
      userEmail: user.email,
      organizationId: user.organizationId,
      details: JSON.stringify({ method: 'password' }),
      success: true,
    });

    // 8. Return response
    return {
      accessToken,
      user: this.toPublicUser(user),
      expiresIn: 86400, // 24 hours in seconds
    };
  }

  /**
   * Register a new user
   * 
   * @param registerDto - User registration data
   * @returns Created user info
   * @throws ConflictException if email already exists
   */
  async register(registerDto: RegisterDto): Promise<IUserPublic> {
    const { email, password, firstName, lastName, organizationId } = registerDto;

    // 1. Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // 2. Create new user
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password, // Will be hashed by @BeforeInsert hook
      firstName,
      lastName,
      organizationId,
      isActive: true,
    });

    // 3. Save user
    const savedUser = await this.userRepository.save(user);

    // 4. Log registration
    await this.auditService.log({
      action: 'USER_REGISTERED',
      resource: 'user',
      resourceId: savedUser.userId,
      userId: savedUser.userId,
      userEmail: savedUser.email,
      organizationId: savedUser.organizationId,
      details: JSON.stringify({ method: 'self-registration' }),
      success: true,
    });

    return this.toPublicUser(savedUser);
  }

  /**
   * Validate user from JWT payload
   * Called by JwtStrategy to verify token
   * 
   * @param payload - Decoded JWT payload
   * @returns User if valid, null otherwise
   */
  async validateUser(payload: IJwtPayload): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { userId: payload.sub },
      relations: ['organization'],
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  /**
   * Get user profile by ID
   * 
   * @param userId - User ID
   * @returns User info
   */
  async getProfile(userId: string): Promise<IUserPublic> {
    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toPublicUser(user);
  }

  /**
   * Convert User entity to public user object (without password)
   */
  private toPublicUser(user: User): IUserPublic {
    return {
      id: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization?.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

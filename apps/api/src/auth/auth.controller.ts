/**
 * ============================================
 * AUTH CONTROLLER
 * ============================================
 * 
 * Handles all authentication endpoints:
 * - Login
 * - Register
 * - Profile
 * - Logout
 * 
 * AUTHENTICATION FLOW DIAGRAM:
 * ----------------------------
 * 
 *   ┌──────────┐     POST /auth/login      ┌────────────────┐
 *   │  Client  │ ─────────────────────────>│ AuthController │
 *   │          │   { email, password }     │                │
 *   └──────────┘                           └───────┬────────┘
 *        │                                         │
 *        │                                         ▼
 *        │                                 ┌──────────────┐
 *        │                                 │ AuthService  │
 *        │                                 │  - validate  │
 *        │                                 │  - sign JWT  │
 *        │                                 └──────┬───────┘
 *        │                                        │
 *        │<───────────────────────────────────────┘
 *        │        { accessToken, user }
 *        │
 *        │     Future requests with:
 *        │     Authorization: Bearer <token>
 *        ▼
 *   ┌──────────────┐
 *   │ Protected    │ ──> JwtAuthGuard validates token
 *   │ Endpoints    │ ──> Extracts user from token
 *   └──────────────┘ ──> Proceeds with request
 * 
 * MOCK EXAMPLES:
 * --------------
 * 
 * 1. Login:
 *    POST /auth/login
 *    Body: { "email": "admin@acme.com", "password": "SecurePass123!" }
 *    Response: {
 *      "success": true,
 *      "data": {
 *        "accessToken": "eyJhbGciOiJIUzI1NiIs...",
 *        "user": { "id": "...", "email": "admin@acme.com", ... },
 *        "expiresIn": 86400
 *      }
 *    }
 * 
 * 2. Register:
 *    POST /auth/register
 *    Body: {
 *      "email": "new@acme.com",
 *      "password": "NewPass123!",
 *      "firstName": "John",
 *      "lastName": "Doe",
 *      "organizationId": "org-123"
 *    }
 * 
 * 3. Get Profile (requires auth):
 *    GET /auth/profile
 *    Headers: Authorization: Bearer <token>
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, IApiResponse, ILoginResponse } from '@libs/data';
import { JwtAuthGuard, CurrentUser, Public } from '@libs/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   * 
   * Authenticate user and return JWT token
   * This is a PUBLIC endpoint (no auth required)
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request
  ): Promise<IApiResponse<ILoginResponse>> {
    // Extract client info for audit logging
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await this.authService.login(
      loginDto,
      ipAddress,
      userAgent
    );

    return {
      success: true,
      data: result,
      message: 'Login successful'
    };
  }

  /**
   * POST /auth/register
   * 
   * Register a new user
   * This is a PUBLIC endpoint (no auth required)
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto
  ): Promise<IApiResponse<any>> {
    const user = await this.authService.register(registerDto);

    return {
      success: true,
      data: user,
      message: 'Registration successful'
    };
  }

  /**
   * GET /auth/profile
   * 
   * Get current user's profile
   * Requires authentication
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(
    @CurrentUser() user: any
  ): Promise<IApiResponse<any>> {
    const profile = await this.authService.getProfile(user.id);

    return {
      success: true,
      data: profile,
      message: 'Profile retrieved successfully'
    };
  }

  /**
   * POST /auth/logout
   * 
   * Logout user (mainly for audit logging)
   * In JWT auth, the client just needs to discard the token
   * This endpoint is for audit trail purposes
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: any,
    @Req() req: Request
  ): Promise<IApiResponse<null>> {
    // Log the logout event (implementation in auth service)
    // Note: JWT tokens are stateless, so we can't invalidate them
    // For production, consider using a token blacklist or refresh tokens

    return {
      success: true,
      data: null,
      message: 'Logout successful'
    };
  }

  /**
   * GET /auth/me
   * 
   * Alias for profile - commonly used endpoint name
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any): Promise<IApiResponse<any>> {
    return this.getProfile(user);
  }
}

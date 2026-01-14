/**
 * ============================================
 * JWT AUTH GUARD
 * ============================================
 * 
 * Validates JWT tokens on incoming requests.
 * This is the first line of defense - no token = no access.
 * 
 * AUTHENTICATION FLOW:
 * --------------------
 * 
 *   ┌─────────────────────────────────────────────────────────┐
 *   │                    REQUEST FLOW                         │
 *   ├─────────────────────────────────────────────────────────┤
 *   │                                                         │
 *   │   Incoming Request                                      │
 *   │        │                                                │
 *   │        ▼                                                │
 *   │   ┌─────────────────┐                                   │
 *   │   │ Check @Public() │ ──Yes──> Allow (skip auth)       │
 *   │   └────────┬────────┘                                   │
 *   │            │ No                                         │
 *   │            ▼                                            │
 *   │   ┌─────────────────┐                                   │
 *   │   │ Extract Token   │ Header: "Authorization: Bearer X" │
 *   │   └────────┬────────┘                                   │
 *   │            │                                            │
 *   │            ▼                                            │
 *   │   ┌─────────────────┐                                   │
 *   │   │ Verify Token    │ Check signature, expiry           │
 *   │   └────────┬────────┘                                   │
 *   │            │                                            │
 *   │      ┌─────┴─────┐                                      │
 *   │      │           │                                      │
 *   │    Valid      Invalid                                   │
 *   │      │           │                                      │
 *   │      ▼           ▼                                      │
 *   │   Allow    UnauthorizedException                        │
 *   │                                                         │
 *   └─────────────────────────────────────────────────────────┘
 * 
 * USAGE:
 * ------
 * Applied globally in app.module.ts or per-route:
 * 
 * ```typescript
 * // Global application
 * @Module({
 *   providers: [
 *     { provide: APP_GUARD, useClass: JwtAuthGuard }
 *   ]
 * })
 * 
 * // Per-route
 * @UseGuards(JwtAuthGuard)
 * @Get('protected')
 * getProtected() { ... }
 * ```
 */

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if the current request should be allowed
   * 
   * @param context - Execution context with request details
   * @returns boolean or Promise<boolean> - true to allow, false to deny
   */
  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),  // Check method-level metadata
      context.getClass(),    // Check class-level metadata
    ]);

    // If public, allow without authentication
    if (isPublic) {
      return true;
    }

    // Otherwise, proceed with JWT validation
    // This calls the JwtStrategy.validate() method
    return super.canActivate(context);
  }

  /**
   * Handles authentication errors
   * Called when passport authentication fails
   * 
   * @param err - Error from authentication
   * @param user - User object (undefined on failure)
   * @param info - Additional info (e.g., "jwt expired")
   */
  handleRequest(err: any, user: any, info: any) {
    // Handle specific JWT errors
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Token has expired');
    }
    
    if (info?.name === 'JsonWebTokenError') {
      throw new UnauthorizedException('Invalid token');
    }

    // If there's an error or no user, throw unauthorized
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    // Return the authenticated user
    return user;
  }
}
